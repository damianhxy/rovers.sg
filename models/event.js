var Q = require("q");
var nedb = require("nedb");
var moment = require("moment");
var normalizeURL = require("normalize-url");
var settings = require("../controllers/settings.js");
var events = new nedb({ filename: "./database/events", autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var eventInfo = {
            title: req.body.title,
            start: moment(req.body.start, settings.EVENT_TIME_FORMAT).format(),
            end: moment(req.body.end, settings.EVENT_TIME_FORMAT).format(),
            location: req.body.location,
            details: req.body.details,
            link: req.body.link,
            time: moment().format(),
            creator: req.user.username
        };
        if (req.body.link)
            req.body.link = normalizeURL(req.body.link);
        Q.ninvoke(events, "insert", eventInfo)
        .then(function(result) {
            console.info("User " + req.user.username + " created event: " + req.body.title + ".");
            resolve(result._id);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(events, "find", {})
        .then(function(list) {
            resolve(list);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(id) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(events, "remove", { _id: id })
        .then(function() {
            console.info("Deleted event with _id: " + id + ".");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.edit = function(id, field, value) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(events, "findOne", { _id: id })
        .then(function(event) {
            if (field === "start" || field === "end")
                value = moment(value, settings.EVENT_TIME_FORMAT).format();
            else if (field === "link")
                value = normalizeURL(value);
            if (moment(event.start).isAfter(moment(event.end)))
                return reject(Error("Start time must be before end time."));
            if (field === "title" && !value)
                return reject(Error("Title can not be empty."));
            event[field] = value;
            event.time = moment().format();
            return Q.ninvoke(events, "update", { _id: id }, { $set: event });
        })
        .then(function() {
            console.info("Field " + field + " of event " + id + " changed to " + value + ".");
            resolve({
                field: field,
                value: value
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(id) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(events, "findOne", { _id: id })
        .then(function(event) {
            if (!event)
                return reject(Error("Event does not exist."));
            resolve(event);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.upcoming = function(date) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(events, "find", { $where: function() { return moment(this.end).isAfter(moment(date)); } })
        .then(function(list) {
            list.forEach(function(e) {
                e.started = moment(e.start).isBefore(moment(date));
            });
            resolve(list);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};