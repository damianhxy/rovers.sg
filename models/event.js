const nedb = require("@seald-io/nedb");
const fs = require("fs/promises");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const path = require("path");
const normalizeHttpUrl = require("../helpers/httpUrl.js");
const settings = require("../controllers/settings.js");
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const events = new nedb({ filename: "./database/events", autoload: true });

// Add form (combodate), event page editor (x-editable combodate) and stored display format.
const eventTimeFormats = [
  settings.EVENT_INPUT_TIME_FORMAT,
  settings.EVENT_EDITOR_TIME_FORMAT,
  settings.EVENT_TIME_FORMAT,
];

function parseEventTime(value) {
  for (const format of eventTimeFormats) {
    const parsed = dayjs(value, format, true);
    if (parsed.isValid()) return parsed.tz("Asia/Singapore", true);
  }
  throw Error("Invalid event time");
}

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
  const start = parseEventTime(req.body.start);
  const end = parseEventTime(req.body.end);
  if (!req.body.title || req.body.title.length > 200) {
    throw Error("Title is required and must be under 200 characters");
  }
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
    link: req.body.link && normalizeHttpUrl(req.body.link),
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
  const uploadDirectory = path.join("public", "uploads", event._id);
  try {
    await fs.mkdir(uploadDirectory, { recursive: true });
    await events.updateAsync({ _id: event._id }, { $set: event });
    return event._id;
  } catch (err) {
    await fs.rm(uploadDirectory, { force: true, recursive: true }).catch(function () {});
    await events.removeAsync({ _id: event._id }).catch(function () {});
    throw err;
  }
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
  const event = await events.findOneAsync({ _id: id });
  if (!event) throw Error("Event does not exist");
  // Derive the directory from the stored id, never from request input.
  await fs.rm(path.join("public", "uploads", event._id), { force: true, recursive: true });
  return events.removeAsync({ _id: event._id });
};

exports.deletePhoto = async function (id, name) {
  const event = await events.findOneAsync({ _id: id });
  if (!event) throw Error("Event does not exist");
  const index = event.photos.findIndex(function (e) {
    return e.name === name;
  });
  if (index === -1) throw Error("Photo does not exist");
  if (event.favourite && event.photos[index].path === event.favourite.path) event.favourite = {};
  await fs.unlink("./public" + event.photos[index].path);
  event.photos.splice(index, 1);
  return events.updateAsync({ _id: id }, { $set: event });
};

exports.edit = async function (id, field, value) {
  const event = await events.findOneAsync({ _id: id });
  if (!event) throw Error("Event does not exist");
  if (!["details", "end", "link", "location", "start", "title"].includes(field)) {
    throw Error("Field cannot be edited");
  }
  if (field === "start" || field === "end") {
    const time = parseEventTime(value);
    value = time.format();
    event[field + "Pretty"] = time.format(settings.EVENT_TIME_FORMAT);
    if (field === "start") {
      event.date = {
        day: time.date(),
        month: time.format("MMM"),
      };
    }
  }
  if (field === "link" && value) value = normalizeHttpUrl(value);
  event[field] = value;
  if (field === "start" || field === "end") {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    value = event.duration = formatDuration(start, end);
  }
  event.time = dayjs().tz("Asia/Singapore").format();
  if (dayjs(event.start).isAfter(dayjs(event.end)))
    throw Error("Start time must be before end time");
  if (field === "title" && (!value || value.length > 200)) {
    throw Error("Title is required and must be under 200 characters");
  }
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
  if (!event) throw Error("Event does not exist");
  if (name === "del") {
    event.favourite = {};
  } else {
    event.favourite = event.photos.find(function (e) {
      return e.name === name;
    });
    if (!event.favourite) throw Error("Photo does not exist");
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
