const express = require("express");
const router = express.Router();
const resource = require("../models/resource.js");
const admin = require("../middlewares/admin.js");
const uploadResource = require("../middlewares/uploadResource.js");
const fs = require("fs/promises");

router.get("/", async function (req, res) {
  try {
    const categories = {
      Forms: { name: "forms", icon: "newspaper-o", fileList: [] },
      "General Information": { name: "info", icon: "inbox", fileList: [] },
      "Rover Journey": { name: "rj", icon: "map", fileList: [] },
    };
    const files = await resource.all();
    files.forEach(function (file) {
      categories[file.category].fileList.push(file);
    });
    res.render("resources", {
      title: "Resources",
      user: req.user,
      categories: categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", {
      title: "Internal Server Error",
      user: req.user,
    });
  }
});

router.delete("/", admin, async function (req, res) {
  try {
    await resource.delete(req.body.id);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/", admin, async function (req, res) {
  try {
    const response = await resource.edit(req.body.pk, req.body.name, req.body.value);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.post("/", admin, function (req, res) {
  uploadResource(req, res, async function (err) {
    if (err) {
      console.error(err);
      req.session.error = err.message;
      res.status(400).redirect("/resources#upload");
    } else {
      try {
        await resource.add(req);
        req.session.success = "Resource uploaded";
        res.redirect("/resources#upload");
      } catch (err) {
        console.error(err);
        req.session.error = err.message;
        fs.unlink(req.file.path).catch(function () {});
        res.status(400).redirect("/resources#upload");
      }
    }
  });
});

module.exports = router;
