const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory
const authMiddleware = require('../middleware/auth'); // Assuming auth.js is in middleware directory

// POST /api/nutrition/log - Save a daily nutrition log
router.post('/log', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { protein, fiber, calories, lipids, glucides } = req.body;

  // Basic validation
  if (protein == null || fiber == null || calories == null || lipids == null || glucides == null) {
    return res.status(400).json({ error: 'Missing one or more nutrient values.' });
  }

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().slice(0, 10);

  const sql = `
    INSERT INTO daily_nutrition_logs (userId, date, protein, fiber, calories, lipids, glucides)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [userId, currentDate, protein, fiber, calories, lipids, glucides];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error saving nutrition log:', err.message);
      return res.status(500).json({ error: 'Failed to save nutrition log.' });
    }
    res.status(201).json({
      message: 'Nutrition log saved successfully.',
      logId: this.lastID,
      userId,
      date: currentDate,
      protein,
      fiber,
      calories,
      lipids,
      glucides
    });
  });
});

// GET /api/nutrition/log - Fetch all nutrition logs for the user
router.get('/log', authMiddleware, (req, res) => {
  console.log('DEBUG: Entering GET /nutrition/log handler'); // New log
  const userId = req.user.userId;
  console.log('DEBUG: Extracted userId for query:', userId); // New log

  const sql = `
    SELECT id, date, protein, fiber, calories, lipids, glucides 
    FROM daily_nutrition_logs 
    WHERE userId = ? 
    ORDER BY date DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('DEBUG: Error fetching nutrition logs from DB:', err.message); // Enhanced log
      // It's important that this console.error happens BEFORE the res.status().json()
      // to ensure we see it if the response itself fails for some reason.
      return res.status(500).json({ error: 'Failed to fetch nutrition logs.' });
    }
    console.log('DEBUG: Successfully fetched nutrition logs. Count:', rows ? rows.length : 'N/A'); // New log
    // console.log('DEBUG: Fetched rows:', JSON.stringify(rows, null, 2)); // Optional: log all data if needed, can be verbose
    res.json(rows);
  });
});

module.exports = router;
