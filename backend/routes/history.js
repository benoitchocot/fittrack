const express = require("express");
const router = express.Router();
const db = require("../db"); // Path to db.js
const authMiddleware = require("../middleware/auth.js"); // Path to auth.js

// Get history for logged in user
router.get("/", authMiddleware, (req, res) => {
  db.all(
    "SELECT id, userId, action, createdAt, workout_details FROM history WHERE userId = ? ORDER BY createdAt DESC",
    [req.user.userId],
    (err, rows) => {
      if (err) {
        console.error("DB Error (Get History):", err.message);
        return res.status(500).json({ error: "Erreur base de données lors de la récupération de l'historique." });
      }
const historyEntries = rows.map(row => {

  let workoutDetails = null;
  if (row.workout_details) {
    try {
      workoutDetails = JSON.parse(row.workout_details);
      console.log("GET /history - Parsed workout_details:", JSON.stringify(workoutDetails, null, 2));
    } catch (parseErr) {
      console.error("JSON Parse Error (Get History):", parseErr.message);
      // Laisser workoutDetails à null si le parsing échoue
      console.log("GET /history - Failed to parse workout_details for row id:", row.id);
    }
  }
        return {
          history_db_id: row.id,
          user_id: row.userId,
          action_summary: row.action,
          logged_at: row.createdAt,
           workout_details: workoutDetails // This will be the parsedDetails or null
        };
      });
      res.json(historyEntries);
    }
  );
});

// Add history entry
router.post("/", authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const completedWorkoutDetails = req.body; 

  if (!completedWorkoutDetails || typeof completedWorkoutDetails !== 'object' || !completedWorkoutDetails.name || !completedWorkoutDetails.finishedAt) {
    // Validation simplifiée si on ne stocke que le résumé
    return res.status(400).json({ error: "Données de séance manquantes (name, finishedAt)." });
  }

  const actionSummary = `Séance '${completedWorkoutDetails.name}' terminée le ${new Date(completedWorkoutDetails.finishedAt).toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' })}`;
  
  console.log("POST /history - Received completedWorkoutDetails:", JSON.stringify(completedWorkoutDetails, null, 2));
  const workoutDetailsJson = JSON.stringify(completedWorkoutDetails); 
  console.log("POST /history - Storing workoutDetailsJson:", workoutDetailsJson);

  const stmt = db.prepare(
    "INSERT INTO history (userId, action, createdAt, workout_details) VALUES (?, ?, datetime('now'), ?)"
  );

  stmt.run(userId, actionSummary, workoutDetailsJson, function (err) {
    if (err) {
      console.error("DB Error (Insert History):", err.message);
      return res.status(500).json({ error: "Erreur base de données lors de l'enregistrement de l'historique." });
    }
    console.log("POST /history - Successfully inserted history entry with ID:", this.lastID);
    res.status(201).json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

module.exports = router;
