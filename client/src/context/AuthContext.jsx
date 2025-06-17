import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async (currentToken) => {
        if (!currentToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!response.ok) throw new Error("Token invalide");
            const data = await response.json();
            setUser(data);
        } catch (e) {
            console.error("Session invalide, déconnexion.", e);
            // Si le token est invalide, on nettoie tout
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        setToken(storedToken);
        fetchUser(storedToken);
    }, [fetchUser]);

    const login = async (newToken) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        await fetchUser(newToken);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    const authValue = { token, user, loading, login, logout, fetchUser };

    return (
        <AuthContext.Provider value={authValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
