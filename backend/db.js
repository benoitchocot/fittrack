// Database configuration file for FitTrack.
// Sets up SQLite database connection and creates tables for users, exercises, templates, history, and more.
// Handles table creation and schema definitions.
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "data", "data.sqlite3");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur lors de l'ouverture de la base :", err);
  }
});

// Création des tables si elles n'existent pas
db.serialize(() => {
  // Utilisateurs
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  // Templates
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      userId INTEGER,
      description TEXT
    )
  `);

  // History
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Add workout_details column to history table
  db.run("ALTER TABLE history ADD COLUMN workout_details TEXT", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(
        "Error adding 'workout_details' column to 'history' table:",
        err.message
      );
    }
  });

  // template_named_exercises
  db.run(`
    CREATE TABLE IF NOT EXISTS template_named_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      exercise_name TEXT,
      notes TEXT,
      order_num INTEGER
      -- exerciseType TEXT DEFAULT 'reps' -- REMOVED
    )
  `);

  // exercise_sets
  db.run(`
    CREATE TABLE IF NOT EXISTS exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_named_exercise_id INTEGER,
      set_order INTEGER,
      kg INTEGER NULL,
      reps INTEGER NULL,
      completed BOOLEAN DEFAULT 0 
    )
  `);
});


module.exports = db;
