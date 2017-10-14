var multer = require("multer");
var settings = require("../controllers/settings.js");
var fs = require("fs");

module.exports = multer({
    limits: {
        files: 1,
        fields: 4,
        fileSize: settings.FILE_SIZE_LIMIT
    },
    fileFilter: function(req, file, cb) {
        fs.access("./public/uploads/" + file.originalname, function(err) {
            if (err) cb(null, true);
            else cb(Error("File already exists"));
        });
    },
    storage: multer.diskStorage({
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        },
        destination: function(req, file, cb) {
            cb(null, "./public/uploads");
        },
    })
}).single("file");
