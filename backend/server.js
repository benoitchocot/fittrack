// Main Express server file for the FitTrack backend API.
// Handles routes for authentication, templates, history, scan, and data.
// Configures CORS for allowed origins, body parsing, and serves on port 3001.
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const templatesRoutes = require("./routes/templates");
const historyRoutes = require("./routes/history");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");

const app = express();
const PORT = 3001;

const allowedOrigins = [
  'https://muscu.chocot.be', 
  "http://localhost:8080", 
  "https://localhost",  // <-- AJOUT pour Capacitor Android
  "http://localhost",   // <-- AJOUT pour Capacitor Android (variante)
  "capacitor://localhost",  // <-- AJOUT au cas où
  "capacitor://com.fittrack.app"
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


// Si tu utilises des requêtes avec Content-Type: application/json
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use("/templates", templatesRoutes);
app.use("/history", historyRoutes);
app.use("/auth", authRoutes);
app.use("/data", dataRoutes);

app.listen(PORT);
