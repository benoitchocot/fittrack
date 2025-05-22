const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../authMiddleware");

// Get history for logged in user
router.get("/", authMiddleware, (req, res) => {
  db.all(
    "SELECT * FROM history WHERE userId = ? ORDER BY createdAt DESC",
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur DB" });
      res.json(rows);
    }
  );
});

// Add history entry
router.post("/", authMiddleware, (req, res) => {
  const { action } = req.body;
  if (!action) return res.status(400).json({ error: "Action requise" });

  const stmt = db.prepare("INSERT INTO history (userId, action) VALUES (?, ?)");
  stmt.run(req.userId, action, function (err) {
    if (err) return res.status(500).json({ error: "Erreur insertion" });
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

module.exports = router;
