// Importation du framework Express
const express = require('express');

// Création de l'application Express
const app = express();

// Définition du port d'écoute. On utilise une variable d'environnement si disponible, sinon 3001.
const PORT = process.env.PORT || 3001;

// Route de test simple pour vérifier que le serveur fonctionne
app.get('/api/test', (req, res) => {
  res.json({ message: "Le serveur Express fonctionne parfaitement ! 🎉" });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});