var multer = require("multer");
var path = require("path");
var fs = require("fs");
var settings = require("../controllers/settings.js");

module.exports = multer({
    limits: {
        files: 1,
        parts: 3,
        fileSize: settings.FILE_SIZE_LIMIT
    },
    storage: multer.diskStorage({
        filename: function(req, file, cb) {
            console.log("Uploading " + file.originalname + " to " + path.resolve("./public/uploads"));
            var parts = file.originalname.split(".");
            cb(null, parts.shift() + Date.now() + "." + parts.pop());
        },
        destination: function(req, file, cb) {
            cb(null, "./public/uploads");
        }
    })
});