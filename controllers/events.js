const express = require("express");
const router = express.Router();
const event = require("../models/event.js");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const admin = require("../middlewares/admin.js");
const uploadPhoto = require("../middlewares/uploadPhoto.js");
dayjs.extend(utc);
dayjs.extend(timezone);

router.get("/", async function (req, res) {
  try {
    const events = await event.upcoming(dayjs().tz("Asia/Singapore"));
    res.render("events", {
      title: "Events",
      user: req.user,
      upcoming: events,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.get("/add", admin, function (req, res) {
  res.render("eventAdd", {
    title: "Add Event",
    user: req.user,
  });
});

router.get("/all", function (req, res) {
  res.render("eventCalendar", {
    title: "All Events",
    user: req.user,
  });
});

router.get("/category/:category", async function (req, res) {
  try {
    const date = dayjs().tz("Asia/Singapore");
    const events = await event.getCategoryUpcoming(req.params.category, date);
    res.render("eventCategory", {
      title: req.params.category,
      user: req.user,
      events: events,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.get("/feed", async function (req, res) {
  try {
    const events = await event.range(req.query.start, req.query.end);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", admin, async function (req, res) {
  try {
    const id = await event.add(req);
    res.redirect("/events/" + id);
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.status(400).redirect("/events/add");
  }
});

router.delete("/", admin, async function (req, res) {
  try {
    await event.delete(req.body.id);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/", admin, async function (req, res) {
  try {
    const response = await event.edit(req.body.pk, req.body.name, req.body.value);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/:event", async function (req, res) {
  try {
    const info = await event.get(req.params.event);
    res.render("eventView", {
      title: info.title,
      user: req.user,
      info: info,
    });
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.redirect(req.headers.referrer || "/");
  }
});

router.post("/:event", admin, function (req, res) {
  uploadPhoto(req, res, async function (err) {
    if (err) {
      console.error(err);
      req.session.error = err.message;
    } else {
      try {
        await event.addPhotos(req.params.event, req.files);
        req.session.success = "Photos uploaded";
      } catch (err) {
        console.error(err);
        req.session.error = err.message;
      }
    }
    res.redirect("/events/" + req.params.event);
  });
});

router.put("/:event", admin, async function (req, res) {
  try {
    await event.mark(req.params.event, req.body.name);
    res.redirect("/events/" + req.params.event);
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.status(400).redirect("/events/" + req.params.event);
  }
});

router.delete("/:event", admin, async function (req, res) {
  try {
    await event.deletePhoto(req.params.event, req.body.name);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
