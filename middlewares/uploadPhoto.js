const multer = require("multer");
const settings = require("../controllers/settings.js");

const imageTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

module.exports = multer({
  limits: {
    fields: 10,
    files: 20,
    fileSize: settings.PHOTO_SIZE_LIMIT,
    parts: 30,
  },
  fileFilter: function (_req, file, cb) {
    if (!imageTypes.has(file.mimetype)) return cb(Error("File type not allowed"), false);
    cb(null, true);
  },
  storage: multer.memoryStorage(),
}).array("file", 20);
