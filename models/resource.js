const nedb = require("@seald-io/nedb");
const fs = require("fs/promises");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const path = require("path");
const normalizeHttpUrl = require("../helpers/httpUrl.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const files = new nedb({ filename: "./database/resources", autoload: true });
const categories = new Set(["Forms", "General Information", "Rover Journey"]);

exports.add = async function (req) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 200) {
    throw Error("Name is required and must be under 200 characters");
  }
  if (!categories.has(req.body.category)) throw Error("Invalid category");
  if (Boolean(req.file) === Boolean(req.body.url)) {
    throw Error("Provide either one file or one URL");
  }

  const fileInfo = {
    name: name,
    path: "",
    url: req.body.url ? normalizeHttpUrl(req.body.url) : "",
    description: req.body.description,
    time: dayjs().tz("Asia/Singapore").format(),
    category: req.body.category,
  };
  if (!req.file) return files.insertAsync(fileInfo);

  fileInfo.filename = path.basename(req.file.originalname).slice(0, 255) || "resource";
  const inserted = await files.insertAsync(fileInfo);
  const filePath = path.join("uploads", "resources", inserted._id);
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, req.file.buffer, { flag: "wx" });
    inserted.path = filePath;
    inserted.url = "/resources/" + inserted._id + "/download";
    await files.updateAsync({ _id: inserted._id }, { $set: inserted });
    return inserted;
  } catch (err) {
    await fs.rm(filePath, { force: true }).catch(function () {});
    await files.removeAsync({ _id: inserted._id }).catch(function () {});
    throw err;
  }
};

exports.all = function () {
  return files.find({}).sort({ time: -1 }).execAsync();
};

exports.delete = async function (id) {
  const file = await files.findOneAsync({ _id: id });
  if (!file) throw Error("Resource does not exist");
  if (file.path) {
    await fs.rm(file.path, { force: true });
  }
  return files.removeAsync({ _id: id });
};

exports.edit = async function (id, field, value) {
  const file = await files.findOneAsync({ _id: id });
  if (!file) throw Error("Resource does not exist");
  if (!["description", "name"].includes(field)) throw Error("Field cannot be edited");
  if (field === "name" && (!value || value.length > 200)) {
    throw Error("Name is required and must be under 200 characters");
  }
  file[field] = value;
  file.time = dayjs().tz("Asia/Singapore").format();
  await files.updateAsync({ _id: id }, { $set: file });
  return { field: field, value: value };
};

exports.get = function (category) {
  return files.find({ category: category }).sort({ time: -1 }).execAsync();
};

exports.getDownload = async function (id) {
  const file = await files.findOneAsync({ _id: id });
  const storageRoot = path.resolve("uploads", "resources");
  const filePath = file && file.path ? path.resolve(file.path) : "";
  if (!file || !filePath.startsWith(storageRoot + path.sep)) {
    throw Error("Resource does not exist");
  }
  return file;
};
