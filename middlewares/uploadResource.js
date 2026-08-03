const multer = require("multer");
const settings = require("../controllers/settings.js");
const fs = require("fs");
const path = require("path");

module.exports = multer({
  limits: {
    files: 1,
    fields: 10,
    fileSize: settings.FILE_SIZE_LIMIT,
  },
  fileFilter: function (req, file, cb) {
    const blockedExts = [
      ".html",
      ".htm",
      ".js",
      ".mjs",
      ".svg",
      ".php",
      ".exe",
      ".sh",
      ".bat",
      ".jar",
      ".wasm",
      ".asp",
      ".aspx",
      ".jsp",
      ".css",
    ];
    const blockedMimes = [
      "text/html",
      "application/javascript",
      "text/javascript",
      "application/x-javascript",
      "image/svg+xml",
      "",
    ];
    if (
      blockedExts.includes(path.extname(file.originalname).toLowerCase()) ||
      blockedMimes.includes(file.mimetype)
    ) {
      return cb(Error("File type not allowed"), false);
    }
    if (!req.body.name || req.body.name.length > 200) {
      return cb(Error("Name is required and must be under 200 characters"), false);
    }
    fs.access("./public/uploads/" + file.originalname, function (err) {
      if (err) cb(null, true);
      else cb(Error("File already exists"));
    });
  },
  storage: multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
    destination: function (req, file, cb) {
      cb(null, "./public/uploads");
    },
  }),
}).single("file");
