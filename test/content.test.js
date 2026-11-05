// Admin content management: events and photos, resources, the link shortener.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { start, Client, ADMIN } = require("./helpers/app.js");

// Smallest valid PNG (1x1 transparent pixel).
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
    "0000000d4944415478da63f8ffff3f0005fe02fea7d6a4500000000049454e44ae426082",
  "hex",
);

let app;
let admin;
before(async function () {
  app = await start();
  admin = new Client(app.baseUrl);
  await admin.signIn(ADMIN.username, ADMIN.password);
  await admin.get("/users/profile");
  // Files outside the uploads tree that admin requests must never be able to delete.
  fs.writeFileSync(path.join(app.dir, "canary.txt"), "canary");
  fs.mkdirSync(path.join(app.dir, "canary-dir"));
});
after(() => app.stop());

function canariesIntact() {
  assert.ok(fs.existsSync(path.join(app.dir, "canary.txt")), "canary.txt was deleted");
  assert.ok(fs.existsSync(path.join(app.dir, "canary-dir")), "canary-dir was deleted");
}

async function createEvent(fields = {}) {
  await admin.get("/events/add");
  const res = await admin.post("/events", {
    title: "Hike",
    start: "10 Nov 26 10:00",
    end: "10 Nov 26 12:30",
    location: "MacRitchie",
    link: "https://example.org/hike",
    category: "Adventure",
    ...fields,
  });
  assert.equal(res.status, 302);
  assert.match(res.location, /^\/events\/[A-Za-z0-9]+$/, "event not created: " + res.location);
  assert.notEqual(res.location, "/events/add");
  return res.location.split("/")[2];
}

async function eventPage(id) {
  const res = await admin.get("/events/" + id);
  assert.equal(res.status, 200);
  return res.text;
}

describe("events", function () {
  test("times are stored in Singapore time whatever the host zone", async function () {
    const id = await createEvent();
    assert.match(await eventPage(id), /data-name="start">10 Nov 26 \| 10:00</);
    const feed = JSON.parse((await admin.get("/events/feed?start=2026-11-01&end=2026-12-01")).text);
    const event = feed.find((e) => e._id === id);
    assert.equal(event.start, "2026-11-10T10:00:00+08:00");
    assert.equal(event.end, "2026-11-10T12:30:00+08:00");
    assert.equal(event.duration, "2 hours 30 minutes");
  });

  test("inline edits: start time (editor format), title", async function () {
    const id = await createEvent();
    let res = await admin.ajax("PUT", "/events", {
      pk: id,
      name: "start",
      value: "10 Nov 26 | 09:00h",
    });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(JSON.parse(res.text), { field: "start", value: "3 hours 30 minutes" });
    res = await admin.ajax("PUT", "/events", { pk: id, name: "title", value: "Hike 2" });
    assert.equal(res.status, 200);
    assert.match(await eventPage(id), /Hike 2/);
  });

  test("start after end is rejected", async function () {
    await admin.get("/events/add");
    const res = await admin.post("/events", {
      title: "Backwards",
      start: "10 Nov 26 12:00",
      end: "10 Nov 26 10:00",
    });
    assert.equal(res.location, "/events/add");
  });

  test("internal fields cannot be edited", async function () {
    const id = await createEvent();
    for (const name of ["photos", "favourite", "url", "_id"]) {
      const res = await admin.ajax("PUT", "/events", { pk: id, name, value: "x" });
      assert.equal(res.status, 400, name);
    }
  });

  test("non-HTTP links are rejected", async function () {
    const id = await createEvent();
    for (const value of ["javascript://x%0aalert(1)", "data:text/html,<b>x</b>"]) {
      const res = await admin.ajax("PUT", "/events", { pk: id, name: "link", value });
      assert.equal(res.status, 400, value);
    }
  });

  test("delete ignores ids that point outside the uploads folder", async function () {
    for (const id of ["../../canary-dir", "../../canary.txt", ""]) {
      const res = await admin.ajax("DELETE", "/events", { id });
      assert.equal(res.status, 400, id);
    }
    canariesIntact();
  });

  test("delete removes the event and its upload folder", async function () {
    const id = await createEvent();
    assert.ok(fs.existsSync(path.join(app.dir, "public", "uploads", id)));
    const res = await admin.ajax("DELETE", "/events", { id });
    assert.equal(res.status, 200);
    assert.equal(fs.existsSync(path.join(app.dir, "public", "uploads", id)), false);
    assert.equal((await admin.get("/events/" + id)).status, 302);
  });
});

describe("photos", function () {
  test("upload, serve sandboxed, mark favourite, delete", async function () {
    const id = await createEvent();
    await eventPage(id);
    let res = await admin.upload("/events/" + id, {}, [
      { name: "pic.png", type: "image/png", content: PNG },
    ]);
    assert.equal(res.status, 302);
    assert.equal(res.location, "/events/" + id);

    const page = await eventPage(id);
    const photo = page.match(/\/uploads\/[A-Za-z0-9]+\/[0-9a-f-]+\.png/);
    assert.ok(photo, "photo not listed on the event page");
    res = await admin.get(photo[0]);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-security-policy"), "sandbox; default-src 'none'");

    res = await admin.ajax("PUT", "/events/" + id, { name: "pic.png" });
    assert.equal(res.status, 302);
    res = await admin.ajax("DELETE", "/events/" + id, { name: "pic.png" });
    assert.equal(res.status, 200);
    assert.equal(fs.readdirSync(path.join(app.dir, "public", "uploads", id)).length, 0);
  });

  test("upload with a bad CSRF token is rejected and writes nothing", async function () {
    const id = await createEvent();
    const data = new FormData();
    data.append("_csrf", "wrong");
    data.append("file", new Blob([PNG], { type: "image/png" }), "pic.png");
    const res = await admin.request("POST", "/events/" + id, { body: data });
    assert.equal(res.status, 403);
    assert.equal(fs.readdirSync(path.join(app.dir, "public", "uploads", id)).length, 0);
  });

  test("SVG and other non-photo types are rejected", async function () {
    const id = await createEvent();
    await eventPage(id);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    await admin.upload("/events/" + id, {}, [
      { name: "x.svg", type: "image/svg+xml", content: svg },
    ]);
    assert.equal(fs.readdirSync(path.join(app.dir, "public", "uploads", id)).length, 0);
  });
});

describe("resources", function () {
  async function listed() {
    const res = await admin.get("/resources");
    return [
      ...res.text.matchAll(/data-pk="([A-Za-z0-9]+)" data-name="name"[^>]*href="([^"]+)"/g),
    ].map((m) => ({ id: m[1], href: m[2] }));
  }

  test("file upload is stored outside public/ and downloaded as an attachment", async function () {
    await admin.get("/resources");
    const res = await admin.upload("/resources", { name: "Form A", category: "Forms" }, [
      { name: "form-a.pdf", type: "application/pdf", content: "%PDF-1.4 test" },
    ]);
    assert.equal(res.status, 302);
    assert.equal(res.location, "/resources#upload");
    const item = (await listed()).find((r) => r.href.endsWith("/download"));
    assert.ok(item, "uploaded resource not listed");
    const download = await admin.get(item.href);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-disposition"), 'attachment; filename="form-a.pdf"');
    assert.equal(download.text, "%PDF-1.4 test");

    assert.equal((await admin.ajax("DELETE", "/resources", { id: item.id })).status, 200);
    assert.equal((await admin.get(item.href)).status, 404);
  });

  test("link resources work; editing the stored path is refused", async function () {
    await admin.get("/resources");
    await admin.post("/resources", {
      name: "Link",
      category: "Forms",
      url: "https://example.com/x",
    });
    const item = (await listed()).find((r) => r.href === "https://example.com/x");
    assert.ok(item, "link resource not listed");
    const res = await admin.ajax("PUT", "/resources", {
      pk: item.id,
      name: "path",
      value: "canary.txt",
    });
    assert.equal(res.status, 400);
    assert.equal((await admin.ajax("DELETE", "/resources", { id: item.id })).status, 200);
    canariesIntact();
  });
});

describe("link shortener", function () {
  test("create and follow a short link", async function () {
    await admin.get("/users/profile");
    await admin.post("/s", { name: "Example", orgurl: "example.com/page", newurl: "ex" });
    const res = await admin.get("/s/ex");
    assert.equal(res.status, 302);
    assert.equal(res.location, "http://example.com/page");
  });

  test("non-HTTP targets are refused", async function () {
    await admin.get("/users/profile");
    await admin.post("/s", { name: "Bad", orgurl: "javascript://x%0aalert(1)", newurl: "bad" });
    const res = await admin.get("/s/bad");
    assert.doesNotMatch(res.location || "", /^javascript:/i);
    assert.doesNotMatch(res.text, /javascript:/i);
  });
});
