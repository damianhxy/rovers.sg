var express = require("express");
var router = express.Router();
var notification = require("../middlewares/notification.js");
var event = require("../models/event.js");
var resource = require("../models/resource.js");
var request = require("request");
var settings = require("./settings.js");
router.use(notification);

/* Resources */
router.use("/resources", require("./resources.js"));

/* User */
router.use("/users", require("./users.js"));

/* Events */
router.use("/events", require("./events.js"));

/* Normal Pages */
router.get("/", function(req, res, next) {
    event.upcoming(Date.now())
    .then(function(events) {
        res.render("home", {
            title: "Home",
            user: req.user,
            events: events.slice(0, 5),
            more: events.length > 5
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.get("/about", function(req, res) {
    res.render("about", {
        title: "About",
        user: req.user
    });
});

router.get("/contact", function(req, res) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

router.post("/contact/form", function(req, res) {
    request.post(settings.FEEDBACK_FORM_URL).form(req.body).pipe(res);
});

router.get("/faq", function(req, res) {
    res.render("faq", {
        title: "FAQ",
        user: req.user
    });
});

router.get("/join", function(req, res) {
	res.render("join", {
		title: "Join Us",
		user: req.user
	});
});

router.get("/sitemap", function(req, res) {
    res.render("sitemap", {
        title: "Sitemap",
        user: req.user
    });
});

/* 404 & 500 */
router.use(function(req, res) {
    res.status(404).render("404", {
        title: "Page Not Found",
        user: req.user
    });
});

router.use(function(err, req, res) {
    console.error(err.stack);
    res.status(500).render("500", {
        title: "Internal Server Error",
        user: req.user
    });
});

module.exports = router;