var express = require("express");
var passport = require("passport");
var router = express.Router();
var user = require("../models/user.js");
var auth = require("../middlewares/auth.js");

router.post("/changePassword", auth, function(req, res) {
    user.changePassword(req)
    .then(function() {
        req.session.success = "Password Updated.";
        res.redirect("/users/profile");
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = err.message;
        res.status(400).redirect("/users/profile");
    });
});

router.get("/profile", auth, function(req, res) {
    res.render("profile", {
        title: "Profile",
        user: req.user
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
    console.info("Signed out " + req.user.username);
    req.logout();
    res.redirect("/");
});

router.post("/signup", auth, function(req, res) {
    /*passport.authenticate("local-signup", function(err, user, info) {
        if (err) return next(err);
        req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res);*/
    console.warn("Illegal attempt to access sign up.");
    res.session.error = "Nope.";
    res.status(400).redirect(req.headers.referer || "/");
});

module.exports = router;