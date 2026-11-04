const nedb = require("@seald-io/nedb");
const bcryptjs = require("bcryptjs");
const { promisify } = require("util");
const users = new nedb({ filename: "./database/users", autoload: true });
const hashAsync = promisify(bcryptjs.hash);
const compareAsync = promisify(bcryptjs.compare);
const BCRYPT_COST = 10;
// Compared against when the username does not exist, so both failures take as long.
const DUMMY_HASH = bcryptjs.hashSync("not-a-real-password", BCRYPT_COST);

exports.add = async function (name, username, password) {
  const existing = await users.findOneAsync({ username: username });
  if (existing) throw Error("User already exists");
  const hash = await hashAsync(password, BCRYPT_COST);
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
  // Same message and same work for "no such user" and "wrong password", so sign-in does not
  // reveal which usernames exist.
  const match = await compareAsync(String(password), user ? user.hash : DUMMY_HASH);
  if (!user || !match) throw Error("Invalid username or password");
  return user;
};

exports.editPassword = async function (req) {
  if (req.body.newPass !== req.body.newPass2) throw Error("New passwords do not match");
  const match = await compareAsync(req.body.currentPassword, req.user.hash);
  if (!match) throw Error("Wrong password");
  // A fresh salt for every new password (this used to reuse the old hash's salt).
  const hash = await hashAsync(req.body.newPass, BCRYPT_COST);
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
  const hash = await hashAsync(password, BCRYPT_COST);
  await users.insertAsync({
    name: username,
    username: username,
    hash: hash,
    admin: true,
  });
  console.info("Created admin user '" + username + "'");
};
