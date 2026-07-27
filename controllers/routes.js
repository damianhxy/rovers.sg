const express = require("express");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const router = express.Router();
const notification = require("../middlewares/notification.js");
const event = require("../models/event.js");
const resource = require("../models/resource.js");
const settings = require("./settings.js");
dayjs.extend(utc);
dayjs.extend(timezone);

router.use(notification);

/* Homepage */
router.get("/", async function (req, res) {
  try {
    const events = await event.upcoming(dayjs().tz("Asia/Singapore"));
    res.render("home", {
      title: "Home",
      user: req.user,
      upcoming: events,
      slideshow: settings.HOMEPAGE_SLIDESHOW,
      ENABLE_SIGNUP: settings.ENABLE_SIGNUP,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.post("/mailing", async function (req, res) {
  try {
    const response = await fetch(settings.MAILING_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(req.body).toString(),
    });
    const body = await response.text();
    res.send(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* Events */
router.use("/events", require("./events.js"));

/* Link Shortener */
router.use("/s", require("./shortener.js"));

/* Resources */
router.use("/resources", require("./resources.js"));

/* Information */
router.use("/about", require("./about.js"));

router.get("/rjourney", async function (req, res) {
  try {
    const files = await resource.get("Rover Journey");
    res.render("rjourney", {
      title: "A Rover's Journey",
      user: req.user,
      files: files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.get("/faq", function (req, res) {
  res.render("faq", {
    title: "FAQ",
    user: req.user,
  });
});

router.get("/join", function (req, res) {
  res.render("join", {
    title: "Join",
    user: req.user,
  });
});

/* User */
router.use("/users", require("./users.js"));

/* Healthcheck */
router.get("/healthcheck", function (req, res) {
  res.status(200).send("OK");
});

/* 404 & 500 */
router.use(function (req, res) {
  res.status(404).render("404", {
    title: "Page Not Found",
    user: req.user,
  });
});

router.use(function (err, req, res, _next) {
  console.error(err.stack);
  res.status(500).render("500", {
    title: "Internal Server Error",
    user: req.user,
  });
});

module.exports = router;
