var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var exphbs = require("express-handlebars");
var express = require("express");
var func = require("./lib/functions.js");
var passport = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var moment = require("./public/lib/moment.js");
var morgan = require("morgan");
var multer = require("multer");
var nedb = require("nedb");
var session = require("express-session");

// Constants
var PORT = 8080;
var SECRET = "roversingapore";

// Resources Page
var pages = [{path:"forms",header:"Forms",subtitle:"NRR/NCC"},
		     {path:"policies",header:"Policies",subtitle:"Governing Rules"},
		     {path:"progress_scheme",header:"Progress Scheme",subtitle:"For Rovers"},
		     {path:"others",header:"Others",subtitle:"Miscellaneous"}];

// Filetype Icons
var files = [{pattern:"xlsx?",icon:"excel"},{pattern:"pptx?",icon:"powerpoint"},
			 {pattern:"docx?",icon:"word"},{pattern:"pdf",icon:"pdf"},
			 {pattern:"(png|jpg|gif)",icon:"picture"},{pattern:"(zip|rar)",icon:"zip"}];

var app = express();

// Auth
passport.use("local-signin", new localStrategy(
    function(username, password, done) {
        console.info("Signing in...");
        func.signIn(username, password)
        .then(function(user) {
            console.info("Success!");
            done(null, user);
        })
        .fail(function(err) {
            console.error("Failed!");
            console.error(err);
            done(null, false);
        });
    }
));

passport.use("local-signup", new localStrategy( // Temporary
    { passReqToCallback: true },
    function(req, username, password, done) {
        console.log("Signing up...");
        func.signUp(req.body.name, username, password)
        .then(function(user) {
            console.info("Success!");
            done(null, user);
        })
        .fail(function(err) {
            console.error("Failed!");
            console.error(err);
            done(null, false);
        });
    }
));

// Session
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Handlebars
var hbs = exphbs.create({
	defaultLayout: "default",
	helpers: {
		fileType: function(file) {
			var icon = "file-o";
			files.some(function(e) {
				if (RegExp(e.pattern).test(file.split(".").pop()))
					return icon = "file-" + e.icon + "-o";
				return false;
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
app.use(methodOverride("X-HTTP-Method-Override"));
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
    rename: function() {
        return "upload" + Date.now();
    },
    onFileUploadStart: function(file) {
        console.log("Uploading " + file.originalname);
    },
    onFileUploadComplete: function(file) {
        console.log(file.originalname + " uploaded to " + file.path);
    }
}));

// Routes
// Message middleware
app.use(function(req, res, next) {
    ["error", "notice", "success"].forEach(function(e) {
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
        title: "NRR"
    });
});

app.get("/about", function(req, res, next) {
    res.render("about", {
        title: "About"
    });
});

app.get("/links", function(req, res, next) {
    res.render("links", {
        title: "Links"
    });
});

// Remember to change to tab form!
app.get(/^\/resource(\/(forms|policies|progress_scheme|others))?$/, function(req, res, next) {/*
    var header = "Latest Information";
    var subtitle = "News";
    var dir = "/public/resources/" + (req.params[1] || "latest_information") + "/";
    pages.some(function(e) {
        if (req.params[1] === e.path) {
            header = e.header;
            return subtitle = e.subtitle;
        } return false;
    });
    fs.readdir(__dirname + dir, function(err, files) {
        if (err) return next(err);
        files = files.filter(function(e) {
            return e[0] !== '.';
        });
        async.map(files, function(item, callback) {
            fs.stat(__dirname + dir + item, function(err, stats) {
                if (err) return next(err);
                callback(null, {
                    name: item,
                    size: bytes(stats.size),
                    time: moment(stats.mtime.getTime()).format("DD MMMM YYYY, h:mm:ss a")
                });
            });
        }, function(err, files) {
            if (err) return next(err);
            res.render("resources", {
                title: "Resources",
                header_title: header,
                header_subtitle: subtitle,
                filelist: files,
                path: dir.slice(7)
            });
        });
    });*/
    res.render("resources", {
        title: "Resources"
    });
});

app.get("/faq", function(req, res, next) {
    res.render("faq", {
        title: "FAQ"
    });
});

app.get("/join", function(req, res, next) {
    res.render("join", {
        title: "Join us"
    });
});

app.get("/sitemap", function(req, res, next) {
    res.render("sitemap", {
        title: "Sitemap"
    });
});

app.get("/contact", function(req, res, next) {
    res.render("contact", {
        title: "Contact"
    });
});

// Auth
app.post("/signin", passport.authenticate("local-signin", {
    successRedirect: "/",
    failureRedirect: "/"
}));

app.post("/signup", passport.authenticate("local-signup", {
    successRedirect: "/",
    failureRedirect: "/"
}));

app.get("/logout", function(req, res, next) {
    req.logout();
    res.redirect("/");
});

// Others
app.use(function(req, res, next) {
    res.status(404).render("404", {
        title: "404"
    });
});

app.use(function(err, req, res, next) {
    console.error(err);
    res.status(500).render("500", {
        error: err,
        title: "500"
    });
});

app.listen(PORT);
console.info("Listening on port " + PORT + " in " + app.get("env") + " mode.");