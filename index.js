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

app.get("/resources/(:type)?", function(req, res) {
    var headertitle, headersubtitle, path = __dirname + "/resources", valid = true;
    if (req.params.type) {
        path += "/" + req.params.type + "/";
        switch (req.params.type) {
            case "forms":
                headertitle = "Forms";
                headersubtitle = "NRR/NCC";
                break;
            case "policies":
                headertitle = "Policies";
                headersubtitle = "Governing Rules";
                break;
            case "progress_scheme":
                headertitle = "Progress Scheme";
                headersubtitle = "For Rovers"
                break;
            case "others":
                headertitle = "Others";
                headersubtitle = "Miscellaneous";
                break;
            default:
                valid = false;
        }
    } else {
        path += "/latest_information/";
        headertitle = "Latest Information";
        headersubtitle = "News";
    }
    try {
        if (!fs.statSync(path).isDirectory())
            valid = false;
    } catch (e) {
        valid = false;
    }
    if (valid) {
        var files = fs.readdirSync(path)
            .filter(function(e) {
                return !(/(^|.\/)\.+[^\/\.]/.test(e));
            })
            .map(function(e) {
                var info = fs.statSync(path + e);
                return {
                    name: e,
                    time: moment(info.mtime.getTime()).format("DD MMMM YYYY, hh:mm:ss a"),
                    size: bytes(info.size)
                }
            })
            .sort(function(a, b) {
                return moment(a.time, "DD MMMM YYYY, hh:mm:ss a").format() -
                       moment(b.time, "DD MMMM YYYY, hh:mm:ss a").format();
            });
        res.render("resources", {
            title: "Resources",
            header_title: headertitle,
            header_subtitle: headersubtitle,
            filelist: files,
            path: path
        });
    } else
        res.redirect("/404");
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

app.get("/404", function(req, res) {
    res.status(404).render("404", {
        title: "404"
    });
});

app.use(function(req, res) {
    res.redirect("/404");
});

app.listen(8080);
console.log("Listening on port 8080 in " + app.get("env") + " mode.");