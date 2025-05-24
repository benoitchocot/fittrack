const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "data.sqlite3");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur lors de l'ouverture de la base :", err);
  } else {
    console.log("Base SQLite connectée");
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

    // Exercises
db.run(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    kg INTEGER,
    reps INTEGER,
    completed BOOLEAN DEFAULT 0,
    template_id INTEGER,
    FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE
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
  
  // template_named_exercises
  db.run(`
    CREATE TABLE IF NOT EXISTS template_named_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      exercise_name TEXT,
      notes TEXT,
      order_num INTEGER
    )
  `);

  // exercise_sets
  db.run(`
    CREATE TABLE IF NOT EXISTS exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_named_exercise_id INTEGER,
      set_order INTEGER,
      kg INTEGER,
      reps INTEGER,
      completed BOOLEAN DEFAULT 0 
    )
  `);
});

module.exports = db;
