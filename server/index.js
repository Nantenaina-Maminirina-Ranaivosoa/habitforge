// Importations
const express = require('express');
const cors = require('cors'); // <-- Importer cors

// Création de l'application Express
const app = express();

// --- MIDDLEWARES ---
// On indique à Express d'utiliser le middleware CORS pour autoriser les requêtes cross-origin
app.use(cors()); // <-- Utiliser cors

// Définition du port d'écoute
const PORT = process.env.PORT || 3001;

// --- ROUTES ---
// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ message: "Le serveur Express fonctionne parfaitement ! 🎉" });
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});