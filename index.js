var PORT = 8080;
var async = require("async");
var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
var fs = require("fs");
var moment = require("./dep/moment.js");
var bytes = require("bytes");
var morgan = require("morgan");
var hbs = exphbs.create({
	defaultLayout: "default"
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use("/media", express.static(__dirname + "/media"));
app.use("/dep", express.static(__dirname + "/dep"));
app.use("/resources", express.static(__dirname + "/resources"));
app.use(morgan("dev"));

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

app.get(/^\/resources\/(?:(forms|policies|progress_scheme|others)\/)?$/, function(req, res, next) {
	var headertitle = "Others",
		headersubtitle = "Miscellaneous",
		path = "/resources/" + (req.params[0] || "latest_information") + "/";
	if (req.params[0] === "forms") {
		headertitle = "Forms";
		headersubtitle = "NRR/NCC";
	} else if (req.params[0] === "policies") {
		headertitle = "Policies";
		headersubtitle = "Governing Rules";
	} else if (req.params[0] === "progress_scheme") {
		headertitle = "Progress Scheme";
		headersubtitle = "For Rovers";
	} else {
		headertitle = "Latest Information";
		headersubtitle = "News";
	}
	fs.readdir(__dirname + path, function(err, files) {
		if (err) return next(err);
		files = files.filter(function(e) {
			return e[0] !== '.';
		});
		async.map(files, function(item, callback) {
			fs.stat(__dirname + path + item, function(err, stats) {
				if (err) return next(err);
				callback(null, {
					name: item,
					size: bytes(stats.size),
					time: moment(stats.ctime.getTime()).format("DD MMMM YYYY, hh:mm:ss a")
				});
			});
		}, function(err, files) {
			if (err) return next(err);
			res.render("resources", {
				title: "Resources",
				header_title: headertitle,
				header_subtitle: headersubtitle,
				filelist: files,
				path: path
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
	console.log(err.stack);
	res.status(500).render("500", {
		error: err,
		title: "500"
	});
});

app.listen(PORT);
console.log("Listening on port " + PORT + " in " + app.get("env") + " mode.");