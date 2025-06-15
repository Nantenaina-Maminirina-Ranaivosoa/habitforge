const sqlite3 = require('sqlite3').verbose();

// Le .verbose() permet d'avoir plus d'informations en cas de problème

// On se connecte à la base de données (un fichier .db). 
// S'il n'existe pas, il sera créé.
const db = new sqlite3.Database('./habitforge.db', (err) => {
  if (err) {
    // Erreur de connexion
    console.error(err.message);
    throw err;
  } else {
    console.log('Connexion à la base de données SQLite réussie.');
    // On crée la table 'habits' si elle n'existe pas déjà
    db.run(`CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        // Erreur de création de table
        console.error("Erreur lors de la création de la table 'habits'", err);
      } else {
        console.log("Table 'habits' prête.");
      }
    });
  }
});

// On exporte l'objet 'db' pour pouvoir l'utiliser dans d'autres fichiers
module.exports = db;