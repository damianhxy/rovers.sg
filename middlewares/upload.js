var multer = require("multer");
var fs = require("fs");
var settings = require("../controllers/settings.js");

module.exports = multer({
    dest: "./public/uploads",
    limits: {
        files: 1,
        fileSize: settings.FILE_SIZE_LIMIT * 1048576
    },
    putSingleFilesInArray: true,
    onFileUploadStart: function(file, req) {
        if (!req.user)
            return false;
        console.log("Uploading " + file.originalname);
    },
    onFileUploadComplete: function(file) {
        console.log(file.originalname + " was uploaded to " + file.path);
    },
    rename: function(fieldname, filename) {
        return filename + Date.now();
    },
    onError: function(err, next) {
        console.error(err.stack);
        next(err);
    },
    onFileSizeLimit: function(file) {
        console.error("File size limit exceeded: " + file.originalname);
        fs.unlink(file.path);
    }
});