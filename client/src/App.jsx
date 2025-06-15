import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_URL = "http://localhost:3001/api";

function App() {
  // --- STATE MANAGEMENT ---
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingHabitId, setEditingHabitId] = useState(null); // Stocke l'ID de l'habitude en cours d'édition
  const [editingHabitName, setEditingHabitName] = useState(""); // Stocke le texte de l'input d'édition

  // --- DATA FETCHING ---
  const fetchHabits = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`${API_URL}/habits`);
      if (!response.ok) throw new Error("La réponse du réseau n'était pas OK");
      const data = await response.json();
      setHabits(data.data);
    } catch (err) {
      setError("Impossible de charger les habitudes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utiliser useEffect pour appeler fetchHabits une seule fois au montage du composant
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // --- EVENT HANDLERS ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabitName }),
      });
      if (!response.ok) throw new Error("Erreur lors de la création");
      setNewHabitName("");
      await fetchHabits();
    } catch (err) {
      setError("Impossible d'ajouter l'habitude.");
      console.error(err);
    }
  };

  // --- NOUVELLE FONCTION ---
  const handleDelete = async (id) => {
    // On ajoute une confirmation pour éviter les suppressions accidentelles
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette habitude ?")) {
      try {
        const response = await fetch(`${API_URL}/habits/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression");
        await fetchHabits(); // Recharger la liste pour refléter la suppression
      } catch (err) {
        setError("Impossible de supprimer l'habitude.");
        console.error(err);
      }
    }
  };

  // Se déclenche quand on clique sur "Modifier"
  const handleEditClick = (habit) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
  };

  // Se déclenche quand on clique sur "Annuler"
  const handleCancelEdit = () => {
    setEditingHabitId(null);
    setEditingHabitName("");
  };

  // Se déclenche à la soumission du formulaire de mise à jour
  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingHabitName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/habits/${editingHabitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingHabitName }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      setEditingHabitId(null); // Quitter le mode édition
      setEditingHabitName("");
      await fetchHabits(); // Recharger la liste
    } catch (err) {
      setError("Impossible de mettre à jour l'habitude.");
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
            <button type="submit" className="habit-button">
              Ajouter
            </button>
          </form>
        </div>

        <div className="habit-list-container">
          <h2>Mes Habitudes</h2>
          {loading && <p>Chargement...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && (
            <ul className="habit-list">
              {habits.length > 0 ? (
                habits.map((habit) => (
                  <li key={habit.id} className="habit-item">
                    {editingHabitId === habit.id ? (
                      // --- VUE D'ÉDITION (si l'ID correspond) ---
                      <form onSubmit={handleUpdateSubmit} className="edit-form">
                        <input
                          type="text"
                          value={editingHabitName}
                          onChange={(e) => setEditingHabitName(e.target.value)}
                          className="habit-input"
                          autoFocus
                        />
                        <button type="submit" className="save-button">
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="cancel-button"
                        >
                          Annuler
                        </button>
                      </form>
                    ) : (
                      // --- VUE NORMALE (sinon) ---
                      <>
                        <span>{habit.name}</span>
                        <div className="habit-actions">
                          <button
                            onClick={() => handleEditClick(habit)}
                            className="edit-button"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="delete-button"
                          >
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
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
