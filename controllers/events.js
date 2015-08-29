var express = require("express");
var passport = require("passport");
var router = express.Router();
var event = require("../models/event.js");
var auth = require("../middlewares/auth.js");
var admin = require("../middlewares/admin.js");

router.get("/add", admin, function(req, res) {
    res.render("addEvent", {
        title: "Add Event",
        user: req.user
    })
});

module.exports = router;