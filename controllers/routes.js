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

/* Homepage */
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

router.post("/mailing", function(req, res) {
    request.post(settings.MAILING_FORM_URL).form(req.body).pipe(res);
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
router.get("/activities", function(req, res) {
    var date = moment.tz("Asia/Singapore");
    Promise.all([
        event.getCategoryUpcoming("adventure", date),
        event.getCategoryUpcoming("service", date),
        event.getCategoryUpcoming("fellowship", date),
        event.getCategoryUpcoming("courses", date)
    ]).then(function(ret) {
        res.render("activities", {
            title: "Activities",
            user: req.user,
            adventure: ret[0],
            service: ret[1],
            fellowship: ret[2],
            courses: ret[3]
        });
    });
});

/* Information */
router.use("/about", require("./BPAs.js"));

router.get("/rjourney", function(req, res) {
    resource.get("Rover Journey")
    .then(function(files) {
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

router.get("/contact", function(req, res) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

router.post("/contact", function(req, res) {
    request.post(settings.CONTACT_FORM_URL).form(req.body).pipe(res);
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
