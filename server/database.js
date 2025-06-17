const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./habitforge.db', (err) => {
    if (err) throw err;
    console.log('Connexion à la base de données SQLite réussie.');
    db.serialize(() => {
        // 1. Nouvelle table pour les utilisateurs
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Erreur table 'users'", err);
            else console.log("Table 'users' prête.");
        });

        // 2. Table 'habits' modifiée avec une clé étrangère user_id
        db.run(`CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Erreur table 'habits'", err);
            else console.log("Table 'habits' prête.");
        });

        // 3. Table 'habit_completions'
        db.run(`CREATE TABLE IF NOT EXISTS habit_completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id INTEGER NOT NULL,
            completion_date DATE NOT NULL,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
            UNIQUE (habit_id, completion_date)
        )`, (err) => {
            if (err) console.error("Erreur table 'habit_completions'", err);
            else console.log("Table 'habit_completions' prête.");
        });
    });
});
module.exports = db;
