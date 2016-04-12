var express = require("express");
var router = express.Router();
var moment = require("moment-timezone");
var event = require("../models/event.js");
var form = require("../models/form.js")
var settings = require("./settings.js");
var admin = require("../middlewares/admin.js");

router.get("/", function(req, res, next) {
    event.all()
    .then(function(events) {
        events.forEach(function(e) {
            e.url = "/events/view/" + e._id;
        });
        form.all()
        .then(function(forms) {
            res.render("events", {
                title: "Events",
                user: req.user,
                events: JSON.stringify(events),
                forms: forms
            });
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.get("/add", admin, function(req, res, next) {
    event.all()
    .then(function(events) {
        res.render("eventAdd", {
            title: "Add Event",
            user: req.user,
            events: JSON.stringify(events)
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.post("/add", admin, function(req, res) {
    event.add(req)
    .then(function(id) {
        res.redirect("/events/view/" + id);
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/events/add");
    });
});

router.post("/delete", admin, function(req, res) {
    event.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/edit", admin, function(req, res) {
    event.edit(req.body.pk, req.body.name, req.body.value)
    .then(function(response) {
        res.json(response);
    })
    .fail(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.get("/view/:event", function(req, res) {
    event.get(req.params.event)
    .then(function(info) {
        info.start = moment(info.start).tz("Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        info.end = moment(info.end).tz("Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        res.render("eventView", {
            title: info.title,
            user: req.user,
            info: info
        });
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;
