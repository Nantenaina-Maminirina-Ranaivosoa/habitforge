import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">HabitForge</NavLink>
      <div className="nav-links">
        {token ? (
          <button onClick={handleLogout} className="nav-button">Déconnexion</button>
        ) : (
          <>
            <NavLink to="/login" className="nav-button">Connexion</NavLink>
            <NavLink to="/signup" className="nav-button">Inscription</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;