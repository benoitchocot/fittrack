const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const templatesRoutes = require("./routes/templates");
const historyRoutes = require("./routes/history");
const authRoutes = require("./routes/auth");
const nutritionRoutes = require("./routes/nutrition");

const app = express();
const PORT = 3001;

const allowedOrigins = ['https://muscu.chocot.be', "http://localhost:8080"]

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
app.use(bodyParser.json());

app.use("/api/templates", templatesRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`);
});
