const multer = require("multer");
const settings = require("../controllers/settings.js");
const fs = require("fs");

module.exports = multer({
  limits: {
    fields: 1,
    fileSize: settings.PHOTO_SIZE_LIMIT,
  },
  fileFilter: function (req, file, cb) {
    if (!req.body.id || !/^[a-zA-Z0-9]+$/.test(req.body.id)) {
      return cb(Error("Invalid event ID"), false);
    }
    fs.access("./public/uploads/" + req.body.id + "/" + file.originalname, function (err) {
      if (err) cb(null, file.mimetype.indexOf("image") >= 0);
      else cb(Error("Photo(s) already exist"), false);
    });
  },
  storage: multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
    destination: function (req, file, cb) {
      cb(null, "./public/uploads/" + req.body.id);
    },
  }),
}).array("file");
