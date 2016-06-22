var Promise = require("bluebird");
var nedb = require("nedb");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var short = new nedb({ filename: "./database/shortener", autoload: true });
Promise.promisifyAll(short);
Promise.promisifyAll(short.find().constructor.prototype);

exports.add = function(req) {
    var formInfo = {
        orgurl: normalizeURL(req.body.orgurl),
        newurl: req.body.newurl,
        embed: req.body.embed,
        time: moment.tz("Asia/Singapore").format()
    };
    return short.insertAsync(formInfo);
};

exports.all = function() {
    return short.find({}).sort({ url: 1 }).execAsync();
};

exports.delete = function(id) {
    return short.removeAsync({ _id: id });
};

exports.get = function(url) {
    return short.findOneAsync({ newurl: url })
    .then(function(info) {
        if (!info) return Promise.reject(Error("Invalid link"));
        return Promise.resolve(info);
    });
};
