const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./habitforge.db', (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log('Connexion à la base de données SQLite réussie.');

  // Utiliser db.serialize pour s'assurer que les commandes s'exécutent en séquence
  db.serialize(() => {
    // 1. Création de la table 'habits' avec les nouvelles colonnes de gamification
    db.run(`CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error("Erreur lors de la création de la table 'habits'", err);
      } else {
        console.log("Table 'habits' prête.");
      }
    });

    // 2. Création de la nouvelle table pour suivre les complétions
    db.run(`CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completion_date DATE NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE (habit_id, completion_date)
    )`, (err) => {
      if (err) {
        console.error("Erreur lors de la création de la table 'habit_completions'", err);
      } else {
        console.log("Table 'habit_completions' prête.");
      }
    });
  });
});

module.exports = db;