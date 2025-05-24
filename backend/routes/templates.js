const express = require("express");
const router = express.Router();
const db = require("../db"); // Corrected path
const authMiddleware = require("../middleware/auth.js");

console.log(
  "DEBUG: backend/routes/templates.js - Fichier chargé et initialisé."
);

// Promisify db.run and db.all - these can be defined once at the top or imported from a utils file
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

// POST route to create a new template
router.post("/", authMiddleware, async (req, res) => {
  const { name, description, exercises: exercisesPayload } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: "Le nom du modèle est requis." });
  }

  try {
    await runExec("BEGIN TRANSACTION");
    console.log(`[POST /templates] Transaction started for user ${userId}.`);

    const templateResult = await runExec(
      "INSERT INTO templates (userId, name, description) VALUES (?, ?, ?)",
      [userId, name, description || null]
    );
    const newTemplateId = templateResult.lastID;
    console.log(`[POST /templates] Created template with ID: ${newTemplateId}`);

    let savedExercises = [];

    if (Array.isArray(exercisesPayload)) {
      for (const exercise of exercisesPayload) {
        if (!exercise.exercise_name) {
          console.warn(
            `[POST /templates] Skipping exercise due to missing name:`,
            exercise
          );
          continue;
        }
        console.log(
          `[POST /templates] Inserting exercise: ${exercise.exercise_name} for template ID: ${newTemplateId}`
        );
        const namedExerciseResult = await runExec(
          "INSERT INTO template_named_exercises (template_id, exercise_name, notes, order_num) VALUES (?, ?, ?, ?)",
          [
            newTemplateId,
            exercise.exercise_name,
            exercise.notes || null,
            exercise.order_num || null,
          ]
        );
        const newNamedExerciseId = namedExerciseResult.lastID;
        console.log(
          `[POST /templates] Inserted named exercise ID: ${newNamedExerciseId}`
        );

        let savedSets = [];
        if (Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            const completedStatus =
              typeof set.completed === "boolean"
                ? set.completed
                : set.completed === "true" || set.completed === 1;
            console.log(
              `[POST /templates] Inserting set for named exercise ID ${newNamedExerciseId}:`,
              set
            );
            const setResult = await runExec(
              "INSERT INTO exercise_sets (template_named_exercise_id, set_order, kg, reps, completed) VALUES (?, ?, ?, ?, ?)",
              [
                newNamedExerciseId,
                set.set_order || null,
                set.kg || 0,
                set.reps || 0,
                completedStatus,
              ]
            );
            savedSets.push({
              id: setResult.lastID,
              template_named_exercise_id: newNamedExerciseId, // Corrected to newNamedExerciseId
              set_order: set.set_order || null,
              kg: set.kg || 0,
              reps: set.reps || 0,
              completed: completedStatus,
            });
          }
        }
        savedExercises.push({
          id: newNamedExerciseId,
          template_id: newTemplateId, // Corrected to newTemplateId
          exercise_name: exercise.exercise_name,
          notes: exercise.notes || null,
          order_num: exercise.order_num || null,
          sets: savedSets,
        });
      }
    }

    await runExec("COMMIT");
    console.log(
      `[POST /templates] Transaction committed for template ID: ${newTemplateId}`
    );

    res.status(201).json({
      id: newTemplateId,
      userId: userId,
      name: name,
      description: description || null,
      exercises: savedExercises, // Include processed exercises
    });
  } catch (error) {
    console.error(
      `[POST /templates] Error during transaction for user ${userId}:`,
      error.message,
      error.stack
    );
    try {
      await runExec("ROLLBACK");
      console.log(
        `[POST /templates] Transaction rolled back for user ${userId}.`
      );
    } catch (rbError) {
      console.error(
        `[POST /templates] Error rolling back transaction for user ${userId}:`,
        rbError.message
      );
    }
    res.status(500).json({
      error: "Erreur base de données lors de la création du modèle.",
      details: error.message,
    });
  }
});

// GET /templates - Fetch all templates for a user
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  console.log(
    `DEBUG: GET /templates - REQUÊTE REÇUE ! (Authentifié pour userId: ${userId})`
  );

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
        namedExercise.sets = sets.map((s) => ({
          ...s,
          completed: !!s.completed,
        }));
      }
      template.exercises = namedExercises;
    }

    res.json(templates);
  } catch (error) {
    console.error(
      "Error fetching templates with exercises:",
      error.message,
      error.stack
    );
    res.status(500).json({
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

  try {
    const templates = await runQuery(
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
        completed: !!s.completed,
      }));
    }
    singleTemplate.exercises = namedExercises;

    res.json(singleTemplate);
  } catch (error) {
    console.error(
      `Error fetching template ${templateId} with exercises:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Erreur base de données lors de la récupération du modèle.",
    });
  }
});

// PUT /templates/:id - Update a template
router.put("/:id", authMiddleware, async (req, res) => {
  const { id: templateId } = req.params;
  const userId = req.user.userId;
  const { name, description, exercises: exercisesPayload } = req.body; // exercisesPayload is the transformed exercises array from frontend

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

  // Frontend now sends exercises with exercise_name, notes, and sets with kg.
  const exercisesToProcess = Array.isArray(exercisesPayload)
    ? exercisesPayload
    : [];

  try {
    await runExec("BEGIN TRANSACTION");
    console.log(`[PUT /templates/${templateId}] Transaction started.`);

    const existingTemplateArray = await runQuery(
      "SELECT id, userId FROM templates WHERE id = ? AND userId = ?",
      [templateId, userId]
    );

    if (existingTemplateArray.length === 0) {
      console.log(
        `[PUT /templates/${templateId}] Template not found or user ${userId} not authorized. Rolling back.`
      );
      await runExec("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Modèle non trouvé ou non autorisé." });
    }

    await runExec(
      "UPDATE templates SET name = ?, description = ? WHERE id = ? AND userId = ?",
      [name, description || null, templateId, userId]
    );
    console.log(`[PUT /templates/${templateId}] Updated 'templates' table.`);

    // Delete old exercises and sets associated with this template
    // Assumes ON DELETE CASCADE for 'exercise_sets' linked to 'template_named_exercises'
    await runExec(
      "DELETE FROM template_named_exercises WHERE template_id = ?",
      [templateId]
    );
    console.log(`[PUT /templates/${templateId}] Deleted old exercises from 'template_named_exercises'.`);

    let processedExercises = []; // To store exercises and sets with their new DB IDs for the response

    for (const exercise of exercisesToProcess) {
      if (!exercise.exercise_name) {
        console.warn(
          `[PUT /templates/${templateId}] Skipping exercise due to missing exercise_name:`,
          exercise
        );
        continue;
      }
      console.log(
        `[PUT /templates/${templateId}] Processing exercise: ${exercise.exercise_name}`
      );
      const namedExerciseResult = await runExec(
        "INSERT INTO template_named_exercises (template_id, exercise_name, notes, order_num) VALUES (?, ?, ?, ?)",
        [
          templateId,
          exercise.exercise_name,
          exercise.notes || null,
          exercise.order_num || null,
        ]
      );
      const newNamedExerciseId = namedExerciseResult.lastID;
      console.log(
        `[PUT /templates/${templateId}] Inserted named exercise ID: ${newNamedExerciseId}`
      );

      let processedSets = [];
      if (Array.isArray(exercise.sets)) {
        for (const set of exercise.sets) {
          const completedStatus =
            typeof set.completed === "boolean"
              ? set.completed
              : set.completed === "true" || set.completed === 1;
          
          console.log(
            `[PUT /templates/${templateId}] Inserting set for named exercise ID ${newNamedExerciseId}:`,
            set
          );
          const setResult = await runExec(
            "INSERT INTO exercise_sets (template_named_exercise_id, set_order, kg, reps, completed) VALUES (?, ?, ?, ?, ?)",
            [
              newNamedExerciseId, // Consistent usage here
              set.set_order || null,
              set.kg || 0,
              set.reps || 0,
              completedStatus,
            ]
          );
          processedSets.push({
            id: setResult.lastID,
            template_named_exercise_id: newNamedExerciseId,
            set_order: set.set_order || null,
            kg: set.kg || 0,
            reps: set.reps || 0,
            completed: completedStatus,
          });
        }
      }
      processedExercises.push({
        id: newNamedExerciseId,
        template_id: parseInt(templateId, 10),
        exercise_name: exercise.exercise_name,
        notes: exercise.notes || null,
        order_num: exercise.order_num || null,
        sets: processedSets,
      });
    }

    await runExec("COMMIT");
    console.log(`[PUT /templates/${templateId}] Transaction committed.`);

    res.json({
      id: parseInt(templateId, 10),
      userId: parseInt(userId, 10), // Ensure userId is also an int if it comes from req.user.userId as string
      name: name,
      description: description,
      exercises: processedExercises, // Send back the processed exercises and sets with their new DB IDs
    });
  } catch (error) {
    console.error(
      `[PUT /templates/${templateId}] Error during transaction:`,
      error.message,
      error.stack
    );
    try {
      await runExec("ROLLBACK");
      console.log(`[PUT /templates/${templateId}] Transaction rolled back.`);
    } catch (rbError) {
      console.error(
        `[PUT /templates/${templateId}] Error rolling back transaction:`,
        rbError.message
      );
    }
    res
      .status(500)
      .json({
        error: "Erreur base de données lors de la mise à jour du modèle.",
        details: error.message,
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

  try {
    const result = await runExec(
      "DELETE FROM templates WHERE id = ? AND userId = ?",
      [templateId, userId]
    );

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Modèle non trouvé ou non autorisé à supprimer." });
    }

    res
      .status(200)
      .json({ message: "Modèle supprimé avec succès.", id: templateId });
  } catch (error) {
    console.error(
      `Error deleting template ${templateId}:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Erreur base de données lors de la suppression du modèle.",
    });
  }
});

module.exports = router;
