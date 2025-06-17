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

// Clé secrète pour JWT.
const JWT_SECRET = "votre_super_secret_absolument_pas_partageable_12345";

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
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ error: "Token invalide ou expiré." });
    }
};

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
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
             return res.status(401).json({ error: "Identifiants invalides." });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: "24h",
        });
        res.json({ message: "Connexion réussie.", token: token });
    });
});

// NOUVELLE ROUTE : Récupérer les informations de l'utilisateur connecté
app.get('/api/auth/me', protect, (req, res) => {
  const sql = "SELECT id, username, xp, level FROM users WHERE id = ?";
  db.get(sql, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });
    res.json(user);
  });
});

// --- ROUTES DES HABITUDES (PROTÉGÉES) ---

// GET /api/habits
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

// POST /api/habits
app.post("/api/habits", protect, (req, res) => {
    const { name } = req.body;
    const sql = "INSERT INTO habits (name, user_id) VALUES (?, ?)";
    db.run(sql, [name, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            message: "Habitude créée",
            data: { id: this.lastID, name, user_id: req.user.id },
        });
    });
});

// DELETE /api/habits/:id
app.delete("/api/habits/:id", protect, (req, res) => {
    const sql = "DELETE FROM habits WHERE id = ? AND user_id = ?";
    db.run(sql, [req.params.id, req.user.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Aucune habitude trouvée avec cet ID ou non autorisé." });
        }
        res.json({ message: "Habitude supprimée avec succès" });
    });
});

// POST /api/habits/:id/complete
app.post("/api/habits/:id/complete", protect, (req, res) => {
    const habitId = req.params.id;
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const XP_PER_COMPLETION = 10;
    const getLevelFromXp = (xp) => Math.floor(Math.sqrt(xp) / 10) + 1;

    db.get("SELECT id FROM habit_completions WHERE habit_id = ? AND completion_date = ?", [habitId, today], (err, completion) => {
        if (err) return res.status(500).json({ error: err.message });
        if (completion) return res.status(409).json({ message: "Habitude déjà complétée." });

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            db.run("INSERT INTO habit_completions (habit_id, completion_date) VALUES (?, ?)", [habitId, today]);

            const getDatesSql = "SELECT completion_date FROM habit_completions WHERE habit_id = ? ORDER BY completion_date DESC";
            db.all(getDatesSql, [habitId], (err, rows) => {
                if (err) { db.run("ROLLBACK"); return; }
                let current_streak = 1;
                if (rows.length > 1) {
                    let lastDate = new Date(rows[0].completion_date);
                    for (let i = 1; i < rows.length; i++) {
                        let currentDate = new Date(rows[i].completion_date);
                        let expectedDate = new Date(lastDate);
                        expectedDate.setDate(lastDate.getDate() - 1);
                        if (currentDate.toISOString().slice(0, 10) === expectedDate.toISOString().slice(0, 10)) {
                            current_streak++;
                            lastDate = currentDate;
                        } else { break; }
                    }
                }
                db.run("UPDATE habits SET current_streak = ?, longest_streak = MAX(longest_streak, ?) WHERE id = ?", [current_streak, current_streak, habitId]);
            });

            db.get("SELECT xp FROM users WHERE id = ?", [userId], (err, user) => {
                if (err) { db.run("ROLLBACK"); return; }
                const newXp = user.xp + XP_PER_COMPLETION;
                const newLevel = getLevelFromXp(newXp);
                db.run("UPDATE users SET xp = ?, level = ? WHERE id = ?", [newXp, newLevel, userId]);
            });

            db.run("COMMIT", (err) => {
                if(err) return res.status(500).json({error: "Commit a échoué"});
                res.status(200).json({ message: `Habitude complétée ! +${XP_PER_COMPLETION} XP` });
            });
        });
    });
});


// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
