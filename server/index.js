// Importations
const express = require("express");
const cors = require("cors");
const db = require("./database.js");

// Création de l'application Express
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

// GET /api/habits (modifiée pour inclure le statut de complétion du jour)
app.get("/api/habits", (req, res) => {
  // On utilise une sous-requête pour vérifier si l'habitude a été complétée aujourd'hui
  const sql = `
    SELECT 
      h.id, h.name, h.current_streak, h.longest_streak,
      (SELECT 1 FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.completion_date = DATE('now', 'localtime')) as completed_today
    FROM habits h
    ORDER BY h.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
});

// ROUTE 2 : Créer une nouvelle habitude
app.post("/api/habits", (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Le nom de l'habitude est requis." });
    return;
  }

  const sql = "INSERT INTO habits (name) VALUES (?)";
  const params = [name];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      message: "success",
      data: { id: this.lastID, name: name },
    });
  });
});

// ROUTE 3 : Supprimer une habitude
app.delete("/api/habits/:id", (req, res) => {
  const { id } = req.params; // On récupère l'id depuis les paramètres de l'URL
  const sql = "DELETE FROM habits WHERE id = ?";

  db.run(sql, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // this.changes contient le nombre de lignes affectées.
    // Si 0, l'id n'a pas été trouvé.
    if (this.changes === 0) {
      res.status(404).json({ error: "Aucune habitude trouvée avec cet ID." });
      return;
    }
    res.json({
      message: "Habitude supprimée avec succès",
      changes: this.changes,
    });
  });
});

// ROUTE 4 : Mettre à jour une habitude (Update)
app.put("/api/habits/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // On récupère le nouveau nom depuis le corps de la requête

  if (!name) {
    return res.status(400).json({ error: "Le nouveau nom est requis." });
  }

  const sql = "UPDATE habits SET name = ? WHERE id = ?";
  const params = [name, id];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Aucune habitude trouvée avec cet ID." });
      return;
    }
    res.json({
      message: "Habitude mise à jour avec succès",
      data: { id: id, name: name },
      changes: this.changes,
    });
  });
});

// --- NOUVELLE ROUTE DE GAMIFICATION ---

// POST /api/habits/:id/complete
app.post("/api/habits/:id/complete", (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Vérifier si déjà complété aujourd'hui pour éviter le recalcul
  db.get(
    "SELECT id FROM habit_completions WHERE habit_id = ? AND completion_date = ?",
    [id, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row)
        return res
          .status(409)
          .json({ message: "Habitude déjà complétée aujourd'hui." });

      // Transaction pour assurer l'intégrité des données
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Insérer la complétion du jour
        const insertCompletionSql =
          "INSERT INTO habit_completions (habit_id, completion_date) VALUES (?, ?)";
        db.run(insertCompletionSql, [id, today]);

        // 2. Récupérer toutes les dates de complétion pour recalculer la série
        const getDatesSql =
          "SELECT completion_date FROM habit_completions WHERE habit_id = ? ORDER BY completion_date DESC";
        db.all(getDatesSql, [id], (err, rows) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }

          // 3. Calcul de la série
          let current_streak = 0;
          if (rows.length > 0) {
            current_streak = 1;
            let lastDate = new Date(rows[0].completion_date);

            for (let i = 1; i < rows.length; i++) {
              let currentDate = new Date(rows[i].completion_date);
              let expectedDate = new Date(lastDate);
              expectedDate.setDate(lastDate.getDate() - 1);

              if (currentDate.getTime() === expectedDate.getTime()) {
                current_streak++;
                lastDate = currentDate;
              } else {
                break; // La série est rompue
              }
            }
          }

          // 4. Mettre à jour la série dans la table habits
          const updateStreakSql =
            "UPDATE habits SET current_streak = ?, longest_streak = MAX(longest_streak, ?) WHERE id = ?";
          db.run(
            updateStreakSql,
            [current_streak, current_streak, id],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
              }
              db.run("COMMIT");
              res
                .status(200)
                .json({
                  message: "Habitude complétée !",
                  new_streak: current_streak,
                });
            }
          );
        });
      });
    }
  );
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
