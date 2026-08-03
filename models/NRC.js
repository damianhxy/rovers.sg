const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "database", "NRCs.json");

exports.get = async function () {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return require("../controllers/NRCs.js").NRC;
  }
};

exports.update = async function (data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};
