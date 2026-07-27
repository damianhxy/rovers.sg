var nedb = require("@seald-io/nedb");
var fs = require("fs/promises");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var settings = require("../controllers/settings.js");
var events = new nedb({ filename: "./database/events", autoload: true });
require("moment-duration-format");

exports.add = function(req) {
    var start = moment.tz(req.body.start, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
    var end = moment.tz(req.body.end, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
    if (start.isAfter(end))
        return Promise.reject(Error("Start time must be before end time"));
    var startMoment = moment.tz(start, "Asia/Singapore");
    var endMoment = moment.tz(end, "Asia/Singapore");
    var eventInfo = {
        title: req.body.title,
        start: start.format(),
        end: end.format(),
        startPretty: startMoment.format(settings.EVENT_TIME_FORMAT),
        endPretty: endMoment.format(settings.EVENT_TIME_FORMAT),
        duration: moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]", {
            trim: "both mid"
        }),
        location: req.body.location,
        details: req.body.details,
        category: req.body.category ? [].concat(req.body.category) : [],
        link: req.body.link && normalizeURL(req.body.link),
        time: moment.tz("Asia/Singapore").format(),
        date: {
            day: startMoment.date(),
            month: startMoment.format("MMM")
        },
        photos: [],
        favourite: {}
    };
    return events.insertAsync(eventInfo)
    .then(function(event) {
        event.url = "/events/" + event._id;
        return events.updateAsync({ _id: event._id }, { $set: event })
        .then(fs.mkdir("./public/uploads/" + event._id))
        .then(function() {
            return event._id;
        });
    });
};

exports.addPhotos = function(id, photos) {
    return events.findOneAsync({ _id: id })
    .then(function(event) {
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
    return fs.rm("./public/uploads/" + id, { recursive: true })
    .then(events.removeAsync({ _id: id }));
};

// Delete by name, since there are not duplicates (and we don't have _id)
exports.deletePhoto = function(id, name) {
    return events.findOneAsync({ _id: id })
    .then(function(event) {
        var index = event.photos.findIndex(function(e) {
            return e.name === name;
        });
        if (event.photos[index].path === event.favourite)
            event.favourite = {};
        return fs.unlink("./public" + event.photos[index].path)
        .then(function() {
            event.photos.splice(index, 1);
            return events.updateAsync({ _id: id }, { $set: event });
        });
    });
};

exports.edit = function(id, field, value) {
    return events.findOneAsync({ _id: id })
    .then(function(event) {
        if (field === "start" || field === "end")
            value = moment.tz(value, settings.EVENT_TIME_FORMAT, "Asia/Singapore").format();
        if (field === "start") {
            var startMoment = moment.tz(value, "Asia/Singapore");
            event.startPretty = startMoment.format(settings.EVENT_TIME_FORMAT);
            event.date = {
                day: startMoment.date(),
                month: startMoment.format("MMM")
            };
        }
        if (field === "end")
            event.endPretty = moment.tz(value, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
        if (field === "link" && value)
            value = normalizeURL(value);
        event[field] = value;
        if (field === "start" || field === "end") {
            var start = moment(event.start);
            var end = moment(event.end);
            value = event.duration = moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]").trim();
        }
        event.time = moment.tz("Asia/Singapore").format();
        if (moment(event.start).isAfter(moment(event.end)))
            throw Error("Start time must be before end time");
        if (field === "title" && !value)
            throw Error("Title can not be empty");
        return events.updateAsync({ _id: id }, { $set: event });
    })
    .then(function() {
        return { field: field, value : value };
    });
};

exports.get = function(id) {
    return events.findOneAsync({ _id: id })
    .then(function(event) {
        if (!event) throw Error("Event does not exist");
        return event;
    });
};

exports.getCategoryUpcoming = function(category, date) {
    return events.find({
        $where: function() {
            return moment.tz(this.end, "Asia/Singapore").isAfter(date) && this.category.indexOf(category) !== -1;
        }
    })
    .sort({ start: 1, end: 1 })
    .execAsync();
};

exports.mark = function(id, name) {
    return events.findOneAsync({ _id: id })
    .then(function(event) {
        if (name === "del") {
            event.favourite = {};
        } else {
            event.favourite = event.photos.find(function(e) {
                return e.name === name;
            });
        }
        return events.updateAsync({ _id: id }, { $set: event });
    });
};

exports.range = function(start, end) {
    return events.findAsync({
        $where: function() {
            return moment.tz(this.start, "Asia/Singapore").format("YYYY-MM-DD") < end
            && moment.tz(this.end, "Asia/Singapore").format("YYYY-MM-DD") >= start;
        }
    });
};

exports.upcoming = function(date) {
    return events.find({
        $where: function() { return moment.tz(this.end, "Asia/Singapore").isAfter(date); }
    })
    .sort({ start: 1, end: 1 })
    .execAsync();
};
