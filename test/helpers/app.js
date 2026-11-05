// Starts the real app in a throwaway copy of the repo, so tests never touch ./database or
// ./public/uploads in the working tree. Static assets and node_modules are symlinked, not copied.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const skip = new Set([".git", "node_modules", "database", "uploads", "public", "test"]);

function freePort() {
  return new Promise(function (resolve, reject) {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", function () {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rovers-test-"));
  for (const entry of fs.readdirSync(repoRoot)) {
    if (skip.has(entry) || entry.startsWith(".env")) continue;
    fs.cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true });
  }
  fs.symlinkSync(path.join(repoRoot, "node_modules"), path.join(dir, "node_modules"), "dir");
  fs.mkdirSync(path.join(dir, "public", "uploads"), { recursive: true });
  for (const entry of fs.readdirSync(path.join(repoRoot, "public"))) {
    if (entry === "uploads") continue;
    fs.symlinkSync(path.join(repoRoot, "public", entry), path.join(dir, "public", entry));
  }
  return dir;
}

exports.ADMIN = { username: "admin", password: "test-password-123" };

// Resolves once the server is listening and the admin account exists. `env` adds variables.
exports.start = async function (env = {}) {
  const dir = makeSandbox();
  const port = await freePort();
  const child = spawn(process.execPath, ["app.js"], {
    cwd: dir,
    env: {
      PATH: process.env.PATH,
      PORT: String(port),
      SESSION_SECRET: "s".repeat(48),
      ADMIN_USERNAME: exports.ADMIN.username,
      ADMIN_PASSWORD: exports.ADMIN.password,
      // Deliberately neither UTC nor Asia/Singapore: event times must not depend on the host zone.
      TZ: "America/New_York",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  await new Promise(function (resolve, reject) {
    const timer = setTimeout(() => reject(Error("App did not start:\n" + output)), 15000);
    function onData(chunk) {
      output += chunk;
      if (output.includes("Created admin user")) {
        clearTimeout(timer);
        resolve();
      }
    }
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", function (code) {
      clearTimeout(timer);
      reject(Error("App exited with code " + code + ":\n" + output));
    });
  });
  child.removeAllListeners("exit");
  return {
    dir,
    baseUrl: "http://127.0.0.1:" + port,
    output: () => output,
    stop: async function () {
      if (child.exitCode === null) {
        await new Promise(function (resolve) {
          child.once("exit", resolve);
          child.kill();
        });
      }
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
};

// A tiny browser stand-in: keeps cookies and reads the CSRF token from rendered pages.
exports.Client = class Client {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = {};
    this.csrfToken = null;
  }

  clone() {
    const copy = new Client(this.baseUrl);
    copy.cookies = { ...this.cookies };
    copy.csrfToken = this.csrfToken;
    return copy;
  }

  async request(method, url, { form, body, headers = {} } = {}) {
    const init = {
      method,
      redirect: "manual",
      headers: {
        cookie: Object.entries(this.cookies)
          .map(([k, v]) => k + "=" + v)
          .join("; "),
        ...headers,
      },
    };
    if (form) {
      init.body = new URLSearchParams(form).toString();
      init.headers["content-type"] = "application/x-www-form-urlencoded";
    } else if (body) {
      init.body = body;
    }
    const res = await fetch(this.baseUrl + url, init);
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const name = pair.slice(0, pair.indexOf("="));
      if (/expires=thu, 01 jan 1970/i.test(cookie)) delete this.cookies[name];
      else this.cookies[name] = pair.slice(pair.indexOf("=") + 1);
    }
    const text = await res.text();
    const token = text.match(/<meta name="csrf-token" content="([^"]+)">/);
    if (token) this.csrfToken = token[1];
    return {
      status: res.status,
      headers: res.headers,
      text,
      location: res.headers.get("location"),
    };
  }

  get(url) {
    return this.request("GET", url);
  }

  // Form post with the page's CSRF token in the body, as the site's own forms send it.
  post(url, fields) {
    return this.request("POST", url, { form: { _csrf: this.csrfToken, ...fields } });
  }

  // x-editable / AJAX style: token in the X-CSRF-Token header.
  ajax(method, url, fields) {
    return this.request(method, url, { form: fields, headers: { "x-csrf-token": this.csrfToken } });
  }

  // Multipart upload; fields are appended in order, like the browser form (token first).
  upload(url, fields, files) {
    const data = new FormData();
    data.append("_csrf", this.csrfToken);
    for (const [k, v] of Object.entries(fields)) data.append(k, v);
    for (const f of files) data.append("file", new Blob([f.content], { type: f.type }), f.name);
    return this.request("POST", url, { body: data });
  }

  async signIn(username, password) {
    await this.get("/");
    return this.post("/users/signin", { username, password });
  }
};
