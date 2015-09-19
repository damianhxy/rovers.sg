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
            "Latest Information": { name: "info", icon: "inbox", fileList: [], isEmpty: true },
            "Forms": { name: "forms", icon: "newspaper-o", fileList: [], isEmpty: true },
            "NRC": { name: "nrc", icon: "institution", fileList: [], isEmpty: true },
            "About": { name: "about", icon: "info-circle", fileList: [], isEmpty: true }
        };
        files.forEach(function(e) {
            categories[e.category].fileList.push(e);
            categories[e.category].isEmpty = false;
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

router.post("/delete", admin, function(req, res) {
    resource.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/edit", admin, function(req, res) {
    resource.edit(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.json({});
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/upload", admin, upload.single("file"), function(req, res) {
    if (!req.file) {
        req.session.error = "Please select a file.";
        res.status(400).redirect("/resource#upload");
    }
    resource.add(req)
    .then(function() {
        req.session.success = "File uploaded.";
        res.redirect("/resources#upload");
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = err.message;
        fs.unlink(req.file.path);
        res.status(400).redirect("/resources#upload");
    });
});

module.exports = router;