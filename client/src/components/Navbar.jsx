import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Assurez-vous d'avoir un fichier Navbar.css avec les styles nécessaires
import './Navbar.css';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <NavLink to="/" className="nav-brand">HabitForge</NavLink>
            <div className="nav-links">
                {user ? (
                    <>
                        <div className="user-info">
                            <span>{user.username} | Niv. {user.level} ({user.xp} XP)</span>
                        </div>
                        <button onClick={handleLogout} className="nav-button">Déconnexion</button>
                    </>
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
