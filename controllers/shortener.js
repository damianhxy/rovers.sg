var express = require("express");
var router = express.Router();
var short = require("../models/shortener.js");
var admin = require("../middlewares/admin.js");

router.post("/", function(req, res) {
    short.add(req)
    .then(function() {
        req.session.success = "Link created";
        res.redirect("/users/profile");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/", function(req, res) {
    short.delete(req.body.url)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.get("/:url", function(req, res) {
    short.get(req.params.url)
    .then(function(info) {
        if (info.embed) {
            res.render("embed", {
                title: info.newurl,
                user: req.user,
                info: info
            });
        } else {
            res.redirect(info.orgurl);
        }
    })
    .fail(function(err) {
        console.log(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;
