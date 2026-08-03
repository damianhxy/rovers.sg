const user = require("../models/user.js");
const morgan = require("morgan");
const passport = require("passport");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const settings = require("./settings.js");
const session = require("express-session");
const exphbs = require("express-handlebars");
const localStrategy = require("passport-local");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const methodOverride = require("method-override");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { csrfSync } = require("csrf-sync");
const MemoryStore = require("memorystore")(session);
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = function (app, express) {
  require("console-stamp")(console, {
    format: ":date(ddd mmm HH:MM:ss).cyan :label.magenta",
  });

  morgan.token("time", function () {
    return dayjs().format(settings.TIME_FORMAT);
  });

  const csrfProtection = csrfSync({
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getTokenFromRequest: function (req) {
      return (
        (req.body && req.body._csrf) ||
        (req.query && req.query._csrf) ||
        req.headers["x-csrf-token"]
      );
    },
  });

  // Middleware
  app.set("trust proxy", 1);
  app.use(compression());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.static("public"));
  app.use(
    morgan("[:time] :method :url :status :res[content-length] - :remote-addr - :response-time ms"),
  );
  app.use(cookieParser(settings.SECRET));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    session({
      secret: settings.SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      store: new MemoryStore({ checkPeriod: 86400000 }),
    }),
  );
  app.use(methodOverride("_method"));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(csrfProtection.csrfSynchronisedProtection);

  app.use(function (req, res, next) {
    res.locals.csrfToken = csrfProtection.generateToken(req);
    next();
  });

  // Rate limiting on auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many attempts, please try again later",
  });
  app.use("/users/signin", authLimiter);
  app.use("/users/signup", authLimiter);

  // Strategies
  passport.use(
    "local-signin",
    new localStrategy({ passReqToCallback: true }, function (req, username, password, done) {
      return user
        .authenticate(username, password)
        .then(function (user) {
          console.info("Signed in", user.username);
          done(null, user);
        })
        .catch(function (err) {
          console.error(err);
          req.session.error = err.message;
          done(null, false);
        });
    }),
  );

  if (settings.ENABLE_SIGNUP)
    passport.use(
      "local-signup",
      new localStrategy({ passReqToCallback: true }, function (req, username, password, done) {
        return user
          .add(req.body.name, username, password)
          .then(function (user) {
            console.info("Signed up", user.username);
            done(null, user);
          })
          .catch(function (err) {
            console.error(err);
            req.session.error = err.message;
            done(null, false);
          });
      }),
    );

  // Serialization
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (id, done) {
    user
      .get(id)
      .then(function (user) {
        done(null, user);
      })
      .catch(function (err) {
        done(err, false);
      });
  });

  const hbs = exphbs.create({
    defaultLayout: "default",
    helpers: {
      fileType: require("../helpers/fileType.js"),
      rowSpan: require("../helpers/rowSpan.js"),
    },
  });

  app.enable("case sensitive routing");
  app.enable("strict routing");
  app.disable("x-powered-by");
  app.engine("handlebars", hbs.engine);
  app.set("view engine", "handlebars");
};
