var express = require("express");
var router = express.Router();
var form = require("../models/form.js");
var admin = require("../middlewares/admin.js");

router.post("/", function(req, res) {
    form.add(req)
    .then(function() {
        req.session.success = "Form added.";
        res.redirect("/events");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/", function(req, res) {
    form.delete(req.body.url)
    .then(function() {
        req.session.success = "Form deleted.";
        res.redirect("/events");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.get("/:url", function(req, res) {
    form.get(req.params.url)
    .then(function(info) {
        res.render("form", {
            title: info.name,
            user: req.user,
            info: info
        });
    })
    .fail(function(err) {
        console.log(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;
