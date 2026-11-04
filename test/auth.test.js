const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { start, Client, ADMIN } = require("./helpers/app.js");

let app;
before(async function () {
  app = await start();
});
after(() => app.stop());

async function isSignedIn(client) {
  const res = await client.get("/users/profile");
  return res.status === 200;
}

// The latest stored bcrypt hash for a user (nedb appends a line per update).
function storedHash(username) {
  const lines = fs
    .readFileSync(path.join(app.dir, "database", "users"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((doc) => doc.username === username);
  return lines[lines.length - 1].hash;
}

test("wrong password does not sign in", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, "wrong-password");
  assert.equal(await isSignedIn(client), false);
});

test("unknown user does not sign in", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn("nobody", ADMIN.password);
  assert.equal(await isSignedIn(client), false);
});

test("correct credentials sign in", async function () {
  const client = new Client(app.baseUrl);
  const res = await client.signIn(ADMIN.username, ADMIN.password);
  assert.equal(res.status, 302);
  assert.equal(await isSignedIn(client), true);
});

test("sign-in returns to the page it was submitted from, but never off-site", async function () {
  const cases = [
    [app.baseUrl + "/resources?x=1", "/resources?x=1"],
    ["https://evil.example/phish", "/"],
    ["not a url", "/"],
  ];
  for (const [referer, expected] of cases) {
    const client = new Client(app.baseUrl);
    await client.get("/");
    const res = await client.request("POST", "/users/signin", {
      form: { _csrf: client.csrfToken, username: ADMIN.username, password: ADMIN.password },
      headers: { referer },
    });
    assert.equal(res.location, expected, referer);
  }
});

test("pages send a same-origin Referrer-Policy", async function () {
  const res = await new Client(app.baseUrl).get("/");
  assert.equal(res.headers.get("referrer-policy"), "same-origin");
});

test("sign-out cannot be triggered by a GET link", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, ADMIN.password);
  const res = await client.get("/users/signout");
  assert.equal(res.status, 404);
  assert.equal(await isSignedIn(client), true);
});

test("sign-out needs the CSRF token", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, ADMIN.password);
  const res = await client.request("POST", "/users/signout", { form: { _csrf: "wrong" } });
  assert.equal(res.status, 403);
  assert.equal(await isSignedIn(client), true);
});

test("sign-out clears the cookie and kills the old session", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, ADMIN.password);
  await client.get("/users/profile");
  const oldCookie = client.clone();
  const res = await client.post("/users/signout", {});
  assert.equal(res.status, 302);
  assert.equal(client.cookies["connect.sid"], undefined, "cookie should be expired");
  assert.equal(await isSignedIn(oldCookie), false, "old session cookie must not work");
});

test("password change: wrong current password is rejected, right one works", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, ADMIN.password);
  await client.get("/users/profile");
  const newPass = "another-password-456";
  const oldHash = storedHash(ADMIN.username);

  await client.post("/users/editPassword", {
    currentPassword: "wrong",
    newPass,
    newPass2: newPass,
  });
  let other = new Client(app.baseUrl);
  await other.signIn(ADMIN.username, newPass);
  assert.equal(await isSignedIn(other), false);

  const res = await client.post("/users/editPassword", {
    currentPassword: ADMIN.password,
    newPass,
    newPass2: newPass,
  });
  assert.equal(res.status, 302);
  other = new Client(app.baseUrl);
  await other.signIn(ADMIN.username, newPass);
  assert.equal(await isSignedIn(other), true);
  // bcrypt hashes start with "$2a$10$" plus a 22-character salt; a new password gets a new salt.
  assert.notEqual(storedHash(ADMIN.username).slice(0, 29), oldHash.slice(0, 29));

  // Restore, so test order does not matter.
  await client.get("/users/profile");
  await client.post("/users/editPassword", {
    currentPassword: newPass,
    newPass: ADMIN.password,
    newPass2: ADMIN.password,
  });
});
