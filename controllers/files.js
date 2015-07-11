var express = require("express");
var router = express.Router();
var file = require("../models/file.js");
var auth = require("../middlewares/auth.js");
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

router.post("/delete", auth, function(req, res, next) {
    file.delete(req.body.id)
    .then(function() {
        res.send("Success");
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).send("Failed");
    });
});

router.post("/edit", auth, function(req, res, next) {
    file.edit(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.send("Success");
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).send("Failed");
    });
});

router.post("/upload", auth, upload, function(req, res, next) {
    if (!req.files.file) {
        req.session.error = "Please select a file.";
        res.status(400).redirect("/resource#upload");
    }
    file.add(req)
    .then(function() {
        req.session.success = "File uploaded.";
    })
    .fail(function(err) {
        console.error(err.stack);
        req.session.error = "Failed to upload file.";
        fs.unlink(req.files.file[0].path);
    })
    .fin(function() {
        res.redirect("/resource#upload");
    });
});

module.exports = router;