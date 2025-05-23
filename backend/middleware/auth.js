const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // Importer JWT_SECRET

// const SECRET = "supersecret"; // Supprimer cette ligne

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Format de token incorrect" }); // Ajout d'une vérification

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Utiliser JWT_SECRET importé
    req.user = decoded;
    next();
  } catch (err) { // Capturer l'erreur pour potentiellement la logger ou la gérer différemment
    // console.error("Erreur de vérification JWT:", err.message); // Optionnel: logger l'erreur
    res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = authenticate;
