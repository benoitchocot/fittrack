const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory
const authMiddleware = require('../middleware/auth'); // Assuming auth.js is in middleware directory

// POST /api/nutrition/log - Save a daily nutrition log and its individual food items
router.post('/log', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  // dailyLog is an array of individual food items
  const { protein, fiber, calories, lipids, glucides, dailyLog } = req.body;

  // Basic validation for totals
  if (protein == null || fiber == null || calories == null || lipids == null || glucides == null) {
    return res.status(400).json({ error: 'Missing one or more nutrient total values.' });
  }

  // Validate dailyLog format
  if (dailyLog && !Array.isArray(dailyLog)) {
    return res.status(400).json({ error: 'dailyLog should be an array of food items.' });
  }

  const currentDate = new Date().toISOString().slice(0, 10);

  const sqlDailyLogTotals = `
    INSERT INTO daily_nutrition_logs (userId, date, protein, fiber, calories, lipids, glucides)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const paramsDailyLogTotals = [userId, currentDate, protein, fiber, calories, lipids, glucides];

  db.run(sqlDailyLogTotals, paramsDailyLogTotals, function(err) {
    if (err) {
      console.error('Error saving daily nutrition log totals:', err.message);
      return res.status(500).json({ error: 'Failed to save daily nutrition log totals.' });
    }

    const dailyLogId = this.lastID; // ID of the entry in daily_nutrition_logs

    // If dailyLogId is obtained and dailyLog array has items, insert them
    if (dailyLogId && dailyLog && dailyLog.length > 0) {
      const sqlLoggedFoodItem = `
        INSERT INTO logged_food_items (log_id, name, weight, protein, carbs, lipids, calories, fiber)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Prepare the statement for reuse
      const stmt = db.prepare(sqlLoggedFoodItem, (prepareErr) => {
        if (prepareErr) {
            console.error('Error preparing statement for logged_food_items:', prepareErr.message);
            // Not returning error to client here, as totals are saved. Consider logging.
            // The response will indicate success for totals but items might have failed.
        }
      });

      if (stmt) {
        dailyLog.forEach(item => {
          // Basic validation for each item
          if (item.name == null || item.weight == null || item.protein == null || item.carbs == null || item.lipids == null || item.calories == null || item.fiber == null) {
            console.warn(`Skipping food item due to missing fields: ${JSON.stringify(item)} for log_id: ${dailyLogId}`);
            return; // Skip this item
          }

          const itemParams = [
            dailyLogId,
            item.name,
            item.weight,
            item.protein,
            item.carbs, // Frontend sends 'carbs' for individual items
            item.lipids,
            item.calories,
            item.fiber
          ];

          stmt.run(itemParams, function(itemErr) {
            if (itemErr) {
              console.error(`Error saving logged food item (log_id: ${dailyLogId}, name: ${item.name}):`, itemErr.message);
              // Non-critical error for now, totals are saved.
            }
          });
        });
        stmt.finalize(); // Finalize the prepared statement after the loop
      }
    }

    res.status(201).json({
      message: 'Nutrition log saved successfully. Individual items processed.',
      logId: dailyLogId,
      userId,
      date: currentDate,
      protein,
      fiber,
      calories,
      lipids,
      glucides
      // Note: individual items are not returned in this response to keep it concise
    });
  });
});

// GET /api/nutrition/log - Fetch all nutrition logs for the user, including individual items
router.get('/log', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  const sqlDailyLogs = `
    SELECT id, date, protein, fiber, calories, lipids, glucides 
    FROM daily_nutrition_logs 
    WHERE userId = ? 
    ORDER BY date DESC
  `;

  try {
    // Promisify db.all for fetching daily logs
    const getDailyLogs = () => new Promise((resolve, reject) => {
      db.all(sqlDailyLogs, [userId], (err, dayEntries) => {
        if (err) {
          console.error('Error fetching daily nutrition logs:', err.message);
          // Pass an object with status and message for specific error handling
          reject({ status: 500, message: 'Failed to fetch daily nutrition logs.' });
          return;
        }
        resolve(dayEntries);
      });
    });

    const dayEntries = await getDailyLogs();

    if (!dayEntries || dayEntries.length === 0) {
      return res.json([]); // Return empty array if no logs found
    }

    // For each day entry, fetch its associated food items
    const enrichedDayEntries = await Promise.all(
      dayEntries.map(async (dayEntry) => {
        const sqlLoggedItems = `
          SELECT name, weight, protein, carbs, lipids, calories, fiber 
          FROM logged_food_items 
          WHERE log_id = ?
        `;
        
        // Promisify db.all for fetching items for a specific log
        const getItemsForLog = (logId) => new Promise((resolve, reject) => {
          db.all(sqlLoggedItems, [logId], (err, items) => {
            if (err) {
              // Log error but don't fail the entire request for one log's items
              console.error(`Error fetching items for log_id ${logId}:`, err.message);
              // Resolve with empty items array on error for this specific log_id
              // This ensures that if one log's items fail, others can still be returned.
              resolve([]); 
              return;
            }
            resolve(items);
          });
        });

        const items = await getItemsForLog(dayEntry.id);
        // Ensure 'items' property is always an array, even if null/undefined from DB
        return { ...dayEntry, items: items || [] }; 
      })
    );

    res.json(enrichedDayEntries);

  } catch (error) {
    // Handle errors from the getDailyLogs promise or other unexpected errors
    if (error && error.status) { // Check if error is the object we created
      return res.status(error.status).json({ error: error.message });
    }
    // Fallback for other types of unexpected errors
    console.error('Unexpected error in GET /api/nutrition/log:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while fetching nutrition logs.' });
  }
});

module.exports = router;
