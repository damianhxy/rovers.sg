const nedb = require("@seald-io/nedb");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const normalizeURL = require("normalize-url");
dayjs.extend(utc);
dayjs.extend(timezone);

const short = new nedb({ filename: "./database/shortener", autoload: true });

exports.add = function (req) {
  const formInfo = {
    name: req.body.name,
    orgurl: normalizeURL(req.body.orgurl),
    newurl: req.body.newurl.trim(),
    embed: req.body.embed,
    time: dayjs().tz("Asia/Singapore").format(),
  };
  return short.findOneAsync({ newurl: formInfo.newurl }).then(function (url) {
    if (url) throw Error("Short URL already exists");
    return short.insertAsync(formInfo);
  });
};

exports.all = function () {
  return short.find({}).sort({ url: 1 }).execAsync();
};

exports.delete = function (id) {
  return short.removeAsync({ _id: id });
};

exports.get = function (url) {
  return short.findOneAsync({ newurl: url }).then(function (info) {
    if (!info) throw Error("Invalid link");
    return info;
  });
};
