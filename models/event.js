var Q = require("q");
var nedb = require("nedb");
var moment = require("moment");
var events = new nedb({filename: "./database/events", autoload: true});

exports.add = function(req) {
    return Q.promise(function(reject, resolve) {
        req.body.start = moment(req.body.start, settings.EVENT_TIME_FORMAT).unix();
        req.body.end = moment(req.body.end, settings.EVENT_TIME_FORMAT).unix();
        if (end <= start)
            return reject(Error("End time must be after start time."));
        var eventinfo = {
            title: req.body.title,
            start: req.body.start,
            end: req.body.end,
            location: req.body.location,
            details: req.body.details,
            url: req.body.url,
            creator: req.user.username
        };
        Q.ninvoke(events, "insert", eventinfo)
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(reject, resolve) {
        Q.ninvoke(events, "find", {})
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(id) {
    return Q.promise(function(reject, resolve) {
        Q.ninvoke(events, "remove", { _id: id })
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.edit = function(id, field, value) {
    return Q.promise(function(reject, resolve) {
        Q.ninvoke(events, "findOne", { _id: id })
        .then(function(event) {
            event[field] = value;
            return Q.ninvoke(events, "update", { _id: id }, { $set: event });
        })
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(id) {
    return Q.promise(function(reject, resolve) {
        Q.ninvoke(events, "findOne", { _id: id })
        .then(function(event) {
            resolve(event);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};