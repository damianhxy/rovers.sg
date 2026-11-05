// Cross-cutting checks: secrets, the production cookie, CSRF edge cases, rate limiting and error
// pages. test.todo entries are known gaps, named after the baseline item they miss. Each body
// checks the behaviour the fix should produce, so fixing one means dropping ".todo" (the
// session-store one also needs a helper that restarts the app in the same sandbox).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { start, Client, ADMIN } = require("./helpers/app.js");

let app;
before(async function () {
  app = await start();
});
after(() => app.stop());

test("the app refuses to start with an empty or short SESSION_SECRET", function () {
  // An empty directory as cwd, so no .env is read; the app exits before opening any database.
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "rovers-secret-"));
  try {
    for (const secret of ["", "too-short"]) {
      const result = spawnSync(process.execPath, [path.resolve(__dirname, "..", "app.js")], {
        cwd,
        env: { PATH: process.env.PATH, SESSION_SECRET: secret },
        encoding: "utf8",
        timeout: 10000,
      });
      assert.equal(result.status, 1, JSON.stringify(secret));
      assert.match(result.stderr, /SESSION_SECRET/);
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("a POST with the token in the X-CSRF-Token header and no body works", async function () {
  const client = new Client(app.baseUrl);
  await client.signIn(ADMIN.username, ADMIN.password);
  await client.get("/users/profile");
  const res = await client.request("POST", "/users/signout", {
    headers: { "x-csrf-token": client.csrfToken },
  });
  assert.equal(res.status, 302);
  assert.equal((await client.get("/users/profile")).status, 302, "still signed in");
});

test("21 failed sign-ins from one address do not lock out another", async function () {
  const attempt = async (ip) => {
    const client = new Client(app.baseUrl);
    await client.get("/");
    return client.request("POST", "/users/signin", {
      form: { _csrf: client.csrfToken, username: ADMIN.username, password: "wrong" },
      headers: { "x-forwarded-for": ip },
    });
  };
  let res;
  for (let i = 0; i < 21; i++) res = await attempt("203.0.113.7");
  assert.equal(res.status, 429, "the limiter should stop the 21st attempt");
  res = await attempt("203.0.113.8");
  assert.equal(res.status, 302);
});

test("production: the session cookie is Secure behind an HTTPS proxy", async function () {
  const prod = await start({ NODE_ENV: "production" });
  try {
    const res = await fetch(prod.baseUrl + "/", {
      headers: { "x-forwarded-proto": "https", "x-forwarded-for": "203.0.113.9" },
    });
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("connect.sid="));
    assert.ok(cookie, "no session cookie issued");
    assert.match(cookie, /;\s*Secure/i);
    assert.match(cookie, /;\s*HttpOnly/i);
  } finally {
    await prod.stop();
  }
});

test.todo("3.5 no query-string CSRF token: a token only in ?_csrf= is refused", async function () {
  const client = new Client(app.baseUrl);
  await client.get("/");
  const res = await client.request(
    "POST",
    "/users/signin?_csrf=" + encodeURIComponent(client.csrfToken),
    { form: { username: ADMIN.username, password: ADMIN.password } },
  );
  assert.equal(res.status, 403);
});

test.todo(
  "3.7 app-level 4-arg error handler: a CSRF failure shows no stack trace",
  async function () {
    const res = await new Client(app.baseUrl).request("POST", "/users/signin", {
      form: { username: "x", password: "y" },
    });
    assert.equal(res.status, 403);
    assert.doesNotMatch(res.text, /at \w+ \(|node_modules/);
  },
);

test.todo(
  "3.4 auth limiter POST-only: page loads of /users/signin are not counted",
  async function () {
    const client = new Client(app.baseUrl);
    let res;
    for (let i = 0; i < 25; i++) res = await client.get("/users/signin");
    assert.notEqual(res.status, 429);
  },
);

test.todo("3.4 persistent session store: a session survives an app restart", async function () {
  // Needs a restart in the same sandbox; sessions are in memory (memorystore) today.
  assert.fail("sessions are kept in memory and lost on restart");
});
