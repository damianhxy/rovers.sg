// SEED_DEMO_DATA=true fills an empty site with sample content, once.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, Client } = require("./helpers/app.js");

let app;
let visitor;
before(async function () {
  app = await start({ SEED_DEMO_DATA: "true" });
  await app.waitForOutput(/Demo data: seeded/);
  visitor = new Client(app.baseUrl);
});
after(() => app && app.stop());

test("home and events pages list the upcoming sample events", async function () {
  for (const url of ["/", "/events"]) {
    const res = await visitor.get(url);
    for (const title of [
      "Pulau Ubin Cycling Expedition",
      "Coastal Cleanup at East Coast Park",
      "Rover Fellowship Night",
      "Basic Rover Leadership Course",
    ]) {
      assert.match(res.text, new RegExp(title), url + " is missing " + title);
    }
    assert.doesNotMatch(res.text, /Blood Donation Drive/, "past events must not be upcoming");
  }
});

test("past events have their photos, served from uploads", async function () {
  const feed = JSON.parse((await visitor.get("/events/feed?start=2000-01-01&end=2100-01-01")).text);
  assert.equal(feed.length, 8);
  const rinjani = feed.find((e) => e.title === "Gunung Rinjani Expedition");
  assert.equal(rinjani.photos.length, 2);
  assert.equal(rinjani.favourite.name, "Gunung Rinjani.jpg");
  const photo = await visitor.get(rinjani.photos[0].path);
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get("content-type"), "image/jpeg");
});

test("resources include downloadable sample PDFs and links", async function () {
  const res = await visitor.get("/resources");
  const downloads = [
    ...new Set(
      [...res.text.matchAll(/href="(\/resources\/[A-Za-z0-9]+\/download)"/g)].map((m) => m[1]),
    ),
  ];
  assert.equal(downloads.length, 2);
  const pdf = await visitor.get(downloads[0]);
  assert.equal(pdf.status, 200);
  assert.match(pdf.text, /^%PDF-1\.4/);
  assert.match(res.text, /href="https:\/\/scout\.org\.sg\/?"/);
});

test("about page lists the sample awardees; the short link works", async function () {
  const about = await visitor.get("/about");
  for (const name of ["Alex Tan", "Priya Nair", "Daniel Lim", "Mei Ling Goh"]) {
    assert.match(about.text, new RegExp(name));
  }
  const link = await visitor.get("/s/hq");
  assert.equal(link.status, 302);
  assert.match(link.location, /^https:\/\/scout\.org\.sg/);
});

test("restarting with content already there does not seed again", async function () {
  await app.stop({ keep: true });
  app = await start({ SEED_DEMO_DATA: "true" }, { dir: app.dir });
  await app.waitForOutput(/Demo data: site already has content/);
  const feed = JSON.parse(
    (await new Client(app.baseUrl).get("/events/feed?start=2000-01-01&end=2100-01-01")).text,
  );
  assert.equal(feed.length, 8);
});
