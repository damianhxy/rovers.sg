var Q = require("q");
var nedb = require("nedb");
var fs = require("fs");
var moment = require("moment-timezone");
var files = new nedb({ filename: "./database/resources", autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var fileInfo = {
            name: req.file.filename,
            path: req.file.path,
            description: req.body.description,
            time: moment.tz("Asia/Singapore").format(),
            category: req.body.category
        };
        Q.ninvoke(files, "insert", fileInfo)
        .then(function() {
            console.info("User", req.user.username, "uploaded file", req.file.filename);
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        var cursor = files.find({}).sort({ time: -1 });
        Q.ninvoke(cursor, "exec")
        .then(function(fileList) {
            resolve(fileList);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(id) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(files, "findOne", { _id: id })
        .then(function(file) {
            console.info("Unlinking file", file.name);
            return Q.nfcall(fs.unlink, file.path);
        })
        .then(Q.ninvoke(files, "remove", { _id: id }))
        .then(function() {
            console.info("File unlink successful");
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.edit = function(id, field, value) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(files, "findOne", { _id: id })
        .then(function(file) {
            file[field] = value;
            file.time = moment.tz("Asia/Singapore").format();
            return Q.ninvoke(files, "update", { _id: id }, { $set: file });
        })
        .then(function() {
            console.info("Field", field, "of file", id, "changed to", value);
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};
