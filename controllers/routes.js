var express = require("express");
var request = require("request");
var moment = require("moment-timezone");
var router = express.Router();
var notification = require("../middlewares/notification.js");
var event = require("../models/event.js");
var resource = require("../models/resource.js");
var settings = require("./settings.js");
var admin = require("../middlewares/admin.js");
router.use(notification);

/* Normal Pages */
router.get("/", function(req, res) {
    event.upcoming(moment.tz("Asia/Singapore").format())
    .then(function(events) {
        res.render("home", {
            title: "Home",
            user: req.user,
            upcoming: events
        });
    });
});

/* Events */
router.get("/upcoming", function(req, res) {
    event.upcoming(moment.tz("Asia/Singapore"))
    .then(function(events) {
        res.render("upcoming", {
            title: "Upcoming",
            user: req.user,
            upcoming: events
        });
    });
});

router.use("/events", require("./events.js"));

/* Link Shortener */
router.use("/s", require("./shortener.js"));

/* Resources */
router.use("/resources", require("./resources.js"));

/* Activities */
router.use("/activities", require("./activities.js"));

/* Information */
router.use("/about", require("./BPAs.js"));

router.get("/rjourney", function(req, res) {
    resource.get("Rover Journey")
    .then(function(files) {
        console.log(files);
        res.render("rjourney", {
            title: "A Rover's Journey",
            user: req.user,
            files: files
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

router.post("/join", function(req, res) {
    request.post(settings.JOIN_FORM_URL).form(req.body).pipe(res);
});

router.get("/contact", function(req, res) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

router.post("/contact", function(req, res) {
    request.post(settings.FEEDBACK_FORM_URL).form(req.body).pipe(res);
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
