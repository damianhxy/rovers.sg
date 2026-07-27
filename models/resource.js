const nedb = require("@seald-io/nedb");
const fs = require("fs/promises");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const normalizeURL = require("normalize-url").default;
dayjs.extend(utc);
dayjs.extend(timezone);

const files = new nedb({ filename: "./database/resources", autoload: true });

exports.add = function (req) {
  const filePath = req.file ? req.file.path : "";
  const url = req.body.url ? normalizeURL(req.body.url) : req.file.path.slice(6);
  const fileInfo = {
    name: req.body.name,
    path: filePath,
    url: url,
    description: req.body.description,
    time: dayjs().tz("Asia/Singapore").format(),
    category: req.body.category,
  };
  return files.insertAsync(fileInfo);
};

exports.all = function () {
  return files.find({}).sort({ time: -1 }).execAsync();
};

exports.delete = async function (id) {
  const file = await files.findOneAsync({ _id: id });
  if (file.path) {
    await fs.unlink(file.path);
  }
  return files.removeAsync({ _id: id });
};

exports.edit = async function (id, field, value) {
  const file = await files.findOneAsync({ _id: id });
  file[field] = value;
  file.time = dayjs().tz("Asia/Singapore").format();
  await files.updateAsync({ _id: id }, { $set: file });
  return { field: field, value: value };
};

exports.get = function (category) {
  return files.find({ category: category }).sort({ time: -1 }).execAsync();
};
