// Drives every page and widget in headless Chromium and fails on any JavaScript error or warning.
// Run with `npm run test:browser` (needs a Playwright Chromium: `npx playwright install chromium`).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const { start, ADMIN } = require("../helpers/app.js");

// The test event is tomorrow (Singapore time), so it is upcoming and on this month's calendar.
const TOMORROW = dayjs().tz("Asia/Singapore").add(1, "day");
const DAY = TOMORROW.format("YYYY-MM-DD");
const DAY_AFTER = TOMORROW.add(1, "day").format("YYYY-MM-DD");
const SHOWN = TOMORROW.format("D MMM YY"); // as the event page shows it

// A name that runs script if any page puts it into HTML unescaped.
const XSS = "<img src=x onerror=window.__xss=1>";
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
    "0000000d4944415478da63f8ffff3f0005fe02fea7d6a4500000000049454e44ae426082",
  "hex",
);

let app;
let stub;
let browser;
let page;
let base;
const problems = [];

before(async function () {
  // Stand-in for the Google Form behind the footer's mailing-list sign-up.
  stub = http.createServer((req, res) => req.resume().on("end", () => res.end("ok")));
  await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));
  app = await start({ MAILING_FORM_URL: "http://127.0.0.1:" + stub.address().port + "/" });
  base = app.baseUrl;
  browser = await chromium.launch();
  // The site's users are in Singapore; the add-event form defaults to the browser's "now".
  const context = await browser.newContext({
    viewport: { width: 1300, height: 900 },
    timezoneId: "Asia/Singapore",
  });
  // Only the app itself: pages embed YouTube and Google Maps, which tests must not depend on.
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  context.setDefaultTimeout(8000);
  page = await context.newPage();
  const where = () => page.url().replace(base, "");
  page.on("pageerror", (err) => problems.push(where() + " error: " + err.message));
  page.on("console", function (msg) {
    const ignored = /Failed to load resource/.test(msg.text()); // the blocked external embeds
    if (["error", "warning"].includes(msg.type()) && !ignored) {
      problems.push(where() + " console." + msg.type() + ": " + msg.text());
    }
  });
});

after(async function () {
  if (browser) await browser.close();
  if (app) await app.stop();
  if (stub) stub.close();
});

async function dialogOpen() {
  await page.waitForSelector("dialog.confirm-dialog[open]");
}

async function dialogText() {
  return page.textContent("dialog.confirm-dialog .modal-body");
}

async function noScriptRan() {
  assert.equal(await page.evaluate(() => globalThis.__xss), undefined, "a name ran as HTML");
}

test("home: carousel changes slide", async function () {
  await page.goto(base + "/");
  await page.click("#homepageCarousel .carousel-indicators li:nth-child(2)");
  await page.waitForSelector("#homepageCarousel .item:nth-child(2).active");
});

test("mailing-list sign-up reports success", async function () {
  await page.fill("#mailingForm input[type=email]", "rover@example.com");
  await page.click("#mailingForm button[type=submit]");
  await page.waitForSelector("#toasts .toast:has-text('details have been recorded')");
});

test("sign in through the navbar", async function () {
  await page.click("a.dropdown-toggle:has-text('Sign In')");
  await page.fill("input[name=username]", ADMIN.username);
  await page.fill("input[name=password]", ADMIN.password);
  await page.click("button:has-text('Sign in')");
  await page.waitForSelector("a[href='/users/profile']");
});

let eventUrl;
test("add an event: times, duration, categories, calendar preview", async function () {
  await page.goto(base + "/events/add");
  await page.waitForSelector("#calendar .fc-view");
  assert.equal(await page.inputValue("input[name=duration]"), "1 hour");
  await page.fill("input[name=title]", XSS);
  await page.waitForSelector("#calendar .fc-event");
  await page.fill("input[name=location]", "MacRitchie");

  // Moving the start keeps the duration; an end before the start is flagged.
  await page.fill("input[name=start]", DAY + "T10:00");
  assert.equal(await page.inputValue("input[name=end]"), DAY + "T11:00");
  await page.fill("input[name=end]", DAY_AFTER + "T12:30");
  assert.equal(await page.inputValue("input[name=duration]"), "1 day 2 hours 30 minutes");
  await page.fill("input[name=end]", DAY + "T09:00");
  assert.equal(await page.inputValue("input[name=duration]"), "End is before start");
  assert.equal(await page.$eval("input[name=end]", (e) => e.validity.valid), false);
  await page.fill("input[name=end]", DAY + "T12:00");

  await page.check("input[name=category][value=adventure]");
  await page.click("button:has-text('Create Event')");
  await page.waitForURL(/\/events\/[A-Za-z0-9]{16}$/);
  eventUrl = page.url();
  assert.ok(await page.isVisible("text=/^adventure$/i"), "chosen category not saved");
  assert.equal(await page.textContent("span[data-name=start]"), SHOWN + " | 10:00");
  assert.equal((await page.textContent("[data-name=duration]")).trim(), "2 hours");
  await noScriptRan();
});

test("event page: inline edits of location and start time", async function () {
  await page.goto(eventUrl);
  // Fields are plain text until Edit is pressed.
  await page.click("span.field-edit[data-name=location]");
  assert.equal(await page.$(".field-editor"), null);
  await page.click(".btn-edit");
  await page.click("span.field-edit[data-name=location]");
  await page.fill(".field-editor input", "Bukit Timah");
  await page.keyboard.press("Enter");
  await page.waitForSelector("span[data-name=location]:text-is('Bukit Timah')");

  // Escape closes the editor without saving.
  await page.click("span.field-edit[data-name=location]");
  await page.fill(".field-editor input", "Somewhere else");
  await page.keyboard.press("Escape");
  await page.waitForSelector(".field-editor", { state: "detached" });
  assert.equal(await page.textContent("span[data-name=location]"), "Bukit Timah");

  // An empty field shows "Empty" while editing, and can be filled in.
  await page.click("span.field-edit.field-empty[data-name=details]");
  await page.fill(".field-editor textarea", "Bring water");
  await page.click(".field-editor button[type=submit]");
  await page.waitForSelector("span[data-name=details]:text-is('Bring water')");

  // A start after the end is refused, with the server's message.
  await page.click("span.field-edit[data-name=start]");
  await page.fill(".field-editor input", DAY + "T13:00");
  await page.click(".field-editor button[type=submit]");
  await page.waitForSelector(
    ".field-editor .help-block:has-text('Start time must be before end time')",
  );

  // An hour earlier: the start and duration update on the page and are saved.
  await page.fill(".field-editor input", DAY + "T09:00");
  await page.click(".field-editor button[type=submit]");
  await page.waitForSelector("span[data-name=start]:text-is('" + SHOWN + " | 09:00')");
  assert.equal((await page.textContent("[data-name=duration]")).trim(), "3 hours");
  await page.reload();
  assert.equal(await page.textContent("span[data-name=start]"), SHOWN + " | 09:00");
  assert.equal(await page.getAttribute("span[data-name=start]", "data-value"), DAY + "T09:00");
});

test("event page: upload a photo, relative time, lightbox", async function () {
  const file = path.join(app.dir, "photo.png");
  fs.writeFileSync(file, PNG);
  await page.setInputFiles("#uploadForm input[type=file]", file);
  await page.click("#uploadForm button[type=submit]");
  await page.waitForSelector("#toasts .toast:has-text('Photos uploaded')");
  await page.waitForSelector("a[data-toggle=lightbox][data-gallery]");
  await page.waitForSelector("text=/a few seconds ago/");
  await page.click("a[data-toggle=lightbox][data-gallery]");
  await page.waitForSelector(".ekko-lightbox.in .modal-body img");
  await page.keyboard.press("Escape");
  await page.waitForSelector(".ekko-lightbox", { state: "detached" });
});

test("event page: delete dialogs show names as text and delete", async function () {
  await page.reload();
  await page.click(".btn-delete-photo");
  await dialogOpen();
  assert.match(
    await dialogText(),
    /Photo Name: photo\.pngUploaded on: \d+ \w{3} \d\d \| \d\d:\d\dh/,
  );
  await page.click("dialog .btn-danger");
  await page.waitForSelector(".btn-delete-photo", { state: "detached" });

  // Cancel, Escape and a click outside the dialog all keep the event.
  await page.click(".btn-delete");
  await dialogOpen();
  assert.ok((await dialogText()).includes(XSS));
  await noScriptRan();
  await page.click("dialog .btn-default");
  await page.waitForSelector("dialog", { state: "detached" });
  await page.click(".btn-delete");
  await dialogOpen();
  await page.keyboard.press("Escape");
  await page.waitForSelector("dialog", { state: "detached" });
  await page.click(".btn-delete");
  await dialogOpen();
  await page.mouse.click(5, 450);
  await page.waitForSelector("dialog", { state: "detached" });
  await page.reload();
  assert.ok(await page.isVisible(".btn-delete"), "event deleted");
});

test("calendar shows the event", async function () {
  await page.goto(base + "/events/all");
  await page.waitForSelector("#calendar .fc-event");
});

test("events list and category pages", async function () {
  await page.goto(base + "/events");
  await page.goto(base + "/events/category/adventure");
  await page.getByText(XSS).first().waitFor();
  await noScriptRan();
});

test("resources: upload a file, rename it inline, delete dialog shows the name as text", async function () {
  await page.goto(base + "/resources");
  const file = path.join(app.dir, "form.pdf");
  fs.writeFileSync(file, "%PDF-1.4 test");
  await page.setInputFiles("#uploadForm input[type=file]", file);
  await page.fill("#uploadForm input[name=name]", XSS);
  await page.selectOption("#uploadForm select[name=category]", "Forms");
  await page.click("button:has-text('Upload Resource')");
  await page.waitForSelector(".btn-delete");

  // The name links to the download; in edit mode a click edits it instead.
  const card = page.locator(".card", { has: page.locator(".btn-delete") });
  const href = await card.locator("a[data-name=name]").getAttribute("href");
  await card.locator(".btn-edit").click();
  await card.locator("a[data-name=name]").click();
  await card.locator(".field-editor input").fill(XSS + " v2");
  await card.locator(".field-editor input").press("Enter");
  await card.locator("a[data-name=name]", { hasText: "v2" }).waitFor();
  assert.equal(await card.locator("a[data-name=name]").getAttribute("href"), href);
  await card.locator(".btn-edit").click();

  await page.click(".btn-delete");
  await dialogOpen();
  assert.ok((await dialogText()).includes(XSS + " v2"));
  await noScriptRan();
  await page.click("dialog .btn-danger");
  await page.waitForSelector(".btn-delete", { state: "detached" });
});

test("profile: NRC editor loads; create and delete a short link", async function () {
  await page.goto(base + "/users/profile");
  await page.waitForSelector("#editor .ace_content");
  await page.fill("form[action='/s'] input[name=name]", "Example");
  await page.fill("input[name=orgurl]", "example.com");
  await page.fill("input[name=newurl]", "ex");
  await page.click("form[action='/s'] button[type=submit]");
  await page.waitForSelector(".btn-delete");
  await page.click(".btn-delete");
  await dialogOpen();
  await page.click("dialog .btn-danger");
  await page.waitForSelector(".btn-delete", { state: "detached" });
});

test("about: add awardees, sort by year, delete dialog", async function () {
  await page.goto(base + "/about");
  for (const [name, year] of [
    [XSS, "2001"],
    ["Bob", "1999"],
  ]) {
    await page.fill("form[action='/about/BPA'] input[name=name]", name);
    await page.fill("form[action='/about/BPA'] input[name=year]", year);
    await page.click("form[action='/about/BPA'] button[type=submit]");
    await page.waitForLoadState("load");
  }
  const table = page.locator("table[data-sortable]", { hasText: "Bob" });
  const years = async () =>
    (await table.locator("tbody tr").allTextContents()).map((t) => t.match(/\d{4}/)[0]);
  assert.deepEqual(await years(), ["2001", "1999"]);
  await table.locator("th:has-text('Year')").click();
  assert.deepEqual(await years(), ["1999", "2001"]);
  await table.locator(".btn-delete").last().click();
  await dialogOpen();
  assert.ok((await dialogText()).includes(XSS));
  await noScriptRan();
  await page.click("dialog .btn-default");
});

test("faq, join and rover journey pages", async function () {
  for (const url of ["/faq", "/join", "/rjourney"]) await page.goto(base + url);
});

test("phone width: navbar collapses and opens", async function () {
  await page.setViewportSize({ width: 420, height: 800 });
  await page.goto(base + "/");
  await page.click(".navbar-toggle");
  await page.waitForSelector(".navbar-collapse.in");
  await page.setViewportSize({ width: 1300, height: 900 });
});

test("sign out", async function () {
  await page.goto(base + "/");
  await page.click("button:has-text('Sign Out')");
  await page.waitForSelector("a.dropdown-toggle:has-text('Sign In')");
});

test("no JavaScript errors or warnings on any page", function () {
  assert.deepEqual(problems, []);
});
