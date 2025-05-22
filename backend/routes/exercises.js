router.post("/:templateId/exercises", authMiddleware, (req, res) => {
  const { name, kg, reps, completed } = req.body;
  const { templateId } = req.params;

  const stmt = db.prepare(`
    INSERT INTO exercises (name, kg, reps, completed, template_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(name, kg, reps, completed ? 1 : 0, templateId, function (err) {
    if (err) return res.status(500).json({ error: "Erreur ajout exercice" });
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});
