const express = require("express");
const router = express.Router();
const db = require("../db"); // Path to db.js
const authMiddleware = require("../middleware/auth.js"); // Path to auth.js

// Get history for logged in user
router.get("/", authMiddleware, (req, res) => {
  db.all(
    "SELECT id, userId, action, createdAt FROM history WHERE userId = ? ORDER BY createdAt DESC", // workout_details retiré
    [req.user.userId],
    (err, rows) => {
      if (err) {
        console.error("DB Error (Get History):", err.message);
        return res.status(500).json({ error: "Erreur base de données lors de la récupération de l'historique." });
      }
      // Simplement renvoyer les lignes telles quelles, ou les mapper si un format spécifique est attendu par le frontend
      // pour des objets sans workout_details.
      // Pour l'instant, renvoyons une structure simple.
      const historyEntries = rows.map(row => ({
        history_db_id: row.id,
        user_id: row.userId, // ou renommer en userId pour correspondre au schéma
        action_summary: row.action,
        logged_at: row.createdAt 
        // Le frontend devra être adapté pour gérer cette structure plus simple si elle est différente de WorkoutHistory
      }));
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
  
  // workout_details n'est plus stocké
  // const workoutDetailsJson = JSON.stringify(completedWorkoutDetails); 

  const stmt = db.prepare(
    "INSERT INTO history (userId, action, createdAt) VALUES (?, ?, datetime('now'))" // workout_details retiré
  );

  stmt.run(userId, actionSummary, function (err) { // workoutDetailsJson retiré
    if (err) {
      console.error("DB Error (Insert History):", err.message);
      return res.status(500).json({ error: "Erreur base de données lors de l'enregistrement de l'historique." });
    }
    res.status(201).json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

module.exports = router;
