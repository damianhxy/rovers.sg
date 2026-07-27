const nedb = require("@seald-io/nedb");
const bcryptjs = require("bcryptjs");
const { promisify } = require("util");
const users = new nedb({ filename: "./database/users", autoload: true });
const hashAsync = promisify(bcryptjs.hash);
const compareAsync = promisify(bcryptjs.compare);

exports.add = async function (name, username, password) {
  const existing = await users.findOneAsync({ username: username });
  if (existing) throw Error("User already exists");
  const hash = await hashAsync(password, 10);
  const user = {
    name: name,
    username: username,
    hash: hash,
    admin: false,
  };
  return users.insertAsync(user);
};

exports.all = function () {
  return users.findAsync({});
};

exports.authenticate = async function (username, password) {
  const user = await users.findOneAsync({ username: username });
  if (!user) throw Error("User does not exist");
  const match = await compareAsync(password, user.hash);
  if (!match) throw Error("Wrong password");
  return user;
};

exports.editPassword = async function (req) {
  if (req.body.newPass !== req.body.newPass2) throw Error("New passwords do not match");
  const match = await compareAsync(req.body.currentPassword, req.user.hash);
  if (!match) throw Error("Wrong password");
  const salt = req.user.hash.slice(0, 29);
  const hash = await hashAsync(req.body.newPass, salt);
  return users.updateAsync({ _id: req.user._id }, { $set: { hash: hash } });
};

exports.get = function (id) {
  return users.findOneAsync({ _id: id });
};

exports.bootstrapAdmin = async function (username, password) {
  if (!username || !password) return;
  const existing = await users.findOneAsync({ username: username });
  if (existing) {
    console.info("Admin user '" + username + "' already exists");
    return;
  }
  const hash = await hashAsync(password, 10);
  await users.insertAsync({
    name: username,
    username: username,
    hash: hash,
    admin: true,
  });
  console.info("Created admin user '" + username + "'");
};
