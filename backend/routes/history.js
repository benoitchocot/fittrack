const express = require("express");
const router = express.Router();
const { getHistory, setHistory } = require("../data/storage");

router.get("/", (req, res) => {
  res.json(getHistory());
});

router.post("/", (req, res) => {
  const newHistory = req.body;
  if (!Array.isArray(newHistory)) return res.status(400).json({ error: "Invalid data" });

  setHistory(newHistory);
  res.json({ success: true });
});

module.exports = router;
