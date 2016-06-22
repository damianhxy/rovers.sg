var express = require("express");
var router = express.Router();
var moment = require("moment-timezone");
var event = require("../models/event.js");
var settings = require("./settings.js");
var admin = require("../middlewares/admin.js");
var upload = require("../middlewares/uploadPhoto.js");

router.get("/", function(req, res, next) {
    res.render("events", {
        title: "Events",
        user: req.user
    });
});

router.get("/feed", function(req, res, next) {
    event.range(req.query.start, req.query.end)
    .then(function(events) {
        /*events.forEach(function(e) {
            e.url = "/events/" + e._id;
        });*/
        res.json(events);
    });
});

router.get("/add", admin, function(req, res, next) {
    res.render("eventAdd", {
        title: "Add Event",
        user: req.user
    });
});

router.post("/", admin, function(req, res) {
    event.add(req)
    .then(function(id) {
        res.redirect("/events/" + id);
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/events/add");
    });
});

router.delete("/", admin, function(req, res) {
    event.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.put("/", admin, function(req, res) {
    event.edit(req.body.pk, req.body.name, req.body.value)
    .then(function(response) {
        res.json(response);
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/mark/:event", function(req, res) {
    event.mark(req.params.event, req.body.name)
    .then(function() {
        res.redirect("/events/" + req.params.event);
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/events/" + req.params.event);
    });
});

router.get("/:event", function(req, res) {
    event.get(req.params.event)
    .then(function(info) {
        res.render("eventView", {
            title: info.title,
            user: req.user,
            info: info
        });
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.post("/:event", admin, function(req, res) {
    upload.array("file")(req, res, function(err) {
        if (err) {
            console.error(err);
            req.session.error = err.message;
        } else {
            event.addPhotos(req.params.event, req.files)
            .then(function() {
                req.session.success = "Photos uploaded";
            })
            .catch(function(err) {
                console.error(err);
                req.session.error = err.message;
            });
        }
        res.redirect("/events/" + req.params.event);
    });
});

router.delete("/:event", admin, function(req, res) {
    event.deletePhoto(req.params.event, req.body.name)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

module.exports = router;
