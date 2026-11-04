const normalizeURL = require("normalize-url").default;

module.exports = function (value) {
  const normalized = normalizeURL(value);
  const parsed = new URL(normalized);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw Error("URL must use HTTP or HTTPS");
  }
  if (parsed.username || parsed.password) {
    throw Error("URL must not contain credentials");
  }
  return normalized;
};
