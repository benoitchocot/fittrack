const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Register route (laisser inchangée)
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      "INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)"
    );
    stmt.run(firstName, lastName, email, hashedPassword, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ error: "Email déjà utilisé" });
        }
        return res.status(500).json({ error: "Erreur lors de l'inscription" });
      }
      const userId = this.lastID;
      const tokenPayload = { userId };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

      res.json({
        success: true,
        token,
        user: {
          id: userId,
          firstName,
          lastName,
          email,
        },
      });
    });
    stmt.finalize();
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Login route (logique originale restaurée)
router.post("/login", (req, res) => {
  // La réponse statique temporaire a été supprimée.
  // La logique originale ci-dessous est maintenant active.

  const { email, password } = req.body;
  console.log("[LOGIN ATTEMPT] Email:", email);

  if (!email || !password) {
    console.log("[LOGIN FAIL] Email ou mot de passe manquant");
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error("[LOGIN DB ERROR]", err.message);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors recherche utilisateur" });
    }
    if (!user) {
      console.log("[LOGIN FAIL] Utilisateur non trouvé:", email);
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    console.log("[LOGIN USER FOUND] User ID:", user.id, "Email:", user.email);

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log(
          "[LOGIN FAIL] Mot de passe incorrect pour utilisateur:",
          email
        );
        return res.status(400).json({ error: "Mot de passe incorrect" });
      }

      console.log("[LOGIN PASSWORD MATCH] Utilisateur:", email);

      const tokenPayload = { userId: user.id };
      console.log("[LOGIN JWT PAYLOAD]", tokenPayload);
      console.log(
        "[LOGIN JWT SECRET]",
        JWT_SECRET ? "SECRET PRESENT" : "SECRET MANQUANT OU VIDE"
      );

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });
      console.log("[LOGIN TOKEN CREATED]", token);

      const responsePayload = {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      };
      console.log("[LOGIN RESPONSE PAYLOAD]", JSON.stringify(responsePayload));

      res.json(responsePayload);
      console.log("[LOGIN RESPONSE SENT] Pour utilisateur:", email);
    } catch (e) {
      console.error("[LOGIN ASYNC/SIGNING ERROR]", e.message, e.stack);
      if (!res.headersSent) {
        res
          .status(500)
          .json({
            error:
              "Erreur interne lors de la création du token ou comparaison mot de passe",
          });
      }
    }
  });
});

// New GET route handler for /count using callback style
router.get('/count', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (err) {
      console.error("Error getting user count:", err.message);
      return res.status(500).json({ error: "Erreur serveur lors de la récupération du nombre d'utilisateurs." });
    }
    if (row && typeof row.count !== 'undefined') {
      res.json({ count: row.count });
    } else {
      // This case implies an issue with the query or table, or unexpected row structure
      console.error("Failed to retrieve user count or count was undefined. Row:", row);
      res.status(500).json({ error: "Erreur lors de la récupération du nombre d'utilisateurs." });
    }
  });
});

module.exports = router;
