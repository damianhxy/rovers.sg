var express = require("express");
var router = express.Router();
var event = require("../models/event.js");
var settings = require("./settings.js");
var moment = require("moment-timezone");

router.get("/", function(req, res) {
    res.render("activitiesOverview", {
        title: "Overview",
        user: req.user
    });
});

router.get("/:category", function(req, res) {
    var category = req.params.category;
    event.getCategory(category)
    .then(function(events) {
        events.forEach(function(e) {
            e.start = moment.tz(e.start, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
            e.end = moment.tz(e.end, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        });
        res.render("activities", {
            title: category[0].toUpperCase() + category.slice(1),
            user: req.user,
            events: events
        });
    });
});

module.exports = router;
