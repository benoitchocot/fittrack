const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../authMiddleware");

// Get all templates
router.get("/", authMiddleware, (req, res) => {
  db.all("SELECT * FROM templates", (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur DB" });
    res.json(rows);
  });
});

// Add new template
router.post("/", authMiddleware, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis" });

  const stmt = db.prepare("INSERT INTO templates (name, description) VALUES (?, ?)");
  stmt.run(name, description, function (err) {
    if (err) return res.status(500).json({ error: "Erreur insertion" });
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

module.exports = router;
