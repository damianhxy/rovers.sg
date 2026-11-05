require("dotenv").config();

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error("FATAL: SESSION_SECRET must be set in .env (min 32 chars)");
  process.exit(1);
}

const express = require("express");
const app = express();
const settings = require("./controllers/settings.js");
const user = require("./models/user.js");

require("./controllers/config.js")(app, express);
app.use(require("./controllers/routes.js"));

user.bootstrapAdmin(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);

if (process.env.SEED_DEMO_DATA === "true") {
  require("./demo/seed.js")
    .seedIfEmpty()
    .catch((err) => console.error("Demo data: seeding failed", err));
}

app.listen(settings.PORT);
console.info("Listening on port " + settings.PORT + " in " + app.get("env") + " mode.");
