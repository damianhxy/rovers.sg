var express = require("express");
var router = express.Router();
var settings = require("./settings.js");
var BPA = require("../models/BPA.js");
var admin = require("../middlewares/admin.js");

router.get("/", function(req, res) {
    BPA.all()
    .then(function(BPAs) {
        res.render("about", {
            title: "About",
            user: req.user,
            BPAs: BPAs,
            NRC: settings.NRC
        });
    });
});

router.post("/", admin, function(req, res) {
    BPA.add(req)
    .then(function() {
        req.session.success = "Awardee added";
        res.redirect("/about");
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/", admin, function(req, res) {
    BPA.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

module.exports = router;
