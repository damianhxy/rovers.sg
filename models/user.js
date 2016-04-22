var Q = require("q");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
var users = new nedb({ filename: "./database/users", autoload: true });
/*
exports.add = function(name, username, password) {
    return Q.promise(function(resolve, reject) {
        Q.ninvoke(users, "findOne", { username: username })
        .then(function(user) {
            if (user) return reject(Error("User already exists"));
            Q.ninvoke(bcryptjs, "hash", password, 10)
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
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
};
*/
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
            if (!user) return reject(Error("User does not exist"));
            Q.ninvoke(bcryptjs, "compare", password, user.hash)
            .then(function(res) {
                if (!res) return reject(Error("Wrong Password"));
                resolve(user);
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
};

exports.editPassword = function(req) {
    return Q.promise(function(resolve, reject) {
        if (req.body.newPass !== req.body.newPass2)
            return reject(Error("New passwords do not match"));
        Q.ninvoke(bcryptjs, "compare", req.body.currentPassword, req.user.hash)
        .then(function(res) {
            if (!res) return(reject(Error("Wrong Password")));
            Q.nfcall(bcryptjs.hash, req.body.newPass, req.user.hash.substr(0, 29))
            .then(function(hash) {
                Q.ninvoke(users, "update", { _id: req.user._id }, { $set: { hash: hash } });
            })
            .then(function() {
                resolve();
            });
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
