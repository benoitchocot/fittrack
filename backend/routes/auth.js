const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Register
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
      res.json({ success: true, userId: this.lastID });
    });
    stmt.finalize();
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  });
});

module.exports = router;
