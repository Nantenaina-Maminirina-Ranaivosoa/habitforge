// Importations
const express = require("express");
const cors = require("cors");
const db = require("./database.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Création de l'application Express
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

// Clé secrète pour JWT. DANS UN VRAI PROJET, CELA DOIT ÊTRE DANS UN FICHIER .env !
const JWT_SECRET = "votre_super_secret_absolument_pas_partageable_12345";

// --- ROUTES D'AUTHENTIFICATION ---

// Inscription (Signup)
app.post("/api/auth/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Nom d'utilisateur et mot de passe requis." });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
  db.run(sql, [username, password_hash], function (err) {
    if (err) {
      if (err.code === "SQLITE_CONSTRAINT") {
        return res
          .status(409)
          .json({ error: "Ce nom d'utilisateur est déjà pris." });
      }
      return res.status(500).json({ error: err.message });
    }
    res
      .status(201)
      .json({ message: "Utilisateur créé avec succès.", userId: this.lastID });
  });
});

// Connexion (Login)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user)
      return res.status(401).json({ error: "Identifiants invalides." });

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordIsValid)
      return res.status(401).json({ error: "Identifiants invalides." });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ message: "Connexion réussie.", token: token });
  });
});

// --- MIDDLEWARE DE PROTECTION ---
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Accès non autorisé. Token manquant ou mal formé." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId }; // Ajoute l'id de l'utilisateur à l'objet requête
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
};

// --- ROUTES DES HABITUDES (MAINTENANT PROTÉGÉES) ---

// Toutes les routes ci-dessous nécessiteront un token valide
app.get("/api/habits", protect, (req, res) => {
  const sql = `
    SELECT h.id, h.name, h.current_streak, h.longest_streak,
           (SELECT 1 FROM habit_completions hc WHERE hc.habit_id = h.id AND hc.completion_date = DATE('now', 'localtime')) as completed_today
    FROM habits h WHERE h.user_id = ? ORDER BY h.created_at DESC`;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
});

app.post("/api/habits", protect, (req, res) => {
  const { name } = req.body;
  const sql = "INSERT INTO habits (name, user_id) VALUES (?, ?)";
  db.run(sql, [name, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    // On peut renvoyer la nouvelle habitude complète
    res.status(201).json({
      message: "Habitude créée",
      data: { id: this.lastID, name, user_id: req.user.id },
    });
  });
});

// ROUTE 3 : Supprimer une habitude
app.delete("/api/habits/:id", protect, (req, res) => {
  const { id } = req.params; // On récupère l'id depuis les paramètres de l'URL
  const sql = "DELETE FROM habits WHERE id = ? AND user_id = ?";
  db.run(sql, [id, req.user.id], function (err) {
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
app.put("/api/habits/:id", protect, (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // On récupère le nouveau nom depuis le corps de la requête

  if (!name) {
    return res.status(400).json({ error: "Le nouveau nom est requis." });
  }

  const sql = "UPDATE habits SET name = ? WHERE id = ? AND user_id = ?";
  const params = [name, id, req.user.id];

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
app.post("/api/habits/:id/complete", protect, (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Vérifier que l'habitude existe ET appartient à l'utilisateur
  db.get(
    "SELECT id FROM habits WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    (err, habit) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!habit)
        return res
          .status(404)
          .json({ error: "Habitude introuvable ou non autorisée." });

      db.get(
        "SELECT id FROM habit_completions WHERE habit_id = ? AND completion_date = ?",
        [id, today],
        (err, completion) => {
          if (err) return res.status(500).json({ error: err.message });
          if (completion)
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
              let current_streak = 1;
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
                  res.status(200).json({
                    message: "Habitude complétée !",
                    new_streak: current_streak,
                  });
                }
              );
            });
          });
        }
      );
    }
  );
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
