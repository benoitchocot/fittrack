const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth'); // Assuming auth.js is in middleware directory

// GET /api/scan/history - Get scan history for the logged-in user
router.get('/history', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const sql = "SELECT * FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC";
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST /api/scan/history - Save a new scan to the history
router.post('/history', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { barcode, product_name, image_url, calories, protein, carbohydrates, fat, fiber } = req.body;

  if (!barcode || !product_name) {
    return res.status(400).json({ error: 'Barcode and product name are required.' });
  }

  const sql = `INSERT INTO scan_history (user_id, barcode, product_name, image_url, calories, protein, carbohydrates, fat, fiber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [userId, barcode, product_name, image_url, calories, protein, carbohydrates, fat, fiber];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

module.exports = router;
