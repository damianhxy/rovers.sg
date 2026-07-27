const express = require("express");
const os = require("os");
const passport = require("passport");
const router = express.Router();
const short = require("../models/shortener.js");
const user = require("../models/user.js");
let NRCs = require("./NRCs.js");
const settings = require("./settings.js");
const auth = require("../middlewares/auth.js");
const { body, validationResult } = require("express-validator");

const passwordValidation = [
  body("newPass").isLength({ min: 8, max: 100 }).withMessage("Password must be 8-100 characters"),
  body("newPass2")
    .custom(function (value, req) {
      return value === req.req.body.newPass;
    })
    .withMessage("Passwords do not match"),
];

router.post("/editPassword", auth, passwordValidation, function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    return res.status(400).redirect("/users/profile");
  }
  user
    .editPassword(req)
    .then(function () {
      req.session.success = "Password Updated";
      res.redirect("/users/profile");
    })
    .catch(function (err) {
      console.error(err);
      req.session.error = err.message;
      res.status(400).redirect("/users/profile");
    });
});

router.get("/profile", auth, function (req, res) {
  short
    .all()
    .then(function (links) {
      delete require.cache[require.resolve("./NRCs.js")];
      NRCs = require("./NRCs.js");
      res.render("profile", {
        title: "Profile",
        user: req.user,
        NRCStr: JSON.stringify(NRCs.NRC, null, 4),
        info: {
          "Node Version": process.version,
          Platform: os.type(),
          Architecture: os.arch(),
          "OS Version": os.release(),
          "Total Memory": Math.round(os.totalmem() / Math.pow(1024, 3)) + " GB",
          Uptime: os.uptime() + " Seconds",
        },
        links: links,
        linksStr: JSON.stringify(links, null, 4),
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).render("500", {
        title: "Internal Server Error",
        user: req.user,
      });
    });
});

router.post("/signin", function (req, res, next) {
  passport.authenticate("local-signin", function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(400).redirect(req.headers.referer || "/");
    return req.login(user, function (err) {
      if (err) return next(err);
      res.redirect(req.headers.referer || "/");
    });
  })(req, res, next);
});

router.get("/signout", auth, function (req, res) {
  console.info("Signed out", req.user.username);
  req.logout(function (err) {
    if (err) {
      console.error(err);
    }
    res.redirect("/");
  });
});

if (settings.ENABLE_SIGNUP)
  router.post(
    "/signup",
    [
      body("username")
        .isLength({ min: 3, max: 30 })
        .isAlphanumeric()
        .withMessage("Username must be 3-30 alphanumeric characters"),
      body("password")
        .isLength({ min: 8, max: 100 })
        .withMessage("Password must be 8-100 characters"),
      body("name").isLength({ min: 1, max: 100 }).withMessage("Name is required"),
    ],
    function (req, res, next) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.session.error = errors.array()[0].msg;
        return res.status(400).redirect(req.headers.referer || "/");
      }
      passport.authenticate("local-signup", function (err, user, _info) {
        if (err) return next(err);
        return req.login(user, function (err) {
          if (err) return next(err);
          res.redirect("/");
        });
      })(req, res, next);
    },
  );

module.exports = router;
