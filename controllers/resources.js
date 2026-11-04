const express = require("express");
const router = express.Router();
const resource = require("../models/resource.js");
const admin = require("../middlewares/admin.js");

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

router.get("/:id/download", async function (req, res) {
  try {
    const file = await resource.getDownload(req.params.id);
    res.download(file.path, file.filename || file.name, { root: process.cwd() });
  } catch (err) {
    console.error(err);
    res.status(404).render("404", {
      title: "Resource Not Found",
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

router.post("/", admin, async function (req, res) {
  if (req.uploadError) {
    console.error(req.uploadError);
    req.session.error = req.uploadError.message;
    return res.status(400).redirect("/resources#upload");
  }
  try {
    await resource.add(req);
    req.session.success = "Resource uploaded";
    res.redirect("/resources#upload");
  } catch (err) {
    console.error(err);
    req.session.error = err.message;
    res.status(400).redirect("/resources#upload");
  }
});

module.exports = router;
