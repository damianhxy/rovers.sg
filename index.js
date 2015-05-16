var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var hbs = exphbs.create({
    defaultLayout: "default"
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
//app.enable('view cache');

app.use("/media", express.static(__dirname + "/media"));
app.use("/dep", express.static(__dirname + "/dep"));

app.get("/", function(req, res) {
    res.render("home", {
        title: "Home | The Singapore Scout Association",
        home: 1
    });
});

app.get("/nrr", function(req, res) {
    res.render("nrr", {
        title: "NRR | The Singapore Scout Association",
        nrr: 1
    })
});

app.get("/about", function(req, res) {

});

app.get("/links", function(req, res) {

});

app.get("/resources", function(req, res) {

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
    // 404
});

app.listen(8080);
console.log("Listening on port 8080.");