var express = require("express");
var router = express.Router();
var event = require("../models/event.js");
var admin = require("../middlewares/admin.js");

router.get("/add", admin, function(req, res) {
    res.render("addEvent", {
        title: "Add Event",
        user: req.user
    });
});

router.post("/add", admin, function(req, res) {
    event.add(req)
    .then(function(id) {
        req.session.success = "Event added.";
        res.redirect("/events/" + id);
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = err.message;
        res.status(400).redirect("/events/add");
    });
});

router.get("/:event", function(req, res) {
    event.get(req.params.event)
    .then(function(info) {
        res.render("event", {
            title: "Event",
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