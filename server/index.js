// Importations
const express = require('express');
const cors = require('cors'); // <-- Importer cors
const db = require('./database.js'); // <-- Importer notre connexion à la DB


// Création de l'application Express
const app = express();

// --- MIDDLEWARES ---
// On indique à Express d'utiliser le middleware CORS pour autoriser les requêtes cross-origin
app.use(cors()); // <-- Utiliser cors
app.use(express.json()); // <-- Très important !

// Définition du port d'écoute
const PORT = process.env.PORT || 3001;

// ROUTE 1 : Récupérer toutes les habitudes
app.get('/api/habits', (req, res) => {
  const sql = "SELECT * FROM habits ORDER BY created_at DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "data": rows
    });
  });
});

// ROUTE 2 : Créer une nouvelle habitude
app.post('/api/habits', (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ "error": "Le nom de l'habitude est requis." });
    return;
  }

  const sql = 'INSERT INTO habits (name) VALUES (?)';
  const params = [name];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    res.status(201).json({
      "message": "success",
      "data": { id: this.lastID, name: name }
    });
  });
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});