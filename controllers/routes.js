var express = require("express");
var router = express.Router();
var notification = require("../middlewares/notification.js");
router.use(notification);

/* Resources */
router.use("/resource", require("./files.js"));

/* User */
router.use("/users", require("./users.js"));

/* Normal Pages */
router.get("/", function(req, res) {
    res.render("home", {
        title: "Home",
        user: req.user
    });
});

router.get("/about", function(req, res) {
    res.render("about", {
        title: "About",
        user: req.user
    });
});

router.get("/contact", function(req, res) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

router.get("/faq", function(req, res) {
    res.render("faq", {
        title: "FAQ",
        user: req.user
    });
});

router.get("/join", function(req, res) {
    res.render("join", {
        title: "Join us",
        user: req.user
    });
});

router.get("/links", function(req, res) {
    res.render("links", {
        title: "Links",
        user: req.user
    });
});

router.get("/nrr", function(req, res) {
    res.render("nrr", {
        title: "NRR",
        user: req.user
    });
});

router.get("/sitemap", function(req, res) {
    res.render("sitemap", {
        title: "Sitemap",
        user: req.user
    });
});

/* 404 & 500 */
router.use(function(req, res) {
    res.status(404).render("404", {
        title: "Page Not Found",
        user: req.user
    });
});

router.use(function(err, req, res) {
    console.error(err.stack);
    res.status(500).render("500", {
        title: "Internal Server Error",
        user: req.user
    });
});

module.exports = router;