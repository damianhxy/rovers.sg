var express = require("express");
var router = express.Router();
var fs = require("fs");
var resource = require("../models/resource.js");
var admin = require("../middlewares/admin.js");
var upload = require("../middlewares/uploadResource.js");

router.get("/", function(req, res) {
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
    });
});

router.delete("/", admin, function(req, res) {
    resource.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.put("/", admin, function(req, res) {
    resource.edit(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.json({});
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

router.post("/", function(req, res) {
    upload.single("file")(req, res, function(err) {
        if (err) {
            console.error(err);
            req.session.error = err.message;
            res.status(400).redirect("/resources#upload");
        } else {
            resource.add(req)
            .then(function() {
                req.session.success = "File uploaded";
                res.redirect("/resources#upload");
            })
            .catch(function(err) {
                console.error(err);
                req.session.error = err.message;
                fs.unlink(req.file.path);
                res.status(400).redirect("/resources#upload");
            });
        }
    });
});

module.exports = router;
