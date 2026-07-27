const express = require("express");
const router = express.Router();
const short = require("../models/shortener.js");
const admin = require("../middlewares/admin.js");

router.post("/", admin, async function (req, res) {
  try {
    await short.add(req);
    req.session.success = "Link created";
    res.redirect("/users/profile");
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.status(400).redirect("/users/profile");
  }
});

router.delete("/", admin, async function (req, res) {
  try {
    await short.delete(req.body.id);
    res.end();
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.redirect(req.headers.referrer || "/");
  }
});

router.get("/:url", async function (req, res) {
  try {
    const info = await short.get(req.params.url);
    if (info.embed) {
      res.render("embed", {
        title: info.name,
        user: req.user,
        info: info,
      });
    } else {
      res.redirect(info.orgurl);
    }
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.redirect(req.headers.referrer || "/");
  }
});

module.exports = router;
