const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Promisify db.run and db.all
const runExec = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) {
            console.error("DB runExec Error:", query, params, err.message);
            return reject(err);
        }
        resolve(this);
    });
});

const runQuery = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("DB runQuery Error:", query, params, err.message);
            return reject(err);
        }
        resolve(rows);
    });
});

router.get('/export', authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const exportData = {};

        // 1. Fetch Templates and their children
        const templates = await runQuery("SELECT * FROM templates WHERE userId = ?", [userId]);
        for (const template of templates) {
            const namedExercises = await runQuery("SELECT * FROM template_named_exercises WHERE template_id = ?", [template.id]);
            for (const namedExercise of namedExercises) {
                const sets = await runQuery("SELECT * FROM exercise_sets WHERE template_named_exercise_id = ?", [namedExercise.id]);
                namedExercise.sets = sets;
            }
            template.exercises = namedExercises;
        }
        exportData.templates = templates;

        // 3. Fetch Workout History
        const history = await runQuery("SELECT * FROM history WHERE userId = ?", [userId]);
        exportData.history = history;

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename="workout_data_export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(exportData);

    } catch (error) {
        console.error(`[GET /data/export] Failed to export data for user ${userId}:`, error);
        res.status(500).json({ error: "Failed to export data.", details: error.message });
    }
});

router.post('/import', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const data = req.body;

    // Basic validation
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: "Invalid import data format." });
    }

    const { templates = [], history = [] } = data;

    try {
        await runExec("BEGIN TRANSACTION");

        // 1. Delete existing user data in reverse order of dependency
        await runExec("DELETE FROM exercise_sets WHERE template_named_exercise_id IN (SELECT id FROM template_named_exercises WHERE template_id IN (SELECT id FROM templates WHERE userId = ?))", [userId]);
        await runExec("DELETE FROM template_named_exercises WHERE template_id IN (SELECT id FROM templates WHERE userId = ?)", [userId]);
        await runExec("DELETE FROM templates WHERE userId = ?", [userId]);
        await runExec("DELETE FROM history WHERE userId = ?", [userId]);

        // 2. Import new data
        // Import Templates
        for (const template of templates) {
            const { id: oldTemplateId, name, description, exercises = [] } = template;
            const templateResult = await runExec("INSERT INTO templates (userId, name, description) VALUES (?, ?, ?)", [userId, name, description]);
            const newTemplateId = templateResult.lastID;

            for (const exercise of exercises) {
                const { id: oldExerciseId, exercise_name, notes, order_num, sets = [] } = exercise;
                const exerciseResult = await runExec("INSERT INTO template_named_exercises (template_id, exercise_name, notes, order_num) VALUES (?, ?, ?, ?)", [newTemplateId, exercise_name, notes, order_num]);
                const newExerciseId = exerciseResult.lastID;

                for (const set of sets) {
                    await runExec("INSERT INTO exercise_sets (template_named_exercise_id, set_order, kg, reps, completed) VALUES (?, ?, ?, ?, ?)", [newExerciseId, set.set_order, set.kg, set.reps, set.completed]);
                }
            }
        }

        // Import History
        for (const record of history) {
            await runExec("INSERT INTO history (userId, action, createdAt, workout_details) VALUES (?, ?, ?, ?)", [userId, record.action, record.createdAt, record.workout_details]);
        }

        await runExec("COMMIT");
        res.status(200).json({ message: "Import successful." });

    } catch (error) {
        console.error(`[POST /data/import] Error during transaction for user ${userId}:`, error);
        try {
            await runExec("ROLLBACK");
        } catch (rbError) {
            console.error(`[POST /data/import] Error rolling back transaction for user ${userId}:`, rbError);
        }
        res.status(500).json({ error: "Failed to import data.", details: error.message });
    }
});

module.exports = router;
