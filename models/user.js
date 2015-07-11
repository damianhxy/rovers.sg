var Q = require("q");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
// User Object: Name / Username / Salt / Hash
var users = new nedb({filename: "./database/users", autoload: true});

exports.all = function() {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "find", {})
        .then(function(res) {
            resolve(res);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.authenticate = function(username, password) {
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

exports.changePassword = function(req) {
    return Q.promise(function(resolve, reject, notify) {
        if (req.body.newPassword !== req.body.newPasswordRepeat) return reject("Passwords do not match.");
        return Q.ninvoke(bcryptjs, "compare", req.body.currentPassword, req.user.hash)
        .then(function(res) {
            if (!res) return reject("Wrong Password");
            return Q.nfcall(bcryptjs.hash, req.body.newPassword, req.user.salt);
        })
        .then(function(hash) {
            return Q.ninvoke(users, "update", { _id: req.user._id }, {$set: { hash: hash }});
        })
        .then(function() {
            resolve("Success");
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.create = function(name, username, password) {
    return Q.promise(function(resolve, reject, notify) {
        return Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (user) return reject("User already exists.");
            return Q.nfcall(bcryptjs.gensalt, 10);
        })
        .then(function(salt) {
            return Q.nfcall(bcryptjs.hash, password, salt)
            .then(function(hash) {
                var user = {
                    "name": name,
                    "username": username,
                    "hash": hash,
                    "salt": salt
                }
                return Q.ninvoke(users, "insert", user);
            })
        })
        .then(function(user) {
            resolve(user);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(id) {
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