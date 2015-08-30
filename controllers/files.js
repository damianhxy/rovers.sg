var express = require("express");
var router = express.Router();
var fs = require("fs");
var file = require("../models/file.js");
var admin = require("../middlewares/admin.js");
var upload = require("../middlewares/upload.js");

router.get("/", function(req, res, next) {
    file.all()
    .then(function(files) {
        var pages = {
            "Latest Information": { name: "info", fileList: [], isEmpty: true },
            "Forms": { name: "forms", fileList: [], isEmpty: true },
            "Policies": { name: "policies", fileList: [], isEmpty: true },
            "Progress Scheme": { name: "scheme", fileList: [], isEmpty: true },
            "Others": { name: "others", fileList: [], isEmpty: true }
        };
        files.forEach(function(e) {
            pages[e.category].fileList.push(e);
            pages[e.category].isEmpty = false;
        });
        res.render("resources", {
            title: "Resources",
            user: req.user,
            category: pages
        });
    })
    .fail(function(err) {
        next(err);
    });
});

router.post("/delete", admin, function(req, res) {
    file.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).send(err.message);
    });
});

router.post("/edit", admin, function(req, res) {
    file.edit(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).end();
    });
});

router.post("/upload", admin, upload.single("file"), function(req, res) {
    if (!req.file) {
        req.session.error = "Please select a file.";
        res.status(400).redirect("/resource#upload");
    }
    file.add(req)
    .then(function() {
        req.session.success = "File uploaded.";
        res.redirect("/resource#upload");
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = err.message;
        fs.unlink(req.file.path);
        res.status(400).redirect("/resource#upload");
    });
});

module.exports = router;