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
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "3d" });

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

// Login route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
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
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ error: "Mot de passe incorrect" });
      }

      const tokenPayload = { userId: user.id };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

      const responsePayload = {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      };

      res.json(responsePayload);
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

module.exports = router;
