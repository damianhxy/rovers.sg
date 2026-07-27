const Store = require("express-session").Store;
const nedb = require("@seald-io/nedb");

function NedbStore(options) {
  Store.call(this);
  this.db = new nedb({
    filename: options.filename || "sessions.db",
    autoload: true,
  });
}

NedbStore.prototype = Object.create(Store.prototype);

NedbStore.prototype.get = function (sid, callback) {
  this.db
    .findOneAsync({ _id: sid })
    .then(function (session) {
      if (!session) return callback(null, null);
      callback(null, session.data);
    })
    .catch(callback);
};

NedbStore.prototype.set = function (sid, session, callback) {
  const doc = { _id: sid, data: session };
  this.db
    .updateAsync({ _id: sid }, { $set: doc }, { upsert: true })
    .then(function () {
      callback(null);
    })
    .catch(callback);
};

NedbStore.prototype.destroy = function (sid, callback) {
  this.db
    .removeAsync({ _id: sid })
    .then(function () {
      callback(null);
    })
    .catch(callback);
};

module.exports = NedbStore;
