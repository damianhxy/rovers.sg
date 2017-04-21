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
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/", function(req, res) {
    short.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
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
                title: info.name,
                user: req.user,
                info: info
            });
        } else {
            res.redirect(info.orgurl);
        }
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;
