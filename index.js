var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var exphbs = require("express-handlebars");
var express = require("express");
var fs = require("fs");
var func = require("./lib/functions.js");
var localStrategy = require("passport-local");
var moment = require("./public/lib/moment.js");
var morgan = require("morgan");
var multer = require("multer");
var passport = require("passport");
var session = require("express-session");

// Constants
var PORT = 8080;
var SECRET = "roversingapore";
var FILE_SIZE_LIMIT = 25;

// Resources Page
var pages = {
                "Latest Information": {name: "info"},
                "Forms": {name: "forms"},
    		    "Policies": {name: "policies"},
    		    "Progress Scheme": {name: "scheme"},
    		    "Others": {name: "others"}
            };

// Filetype Icons
var files = [
                {pattern: "xlsx?", icon: "excel"}, {pattern: "pptx?", icon: "powerpoint"},
    			{pattern: "docx?", icon: "word"}, {pattern :"pdf", icon: "pdf"},
    			{pattern: "(png|jpg|gif)", icon: "picture"}, {pattern: "(zip|rar)", icon: "zip"}
            ];

var app = express();

// Auth
passport.use("local-signin", new localStrategy(
    { passReqToCallback: true },
    function(req, username, password, done) {
        return func.signIn(username, password)
        .then(function(user) {
            req.session.success = "Welcome back, " + user.username + ".";
            done(null, user);
        })
        .fail(function(err) {
            console.error(err.stack);
            req.session.error = "Error encountered while signing in.";
            done(null, false);
        });
    }
));

passport.use("local-signup", new localStrategy(
    { passReqToCallback: true },
    function(req, username, password, done) {
        return func.signUp(req.body.name, username, password)
        .then(function(user) {
            req.session.success = "Welcome, " + user.username + ".";
            done(null, user);
        })
        .fail(function(err) {
            console.error(err.stack);
            req.session.error = "Error encountered while signing up.";
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
			var icon = "file-o";
            files.forEach(function(e) {
                if (RegExp(e.pattern).test(file.split(".").pop()))
                    icon = "file-" + e.icon + "-o";
            });
			return icon;
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
app.use(multer({
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
        console.log(file.originalname + " uploaded to " + file.path);
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
}));

// Routes
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

app.get("/nrr", function(req, res, next) {
    res.render("nrr", {
        title: "NRR",
        user: req.user
    });
});

app.get("/about", function(req, res, next) {
    res.render("about", {
        title: "About",
        user: req.user
    });
});

app.get("/links", function(req, res, next) {
    res.render("links", {
        title: "Links",
        user: req.user
    });
});

app.get("/resource", function(req, res, next) {
    func.getFiles()
    .then(function(files) {
        var category = pages;
        var page;
        for (page in category)
            if (category.hasOwnProperty(page))
                category[page].filelist = [];
        files.forEach(function(e) {
            e.formattedTime = moment(e.time).format("DD MMMM YYYY, h:mm:ss a");
            category[e.category].filelist.push(e);
        });
        for (page in category)
            if (category.hasOwnProperty(page))
                category[page].isEmpty = !category[page].filelist.length;
        res.render("resources", {
            title: "Resources",
            user: req.user,
            category: category
        });
    })
    .fail(function(err) {
        next(err);
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

app.get("/sitemap", function(req, res, next) {
    res.render("sitemap", {
        title: "Sitemap",
        user: req.user
    });
});

app.get("/contact", function(req, res, next) {
    res.render("contact", {
        title: "Contact",
        user: req.user
    });
});

// Auth
app.post("/signin", function(req, res, next) {
    passport.authenticate("local-signin", function(err, user, info) {
        if (err) return next(err);
        req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res, next);
});

app.post("/signup", function(req, res, next) {
    /*
    passport.authenticate("local-signup", function(err, user, info) {
        if (err) return next(err);
        req.login(user, function(err) {
            if (err) return next(err);
            res.redirect(req.headers.referer || "/");
        });
    })(req, res, next);
    */
    req.session.error = "There is no signup.";
    res.redirect(req.headers.referer || "/");
});

app.get("/logout", function(req, res, next) {
    req.logout();
    res.redirect(req.headers.referer || "/");
});

// File Management
app.post("/upload", ensureAuthenticated, function(req, res, next) {
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
    })
    .fin(function() {
        res.redirect("/resource#upload");
    });
});
/* "no element found" in FF as a result of an empty response body */
app.post("/edit", ensureAuthenticated, function(req, res, next) {
    func.editFile(req.body.pk, req.body.name, req.body.value)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        req.session.error = err;
        console.error(err.stack);
        res.status(400).end();
    });
});

app.post("/delete", ensureAuthenticated, function(req, res, next) {
    func.deleteFile(req.body.id)
    .then(function() {
        res.end();
    })
    .fail(function(err) {
        req.session.error = err;
        console.error(err.stack);
        res.status(400).end();
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
    /* Code */
});

// Others
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