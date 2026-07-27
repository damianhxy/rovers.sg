var nedb = require("@seald-io/nedb");
var fs = require("fs/promises");
var moment = require("moment-timezone");
var normalizeURL = require("normalize-url");
var files = new nedb({ filename: "./database/resources", autoload: true });

exports.add = function(req) {
    var filePath = req.file ? req.file.path : "";
    var url = req.body.url ? normalizeURL(req.body.url) : req.file.path.slice(6);
    var fileInfo = {
        name: req.body.name,
        path: filePath,
        url: url,
        description: req.body.description,
        time: moment.tz("Asia/Singapore").format(),
        category: req.body.category
    };
    return files.insertAsync(fileInfo);
};

exports.all = function() {
    return files.find({})
    .sort({ time: -1 })
    .execAsync();
};

exports.delete = function(id) {
    return files.findOneAsync({ _id: id })
    .then(function(file) {
        if (file.path) {
            return fs.unlink(file.path)
            .then(files.removeAsync({ _id: id }));
        } else {
            return files.removeAsync({ _id: id });
        }
    });
};

exports.edit = function(id, field, value) {
    return files.findOneAsync({ _id: id })
    .then(function(file) {
        file[field] = value;
        file.time = moment.tz("Asia/Singapore").format();
        return files.updateAsync({ _id: id }, { $set: file });
    })
    .then(function() {
        return { field: field, value : value };
    });
};

exports.get = function(category) {
    return files.find({ category: category })
    .sort({ time: -1 })
    .execAsync();
};
