var Promise = require("bluebird");
var nedb = require("nedb");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var settings = require("../controllers/settings.js");
var events = new nedb({ filename: "./database/events", autoload: true });
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
        location: req.body.location,
        details: req.body.details,
        category: req.body.category ? [].concat(req.body.category) : [],
        link: req.body.link && normalizeURL(req.body.link),
        time: moment.tz("Asia/Singapore").format()
    };
    return events.insertAsync(eventInfo).then(function(event) {
        return Promise.resolve(event._id);
    });
};

exports.all = function() {
    return events.findAsync({});
};

exports.delete = function(id) {
    return events.removeAsync({ _id: id });
};

exports.edit = function(id, field, value) {
    return events.findOneAsync({ _id: id }).then(function(event) {
        if (field === "start" || field === "end")
            value = moment.tz(value, settings.EVENT_TIME_FORMAT, "Asia/Singapore").format();
        if (field === "link" && value)
            value = normalizeURL(value);
        event[field] = value;
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
