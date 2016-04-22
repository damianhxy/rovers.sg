var express = require("express");
var router = express.Router();
var BPA = require("../models/BPA.js");
var admin = require("../middlewares/admin.js");

router.get("/", function(req, res) {
    BPA.all()
    .then(function(BPAs) {
        res.render("about", {
            title: "About",
            user: req.user,
            BPAs: BPAs
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.post("/", admin, function(req, res) {
    BPA.add(req)
    .then(function() {
        req.session.success = "Awardee added.";
        res.redirect("/about");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/", admin, function(req, res) {
    BPA.delete(req.body.name)
    .then(function() {
        req.session.success = "Awardee deleted.";
        res.redirect("/about");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

module.exports = router;
