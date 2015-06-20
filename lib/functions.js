var Q = require("q");
var bytes = require("bytes");
var fs = require("fs");
var nedb = require("nedb");
var bcryptjs = require("bcryptjs");
// User Object: Name / Username / Salt / Hash
var users = new nedb({filename: "../database/users", autoload: true});
var files = new nedb({filename: "../database/files", autoload: true});

exports.addUser = function(req, username, password) {
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.genSalt, 10)
        .then(function(salt) {
            Q.nfcall(bcryptjs.hash, password, salt)
            .then(function(hash) {
                var user = {
                    "name": req.name,
                    "username": username,
                    "hash": hash,
                    "salt": salt
                }
                users.insert(user, function(err, user) {
                    if (err) reject(new Error("Creation failed."));
                    else resolve(user);
                });
            });
        })
        .fail(function() {
            reject(new Error("Creation failed."));
        });
    });
}

exports.checkUser = function(user, password) {
    return Q.promise(function(resolve, reject, notify) {
        Q.nfcall(bcryptjs.hash, password, user.salt)
            .then(function(hash) {
                return hash === user.hash;
            })
            .then(function() {
                resolve("Auth successful");
            })
            .fail(function() {
                reject(new Error("Auth failed."));
            });
    });
};