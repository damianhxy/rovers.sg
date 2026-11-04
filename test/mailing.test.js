// The footer's mailing-list sign-up, against a local stand-in for the Google Form.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { start, Client } = require("./helpers/app.js");

const FIELD = "entry.157598053";
let app;
let stub;
let stubStatus = 200;
const received = [];

before(async function () {
  stub = http.createServer(function (req, res) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", function () {
      received.push(Object.fromEntries(new URLSearchParams(body)));
      res.writeHead(stubStatus, { "content-type": "text/html" });
      res.end("<html><script>google()</script></html>");
    });
  });
  await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));
  app = await start({
    MAILING_FORM_URL: "http://127.0.0.1:" + stub.address().port + "/formResponse",
  });
});
after(async function () {
  await app.stop();
  stub.close();
});

async function signUp(fields) {
  const client = new Client(app.baseUrl);
  await client.get("/");
  return client.ajax("POST", "/mailing", fields);
}

test("forwards only the email address and answers 204", async function () {
  received.length = 0;
  stubStatus = 200;
  const res = await signUp({ [FIELD]: " rover@example.com ", extra: "x" });
  assert.equal(res.status, 204);
  assert.equal(res.text, "", "Google's page must not be relayed to the browser");
  assert.deepEqual(received, [{ [FIELD]: "rover@example.com" }]);
});

test("reports failure when the form rejects the submission", async function () {
  stubStatus = 500;
  const res = await signUp({ [FIELD]: "rover@example.com" });
  assert.equal(res.status, 502);
});

test("rejects a missing email without contacting the form", async function () {
  received.length = 0;
  const res = await signUp({ [FIELD]: "" });
  assert.equal(res.status, 400);
  assert.equal(received.length, 0);
});
