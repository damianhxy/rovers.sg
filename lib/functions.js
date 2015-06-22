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
        return Q.nfcall(bcryptjs.genSalt, 10)
        .then(function(salt) {
            return Q.nfcall(bcryptjs.hash, password, salt)
            .then(function(hash) {
                var user = {
                    "name": name,
                    "username": username,
                    "hash": hash,
                    "salt": salt
                };
                return Q.ninvoke(users, "insert", user);
            })
            .then(function(user) {
                return resolve(user);
            });
        })
        .fail(function(err) {
            return reject(err);
        });
    });
}

function checkUser(user, password) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.nfcall(bcryptjs.hash, password, user.salt)
            .then(function(hash) {
                if (hash === user.hash)
                    return resolve(user);
                return reject("Wrong Password");
            })
            .fail(function(err) {
                return reject(err);
            });
    });
}

exports.signIn = function(username, password) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (!user) return reject("User does not exist.");
            return checkUser(user, password);
        })
        .then(function(user) {
            return resolve(user);
        })
        .fail(function(err) {
            return reject(err);
        });
    });
};

exports.signUp = function(name, username, password) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (user) return reject("User already exists.");
            return addUser(name, username, password);
        })
        .then(function(user) {
            return resolve(user);
        })
        .fail(function(err) {
            return reject(err);
        });
    });
};

/* Resources */
function getStats(file) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.nfcall(fs.stat, file.path)
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
        return Q.ninvoke(files, "find", {})
        .then(function(filelist) {
            return resolve(filelist);
        })
        .fail(function(err) {
            return reject(err);
        });
    });
};

exports.addFile = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        return getStats(req.files.file)
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
            return Q.ninvoke(files, "insert", fileinfo);
        })
        .then(function() {
            return resolve("File info saved.");
        })
        .fail(function(err) {
            fs.unlink(req.files.file.path, function() { // Unlink file first
                return reject(err);
            });
        });
    });
};