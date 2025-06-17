const path = require('path');
const dbPath = path.resolve(__dirname, '../habitforge.db');
const db = new (require('sqlite3').verbose().Database)(dbPath);

console.log("Exécution de la migration 001 : Ajout des colonnes XP et Level aux utilisateurs...");

db.serialize(() => {
    // Commande pour ajouter la colonne 'xp'
    db.run(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Erreur lors de l'ajout de la colonne 'xp':", err.message);
        } else {
            console.log("Colonne 'xp' ajoutée ou déjà existante.");
        }
    });

    // Commande pour ajouter la colonne 'level'
    db.run(`ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Erreur lors de l'ajout de la colonne 'level':", err.message);
        } else {
            console.log("Colonne 'level' ajoutée ou déjà existante.");
        }
    });
});

db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Migration terminée. Connexion à la base de données fermée.');
});
