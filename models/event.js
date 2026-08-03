const nedb = require("@seald-io/nedb");
const fs = require("fs/promises");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const normalizeURL = require("normalize-url").default;
const settings = require("../controllers/settings.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const events = new nedb({ filename: "./database/events", autoload: true });

function formatDuration(start, end) {
  const diffMs = end.diff(start);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(days + " day" + (days !== 1 ? "s" : ""));
  if (hours) parts.push(hours + " hour" + (hours !== 1 ? "s" : ""));
  if (minutes) parts.push(minutes + " minute" + (minutes !== 1 ? "s" : ""));
  return parts.join(" ") || "0 minutes";
}

exports.add = async function (req) {
  const start = dayjs.tz(req.body.start, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
  const end = dayjs.tz(req.body.end, settings.EVENT_TIME_FORMAT, "Asia/Singapore");
  if (start.isAfter(end)) throw Error("Start time must be before end time");
  const eventInfo = {
    title: req.body.title,
    start: start.format(),
    end: end.format(),
    startPretty: start.format(settings.EVENT_TIME_FORMAT),
    endPretty: end.format(settings.EVENT_TIME_FORMAT),
    duration: formatDuration(start, end),
    location: req.body.location,
    details: req.body.details,
    category: req.body.category ? [].concat(req.body.category) : [],
    link: req.body.link && normalizeURL(req.body.link),
    time: dayjs().tz("Asia/Singapore").format(),
    date: {
      day: start.date(),
      month: start.format("MMM"),
    },
    photos: [],
    favourite: {},
  };
  const event = await events.insertAsync(eventInfo);
  event.url = "/events/" + event._id;
  await events.updateAsync({ _id: event._id }, { $set: event });
  await fs.mkdir("./public/uploads/" + event._id);
  return event._id;
};

exports.addPhotos = async function (id, photos) {
  const event = await events.findOneAsync({ _id: id });
  photos.forEach(function (e) {
    event.photos.push({
      name: e.originalname,
      time: dayjs().tz("Asia/Singapore").format(),
      path: e.path.slice(6),
    });
  });
  return events.updateAsync({ _id: id }, { $set: event });
};

exports.all = function () {
  return events.findAsync({});
};

exports.delete = async function (id) {
  await fs.rm("./public/uploads/" + id, { recursive: true });
  return events.removeAsync({ _id: id });
};

exports.deletePhoto = async function (id, name) {
  const event = await events.findOneAsync({ _id: id });
  const index = event.photos.findIndex(function (e) {
    return e.name === name;
  });
  if (event.photos[index].path === event.favourite) event.favourite = {};
  await fs.unlink("./public" + event.photos[index].path);
  event.photos.splice(index, 1);
  return events.updateAsync({ _id: id }, { $set: event });
};

exports.edit = async function (id, field, value) {
  const event = await events.findOneAsync({ _id: id });
  if (field === "start" || field === "end")
    value = dayjs.tz(value, settings.EVENT_TIME_FORMAT, "Asia/Singapore").format();
  if (field === "start") {
    const startMoment = dayjs.tz(value, "Asia/Singapore");
    event.startPretty = startMoment.format(settings.EVENT_TIME_FORMAT);
    event.date = {
      day: startMoment.date(),
      month: startMoment.format("MMM"),
    };
  }
  if (field === "end")
    event.endPretty = dayjs.tz(value, "Asia/Singapore").format(settings.EVENT_TIME_FORMAT);
  if (field === "link" && value) value = normalizeURL(value);
  event[field] = value;
  if (field === "start" || field === "end") {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    value = event.duration = formatDuration(start, end);
  }
  event.time = dayjs().tz("Asia/Singapore").format();
  if (dayjs(event.start).isAfter(dayjs(event.end)))
    throw Error("Start time must be before end time");
  if (field === "title" && !value) throw Error("Title can not be empty");
  await events.updateAsync({ _id: id }, { $set: event });
  return { field: field, value: value };
};

exports.get = async function (id) {
  const event = await events.findOneAsync({ _id: id });
  if (!event) throw Error("Event does not exist");
  return event;
};

exports.getCategoryUpcoming = function (category, date) {
  return events
    .find({
      $where: function () {
        return (
          dayjs.tz(this.end, "Asia/Singapore").isAfter(date) &&
          this.category.indexOf(category) !== -1
        );
      },
    })
    .sort({ start: 1, end: 1 })
    .execAsync();
};

exports.mark = async function (id, name) {
  const event = await events.findOneAsync({ _id: id });
  if (name === "del") {
    event.favourite = {};
  } else {
    event.favourite = event.photos.find(function (e) {
      return e.name === name;
    });
  }
  return events.updateAsync({ _id: id }, { $set: event });
};

exports.range = function (start, end) {
  return events.findAsync({
    $where: function () {
      return (
        dayjs.tz(this.start, "Asia/Singapore").format("YYYY-MM-DD") < end &&
        dayjs.tz(this.end, "Asia/Singapore").format("YYYY-MM-DD") >= start
      );
    },
  });
};

exports.upcoming = function (date) {
  return events
    .find({
      $where: function () {
        return dayjs.tz(this.end, "Asia/Singapore").isAfter(date);
      },
    })
    .sort({ start: 1, end: 1 })
    .execAsync();
};
