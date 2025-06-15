import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  // --- STATE MANAGEMENT ---
  // État pour stocker la liste des habitudes
  const [habits, setHabits] = useState([]);
  // État pour le champ de saisie du formulaire
  const [newHabitName, setNewHabitName] = useState('');
  // États pour la gestion du chargement et des erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA FETCHING ---
  // Fonction pour récupérer les habitudes depuis l'API
  const fetchHabits = useCallback(async () => {
    try {
      setError(null); // Réinitialiser les erreurs
      setLoading(true); // Indiquer le début du chargement
      const response = await fetch(`${API_URL}/habits`);
      if (!response.ok) {
        throw new Error("La réponse du réseau n'était pas OK");
      }
      const data = await response.json();
      setHabits(data.data); // Mettre à jour notre état avec les données reçues
    } catch (err) {
      setError("Impossible de charger les habitudes. Le serveur est-il en ligne ?");
      console.error(err);
    } finally {
      setLoading(false); // Indiquer la fin du chargement
    }
  }, []);

  // Utiliser useEffect pour appeler fetchHabits une seule fois au montage du composant
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);


  // --- EVENT HANDLERS ---
  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault(); // Empêcher le rechargement de la page
    
    if (!newHabitName.trim()) return; // Ne rien faire si le champ est vide

    try {
      const response = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newHabitName }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'habitude");
      }
      
      setNewHabitName(''); // Vider le champ de saisie après succès
      await fetchHabits(); // Recharger la liste des habitudes pour afficher la nouvelle
      
    } catch (err) {
      setError("Impossible d'ajouter l'habitude.");
      console.error(err);
    }
  };

  // --- RENDER ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>HabitForge</h1>
        <p>Forgez vos meilleures habitudes, une par une.</p>
      </header>
      <main>
        <div className="habit-form-container">
          <form onSubmit={handleSubmit} className="habit-form">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Entrez une nouvelle habitude..."
              className="habit-input"
            />
            <button type="submit" className="habit-button">Ajouter</button>
          </form>
        </div>

        <div className="habit-list-container">
          <h2>Mes Habitudes</h2>
          {loading && <p>Chargement...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && (
            <ul className="habit-list">
              {habits.length > 0 ? (
                habits.map(habit => (
                  <li key={habit.id} className="habit-item">
                    {habit.name}
                  </li>
                ))
              ) : (
                <p>Aucune habitude pour le moment. Ajoutez-en une !</p>
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;