// Retakes the README screenshots (docs/screenshots) from a local copy with the demo content.
// Usage: node scripts/screenshots.js   (needs a Playwright Chromium: npx playwright install chromium)
const path = require("path");
const { chromium } = require("playwright");
const { start, ADMIN, Client } = require("../test/helpers/app.js");
const out = path.join(__dirname, "..", "docs", "screenshots");
(async () => {
  const app = await start({ SEED_DEMO_DATA: "true", TZ: "Asia/Singapore" });
  await app.waitForOutput(/Demo data: seeded/);
  const admin = new Client(app.baseUrl);
  await admin.signIn(ADMIN.username, ADMIN.password);
  const feed = JSON.parse((await admin.get("/events/feed?start=2000-01-01&end=2100-01-01")).text);
  const id = (t) => feed.find((e) => e.title === t)._id;
  const browser = await chromium.launch();
  async function shoot(name, url, { width = 1280, height = 800, signedIn = false, before } = {}) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      timezoneId: "Asia/Singapore",
      reducedMotion: "reduce",
    });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    if (signedIn)
      await ctx.addCookies([
        { name: "connect.sid", value: admin.cookies["connect.sid"], url: app.baseUrl },
      ]);
    const page = await ctx.newPage();
    await page.goto(app.baseUrl + url);
    await page.evaluate(() => window.jQuery && jQuery(".carousel").carousel("pause"));
    await page.waitForTimeout(600);
    if (before) await before(page);
    await page.screenshot({ path: path.join(out, name + ".jpg"), type: "jpeg", quality: 80 });
    await ctx.close();
  }
  await shoot("home", "/");
  await shoot("calendar", "/events/all");
  await shoot("event", "/events/" + id("Gunung Rinjani Expedition"), {
    before: (p) =>
      p.evaluate(() => {
        const h = [...document.querySelectorAll("h2")].find((e) =>
          /Photo Gallery/.test(e.textContent),
        );
        window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 70);
      }),
  });
  await shoot("resources", "/resources");
  await shoot("admin-event", "/events/" + id("Pulau Ubin Cycling Expedition"), {
    signedIn: true,
    before: async (p) => {
      await p.click(".btn-edit");
      await p.click("span.field-edit[data-name=start]");
      await p.waitForTimeout(300);
    },
  });
  await shoot("admin-profile", "/users/profile", {
    signedIn: true,
    before: (p) =>
      p.evaluate(() =>
        document.querySelector("form[action='/s']").scrollIntoView({ block: "start" }),
      ),
  });
  await browser.close();
  await app.stop();
})();
