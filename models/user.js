var Promise = require("bluebird");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
var users = new nedb({ filename: "./database/users", autoload: true });
Promise.promisifyAll(users);
Promise.promisifyAll(bcryptjs);

exports.add = function(name, username, password) {
    return users.findOneAsync({ username: username })
    .then(function(user) {
        if (user) throw Error("User already exists");
        return bcryptsjs.hashAsync(password, 10)
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
        return bcryptjs.compareAsync(password, user.hash)
        .then(function(res) {
            if (!res) throw Error("Wrong password");
            return user;
        });
    });
};

exports.editPassword = function(req) {
    if (req.body.newPass !== req.body.newPass2)
        return Promise.reject(Error("New passwords do not match"));
    return bcryptjs.compareAsync(req.body.currentPassword, req.user.hash)
    .then(function(res) {
        if (!res) throw Error("Wrong password");
        return bcryptjs.hashAsync(req.body.newPass, req.user.hash.substr(0, 29))
    })
    .then(function(hash) {
        return users.updateAsync({ _id: req.user._id }, { $set: {hash: hash} });
    });
};

exports.get = function(id) {
    return users.findOneAsync({ _id: id });
};
