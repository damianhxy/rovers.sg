const multer = require("multer");
const settings = require("../controllers/settings.js");

module.exports = multer({
  limits: {
    files: 1,
    fields: 10,
    fileSize: settings.FILE_SIZE_LIMIT,
    parts: 11,
  },
  storage: multer.memoryStorage(),
}).single("file");
