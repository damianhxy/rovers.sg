const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { start, Client } = require("./helpers/app.js");

let app;
let client;
before(async function () {
  app = await start();
  client = new Client(app.baseUrl);
});
after(() => app.stop());

for (const url of [
  "/",
  "/events",
  "/events/all",
  "/resources",
  "/about",
  "/faq",
  "/join",
  "/rjourney",
  "/healthcheck",
]) {
  test("GET " + url + " renders", async function () {
    const res = await client.get(url);
    assert.equal(res.status, 200, app.output());
  });
}

test("unknown pages return 404", async function () {
  const res = await client.get("/no-such-page");
  assert.equal(res.status, 404);
});

test("calendar feed returns JSON", async function () {
  const res = await client.get("/events/feed?start=2026-01-01&end=2026-02-01");
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.text), []);
});

test("static assets are served", async function () {
  const res = await client.get("/css/main.css");
  assert.equal(res.status, 200);
});

test("admin pages redirect anonymous visitors", async function () {
  const res = await client.get("/events/add");
  assert.equal(res.status, 302);
  assert.equal(res.location, "/");
});

test("POST without a CSRF token is rejected", async function () {
  const res = await client.request("POST", "/users/signin", {
    form: { username: "admin", password: "x" },
  });
  assert.equal(res.status, 403);
});
