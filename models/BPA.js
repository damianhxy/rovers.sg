var Q = require("q");
var nedb = require("nedb");
var BPAs = new nedb({ filename: "./database/BPAs", autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var BPAInfo = {
            name: req.body.name,
            unit: req.body.unit,
            year: req.body.year,
            honorary: req.body.honorary,
            adder: req.user.username
        };
        Q.ninvoke(BPAs, "insert", BPAInfo)
        .then(function() {
            console.info("User " + req.user.username + " added BPA awardee: " + req.body.name + ".");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(BPAs, "find", {})
        .then(function(list) {
            resolve(list);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(name) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(BPAs, "remove", { name: name })
        .then(function() {
            console.info("Removed awardee " + name + ".");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};