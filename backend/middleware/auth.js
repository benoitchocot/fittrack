const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // Importer uniquement JWT_SECRET depuis le fichier de config

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('DEBUG [AuthMiddleware]: Path being accessed:', req.path); // Log the path
  console.log('DEBUG [AuthMiddleware]: Auth Header:', authHeader); // Log the full Authorization header

  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    // Removed the stray console.log() here
    return res.status(401).json({ error: "Format de token incorrect: 'Bearer <token>' attendu. (Nombre de segments invalide)" });
  }

  if (parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Format de token incorrect: Doit commencer par 'Bearer'." });
  }

  const token = parts[1];
  console.log('DEBUG [AuthMiddleware]: Extracted Token:', token); // Log the extracted token

  if (!token) {
    return res.status(401).json({ error: "Token vide: Le token ne peut pas être une chaîne vide." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Utiliser JWT_SECRET importé // decoded will be like { userId: 123 }
    console.log('DEBUG [AuthMiddleware]: Decoded Payload:', decoded); // Log the entire decoded payload
    req.user = { id: decoded.userId }; // Now req.user will be { id: 123 }, so req.user.id is defined
    console.log('DEBUG [AuthMiddleware]: Set req.user to:', req.user); // Log what req.user is set to
    next();
  } catch (err) { // Capturer l'erreur pour potentiellement la logger ou la gérer différemment
    console.error("[AUTH MIDDLEWARE] JWT Verification Error:", err.name, "-", err.message);
    console.log('DEBUG [AuthMiddleware]: Error during JWT verify, token was:', token); // Log token on error too
    res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = authenticate;
