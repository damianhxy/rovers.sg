var express = require("express");
var router = express.Router();
var moment = require("moment");
var event = require("../models/event.js");
var settings = require("./settings.js");
var admin = require("../middlewares/admin.js");

router.get("/add", admin, function(req, res, next) {
    event.all()
    .then(function(events) {
        events.forEach(function(e) {
            e.url = "/events/view/" + e._id;
        });
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
        console.error(err.stack);
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
        console.error(err.stack);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/edit", admin, function(req, res) {
    event.edit(req.body.pk, req.body.name, req.body.value)
    .then(function(response) {
        res.json(response);
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).json({ "error": err.message });
    });
});

router.get("/view/:event", function(req, res) {
    event.get(req.params.event)
    .then(function(info) {
        info.start = moment(info.start).format(settings.EVENT_TIME_FORMAT);
        info.end = moment(info.end).format(settings.EVENT_TIME_FORMAT);
        res.render("eventView", {
            title: info.title,
            user: req.user,
            info: info
        });
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;