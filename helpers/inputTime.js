const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const settings = require("../controllers/settings.js");
dayjs.extend(utc);
dayjs.extend(timezone);

// The value for an <input type="datetime-local"> showing a stored time, in Singapore time.
module.exports = function (time) {
  return dayjs(time).tz("Asia/Singapore").format(settings.EVENT_INPUT_TIME_FORMAT);
};
