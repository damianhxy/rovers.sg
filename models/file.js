var Q = require("q");
var nedb = require("nedb");
var fs = require("fs");
var moment = require("moment");
var files = new nedb({ filename: "./database/files", autoload: true });

exports.add = function(req) {
    return Q.promise(function(resolve, reject) {
        var fileInfo = {
            name: req.file.filename,
            original: req.file.originalname,
            path: req.file.path,
            title: req.body.title,
            time: moment().format(),
            category: req.body.category,
            uploader: req.user.username
        };
        Q.ninvoke(files, "insert", fileInfo)
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(files, "find", {})
        .then(function(filelist) {
            resolve(filelist);
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
            return Q.nfcall(fs.unlink, file.path);
        })
        .then(Q.ninvoke(files, "remove", { _id: id }))
        .then(function() {
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
            return Q.ninvoke(files, "update", { _id: id }, { $set: file });
        })
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};