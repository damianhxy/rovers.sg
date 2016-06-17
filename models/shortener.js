var Q = require("q");
var nedb = require("nedb");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var forms = new nedb({ filename: "./database/shortener", autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var formInfo = {
            orgurl: normalizeURL(req.body.orgurl),
            newurl: req.body.newurl,
            embed: req.body.embed,
            time: moment.tz("Asia/Singapore").format()
        };
        Q.ninvoke(forms, "insert", formInfo)
        .then(function() {
            console.info("User", req.user.username, "added link", req.body.orgurl);
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        var cursor = forms.find({}).sort({ url: 1 });
        Q.ninvoke(cursor, "exec")
        .then(function(list) {
            resolve(list);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(url) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(forms, "remove", { newurl: url })
        .then(function() {
            console.info("Removed link", url);
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(url) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(forms, "findOne", { newurl: url })
        .then(function(info) {
            resolve(info);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};
