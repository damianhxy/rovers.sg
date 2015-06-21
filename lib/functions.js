var Q = require("q");
var bytes = require("bytes");
var fs = require("fs");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
// User Object: Name / Username / Salt / Hash
var users = new nedb({filename: "./database/users", autoload: true});
var files = new nedb({filename: "./database/files", autoload: true});

function addUser(name, username, password) {
    console.info("In function addUser.");
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.genSalt, 10)
        .then(function(salt) {
            console.info("Generated Salt.");
            Q.nfcall(bcryptjs.hash, password, salt)
            .then(function(hash) {
                console.info("Hashed Password.");
                var user = {
                    "name": name,
                    "username": username,
                    "hash": hash,
                    "salt": salt
                }
                users.insert(user, function(err, user) {
                    console.info("Inserted.");
                    if (err) reject(err);
                    else resolve(user);
                });
            });
        })
        .fail(function(err) {
            reject(err);
        });
    });
}

function checkUser(user, password) {
    console.info("In function checkUser.");
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.hash, password, user.salt)
            .then(function(hash) {
                console.info("Done Hash.");
                if (hash === user.hash)
                    resolve(user);
                else
                    reject(new Error("Wrong Password."));
            })
            .fail(function(err) {
                reject(err);
            });
    });
}

exports.signIn = function(username, password) {
    console.info("In function signIn.");
    return Q.promise(function(resolve, reject, notify) {
        users.findOne({ username: username }, function(err, user) {
            if (err) reject(err);
            else if (!user) reject(new Error("User not found."));
            else checkUser(user, password)
                .then(function(user) {
                    console.info("Checked User.");
                    resolve(user);
                })
                .fail(function(err) {
                    reject(err);
                });
        });
    });
};

exports.signUp = function(name, username, password) {
    console.info("In function signUp.");
    return Q.promise(function(resolve, reject, notify) {
        users.findOne({ username: username }, function(err, user) {
            console.info("Completed Query.");
            console.info(user);
            if (err) reject(err);
            else if (user) reject(new Error("User exists."));
            else addUser(name, username, password)
                .then(function(user) {
                    console.info("Added User.");
                    resolve(user);
                })
                .fail(function(err) {
                    reject(err);
                });
        });
    });
};