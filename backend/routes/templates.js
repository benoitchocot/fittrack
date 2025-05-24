const express = require("express");
const router = express.Router();
const db = require("../db"); // Corrected path
const authMiddleware = require("../middleware/auth.js");

console.log("DEBUG: backend/routes/templates.js - Fichier chargé et initialisé.");

// Test POST route
router.post("/", authMiddleware, (req, res) => {
  console.log("DEBUG: POST /templates - REQUÊTE REÇUE ! (Authentifié)");
  console.log("DEBUG: Contenu du body de la requête:", JSON.stringify(req.body, null, 2));
  // Actual POST logic will be added in a later step.
  // For now, just acknowledging it's protected.
  res.status(200).json({ message: "DEBUG: Réponse de test de la route POST /templates (protégée)" });
});

// Placeholder pour GET pour éviter les erreurs 404 si le frontend le charge
router.get("/", authMiddleware, (req, res) => {
  console.log("DEBUG: GET /templates - REQUÊTE REÇUE ! (Authentifié)");
  db.all(
    "SELECT id, name, exercises, description FROM templates WHERE userId = ?", // Added description
    [req.user.userId],
    (err, rows) => {
      if (err) {
        console.error("DB Error (Get Templates):", err.message);
        return res.status(500).json({ error: "Erreur base de données lors de la récupération des modèles." });
      }
      try {
        const templates = rows.map(row => ({
          ...row,
          exercises: JSON.parse(row.exercises || '[]') // Handle null or empty exercises
        }));
        res.json(templates);
      } catch (parseError) {
        console.error("Error parsing exercises JSON:", parseError.message);
        res.status(500).json({ error: "Erreur lors du traitement des données des modèles." });
      }
    }
  );
});

module.exports = router;