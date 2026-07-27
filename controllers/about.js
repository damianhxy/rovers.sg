const express = require("express");
const router = express.Router();
const BPA = require("../models/BPA.js");
const NRC = require("../models/NRC.js");
let NRCs = require("./NRCs.js");
const admin = require("../middlewares/admin.js");

function findEntryWithTitle(collection, title) {
  for (const entry of collection) {
    if (entry.title === title) {
      return entry;
    }
  }
}

router.get("/", async function (req, res) {
  try {
    const BPAs = await BPA.all();
    delete require.cache[require.resolve("./NRCs.js")];
    NRCs = require("./NRCs.js");
    const nrc2017Entry = findEntryWithTitle(NRCs.NRC, "NRC 2017");
    res.render("about", {
      title: "About",
      user: req.user,
      BPAs: BPAs,
      NRC: NRCs.NRC,
      NRC2017: nrc2017Entry ? nrc2017Entry.members : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.post("/NRC", admin, async function (req, res) {
  try {
    await NRC.update(req.body.data);
    req.session.success = "NRCs updated";
    res.redirect("/users/profile");
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.status(400).redirect("/users/profile");
  }
});

router.post("/BPA", admin, async function (req, res) {
  try {
    await BPA.add(req);
    req.session.success = "Awardee added";
    res.redirect("/about");
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.redirect(req.headers.referrer || "/");
  }
});

router.delete("/BPA", admin, async function (req, res) {
  try {
    await BPA.delete(req.body.id);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
