var express = require("express");
var router = express.Router();
var BPA = require("../models/BPA.js");
var NRC = require("../models/NRC.js");
var NRCs = require("./NRCs.js");
var admin = require("../middlewares/admin.js");

function findEntryWithTitle(collection, title) {
    for (var entry of collection) {
        if (entry.title === title) {
            return entry;
        }
    }
}

router.get("/", function(req, res) {
    BPA.all()
    .then(function(BPAs) {
        delete require.cache[require.resolve("./NRCs.js")];
        NRCs = require("./NRCs.js");
        var nrc2017Entry = findEntryWithTitle(NRCs.NRC, "NRC 2017");
        res.render("about", {
            title: "About",
            user: req.user,
            BPAs: BPAs,
            NRC: NRCs.NRC,
            NRC2017: nrc2017Entry ? nrc2017Entry.members : null
        });
    })
    .catch(function(err) {
        console.error(err);
        res.status(500).render("500", {
            title: "Internal Server Error",
            user: req.user
        });
    });
});

router.post("/NRC", admin, function(req, res) {
    NRC.update(req.body.data)
    .then(function() {
        req.session.success = "NRCs updated";
        res.redirect("/users/profile");
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.status(400).redirect("/users/profile");
    });
});

router.post("/BPA", admin, function(req, res) {
    BPA.add(req)
    .then(function() {
        req.session.success = "Awardee added";
        res.redirect("/about");
    })
    .catch(function(err) {
        console.error(err);
        req.session.error = err.message;
        res.redirect(req.headers.referrer || "/");
    });
});

router.delete("/BPA", admin, function(req, res) {
    BPA.delete(req.body.id)
    .then(function() {
        res.end();
    })
    .catch(function(err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    });
});

module.exports = router;
