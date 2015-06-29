var Q = require("q");
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
                resolve(user);
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
}

exports.findUser = function(id) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "findOne", { _id: id })
        .then(function(user) {
            resolve(user);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.editPassword = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        if (req.body.newPassword !== req.body.newPasswordRepeat) return reject("Passwords do not match.");
        return Q.ninvoke(bcryptjs, "compare", req.body.currentPassword, req.user.hash)
        .then(function(res) {
            if (!res) return reject("Wrong Password");
            return Q.nfcall(bcryptjs.hash, req.body.newPassword, req.user.salt);
        })
        .then(function(hash) {
            return Q.ninvoke(files, "update", { _id: req.user._id }, {$set: { hash: hash }});
        })
        .then(function() {
            resolve("Success");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.signIn = function(username, password) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (!user) return reject("User does not exist.");
            Q.ninvoke(bcryptjs, "compare", password, user.hash)
            .then(function(res) {
                if (res) return resolve(user);
                reject("Wrong Password");
            });
        })
        .fail(function(err) {
            reject(err);
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
            resolve(user);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

/* Resources */
exports.getFiles = function() {
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

exports.addFile = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.nfcall(fs.stat, req.files.file[0].path)
        .then(function(stats) {
            var fileinfo = {
                name: req.files.file[0].name,
                original: req.files.file[0].originalname,
                title: req.body.title,
                time: Date.now(),
                category: req.body.category,
                uploader: req.user._id
            };
            return Q.ninvoke(files, "insert", fileinfo);
        })
        .then(function() {
            resolve("File info saved.");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.editFile = function(id, field, value) {
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

exports.deleteFile = function(id) {
    return Q.promise(function(resolve, reject, notify) {
        Q.ninvoke(files, "findOne", { _id: id })
        .then(function(file) {
            return Q.nfcall(fs.unlink, "./public/files/" + file.name);
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