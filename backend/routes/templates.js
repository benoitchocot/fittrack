const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth.js");

// Get all templates for the logged-in user
router.get("/", authMiddleware, (req, res) => {
  db.all("SELECT * FROM templates WHERE user_id = ? ORDER BY updatedAt DESC", [req.userId], (err, rows) => {
    if (err) {
      console.error("DB Error (Get Templates):", err.message);
      return res.status(500).json({ error: "Erreur lors de la récupération des modèles." });
    }
    res.json(rows);
  });
});

// Add new template
router.post("/", authMiddleware, (req, res) => {
  const { name, description, exercises } = req.body;
  const userId = req.userId;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }
  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: "Au moins un exercice est requis." });
  }
  for (const exercise of exercises) {
    if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim() === "") {
      return res.status(400).json({ error: "Chaque exercice doit avoir un nom valide." });
    }
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      return res.status(400).json({ error: `L'exercice '${exercise.name}' doit avoir au moins une série.` });
    }
    const firstSet = exercise.sets[0];
    if (typeof firstSet.weight !== 'number' || typeof firstSet.reps !== 'number') {
      return res.status(400).json({ error: `La première série de l'exercice '${exercise.name}' doit avoir des valeurs valides pour kg et reps.` });
    }
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;", (err) => {
      if (err) {
        console.error("Transaction Begin Error (POST):", err.message);
        return res.status(500).json({ error: "Erreur serveur (transaction début)." });
      }
    });

    const templateSql = `INSERT INTO templates (name, description, user_id, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))`;
    db.run(templateSql, [name, description || "", userId], function (err) {
      if (err) {
        console.error("DB Error (Insert Template):", err.message);
        db.run("ROLLBACK;");
        return res.status(500).json({ error: "Erreur lors de la création du modèle." });
      }

      const templateId = this.lastID;
      const exerciseSql = `INSERT INTO exercises (name, kg, reps, completed, template_id) VALUES (?, ?, ?, 0, ?)`;
      let exerciseInsertError = null;

      for (const exercise of exercises) {
        if (exerciseInsertError) continue;
        const firstSet = exercise.sets[0];
        db.run(exerciseSql, [exercise.name, firstSet.weight, firstSet.reps, templateId], function (errExercise) {
          if (errExercise) {
            console.error("DB Error (Insert Exercise):", errExercise.message);
            exerciseInsertError = errExercise; 
          }
        });
      }

      if (exerciseInsertError) {
        db.run("ROLLBACK;");
        return res.status(500).json({ error: "Erreur lors de l'ajout d'exercices au modèle." });
      } else {
        db.run("COMMIT;", (errCommit) => {
          if (errCommit) {
            console.error("Transaction Commit Error (POST):", errCommit.message);
            db.run("ROLLBACK;"); 
            return res.status(500).json({ error: "Erreur serveur (transaction commit)." });
          }
          res.status(201).json({ success: true, id: templateId });
        });
      }
    });
  });
});

// Update existing template
router.put("/:id", authMiddleware, (req, res) => {
  const templateId = req.params.id;
  const { name, description, exercises } = req.body;
  const userId = req.userId;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: "Au moins un exercice est requis." });
  }
   for (const exercise of exercises) {
    if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim() === "") {
      return res.status(400).json({ error: "Chaque exercice doit avoir un nom valide." });
    }
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      return res.status(400).json({ error: `L'exercice '${exercise.name}' doit avoir au moins une série.` });
    }
    const firstSet = exercise.sets[0];
    if (typeof firstSet.weight !== 'number' || typeof firstSet.reps !== 'number') {
      return res.status(400).json({ error: `La première série de l'exercice '${exercise.name}' doit avoir des valeurs valides pour kg et reps.` });
    }
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;", (err) => {
      if (err) {
        console.error("Transaction Begin Error (PUT):", err.message);
        return res.status(500).json({ error: "Erreur serveur (transaction début)." });
      }
    });

    db.get("SELECT user_id FROM templates WHERE id = ?", [templateId], (err, row) => {
      if (err) {
        console.error("DB Error (Select Template for Update):", err.message);
        db.run("ROLLBACK;");
        return res.status(500).json({ error: "Erreur lors de la vérification du modèle." });
      }
      if (!row) {
        db.run("ROLLBACK;");
        return res.status(404).json({ error: "Modèle non trouvé." });
      }
      if (row.user_id !== userId) {
        db.run("ROLLBACK;");
        return res.status(403).json({ error: "Action non autorisée." });
      }

      const templateSql = `UPDATE templates SET name = ?, description = ?, updatedAt = datetime('now') WHERE id = ? AND user_id = ?`;
      db.run(templateSql, [name, description || "", templateId, userId], function (errUpdateTemplate) {
        if (errUpdateTemplate) {
          console.error("DB Error (Update Template):", errUpdateTemplate.message);
          db.run("ROLLBACK;");
          return res.status(500).json({ error: "Erreur lors de la mise à jour du modèle." });
        }

        db.run("DELETE FROM exercises WHERE template_id = ?", [templateId], function (errDeleteExercises) {
          if (errDeleteExercises) {
            console.error("DB Error (Delete Old Exercises):", errDeleteExercises.message);
            db.run("ROLLBACK;");
            return res.status(500).json({ error: "Erreur lors de la mise à jour des exercices." });
          }

          const exerciseSql = `INSERT INTO exercises (name, kg, reps, completed, template_id) VALUES (?, ?, ?, 0, ?)`;
          let exerciseInsertError = null;
          for (const exercise of exercises) {
            if (exerciseInsertError) continue;
            const firstSet = exercise.sets[0];
            db.run(exerciseSql, [exercise.name, firstSet.weight, firstSet.reps, templateId], function (errInsertExercise) {
              if (errInsertExercise) {
                console.error("DB Error (Insert New Exercise):", errInsertExercise.message);
                exerciseInsertError = errInsertExercise;
              }
            });
          }

          if (exerciseInsertError) {
            db.run("ROLLBACK;");
            return res.status(500).json({ error: "Erreur lors de la mise à jour des exercices." });
          } else {
            db.run("COMMIT;", (errCommit) => {
              if (errCommit) {
                console.error("Transaction Commit Error (PUT):", errCommit.message);
                db.run("ROLLBACK;"); 
                return res.status(500).json({ error: "Erreur serveur (transaction commit)." });
              }
              res.status(200).json({ success: true, id: templateId });
            });
          }
        });
      });
    });
  });
});

// Delete a template
router.delete("/:id", authMiddleware, (req, res) => {
  const templateId = req.params.id;
  const userId = req.userId;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;", (err) => {
      if (err) {
        console.error("Transaction Begin Error (DELETE):", err.message);
        return res.status(500).json({ error: "Erreur serveur (transaction début)." });
      }
    });

    // 1. Verify template ownership
    db.get("SELECT user_id FROM templates WHERE id = ?", [templateId], (err, row) => {
      if (err) {
        console.error("DB Error (Select Template for Delete):", err.message);
        db.run("ROLLBACK;");
        return res.status(500).json({ error: "Erreur lors de la vérification du modèle pour suppression." });
      }
      if (!row) {
        db.run("ROLLBACK;");
        return res.status(404).json({ error: "Modèle non trouvé." });
      }
      if (row.user_id !== userId) {
        db.run("ROLLBACK;");
        return res.status(403).json({ error: "Action non autorisée (pas le propriétaire)." });
      }

      // 2. Delete associated exercises first
      db.run("DELETE FROM exercises WHERE template_id = ?", [templateId], function (errDeleteExercises) {
        if (errDeleteExercises) {
          console.error("DB Error (Delete Exercises for Template):", errDeleteExercises.message);
          db.run("ROLLBACK;");
          return res.status(500).json({ error: "Erreur lors de la suppression des exercices associés." });
        }

        // 3. Delete the template itself
        db.run("DELETE FROM templates WHERE id = ? AND user_id = ?", [templateId, userId], function (errDeleteTemplate) {
          if (errDeleteTemplate) {
            console.error("DB Error (Delete Template):", errDeleteTemplate.message);
            db.run("ROLLBACK;");
            return res.status(500).json({ error: "Erreur lors de la suppression du modèle." });
          }

          if (this.changes === 0) {
            // Should have been caught by the ownership check, but as a safeguard
            db.run("ROLLBACK;");
            return res.status(404).json({ error: "Modèle non trouvé ou suppression non effectuée." });
          }

          // 4. Commit transaction
          db.run("COMMIT;", (errCommit) => {
            if (errCommit) {
              console.error("Transaction Commit Error (DELETE):", errCommit.message);
              db.run("ROLLBACK;"); 
              return res.status(500).json({ error: "Erreur serveur (transaction commit)." });
            }
            res.status(200).json({ success: true, message: "Modèle et exercices associés supprimés." });
          });
        });
      });
    });
  });
});

module.exports = router;
