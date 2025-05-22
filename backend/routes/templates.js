const express = require("express");
const router = express.Router();
const { getTemplates, setTemplates } = require("../data/storage");

router.get("/", (req, res) => {
  res.json(getTemplates());
});

router.post("/", (req, res) => {
  const newTemplates = req.body;
  if (!Array.isArray(newTemplates)) return res.status(400).json({ error: "Invalid data" });

  setTemplates(newTemplates);
  res.json({ success: true });
});

module.exports = router;
