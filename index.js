var PORT = 8080;
var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
var fs = require("fs");
var moment = require("moment.js");
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

app.get("/robots.txt", function(req, res) {
	res.type("text/plain");
	res.send("User-agent: *\nAllow: /");
});

app.get("/", function(req, res) {
	res.render("home", {
		title: "Home"
	});
});

app.get("/nrr", function(req, res) {
	res.render("nrr", {
		title: "NRR"
	});
});

app.get("/about", function(req, res) {
	res.render("about", {
		title: "About"
	});
});

app.get("/links", function(req, res) {
	res.render("links", {
		title: "Links"
	});
});

app.get(/^\/resources\/(?:(forms|policies|progress_scheme|others)\/)?$/, function(req, res) {
	var headertitle = "Others",
		headersubtitle = "Miscellaneous",
		path = __dirname + "/resources";
	if (req.params[0]) {
		path += "/" + req.params[0] + "/";
		if (req.params[0] === "forms") {
			headertitle = "Forms";
			headersubtitle = "NRR/NCC";
		} else if (req.params[0] === "policies") {
			headertitle = "Policies";
			headersubtitle = "Governing Rules";
		} else if (req.params[0] === "progress_scheme") {
			headertitle = "Progress Scheme";
			headersubtitle = "For Rovers";
		}
	} else {
		path += "/latest_information/";
		headertitle = "Latest Information";
		headersubtitle = "News";
	}
	var files = fs.readdirSync(path)
	.filter(function(e) {
		return !(/(^|.\/)\.+[^\/\.]/.test(e));
	})
	.map(function(e) {
		var info = fs.statSync(path + e);
		return {
			name: e,
			time: moment(info.ctime.getTime()).format("DD MMMM YYYY, hh:mm:ss a"),
			size: bytes(info.size)
		}
	});
	res.render("resources", {
		title: "Resources",
		header_title: headertitle,
		header_subtitle: headersubtitle,
		filelist: files,
		path: path
	});
});

app.get("/faq", function(req, res) {
	res.render("faq", {
		title: "FAQ"
	});
});

app.get("/join", function(req, res) {
	res.render("join", {
		title: "Join us"
	});
});

app.get("/sitemap", function(req, res) {
	res.render("sitemap", {
		title: "Sitemap"
	});
});

app.get("/contact", function(req, res) {
	res.render("contact", {
		title: "Contact"
	});
});

app.use(function(req, res) {
	res.status(404).render("404", {
		title: "404"
	});
});

app.listen(PORT);
console.log("Listening on port " + PORT + " in " + app.get("env") + " mode.");