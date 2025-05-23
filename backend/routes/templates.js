const express = require("express");
const router = express.Router();
// const db = require("../db"); // Pas besoin de DB pour ce test simple
// const authMiddleware = require("../middleware/auth.js"); // Pas besoin d'auth pour ce test simple

console.log("DEBUG: backend/routes/templates.js - Fichier chargé et initialisé.");

// Test POST route
router.post("/", (req, res) => {
  console.log("DEBUG: POST /api/templates - REQUÊTE REÇUE !");
  console.log("DEBUG: Contenu du body de la requête:", JSON.stringify(req.body, null, 2));
  res.status(200).json({ message: "DEBUG: Réponse de test de la route POST /api/templates" });
});

// Placeholder pour GET pour éviter les erreurs 404 si le frontend le charge
router.get("/", (req, res) => {
  console.log("DEBUG: GET /api/templates - REQUÊTE REÇUE !");
  res.status(200).json([]); // Renvoie un tableau vide pour éviter de casser le frontend
});

module.exports = router;