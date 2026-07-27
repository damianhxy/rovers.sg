var express = require("express");
var moment = require("moment-timezone");
var router = express.Router();
var notification = require("../middlewares/notification.js");
var event = require("../models/event.js");
var resource = require("../models/resource.js");
var settings = require("./settings.js");
router.use(notification);

/* Homepage */
router.get("/", function(req, res) {
    event.upcoming(moment.tz("Asia/Singapore"))
    .then(function(events) {
        res.render("home", {
            title: "Home",
            user: req.user,
            upcoming: events,
            slideshow: settings.HOMEPAGE_SLIDESHOW,
            ENABLE_SIGNUP: settings.ENABLE_SIGNUP
        });
    })
    .catch(function(err) {
        console.error(err);
        res.status(500).render("500", {
            title: "Internal Server Error",
            user: req.user
        });
    });
});

router.post("/mailing", function(req, res) {
    fetch(settings.MAILING_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(req.body).toString()
    })
    .then(function(response) {
        return response.text();
    })
    .then(function(body) {
        res.send(body);
    })
    .catch(function(err) {
        console.error(err);
        res.status(500).json({ "error": err.message });
    });
});

/* Events */
router.use("/events", require("./events.js"));

/* Link Shortener */
router.use("/s", require("./shortener.js"));

/* Resources */
router.use("/resources", require("./resources.js"));

/* Information */
router.use("/about", require("./about.js"));

router.get("/rjourney", function(req, res) {
    resource.get("Rover Journey")
    .then(function(files) {
        res.render("rjourney", {
            title: "A Rover's Journey",
            user: req.user,
            files: files
        });
    })
    .catch(function(err) {
        console.error(err);
        res.status(500).render("500", {
            title: "Internal Server Error",
            user: req.user
        });
    });
});

router.get("/faq", function(req, res) {
    res.render("faq", {
        title: "FAQ",
        user: req.user
    });
});

router.get("/join", function(req, res) {
    res.render("join", {
        title: "Join",
        user: req.user
    });
});

/* User */
router.use("/users", require("./users.js"));

/* 404 & 500 */
router.use(function(req, res) {
    res.status(404).render("404", {
        title: "Page Not Found",
        user: req.user
    });
});

router.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render("500", {
        title: "Internal Server Error",
        user: req.user
    });
});

module.exports = router;
