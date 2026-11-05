// The admin flows content.test.js does not reach: awardees, the NRC editor, category pages,
// inline edits of other fields, short-link deletion, and what anonymous visitors cannot do.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, Client, ADMIN } = require("./helpers/app.js");

let app;
let admin;
before(async function () {
  app = await start();
  admin = new Client(app.baseUrl);
  await admin.signIn(ADMIN.username, ADMIN.password);
  await admin.get("/users/profile");
});
after(() => app.stop());

async function createEvent(fields = {}) {
  await admin.get("/events/add");
  const res = await admin.post("/events", {
    title: "Hike",
    start: "10 Nov 26 10:00",
    end: "10 Nov 26 12:30",
    ...fields,
  });
  assert.match(res.location, /^\/events\/[A-Za-z0-9]+$/, "event not created: " + res.location);
  return res.location.split("/")[2];
}

describe("awardees (BPA)", function () {
  test("add, list in the right table, delete", async function () {
    await admin.get("/about");
    let res = await admin.post("/about/BPA", { name: "Alice Tan", unit: "01 Rover", year: "2019" });
    assert.equal(res.location, "/about");
    await admin.post("/about/BPA", { name: "Bob Lim", honorary: "on" });

    let page = (await admin.get("/about")).text;
    const honorary = page.slice(page.indexOf("Honorary BPAs"), page.indexOf("<h3>BPAs</h3>"));
    assert.match(honorary, /Bob Lim/);
    assert.doesNotMatch(honorary, /Alice Tan/);
    assert.match(
      page,
      /<td>Alice Tan<\/td>\s*<td class="hidden-xs">01 Rover<\/td>\s*<td>2019<\/td>/,
    );

    const id = page.match(/data-name="Alice Tan" data-time="[^"]*" data-id="([A-Za-z0-9]+)"/)[1];
    res = await admin.ajax("DELETE", "/about/BPA", { id });
    assert.equal(res.status, 200);
    page = (await admin.get("/about")).text;
    assert.doesNotMatch(page, /Alice Tan/);
    assert.match(page, /Bob Lim/);
  });
});

describe("NRC editor", function () {
  const councils = [{ title: "Test Council 2026", members: { Chairperson: ["Carol Ng"] } }];

  test("saving JSON updates the About page", async function () {
    await admin.get("/users/profile");
    const res = await admin.post("/about/NRC", { data: JSON.stringify(councils) });
    assert.equal(res.location, "/users/profile");
    const page = (await admin.get("/about")).text;
    assert.match(page, /Test Council 2026/);
    assert.match(page, /Carol Ng/);
  });

  test("invalid JSON is refused and changes nothing", async function () {
    await admin.get("/users/profile");
    await admin.post("/about/NRC", { data: "{not json" });
    const profile = (await admin.get("/users/profile")).text;
    assert.match(profile, /Invalid JSON/);
    assert.match((await admin.get("/about")).text, /Test Council 2026/);
  });
});

describe("events", function () {
  test("category pages list upcoming events of that category only", async function () {
    await createEvent({
      title: "Service Day",
      start: "1 Jan 30 10:00",
      end: "1 Jan 30 11:00",
      category: "service",
    });
    await createEvent({
      title: "Camp Night",
      start: "1 Jan 30 10:00",
      end: "1 Jan 30 11:00",
      category: "adventure",
    });
    const page = (await admin.get("/events/category/service")).text;
    assert.match(page, /Service Day/);
    assert.doesNotMatch(page, /Camp Night/);
  });

  test("inline edits: location, details and an http(s) link", async function () {
    const id = await createEvent();
    for (const [name, value] of [
      ["location", "Pulau Ubin"],
      ["details", "Bring water"],
      ["link", "https://example.org/ubin"],
    ]) {
      const res = await admin.ajax("PUT", "/events", { pk: id, name, value });
      assert.equal(res.status, 200, name + ": " + res.text);
    }
    const page = (await admin.get("/events/" + id)).text;
    assert.match(page, /Pulau Ubin/);
    assert.match(page, /Bring water/);
    assert.match(page, /href="https:\/\/example.org\/ubin"/);
  });
});

describe("resources", function () {
  test("name and description can be edited inline; Rover Journey files appear on /rjourney", async function () {
    await admin.get("/resources");
    await admin.post("/resources", {
      name: "Journey Guide",
      category: "Rover Journey",
      url: "https://example.com/guide",
    });
    const page = (await admin.get("/resources")).text;
    const id = page.match(
      /data-pk="([A-Za-z0-9]+)" data-name="name"[^>]*href="https:\/\/example.com\/guide"/,
    )[1];
    for (const [name, value] of [
      ["name", "Journey Handbook"],
      ["description", "Read before your first expedition"],
    ]) {
      const res = await admin.ajax("PUT", "/resources", { pk: id, name, value });
      assert.equal(res.status, 200, name + ": " + res.text);
    }
    const journey = (await new Client(app.baseUrl).get("/rjourney")).text;
    assert.match(journey, /Journey Handbook/);
    assert.match((await admin.get("/resources")).text, /Read before your first expedition/);
  });
});

describe("link shortener", function () {
  test("a deleted short link no longer redirects", async function () {
    await admin.get("/users/profile");
    await admin.post("/s", { name: "Temp", orgurl: "https://example.com/temp", newurl: "temp" });
    assert.equal((await admin.get("/s/temp")).location, "https://example.com/temp");
    const profile = (await admin.get("/users/profile")).text;
    const id = profile.match(/data-name="temp" data-time="[^"]*" data-id="([A-Za-z0-9]+)"/)[1];
    assert.equal((await admin.ajax("DELETE", "/s", { id })).status, 200);
    assert.notEqual((await admin.get("/s/temp")).location, "https://example.com/temp");
  });
});

describe("anonymous visitors", function () {
  test("cannot create content, even with a valid CSRF token", async function () {
    const visitor = new Client(app.baseUrl);
    await visitor.get("/");
    for (const [url, fields] of [
      ["/events", { title: "Intruder", start: "10 Nov 26 10:00", end: "10 Nov 26 11:00" }],
      ["/about/BPA", { name: "Intruder" }],
      ["/s", { name: "Intruder", orgurl: "https://example.com", newurl: "intruder" }],
      ["/resources", { name: "Intruder", category: "Forms", url: "https://example.com" }],
    ]) {
      const res = await visitor.post(url, fields);
      assert.equal(res.status, 302, url);
      assert.equal(res.location, "/", url);
    }
    assert.doesNotMatch((await admin.get("/about")).text, /Intruder/);
    assert.doesNotMatch((await admin.get("/resources")).text, /Intruder/);
    assert.notEqual((await admin.get("/s/intruder")).location, "https://example.com/");
    const feed = (await admin.get("/events/feed?start=2026-11-01&end=2026-12-01")).text;
    assert.doesNotMatch(feed, /Intruder/);
  });

  test("sign-up is switched off", async function () {
    const visitor = new Client(app.baseUrl);
    await visitor.get("/");
    const res = await visitor.post("/users/signup", { username: "eve", password: "password-123" });
    assert.equal(res.status, 404);
  });
});
