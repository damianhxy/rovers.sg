var express = require("express");
var decache = require('decache');
var router = express.Router();
var BPA = require("../models/BPA.js");
var NRC = require("../models/NRC.js");
var NRCs = require("./NRCs.js");
var admin = require("../middlewares/admin.js");

router.get("/", function(req, res) {
    BPA.all()
    .then(function(BPAs) {
        decache("./NRCs.js");
        NRCs = require("./NRCs.js");
        res.render("about", {
            title: "About",
            user: req.user,
            BPAs: BPAs,
            NRC: NRCs.NRC,
            NRC2017: NRCs.NRC[0].members
        });
    });
});

router.post("/NRC", admin, function(req, res) {
    NRC.update(req.body.data)
    .then(function() {
        req.session.success = "NRCs updated";
        res.redirect("/users/profile");
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/users/profile");
    });
});

router.post("/BPA", admin, function(req, res) {
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

router.delete("/BPA", admin, function(req, res) {
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
