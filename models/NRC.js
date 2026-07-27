const fs = require("fs/promises");

exports.update = function (data) {
  return fs.writeFile("./controllers/NRCs.js", "exports.NRC = " + data);
};
