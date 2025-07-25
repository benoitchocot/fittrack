const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory
const authMiddleware = require('../middleware/auth'); // Assuming auth.js is in middleware directory

// POST /api/nutrition/log - Save a daily nutrition log and its individual food items
router.post('/log', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  // dailyLog is an array of individual food items, comment is optional
  const { protein, fiber, calories, lipids, glucides, dailyLog, comment } = req.body;

  // Basic validation for totals
  if (protein == null || fiber == null || calories == null || lipids == null || glucides == null) {
    return res.status(400).json({ error: 'Missing one or more nutrient total values.' });
  }

  // Validate dailyLog format
  if (dailyLog && !Array.isArray(dailyLog)) {
    return res.status(400).json({ error: 'dailyLog should be an array of food items.' });
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const commentValue = comment || null; // Ensure null is inserted if comment is undefined or empty string

  const sqlDailyLogTotals = `
    INSERT INTO daily_nutrition_logs (userId, date, protein, fiber, calories, lipids, glucides, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const paramsDailyLogTotals = [userId, currentDate, protein, fiber, calories, lipids, glucides, commentValue];

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
      glucides,
      comment: commentValue
      // Note: individual items are not returned in this response to keep it concise
    });
  });
});

// GET /api/nutrition/log - Fetch true daily aggregated nutrition logs for the user
router.get('/log', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  // Fetches all daily log entries for the user.
  // Ordered by date DESC, then id DESC to ensure the first entry encountered for a date is the latest.
  const sqlFetchDailyLogs = `
    SELECT id, date, protein, fiber, calories, lipids, glucides, comment
    FROM daily_nutrition_logs
    WHERE userId = ?
    ORDER BY date DESC, id DESC;
  `;

  // Fetches all logged food items for the user, joined with their corresponding daily_nutrition_logs entry
  // to get the date for each item. This is crucial for grouping items by date.
  const sqlFetchAllUserItems = `
    SELECT li.id as itemId, li.log_id, li.name, li.weight, li.protein, li.carbs, li.lipids, li.calories, li.fiber, dl.date as item_date
    FROM logged_food_items li
    JOIN daily_nutrition_logs dl ON li.log_id = dl.id
    WHERE dl.userId = ?;
  `;

  try {
    // Promisify db.all calls
    const dailyLogsPromise = new Promise((resolve, reject) => {
      db.all(sqlFetchDailyLogs, [userId], (err, rows) => {
        if (err) {
          console.error('Error fetching daily nutrition logs for aggregation:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const itemsPromise = new Promise((resolve, reject) => {
      db.all(sqlFetchAllUserItems, [userId], (err, rows) => {
        if (err) {
          console.error('Error fetching all user items for aggregation:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Await both promises concurrently
    const [dailyLogsResults, allUserItemsResults] = await Promise.all([dailyLogsPromise, itemsPromise]);

    if (!dailyLogsResults || dailyLogsResults.length === 0) {
      return res.json([]); // No logs found for the user
    }

    const aggregatedData = {};

    // Step 1: Process daily_nutrition_logs to sum totals and establish the latest comment/id per date
    for (const log of dailyLogsResults) {
      if (!aggregatedData[log.date]) {
        // First time seeing this date (due to ORDER BY id DESC), so this is the latest entry for this date.
        aggregatedData[log.date] = {
          id: log.id, // ID of the latest log entry for this date
          date: log.date,
          total_protein: 0, // Initialize sums
          total_fiber: 0,
          total_calories: 0,
          total_lipids: 0,
          total_glucides: 0,
          comment: log.comment, // Comment from the latest entry for this date
          items: []             // Initialize items array
        };
      }
      // Add current log's nutrient values to the totals for this date
      // Ensure that even if log.protein (etc.) is null, it's treated as 0 for summation.
      aggregatedData[log.date].total_protein += (log.protein || 0);
      aggregatedData[log.date].total_fiber += (log.fiber || 0);
      aggregatedData[log.date].total_calories += (log.calories || 0);
      aggregatedData[log.date].total_lipids += (log.lipids || 0);
      aggregatedData[log.date].total_glucides += (log.glucides || 0);
    }

    // Step 2: Distribute all logged food items to their respective dates
    for (const item of allUserItemsResults) {
      // item_date is the date of the daily_nutrition_log this item belongs to
      if (aggregatedData[item.item_date]) {
        // Destructure item, explicitly keeping itemId, and removing item_date and log_id from the main spread.
        // The rest of the properties (name, weight, protein, etc.) will be in otherFields.
        const { item_date, log_id, itemId, ...otherFields } = item;
        const cleanedItem = {
          itemId, // Ensure itemId is part of the object
          ...otherFields
        };
        aggregatedData[item.item_date].items.push(cleanedItem);
      } else {
        // This case should ideally not happen if data is consistent and queries are correct
        // but adding a log helps identify if it does.
        console.warn(`Item with log_id ${item.log_id} references date ${item.item_date} which was not found in the primary daily_nutrition_logs processing. Skipping item.`);
      }
    }
    
    // Step 3: Convert the aggregatedData object into an array, already sorted by date due to initial query and processing order.
    // If a specific sort order is absolutely required for the final array (e.g. if processing order didn't guarantee it):
    // const responseArray = Object.values(aggregatedData).sort((a, b) => new Date(b.date) - new Date(a.date));
    // However, since dailyLogsResults was sorted by date DESC, the keys in aggregatedData should be processed in a way
    // that Object.values() might retain this order in modern JS, but explicit sort is safer.
    const responseArray = Object.values(aggregatedData).sort((a,b) => b.date.localeCompare(a.date));


    res.json(responseArray);

  } catch (error) {
    // Log the detailed error for server-side debugging
    console.error('Failed to fetch true aggregated nutrition logs:', error.message, error.stack);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Failed to fetch aggregated nutrition logs. Please try again later.' });
  }
});

// DELETE /api/nutrition/log/item/:itemId - Delete a specific food item from a nutrition log
router.delete('/log/item/:itemId', authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId;

  // Step 1: Fetch the item and its nutrient values, and verify ownership
  const getFoodItemSql = `
    SELECT
      lfi.id AS itemId,
      lfi.log_id AS logId,
      lfi.protein,
      lfi.carbs,
      lfi.lipids,
      lfi.calories,
      lfi.fiber,
      dnl.userId
    FROM logged_food_items lfi
    JOIN daily_nutrition_logs dnl ON lfi.log_id = dnl.id
    WHERE lfi.id = ?;
  `;

  try {
    const item = await new Promise((resolve, reject) => {
      db.get(getFoodItemSql, [itemId], (err, row) => {
        if (err) {
          console.error('Error fetching food item:', err.message);
          return reject(err);
        }
        resolve(row);
      });
    });

    if (!item) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    if (item.userId !== userId) {
      return res.status(403).json({ error: 'User not authorized to delete this item.' });
    }

    // Step 2: Delete the item from logged_food_items
    const deleteFoodItemSql = 'DELETE FROM logged_food_items WHERE id = ?';
    await new Promise((resolve, reject) => {
      db.run(deleteFoodItemSql, [itemId], function(err) {
        if (err) {
          console.error('Error deleting food item:', err.message);
          return reject(err);
        }
        if (this.changes === 0) {
          // Should not happen if item was fetched successfully, but good to check
          return reject(new Error('Food item not found for deletion.'));
        }
        resolve();
      });
    });

    // Step 3: Subtract its nutrient values from the totals in daily_nutrition_logs
    const updateLogTotalsSql = `
      UPDATE daily_nutrition_logs
      SET
        protein = protein - ?,
        glucides = glucides - ?, 
        lipids = lipids - ?,
        calories = calories - ?,
        fiber = fiber - ?
      WHERE id = ?;
    `;
    // Note: 'carbs' from logged_food_items corresponds to 'glucides' in daily_nutrition_logs
    await new Promise((resolve, reject) => {
      db.run(updateLogTotalsSql, [item.protein, item.carbs, item.lipids, item.calories, item.fiber, item.logId], function(err) {
        if (err) {
          console.error('Error updating daily nutrition log totals:', err.message);
          return reject(err);
        }
        resolve();
      });
    });

    // Step 4 & 5: Check if the daily_nutrition_logs entry needs to be deleted
    const checkRemainingItemsSql = 'SELECT COUNT(*) AS count FROM logged_food_items WHERE log_id = ?';
    const remainingItems = await new Promise((resolve, reject) => {
      db.get(checkRemainingItemsSql, [item.logId], (err, row) => {
        if (err) {
          console.error('Error checking remaining items:', err.message);
          return reject(err);
        }
        resolve(row);
      });
    });

    if (remainingItems.count === 0) {
      const getUpdatedLogTotalsSql = 'SELECT protein, glucides, lipids, calories, fiber FROM daily_nutrition_logs WHERE id = ?';
      const updatedLogTotals = await new Promise((resolve, reject) => {
        db.get(getUpdatedLogTotalsSql, [item.logId], (err, row) => {
          if (err) {
            console.error('Error fetching updated log totals:', err.message);
            return reject(err);
          }
          resolve(row);
        });
      });

      if (updatedLogTotals &&
          (updatedLogTotals.protein <= 0) &&
          (updatedLogTotals.glucides <= 0) &&
          (updatedLogTotals.lipids <= 0) &&
          (updatedLogTotals.calories <= 0) &&
          (updatedLogTotals.fiber <= 0)) {
        
        const deleteDailyLogSql = 'DELETE FROM daily_nutrition_logs WHERE id = ?';
        await new Promise((resolve, reject) => {
          db.run(deleteDailyLogSql, [item.logId], function(err) {
            if (err) {
              console.error('Error deleting daily nutrition log:', err.message);
              // Non-critical for the overall success of item deletion, but should be logged
              return reject(err); // Or resolve and log, depending on desired behavior
            }
            console.log(`Daily nutrition log ${item.logId} deleted as it became empty.`);
            resolve();
          });
        });
      }
    }

    res.status(200).json({ message: 'Food item deleted successfully.' });

  } catch (error) {
    // Log the error for server-side debugging
    // error.message might already be logged by specific steps, but this catches general errors
    console.error('Failed to delete food item or update logs:', error.message, error.stack);
    // Send a generic error response to the client
    if (!res.headersSent) { // Avoid sending response if one has already been sent (e.g., 403, 404)
        res.status(500).json({ error: 'Failed to delete food item. Please try again later.' });
    }
  }
});

module.exports = router;
