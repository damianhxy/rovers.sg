exports.PORT = process.env.PORT || 5000;
exports.SECRET = process.env.SESSION_SECRET;
exports.FILE_SIZE_LIMIT = 25 * 1024 * 1024;
exports.PHOTO_SIZE_LIMIT = 5 * 1024 * 1024;
exports.TIME_FORMAT = "ddd MMM HH:mm:ss";
exports.EVENT_TIME_FORMAT = "D MMM YY | HH:mm";
exports.MAILING_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf24xB77bXz4Zzf9cpj6nXOWjBfMpaFktouuxama4GXhd5j0Q/formResponse";
exports.HOMEPAGE_SLIDESHOW = [
  "/img/Cropped/HomeBanner.jpg",
  "/img/Cropped/Adventure.jpg",
  "/img/Cropped/Service.jpg",
  "/img/Cropped/Fellowship.jpg",
  "/img/Cropped/Courses.jpg",
];
exports.ENABLE_SIGNUP = false;
