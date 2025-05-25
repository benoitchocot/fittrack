const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // Importer uniquement JWT_SECRET depuis le fichier de config


function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const parts = authHeader.split(" "); // Split the header into parts

  if (parts.length !== 2) {
    console.log();
    return res.status(401).json({ error: "Format de token incorrect: 'Bearer <token>' attendu. (Nombre de segments invalide)" });

  }

  if (parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Format de token incorrect: Doit commencer par 'Bearer'." });
  }

  const token = parts[1];

  if (!token) { // This means token is an empty string, e.g. "Bearer "
    return res.status(401).json({ error: "Token vide: Le token ne peut pas être une chaîne vide." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Utiliser JWT_SECRET importé
    req.user = decoded;
    next();
  } catch (err) { // Capturer l'erreur pour potentiellement la logger ou la gérer différemment
    console.error("[AUTH MIDDLEWARE] JWT Verification Error:", err.name, "-", err.message);
    res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = authenticate;
