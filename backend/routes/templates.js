const express = require("express");
const router = express.Router();
const db = require("../db"); // Corrected path
const authMiddleware = require("../middleware/auth.js");

console.log(
  "DEBUG: backend/routes/templates.js - Fichier chargé et initialisé."
);

// POST route to create a new template
router.post("/", authMiddleware, (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }

  const stmt = db.prepare(
    "INSERT INTO templates (userId, name, description) VALUES (?, ?, ?)"
  );
  stmt.run(userId, name, description || null, function (err) {
    if (err) {
      console.error("DB Error (Insert Template):", err.message);
      return res
        .status(500)
        .json({
          error: "Erreur base de données lors de la création du modèle.",
        });
    }
    // Respond with the created template object
    res.status(201).json({
      id: this.lastID,
      userId: userId, // Include userId in the response as per the example
      name: name,
      description: description || null,
    });
  });
  stmt.finalize();
});

// GET /templates - Fetch all templates for a user
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  console.log(
    `DEBUG: GET /templates - REQUÊTE REÇUE ! (Authentifié pour userId: ${userId})`
  );

  // Promisify db.all for use with async/await
  const runQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("DB Error in runQuery:", query, params, err.message);
          return reject(err);
        }
        resolve(rows);
      });
    });
  };

  try {
    const templates = await runQuery(
      "SELECT id, name, description, userId FROM templates WHERE userId = ?",
      [userId]
    );

    for (const template of templates) {
      const namedExercises = await runQuery(
        "SELECT id, template_id, exercise_name, notes, order_num FROM template_named_exercises WHERE template_id = ? ORDER BY order_num",
        [template.id]
      );

      for (const namedExercise of namedExercises) {
        const sets = await runQuery(
          "SELECT id, template_named_exercise_id, set_order, kg, reps, completed FROM exercise_sets WHERE template_named_exercise_id = ? ORDER BY set_order",
          [namedExercise.id]
        );
        // Ensure boolean conversion for completed: SQLite stores boolean as 0 or 1
        namedExercise.sets = sets.map((s) => ({
          ...s,
          completed: !!s.completed, // Converts 0 to false, 1 to true
        }));
      }
      template.exercises = namedExercises; // Use 'exercises' to match POST payload structure
    }

    res.json(templates);
  } catch (error) {
    console.error(
      "Error fetching templates with exercises:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        error: "Erreur base de données lors de la récupération des modèles.",
      });
  }
});

// GET /templates/:id - Fetch a single template
router.get("/:id", authMiddleware, async (req, res) => {
  const { id: templateId } = req.params;
  const userId = req.user.userId;
  console.log(
    `DEBUG: GET /templates/${templateId} - REQUÊTE REÇUE ! (Authentifié pour userId: ${userId})`
  );

  // Promisify db.all for use with async/await (can be refactored to a common utility)
  const runQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("DB Error in runQuery:", query, params, err.message);
          return reject(err);
        }
        resolve(rows);
      });
    });
  };

  try {
    const templates = await runQuery(
      // db.all returns an array, even for single item queries by ID
      "SELECT id, name, description, userId FROM templates WHERE id = ? AND userId = ?",
      [templateId, userId]
    );

    if (!templates || templates.length === 0) {
      return res
        .status(404)
        .json({ error: "Modèle non trouvé ou non autorisé." });
    }

    const singleTemplate = templates[0];

    const namedExercises = await runQuery(
      "SELECT id, template_id, exercise_name, notes, order_num FROM template_named_exercises WHERE template_id = ? ORDER BY order_num",
      [singleTemplate.id]
    );

    for (const namedExercise of namedExercises) {
      const sets = await runQuery(
        "SELECT id, template_named_exercise_id, set_order, kg, reps, completed FROM exercise_sets WHERE template_named_exercise_id = ? ORDER BY set_order",
        [namedExercise.id]
      );
      namedExercise.sets = sets.map((s) => ({
        ...s,
        completed: !!s.completed, // Converts 0 to false, 1 to true
      }));
    }
    singleTemplate.exercises = namedExercises; // Use 'exercises' to match POST payload structure

    res.json(singleTemplate);
  } catch (error) {
    console.error(
      `Error fetching template ${templateId} with exercises:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        error: "Erreur base de données lors de la récupération du modèle.",
      });
  }
});

// PUT /templates/:id - Update a template
router.put("/:id", authMiddleware, async (req, res) => {
  const { id: templateId } = req.params;
  const userId = req.user.userId;
  const { name, description, exercises: namedExercisesPayload } = req.body;

  // Log initial call details
  console.log(
    `[PUT /templates/${templateId}] Request received. User ID: ${userId}. Body:`,
    req.body
  );

  if (!name) {
    console.log(
      `[PUT /templates/${templateId}] Validation failed: Name is required.`
    );
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }
  const exercisesToProcess = Array.isArray(namedExercisesPayload)
    ? namedExercisesPayload
    : [];

  // Promisify db.run and db.all - define them here or ensure they are available in scope
  const runExec = (query, params) =>
    new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) {
          console.error("DB runExec Error:", query, params, err.message);
          return reject(err);
        }
        resolve(this);
      });
    });
  const runQuery = (query, params) =>
    new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("DB runQuery Error:", query, params, err.message);
          return reject(err);
        }
        resolve(rows);
      });
    });

  try {
    await runExec("BEGIN TRANSACTION");
    console.log(`[PUT /templates/${templateId}] Transaction started.`);

    const existingTemplateArray = await runQuery(
      "SELECT id, userId FROM templates WHERE id = ? AND userId = ?",
      [templateId, userId]
    );
    console.log(
      `[PUT /templates/${templateId}] Fetched existing template for check:`,
      existingTemplateArray
    );

    if (existingTemplateArray.length === 0) {
      console.log(
        `[PUT /templates/${templateId}] Template not found or user ${userId} not authorized. Rolling back.`
      );
      await runExec("ROLLBACK"); // Correctly added rollback
      return res
        .status(404)
        .json({ error: "Modèle non trouvé ou non autorisé." });
    }

    console.log(
      `[PUT /templates/${templateId}] Updating template details in 'templates' table...`
    );
    await runExec(
      "UPDATE templates SET name = ?, description = ? WHERE id = ? AND userId = ?",
      [name, description || null, templateId, userId]
    );

    console.log(
      `[PUT /templates/${templateId}] Deleting old named exercises from 'template_named_exercises' table...`
    );
    await runExec(
      "DELETE FROM template_named_exercises WHERE template_id = ?",
      [templateId]
    );
    // This assumes ON DELETE CASCADE for 'exercise_sets' linked to 'template_named_exercises'

    for (const namedExercise of exercisesToProcess) {
      if (!namedExercise.name) {
        console.warn(
          `[PUT /templates/${templateId}] Skipping named exercise due to missing name:`,
          namedExercise
        );
        continue;
      }
      console.log(
        `[PUT /templates/${templateId}] Inserting named exercise: ${namedExercise.name}`
      );
      const namedExerciseResult = await runExec(
        "INSERT INTO template_named_exercises (template_id, exercise_name, notes, order_num) VALUES (?, ?, ?, ?)",
        [
          templateId,
          namedExercise.name,
          namedExercise.notes || null,
          namedExercise.order_num || null,
        ]
      );
      const namedExerciseId = namedExerciseResult.lastID;
      console.log(
        `[PUT /templates/${templateId}] Inserted named exercise ID: ${namedExerciseId}`
      );

      if (Array.isArray(namedExercise.sets)) {
        for (const set of namedExercise.sets) {
          const completedStatus =
            typeof set.completed === "boolean"
              ? set.completed
              : set.completed === "true" || set.completed === 1;
          console.log(
            `[PUT /templates/${templateId}] Inserting set for named exercise ID ${namedExerciseId}:`,
            set
          );
          await runExec(
            "INSERT INTO exercise_sets (template_named_exercise_id, set_order, kg, reps, completed) VALUES (?, ?, ?, ?, ?)",
            [
              namedExerciseId,
              set.set_order || null,
              set.kg || 0,
              set.reps || 0,
              completedStatus,
            ]
          );
        }
      }
    }

    console.log(`[PUT /templates/${templateId}] Committing transaction...`);
    await runExec("COMMIT");

    // For consistency and to provide feedback, return the updated representation
    res.json({
      id: templateId,
      userId,
      name,
      description,
      exercises: exercisesToProcess,
    });
  } catch (error) {
    console.error(
      `[PUT /templates/${templateId}] Error during transaction:`,
      error.message,
      error.stack
    );
    // Attempt to rollback on any error
    db.run("ROLLBACK", (rbError) => {
      // Use db.run directly for rollback, don't await if it might hide original error
      if (rbError)
        console.error(
          `[PUT /templates/${templateId}] Rollback Error after failure:`,
          rbError.message
        );
    });
    res
      .status(500)
      .json({
        error: "Erreur base de données lors de la mise à jour du modèle.",
      });
  }
});

// DELETE /templates/:id - Delete a template
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id: templateId } = req.params;
  const userId = req.user.userId;
  console.log(
    `DEBUG: DELETE /templates/${templateId} - REQUÊTE REÇUE ! (Authentifié pour userId: ${userId})`
  );

  // Promisify db.run if not already done at a higher level
  const runExec = (query, params) =>
    new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) {
          console.error("DB Error in runExec:", query, params, err.message);
          return reject(err);
        }
        resolve(this); // this contains lastID, changes
      });
    });

  try {
    // The DELETE statement itself with userId check handles ownership.
    // Checking 'changes' property of the result is key.
    const result = await runExec(
      "DELETE FROM templates WHERE id = ? AND userId = ?",
      [templateId, userId]
    );

    if (result.changes === 0) {
      // This means either the template didn't exist or it didn't belong to this user.
      return res
        .status(404)
        .json({ error: "Modèle non trouvé ou non autorisé à supprimer." });
    }

    // ON DELETE CASCADE in DB schema should handle related template_named_exercises and exercise_sets.
    res
      .status(200)
      .json({ message: "Modèle supprimé avec succès.", id: templateId });
    // Or use status 204 (No Content) which is also common for DELETE:
    // res.status(204).send();
  } catch (error) {
    console.error(
      `Error deleting template ${templateId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        error: "Erreur base de données lors de la suppression du modèle.",
      });
  }
});

module.exports = router;
