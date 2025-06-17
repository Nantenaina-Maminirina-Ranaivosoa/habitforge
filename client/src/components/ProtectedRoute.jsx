import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // Si pas de token, rediriger vers la page de connexion
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;