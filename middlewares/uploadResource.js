var multer = require("multer");
var settings = require("../controllers/settings.js");

module.exports = multer({
    limits: {
        files: 1,
        fields: 4,
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
