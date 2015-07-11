var Q = require("q");
var nedb = require("nedb");
var fs = require("fs");
var files = new nedb({filename: "./database/files", autoload: true});

exports.add = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        var fileinfo = {
            name: req.files.file[0].name,
            original: req.files.file[0].originalname,
            path: req.files.file[0].path,
            title: req.body.title,
            time: Math.floor(Date.now() / 1000),
            category: req.body.category,
            uploader: req.user._id
        };
        return Q.ninvoke(files, "insert", fileinfo)
        .then(function() {
            resolve("File info saved.");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(files, "find", {})
        .then(function(filelist) {
            resolve(filelist);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.delete = function(id) {
    return Q.promise(function(resolve, reject, notify) {
        Q.ninvoke(files, "findOne", { _id: id })
        .then(function(file) {
            return Q.nfcall(fs.unlink, file.path);
        })
        .then(Q.ninvoke(files, "remove", { _id: id }))
        .then(function() {
            resolve("Success");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.edit = function(id, field, value) {
    return Q.promise(function(resolve, reject, notify) {
        Q.ninvoke(files, "findOne", { _id: id })
        .then(function(file) {
            file[field] = value;
            return Q.ninvoke(files, "update", { _id: id }, { $set: file });
        })
        .then(function() {
            resolve("Success");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};