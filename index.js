var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var exphbs = require("express-handlebars");
var express = require("express");
var fs = require("fs");
var func = require("./lib/functions.js");
var localStrategy = require("passport-local");
var morgan = require("morgan");
var multer = require("multer");
var passport = require("passport");
var session = require("express-session");

var app = express();

// Constants
var PORT = 8080;
var SECRET = "roversingapore";
var FILE_SIZE_LIMIT = 25;

// Auth
passport.use("local-signin", new localStrategy(
    { passReqToCallback: true },
    function(req, username, password, done) {
        return func.signIn(username, password)
        .then(function(user) {
            console.info("Signed in " + user.username);
            req.session.success = "Welcome back, " + user.username + ".";
            done(null, user);
        })
        .fail(function(err) {
            console.error(err);
            console.error(err.stack);
            req.session.error = err;
            done(null, false);
        });
    }
));

passport.use("local-signup", new localStrategy(
    { passReqToCallback: true },
    function(req, username, password, done) {
        return func.signUp(req.body.name, username, password)
        .then(function(user) {
            console.info("Signed up " + user.username);
            req.session.success = "Welcome, " + user.username + ".";
            done(null, user);
        })
        .fail(function(err) {
            console.error(err.stack);
            req.session.error = err;
            done(null, false);
        });
    }
));

// Session
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    func.findUser(id)
    .then(function(user) {
        done(null, user);
    })
    .fail(function(err) {
        done(err, false);
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    req.session.error = "Unauthorised.";
    res.status(401).redirect("/");
}

// Handlebars
var hbs = exphbs.create({
	defaultLayout: "default",
	helpers: {
		fileType: function(file) {
            // Patterns and Icons
            var files = [
                { pattern: "xlsx?", icon: "excel" }, { pattern: "pptx?", icon: "powerpoint" },
                { pattern: "docx?", icon: "word" }, { pattern :"pdf", icon: "pdf" },
                { pattern: "(png|jpg|gif)", icon: "picture" }, { pattern: "(zip|rar)", icon: "zip" }
            ];
			var icon = "file-text-o";
            files.forEach(function(e) {
                if (RegExp(e.pattern).test(file.split(".").pop()))
                    icon = "file-" + e.icon + "-o";
            });
			return icon;
		},
        toSeconds: function(timestamp) {
            return Math.floor(timestamp / 1000);
        }
	}
});

// Time stamp
require("console-stamp")(console, "dd mmm HH:MM:ss");

// Middleware
app.use(cookieParser(SECRET));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(session({
    secret: SECRET,
    saveUninitialized: true,
    resave: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Settings
app.enable("case sensitive routing");
app.enable("strict routing");
app.disable("x-powered-by");
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Public folder
app.use(express.static(__dirname + "/public"));

// Request logger
morgan.token("date", function(req, res) {
    return require("console-stamp/node_modules/dateformat")(new Date(), "dd mmm HH:MM:ss");
});
app.use(morgan("[:date] :method :url :status :res[content-length] - :remote-addr - :response-time ms"));

// File uploading
var uploadFile = multer({
    dest: "./public/files",
    limits: {
        files: 1,
        fileSize: FILE_SIZE_LIMIT * 1048576
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
        fs.unlink("./" + file.path);
    }
});

/* Routes */
// Message middleware
app.use(function(req, res, next) {
    ["success", "error"].forEach(function(e) {
        if (req.session[e]) {
            res.locals[e] = req.session[e];
            delete req.session[e];
        }
    });
    next();
});

// Navbar
app.get("/", function(req, res, next) {
    res.render("home", {
        title: "Home",
        user: req.user
    });
});

app.get("/about", function(req, res, next) {
    res.render("about", {
        title: "About",
        user: req.user
    });
});

app.get("/contact", function(req, res, next) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

app.get("/faq", function(req, res, next) {
    res.render("faq", {
        title: "FAQ",
        user: req.user
    });
});

app.get("/join", function(req, res, next) {
    res.render("join", {
        title: "Join us",
        user: req.user
    });
});

app.get("/links", function(req, res, next) {
    res.render("links", {
        title: "Links",
        user: req.user
    });
});

app.get("/nrr", function(req, res, next) {
    res.render("nrr", {
        title: "NRR",
        user: req.user
    });
});

app.get("/resource", function(req, res, next) {
    func.getFiles()
    .then(function(files) {
        var pages = {
            "Latest Information": { name: "info", fileList: [], isEmpty: true },
            "Forms": { name: "forms", fileList: [], isEmpty: true },
            "Policies": { name: "policies", fileList: [], isEmpty: true },
            "Progress Scheme": { name: "scheme", fileList: [], isEmpty: true },
            "Others": { name: "others", fileList: [], isEmpty: true }
        };
        files.forEach(function(e) {
            pages[e.category].fileList.push(e);
            pages[e.category].isEmpty = false;
        });
        res.render("resources", {
            title: "Resources",
            user: req.user,
            category: pages
        });
    })
    .fail(function(err) {
        next(err);
    });
});

app.get("/sitemap", function(req, res, next) {
    res.render("sitemap", {
        title: "Sitemap",
        user: req.user
    });
});

// Auth
app.get("/logout", ensureAuthenticated, function(req, res, next) {
    req.logout();
    res.redirect("/");
});

app.post("/signin", function(req, res, next) {
    passport.authenticate("local-signin", function(err, user, info) {
        if (err) return next(err);
        if (user)
            return req.login(user, function(err) {
                if (err) return next(err);
                res.redirect(req.headers.referer || "/");
            });
        return res.redirect(req.headers.referer || "/");
    })(req, res, next);
});

app.post("/signup", ensureAuthenticated, function(req, res, next) {
    /*passport.authenticate("local-signup", function(err, user, info) {
        if (err) return next(err);
        req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res, next);*/
    res.session.error = "Sign Up is closed.";
    res.status(400).redirect(req.headers.referer || "/");
});

// File Management
app.post("/delete", ensureAuthenticated, function(req, res, next) {
    func.deleteFile(req.body.id)
    .then(function() {
        res.send("Success");
    })
    .fail(function(err) {
        console.error(err.stack);
        res.status(400).send(err);
    });
});

app.post("/editFileName", ensureAuthenticated, function(req, res, next) {
    func.editFile(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.send("Success");
    })
    .fail(function(err) {
        req.session.error = err;
        console.error(err.stack);
        res.status(400).send(err);
    });
});

app.post("/upload", ensureAuthenticated, uploadFile, function(req, res, next) {
    if (!req.files.file) {
        req.session.error = "Please select a file.";
        res.status(400).redirect("/resource#upload");
    }
    func.addFile(req)
    .then(function() {
        req.session.success = "File uploaded.";
    })
    .fail(function(err) {
        req.session.error = err;
        console.error(err.stack);
        fs.unlink(req.files.file[0].path);
    })
    .fin(function() {
        res.redirect("/resource#upload");
    });
});

// Admin
app.get("/profile", ensureAuthenticated, function(req, res, next) {
    res.render("profile", {
        title: "Profile",
        user: req.user
    });
});

app.post("/updatePassword", ensureAuthenticated, function(req, res, next) {
    func.editPassword(req)
    .then(function() {
        req.session.success = "Password Updated.";
        res.redirect("/profile");
    })
    .fail(function(err) {
        req.session.error = err;
        console.error(err.stack);
        res.status(400).redirect("/profile");
    });
});

// 404 & 500
app.use(function(req, res, next) {
    res.status(404).render("404", {
        title: "Page Not Found",
        user: req.user
    });
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render("500", {
        title: "Internal Server Error",
        user: req.user
    });
});

app.listen(PORT);
console.info("Listening on port " + PORT + " in " + app.get("env") + " mode.");