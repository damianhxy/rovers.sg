var express = require("express");
var os = require("os");
var passport = require("passport");
var decache = require('decache');
var router = express.Router();
var short = require("../models/shortener.js");
var user = require("../models/user.js");
var NRCs = require("./NRCs.js");
var auth = require("../middlewares/auth.js");

router.post("/editPassword", auth, function(req, res) {
    user.editPassword(req)
    .then(function() {
        req.session.success = "Password Updated";
        res.redirect("/users/profile");
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/users/profile");
    });
});

router.get("/profile", auth, function(req, res) {
    short.all()
    .then(function(links) {
        decache("./NRCs.js");
        NRCs = require("./NRCs.js");
        res.render("profile", {
            title: "Profile",
            user: req.user,
            NRCStr: JSON.stringify(NRCs.NRC, null, 4),
            info: {
                "Node Version": process.version,
                "Platform": os.type(),
                "Architecture": os.arch(),
                "OS Version": os.release(),
                "Total Memory": Math.round(os.totalmem() / Math.pow(1024, 3)) + " GB",
                "Uptime": os.uptime() + " Seconds"
            },
            links: links,
            linksStr: JSON.stringify(links, null, 4)
        });
    });
});

router.post("/signin", function(req, res, next) {
    passport.authenticate("local-signin", function(err, user) {
        if (err) return next(err);
        if (!user)
            return res.status(400).redirect(req.headers.referer || "/");
        return req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res, next);
});

router.get("/signout", auth, function(req, res) {
    console.info("Signed out", req.user.username);
    req.logout();
    res.redirect("/");
});
/*
router.post("/signup", auth, function(req, res) {
    passport.authenticate("local-signup", function(err, user, info) {
        if (err) return next(err);
        req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res);
});
*/
module.exports = router;
