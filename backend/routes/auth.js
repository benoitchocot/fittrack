const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { addUser, findUserByEmail } = require("../data/users");

const router = express.Router();
const SECRET = "supersecret"; // à remplacer par une vraie clé secrète en prod

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email déjà utilisé" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  addUser({ email, password: hashedPassword });

  return res.json({ success: true });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Identifiants invalides" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: "Identifiants invalides" });

  const token = jwt.sign({ email }, SECRET, { expiresIn: "2h" });
  res.json({ token });
});

module.exports = router;
