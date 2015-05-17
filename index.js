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

app.use(morgan("combined", {
    skip: function(req, res) { return res.statusCode < 400; }
}));

app.get("/", function(req, res) {
    res.render("home", {
        title: "Home"
    });
});

app.get("/nrr", function(req, res) {
    res.render("nrr", {
        title: "NRR"
    })
});

app.get("/about", function(req, res) {

});

app.get("/links", function(req, res) {
    res.render("links", {
        title: "Links"
    })
});

app.get("/resources(/:type)?", function(req, res) {
    var headertitle, headersubtitle, path = __dirname + "/resources/";
    if (req.params.type) {
        path += req.params.type + "/";
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
            default:
                headertitle = "Others";
                headersubtitle = "Miscellaneous";
        }
    } else {
        path += "latest_information/";
        headertitle = "Latest Information";
        headersubtitle = "News";
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
        res.render("resources", {
            title: "Resources",
            header_title: headertitle,
            header_subtitle: headersubtitle,
            filelist: files || [],
            path: path
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
    res.status(404).render("404", {
        title: "404"
    })
});

app.listen(8080);
console.log("Listening on port 8080 in " + app.get("env") + " mode.");