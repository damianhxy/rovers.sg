var Q = require("q");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
var users = new nedb({ filename: "./database/users", autoload: true });

exports.add = function(name, username, password) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (user) return reject(Error("User already exists."));
            return Q.ninvoke(bcryptjs, "hash", password, 10);
        })
        .then(function(hash) {
            var user = {
                "name": name,
                "username": username,
                "hash": hash,
                "admin": false
            };
            return Q.ninvoke(users, "insert", user);
        })
        .then(function(user) {
            resolve(user);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.all = function() {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(users, "find", {})
        .then(function(list) {
            resolve(list);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.authenticate = function(username, password) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (!user) return reject(Error("User does not exist."));
            Q.ninvoke(bcryptjs, "compare", password, user.hash)
            .then(function(res) {
                if (res) return resolve(user);
                reject(Error("Wrong Password."));
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.changePassword = function(req) {
    return Q.promise(function(resolve, reject) {
        if (req.body.newPassword !== req.body.newPasswordRepeat) return reject(Error("Passwords do not match."));
        Q.ninvoke(bcryptjs, "compare", req.body.currentPassword, req.user.hash)
        .then(function(res) {
            if (!res) return reject(Error("Wrong Password."));
            return Q.nfcall(bcryptjs.hash, req.body.newPassword, req.user.salt);
        })
        .then(function(hash) {
            return Q.ninvoke(users, "update", { _id: req.user._id }, { $set: { hash: hash } });
        })
        .then(function() {
            resolve();
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.get = function(id) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(users, "findOne", { _id: id })
        .then(function(user) {
            resolve(user);
        })
        .fail(function(err) {
            reject(err);
        });
    });
};