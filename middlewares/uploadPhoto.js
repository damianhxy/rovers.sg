var multer = require("multer");
var settings = require("../controllers/settings.js");

module.exports = multer({
    fileFilter: function(req, file, cb) {
        cb(null, file.mimetype.indexOf("image") >= 0);
    },
    limits: {
        fields: 1,
        fileSize: settings.PHOTO_SIZE_LIMIT,

    },
    storage: multer.diskStorage({
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        },
        destination: function(req, file, cb) {
            cb(null, "./public/uploads/" + req.body.id);
        }
    })
});
