import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 'useState' pour stocker le message que nous recevrons de l'API
  const [apiMessage, setApiMessage] = useState('');

  // 'useEffect' pour exécuter du code après le premier rendu du composant
  // C'est l'endroit idéal pour faire des appels API
  useEffect(() => {
    // On utilise l'API Fetch pour faire une requête GET à notre backend
    fetch('http://localhost:3001/api/test')
      .then(response => response.json()) // On transforme la réponse en JSON
      .then(data => {
        // On met à jour notre état avec le message reçu
        setApiMessage(data.message);
      })
      .catch(error => {
        // On gère les erreurs potentielles
        console.error("Erreur lors de la requête à l'API:", error);
        setApiMessage("Impossible de joindre le serveur. A-t-il bien été démarré ?");
      });
  }, []); // Le tableau de dépendances vide [] signifie que cet effet ne s'exécutera qu'une seule fois, au montage du composant.

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bienvenue sur HabitForge</h1>
        <p>Ce projet est en cours de construction.</p>
        <p className="api-status">
          <strong>Statut du serveur :</strong> {apiMessage || "Chargement..."}
        </p>
      </header>
    </div>
  );
}

export default App;