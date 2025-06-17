import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3001/api';

function HomePage() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const { token } = useAuth();

  const fetchHabits = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/habits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setHabits(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    try {
      await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newHabitName }),
      });
      setNewHabitName('');
      await fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!token || !window.confirm("Supprimer cette habitude ?")) return;
    try {
      await fetch(`${API_URL}/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      await fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (habitId) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/habits/${habitId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) await fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HabitForge</h1>
        <p>🔥 Forgez vos meilleures habitudes, une par une. 🔥</p>
      </header>
      <main>
        <div className="habit-form-container">
          <form onSubmit={handleSubmit} className="habit-form">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Ajouter une habitude à forger..."
              className="habit-input"
            />
            <button type="submit" className="habit-button">Forger</button>
          </form>
        </div>
        <div className="habit-list-container">
          <h2>Mes Habitudes</h2>
          <ul className="habit-list">
            {habits.map(habit => (
              <li key={habit.id} className={`habit-item ${habit.completed_today ? 'completed' : ''}`}>
                <div className="habit-info">
                  <button 
                    className="complete-button" 
                    onClick={() => handleComplete(habit.id)}
                    disabled={habit.completed_today}
                    title={habit.completed_today ? "Déjà complété aujourd'hui" : "Marquer comme fait"}
                  >
                    <span>{habit.completed_today ? '✔' : ''}</span>
                  </button>
                  <span className="habit-name">{habit.name}</span>
                </div>
                <div className="habit-actions">
                  <span className="habit-streak" title={`Série actuelle : ${habit.current_streak} jours`}>
                    🔥 {habit.current_streak}
                  </span>
                  <button 
                    onClick={() => handleDelete(habit.id)} 
                    className="delete-button" 
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
