var async = require("async");
var bytes = require("bytes");
var exphbs = require("express-handlebars");
var express = require("express");
var fs = require("fs");
var moment = require("./public/lib/moment.js");
var morgan = require("morgan");

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
var hbs = exphbs.create({
	defaultLayout: "default",
	helpers: {
		fileType: function(file) {
			var ext = file.split(".").pop();
			var icon = "file-o";
			files.some(function(e) {
				var re = new RegExp(e.pattern);
				if (re.test(ext))
					return icon = "file-" + e.icon + "-o";
				return false;
			});
			return icon;
		}
	}
});
morgan.token("date", function(req, res) {
	return require("console-stamp/node_modules/dateformat")(new Date(), "dd mmm HH:MM:ss");
});
require("console-stamp")(console, "dd mmm HH:MM:ss");

app.enable("case sensitive routing");
app.enable("strict routing");
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));
app.use(morgan("[:date] :method :url :status :res[content-length] - :remote-addr - :response-time ms"));

app.get(/^\/(robots|humans)\.txt$/, function(req, res) {
	res.sendFile(__dirname + "/" + req.params[0] + ".txt");
});

app.get("/", function(req, res, next) {
	res.render("home", {
		title: "Home"
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

app.get(/^\/resource(\/(forms|policies|progress_scheme|others))?$/, function(req, res, next) {
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
					time: moment(stats.ctime.getTime()).format("DD MMMM YYYY, h:mm:ss a")
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

app.listen(8080);
console.info("Listening on port 8080 in " + app.get("env") + " mode.");