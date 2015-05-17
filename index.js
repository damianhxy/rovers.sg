var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var fs = require("fs");
var moment = require("moment.js");
var bytes = require("bytes");
var hbs = exphbs.create({
    defaultLayout: "default"
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
//app.set("env", "development");

app.use("/media", express.static(__dirname + "/media"));
app.use("/dep", express.static(__dirname + "/dep"));
app.use("/resources", express.static(__dirname + "/resources"));

app.get("/", function(req, res) {
    res.render("home", {
        title: "Home",
        home: 1
    });
});

app.get("/nrr", function(req, res) {
    res.render("nrr", {
        title: "NRR",
        nrr: 1
    })
});

app.get("/about", function(req, res) {

});

app.get("/links", function(req, res) {
    res.render("links", {
        title: "Links",
        links: 1
    })
});

app.get("/resources", function(req, res) {
    res.render("resources", {
        title: "Resources",
        resources: 1
    })
});

app.get("/resources/:type", function(req, res) {
    var headertitle, headersubtitle, path = __dirname + "/resources/" + req.params.type + "/";
    if (req.params.type === "forms") {
        headertitle = "Forms";
        headersubtitle = "NRR/NCC";
    } else if (req.params.type === "policies") {
        headertitle = "Policies";
        headersubtitle = "Governing Rules";
    } else if (req.params.type === "progress_scheme") {
        headertitle = "Progress Scheme";
        headersubtitle = "For Rovers"
    } else {
        headertitle = "Others";
        headersubtitle = "Miscellaneous";
    }
    if (!fs.statSync(path).isDirectory())
        res.redirect("/404");
    else {
        var files = fs.readdirSync(path)
            .map(function(e) {
                return {
                    name: e,
                    time: fs.statSync(path + e).mtime,
                    size: fs.statSync(path + e).size
                }
            })
            .sort(function(a, b) {
                return a.time.getTime() - b.time.getTime();
            })
            .map(function(e) {
                return {
                    name: e.name,
                    time: moment(e.time).format("DD MMMM YYYY, hh:mm:ss a"),
                    size: bytes(e.size)
                }
            });
        res.render("filelist", {
            title: "Resources",
            resources: 1,
            header_title: headertitle,
            header_subtitle: headersubtitle,
            filelist: files || [],
            pathname: path
        });
    }
});

app.get("/faq", function(req, res) {

});

app.get("/join", function(req, res) {

});

app.get("/sitemap", function(req, res) {

});

app.get("/contact", function(req, res) {

});

/*
app.get("/search", function(req, res) {

});
*/

app.use(function(req, res) {
    res.render("404", {
        title: "404",
        error: 1
    })
});

app.listen(8080);
console.log("Listening on port 8080.");