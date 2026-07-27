var nedb = require("@seald-io/nedb");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var short = new nedb({ filename: "./database/shortener", autoload: true });

exports.add = function(req) {
    var formInfo = {
        name: req.body.name,
        orgurl: normalizeURL(req.body.orgurl),
        newurl: req.body.newurl.trim(),
        embed: req.body.embed,
        time: moment.tz("Asia/Singapore").format()
    };
    return short.findOneAsync({ newurl: formInfo.newurl })
    .then(function(url) {
        if (url) throw Error("Short URL already exists");
        return short.insertAsync(formInfo);
    });
};

exports.all = function() {
    return short
    .find({})
    .sort({ url: 1 })
    .execAsync();
};

exports.delete = function(id) {
    return short.removeAsync({ _id: id });
};

exports.get = function(url) {
    return short.findOneAsync({ newurl: url })
    .then(function(info) {
        if (!info) throw Error("Invalid link");
        return info;
    });
};
