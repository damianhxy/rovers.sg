var Q = require("q");
var nedb = require("nedb");
var moment = require("moment-timezone");
var forms = new nedb({ filename: "./database/forms" , autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var formInfo = {
            name: req.body.name,
            url: req.body.url,
            embed: req.body.embed,
            time: moment().tz("Asia/Singapore").format()
        };
        Q.ninvoke(forms, "insert", formInfo)
        .then(function() {
            console.info("User " + req.user.username + " added form: " + req.body.url + ".");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(forms, "find", {})
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
        Q.ninvoke(forms, "remove", { url: url })
        .then(function() {
            console.info("Removed form: " + url + ".");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(url) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(forms, "findOne", { url: url })
        .then(function(info) {
            resolve(info);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};
