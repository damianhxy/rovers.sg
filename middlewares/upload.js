var multer = require("multer");
var fs = require("fs");
var settings = require("../controllers/settings.js");

module.exports = multer({
    limits: {
        files: 1,
        parts: 5,
        fileSize: settings.FILE_SIZE_LIMIT
    },
    storage: multer.diskStorage({
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        },
        destination: function(req, file, cb) {
            cb(null, "./public/uploads");
        }
    })
});
