var util = require("util");
var nedb = require("@seald-io/nedb");
var bcryptjs = require("bcryptjs");
var users = new nedb({ filename: "./database/users", autoload: true });
var hashAsync = util.promisify(bcryptjs.hash);
var compareAsync = util.promisify(bcryptjs.compare);

exports.add = function(name, username, password) {
    return users.findOneAsync({ username: username })
    .then(function(user) {
        if (user) throw Error("User already exists");
        return hashAsync(password, 10)
        .then(function(hash) {
            var user = {
                "name": name,
                "username": username,
                "hash": hash,
                "admin": false
            };
            return users.insertAsync(user);
        });
    });
};

exports.all = function() {
    return users.findAsync({});
};

exports.authenticate = function(username, password) {
    return users.findOneAsync({ username: username })
    .then(function(user) {
        if (!user) throw Error("User does not exist");
        return compareAsync(password, user.hash)
        .then(function(res) {
            if (!res) throw Error("Wrong password");
            return user;
        });
    });
};

exports.editPassword = function(req) {
    if (req.body.newPass !== req.body.newPass2)
        return Promise.reject(Error("New passwords do not match"));
    return compareAsync(req.body.currentPassword, req.user.hash)
    .then(function(res) {
        if (!res) throw Error("Wrong password");
        var salt = req.user.hash.slice(0, 29);
        return hashAsync(req.body.newPass, salt);
    })
    .then(function(hash) {
        return users.updateAsync({ _id: req.user._id }, { $set: {hash: hash} });
    });
};

exports.get = function(id) {
    return users.findOneAsync({ _id: id });
};
