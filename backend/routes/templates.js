const express = require("express");
const router = express.Router();
const db = require("../db"); 
const authMiddleware = require("../middleware/auth.js");

console.log("DEBUG: backend/routes/templates.js - Fichier chargé et initialisé.");

// POST route to create a new template
router.post("/", authMiddleware, (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }

  const stmt = db.prepare(
    "INSERT INTO templates (userId, name, description) VALUES (?, ?, ?)"
  );
  stmt.run(userId, name, description || null, function (err) {
    if (err) {
      console.error("DB Error (Insert Template):", err.message);
      return res.status(500).json({ error: "Erreur base de données lors de la création du modèle." });
    }
    // Respond with the created template object
    res.status(201).json({
      id: this.lastID,
      userId: userId, // Include userId in the response as per the example
      name: name,
      description: description || null
    });
  });
  stmt.finalize();
});

// GET route to fetch templates for the authenticated user
router.get("/", authMiddleware, (req, res) => {
  console.log("DEBUG: GET /templates - REQUÊTE REÇUE ! (Authentifié)");
  db.all(
    "SELECT id, name, description FROM templates WHERE userId = ?",
    [req.user.userId],
    (err, rows) => {
      if (err) {
        console.error("DB Error (Get Templates):", err.message);
        return res.status(500).json({ error: "Erreur base de données lors de la récupération des modèles." });
      }
      // rows will already be an array of objects with id, name, description
      // as per the SELECT statement.
      const templates = rows.map(row => ({ 
        id: row.id, 
        name: row.name, 
        description: row.description 
      }));
      res.json(templates);
    }
  );
});

module.exports = router;