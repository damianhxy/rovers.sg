var express = require("express");
var router = express.Router();
var fs = require("fs");
var resource = require("../models/resource.js");
var admin = require("../middlewares/admin.js");
var upload = require("../middlewares/upload.js");

router.get("/", function(req, res, next) {
    resource.all()
    .then(function(files) {
        var categories = {
            "Latest Information": { name: "info", icon: "inbox", fileList: [] },
            "Forms": { name: "forms", icon: "newspaper-o", fileList: [] },
            "NRC": { name: "nrc", icon: "institution", fileList: [] }
        };
        files.forEach(function(e) {
            categories[e.category].fileList.push(e);
        });
        res.render("resources", {
            title: "Resources",
            user: req.user,
            categories: categories
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.delete("/", admin, function(req, res) {
    resource.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.put("/", admin, function(req, res) {
    resource.edit(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.json({});
    })
    .fail(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/", admin, upload.single("file"), function(req, res) {
    resource.add(req)
    .then(function() {
        req.session.success = "File uploaded.";
        res.redirect("/resources#upload");
    })
    .fail(function(err) {
        console.error(err);
        req.session.error = err.message;
        fs.unlink(req.file.path);
        res.status(400).redirect("/resources#upload");
    });
});

module.exports = router;
