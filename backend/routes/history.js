const express = require("express");
const router = express.Router();
const db = require("../db"); // Path to db.js
const authMiddleware = require("../middleware/auth.js"); // Path to auth.js

// Get history for logged in user
router.get("/", authMiddleware, (req, res) => {
  // Assumes 'history' table has 'id', 'user_id', 'action', 'created_at', and 'workout_details'
  db.all(
    "SELECT id, user_id, action, created_at, workout_details FROM history WHERE user_id = ? ORDER BY created_at DESC",
    [req.userId],
    (err, rows) => {
      if (err) {
        console.error("DB Error (Get History):", err.message);
        return res.status(500).json({ error: "Erreur base de données lors de la récupération de l'historique." });
      }
      
      const historyWithDetails = rows.map(row => {
        let details = null;
        if (row.workout_details) {
          try {
            details = JSON.parse(row.workout_details);
          } catch (parseError) {
            console.error("Failed to parse workout_details JSON:", parseError, "Row ID:", row.id);
            // Keep details as null or an error object if preferred
          }
        }
        // Construct the object that matches WorkoutHistory type, merging parsed details
        // The 'id' from the history table is the history entry ID, not workout.id from WorkoutHistory type.
        // The WorkoutHistory type has its own 'id' (which is workoutId from the template).
        // We need to be careful about what the frontend expects.
        // If frontend's WorkoutHistory type expects the DB row ID as 'id', then it's fine.
        // If 'details' is the full WorkoutHistory object, it already contains its own 'id', 'name', 'exercises', etc.
        // Let's assume 'details' is the WorkoutHistory object.
        if (details) {
            return {
                ...details, // Spread the parsed WorkoutHistory object
                history_db_id: row.id, // Add the database row ID for this history entry, using a distinct name
                action_summary: row.action, // The summarized action string (optional, if still useful)
                logged_at: row.created_at // The timestamp of when this history entry was logged
            };
        } else {
            // Fallback if workout_details is missing or unparseable
            // This structure should still try to conform to WorkoutHistory as much as possible
            return {
                id: `fallback_id_${row.id}`, // Construct a unique ID if details.id is missing
                history_db_id: row.id,
                name: row.action, // Default name to action string
                description: "", // Default description
                exercises: [], // Default to empty
                startedAt: row.created_at, 
                finishedAt: row.created_at,
                action_summary: row.action,
                logged_at: row.created_at
                // Ensure all essential WorkoutHistory fields have a default
            };
        }

      });
      res.json(historyWithDetails);
    }
  );
});

// Add history entry
router.post("/", authMiddleware, (req, res) => {
  const userId = req.userId;
  const completedWorkoutDetails = req.body; // This is the full WorkoutHistory object from the client

  // Validate incoming data (basic) - ensure it looks like a WorkoutHistory object
  if (!completedWorkoutDetails || typeof completedWorkoutDetails !== 'object' || !completedWorkoutDetails.id || !completedWorkoutDetails.name || !completedWorkoutDetails.exercises || !completedWorkoutDetails.startedAt || !completedWorkoutDetails.finishedAt) {
    return res.status(400).json({ error: "Données de séance terminées invalides ou manquantes. L'objet WorkoutHistory complet est attendu." });
  }

  // Generate a simple action string for the 'action' column (optional, but good for quick logs)
  const actionSummary = `Séance '${completedWorkoutDetails.name}' terminée le ${new Date(completedWorkoutDetails.finishedAt).toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' })}`;
  
  const workoutDetailsJson = JSON.stringify(completedWorkoutDetails);

  // Assumes 'history' table has columns: 'user_id', 'action', 'workout_details', 'created_at'
  // 'created_at' will be handled by defaultValue: 'datetime('now')' in schema or here.
  const stmt = db.prepare(
    "INSERT INTO history (user_id, action, workout_details, created_at) VALUES (?, ?, ?, datetime('now'))"
  );
  
  stmt.run(userId, actionSummary, workoutDetailsJson, function (err) {
    if (err) {
      console.error("DB Error (Insert History):", err.message);
      return res.status(500).json({ error: "Erreur base de données lors de l'enregistrement de l'historique." });
    }
    res.status(201).json({ success: true, id: this.lastID }); // Returns the DB row ID of the history entry
  });
  stmt.finalize();
});

module.exports = router;
