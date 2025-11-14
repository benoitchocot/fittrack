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
    console.log(`[GET /data/export] Starting export for user ${userId}`);

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
        console.log(`[GET /data/export] Exported ${templates.length} templates for user ${userId}`);

        // 3. Fetch Workout History
        const history = await runQuery("SELECT * FROM history WHERE userId = ?", [userId]);
        exportData.history = history;
        console.log(`[GET /data/export] Exported ${history.length} history records for user ${userId}`);

        // 4. Fetch Scan History
        const scanHistory = await runQuery("SELECT * FROM scan_history WHERE user_id = ?", [userId]);
        exportData.scan_history = scanHistory;
        console.log(`[GET /data/export] Exported ${scanHistory.length} scan history records for user ${userId}`);

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename="workout_data_export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(exportData);
        console.log(`[GET /data/export] Successfully completed export for user ${userId}`);

    } catch (error) {
        console.error(`[GET /data/export] Failed to export data for user ${userId}:`, error);
        res.status(500).json({ error: "Failed to export data.", details: error.message });
    }
});

router.post('/import', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const data = req.body;
    console.log(`[POST /data/import] Starting import for user ${userId}`);

    // Basic validation
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: "Invalid import data format." });
    }

    const { templates = [], history = [], scan_history = [] } = data;

    try {
        await runExec("BEGIN TRANSACTION");
        console.log(`[POST /data/import] Transaction started for user ${userId}.`);

        // 1. Delete existing user data in reverse order of dependency
        console.log(`[POST /data/import] Deleting existing data for user ${userId}.`);
        await runExec("DELETE FROM exercise_sets WHERE template_named_exercise_id IN (SELECT id FROM template_named_exercises WHERE template_id IN (SELECT id FROM templates WHERE userId = ?))", [userId]);
        await runExec("DELETE FROM template_named_exercises WHERE template_id IN (SELECT id FROM templates WHERE userId = ?)", [userId]);
        await runExec("DELETE FROM templates WHERE userId = ?", [userId]);
        await runExec("DELETE FROM history WHERE userId = ?", [userId]);
        await runExec("DELETE FROM scan_history WHERE user_id = ?", [userId]);
        console.log(`[POST /data/import] Finished deleting data for user ${userId}.`);

        // 2. Import new data
        console.log(`[POST /data/import] Starting data insertion for user ${userId}.`);

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
        console.log(`[POST /data/import] Imported ${templates.length} templates.`);

        // Import History
        for (const record of history) {
            await runExec("INSERT INTO history (userId, action, createdAt, workout_details) VALUES (?, ?, ?, ?)", [userId, record.action, record.createdAt, record.workout_details]);
        }
        console.log(`[POST /data/import] Imported ${history.length} history records.`);

        // Import Scan History
        for (const scan of scan_history) {
            await runExec("INSERT INTO scan_history (user_id, barcode, product_name, image_url, calories, protein, carbohydrates, fat, fiber, scanned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [userId, scan.barcode, scan.product_name, scan.image_url, scan.calories, scan.protein, scan.carbohydrates, scan.fat, scan.fiber, scan.scanned_at]);
        }
        console.log(`[POST /data/import] Imported ${scan_history.length} scan history records.`);

        await runExec("COMMIT");
        console.log(`[POST /data/import] Transaction committed for user ${userId}.`);
        res.status(200).json({ message: "Import successful." });

    } catch (error) {
        console.error(`[POST /data/import] Error during transaction for user ${userId}:`, error);
        try {
            await runExec("ROLLBACK");
            console.log(`[POST /data/import] Transaction rolled back for user ${userId}.`);
        } catch (rbError) {
            console.error(`[POST /data/import] Error rolling back transaction for user ${userId}:`, rbError);
        }
        res.status(500).json({ error: "Failed to import data.", details: error.message });
    }
});

module.exports = router;
