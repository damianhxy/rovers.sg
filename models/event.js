var Promise = require("bluebird");
var nedb = require("nedb");
var fs = require("fs");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var settings = require("../controllers/settings.js");
var events = new nedb({ filename: "./database/events", autoload: true });
var rimraf = require("rimraf");
require("moment-duration-format");
Promise.promisifyAll(fs);
Promise.promisifyAll(events);
Promise.promisifyAll(events.find().constructor.prototype);

exports.add = function(req) {
    var start = moment.tz(req.body.start, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
    var end = moment.tz(req.body.end, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
    if (start.isAfter(end))
        return Promise.reject(Error("Start time must be before end time"));
    var eventInfo = {
        title: req.body.title,
        start: start.format(),
        end: end.format(),
        startPretty: moment.tz(start, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT),
        endPretty: moment.tz(end, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT),
        duration: moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]"),
        location: req.body.location,
        details: req.body.details,
        category: req.body.category ? [].concat(req.body.category) : [],
        link: req.body.link && normalizeURL(req.body.link),
        time: moment.tz("Asia/Singapore").format(),
        photos: [],
        favourite: ""
    };
    return events.insertAsync(eventInfo).then(function(event) {
        return fs.mkdirAsync("./public/uploads/" + event._id).then(function() {
            return Promise.resolve(event._id);
        });
    });
};

exports.addPhotos = function(id, photos) {
    return events.findOneAsync({ _id: id }).then(function(event) {
        photos.forEach(function(e) {
            event.photos.push({
                name: e.originalname,
                time: moment.tz("Asia/Singapore").format(),
                path: e.path.slice(6)
            });
        });
        return events.updateAsync({ _id: id }, { $set: event });
    });
};

exports.all = function() {
    return events.findAsync({});
};

exports.delete = function(id) {
    return new Promise(function(resolve, reject) {
        rimraf("./public/uploads/" + id, function(err) {
            if (err) reject(err);
            else resolve();
        });
    }).then(events.removeAsync({ _id: id }));
};

// Delete by name, since there shouldn't be duplicates and there's no _id
exports.deletePhoto = function(id, name) {
    return events.findOneAsync({ _id: id }).then(function(event) {
        var index;
        for (index = 0; index < event.photos.length; ++index) {
            if (event.photos[index].name === name) break;
        }
        return fs.unlinkAsync("./public" + event.photos[index].path).then(function() {
            event.photos.splice(index, 1);
            return events.updateAsync({ _id: id }, { $set: event });
        });
    });
};

exports.edit = function(id, field, value) {
    return events.findOneAsync({ _id: id }).then(function(event) {
        if (field === "start" || field === "end")
            value = moment.tz(value, settings.EVENT_TIME_FORMAT, "Asia/Singapore").format();
        if (field === "start")
            event.startPretty = moment.tz(value, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        if (field === "end")
            event.endPretty = moment.tz(value, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        if (field === "link" && value)
            value = normalizeURL(value);
        event[field] = value;
        if (field === "start" || field === "end") {
            var start = moment(event.start);
            var end = moment(event.end);
            value = event.duration = moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]");
        }
        event.time = moment.tz("Asia/Singapore").format();
        if (moment(event.start).isAfter(moment(event.end)))
            throw Error("Start time must be before end time");
        if (field === "title" && !value)
            throw Error("Title can not be empty");
        return events.updateAsync({ _id: id }, { $set: event });
    }).then(function() {
        return Promise.resolve({ field: field, value: value });
    }).catch(function(e) {
        return Promise.reject(e);
    });
};

exports.get = function(id) {
    return events.findOneAsync({ _id: id }).then(function(event) {
        if (!event) return Promise.reject(Error("Event does not exist"));
        return Promise.resolve(event);
    });
};

exports.getCategory = function(category) {
    return events.findAsync({
        $where: function() { return this.category.indexOf(category) !== -1; }
    });
};

exports.range = function(start, end) {
    return events.findAsync({
        $where: function() {
            return moment.tz(this.start, "Asia/Singapore").format("YYYY-MM-DD") >= start &&
                   moment.tz(this.start, "Asia/Singapore").format("YYYY-MM-DD") < end;
        }
    });
};

exports.upcoming = function(date) {
    return events.find({
        $where: function() { return moment.tz(this.end, "Asia/Singapore").isAfter(date); }
    }).sort({ start: 1, end: 1 }).execAsync();
};
