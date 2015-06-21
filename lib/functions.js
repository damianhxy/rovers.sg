var Q = require("q");
var bytes = require("bytes");
var fs = require("fs");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
// User Object: Name / Username / Salt / Hash
var users = new nedb({filename: "./database/users", autoload: true});
// File Object: File Name / Title Name / Size / Last Modified / Category / Uploader (ID)
var files = new nedb({filename: "./database/files", autoload: true});

/* Auth */
function addUser(name, username, password) {
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.genSalt, 10)
        .then(function(salt) {
            Q.nfcall(bcryptjs.hash, password, salt)
            .then(function(hash) {
                var user = {
                    "name": name,
                    "username": username,
                    "hash": hash,
                    "salt": salt
                }
                users.insert(user, function(err, user) {
                    if (err) return reject(err);
                    return resolve(user);
                });
            });
        })
        .fail(function(err) {
            return reject(err);
        });
    });
}

function checkUser(user, password) {
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.hash, password, user.salt)
            .then(function(hash) {
                if (hash === user.hash)
                    return resolve(user);
                ("Wrong Password");
            })
            .fail(function(err) {
                return reject(err);
            });
    });
}

exports.signIn = function(username, password) {
    return Q.promise(function(resolve, reject, notify) {
        users.findOne({ username: username }, function(err, user) {
            if (err) return reject(err);
            if (!user) return reject("User does not exist.");
            checkUser(user, password)
            .then(function(user) {
                return resolve(user);
            })
            .fail(function(err) {
                return reject(err);
            });
        });
    });
};

exports.signUp = function(name, username, password) {
    return Q.promise(function(resolve, reject, notify) {
        users.findOne({ username: username }, function(err, user) {
            if (err) return reject(err);
            if (user) return reject("User exists.");
            addUser(name, username, password)
            .then(function(user) {
                return resolve(user);
            })
            .fail(function(err) {
                return reject(err);
            });
        });
    });
};

/* Resources */
function getStats(file) {
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(fs.stat, file.path)
        .then(function(stat) {
            return resolve(stat);
        })
        .fail(function(err) {
            return reject(err);
        });
    });
}

exports.getFiles = function() {
    return Q.promise(function(resolve, reject, notify) {
        files.find({}, function(err, filelist) {
            if (err) return reject(err);
            return resolve(filelist);
        });
    });
};

exports.addFile = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        getStats(req.files.file)
        .then(function(stats) {
            var fileinfo = {
                name: req.files.file.name,
                original: req.files.file.originalname,
                title: req.body.title,
                size: bytes(stats.size),
                time: Date.now(),
                category: req.body.category,
                uploader: req.user._id
            };
            files.insert(fileinfo, function(err) {
                if (err) return reject("File info saving failed.");
                return resolve("File info saved.");
            });
        })
        .fail(function(err) {
            fs.unlink(req.files.file.path, function() { // Destroy the file
                return reject(err);
            });
        });
    });
};