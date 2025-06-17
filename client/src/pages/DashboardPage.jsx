    import React, { useState, useEffect } from 'react';
    import { useAuth } from '../context/AuthContext';
    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
    import './DashboardPage.css';

    const API_URL = 'http://localhost:3001/api';

    // Composant pour une carte de statistique
    const StatCard = ({ title, value }) => (
        <div className="stat-card">
            <h3 className="stat-title">{title}</h3>
            <p className="stat-value">{value}</p>
        </div>
    );

    function DashboardPage() {
        const [stats, setStats] = useState(null);
        const [loading, setLoading] = useState(true);
        const { token } = useAuth();

        useEffect(() => {
            const fetchStats = async () => {
                if (!token) return;
                try {
                    setLoading(true);
                    const response = await fetch(`${API_URL}/stats/dashboard`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    const data = await response.json();

                    // Préparer les données pour le graphique
                    const last7Days = [...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return d.toISOString().slice(0, 10);
                    }).reverse();

                    const chartData = last7Days.map(date => {
                        const found = data.weeklyCompletions.find(d => d.date === date);
                        return {
                            name: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
                            completions: found ? found.completions : 0,
                        };
                    });

                    setStats({ ...data, chartData });
                    setLoading(false);
                } catch (error) {
                    console.error("Erreur lors de la récupération des stats:", error);
                    setLoading(false);
                }
            };

            fetchStats();
        }, [token]);

        if (loading) {
            return <p>Chargement du dashboard...</p>;
        }

        if (!stats) {
            return <p>Impossible de charger les données du dashboard.</p>;
        }

        return (
            <div className="dashboard-container">
                <h2>Mon Dashboard</h2>
                <div className="stats-grid">
                    <StatCard title="Habitudes Actives" value={stats.totalHabits} />
                    <StatCard title="Meilleure Série" value={`${stats.bestStreak} jours 🔥`} />
                    <StatCard title="Total des Complétions" value={stats.totalCompletions} />
                </div>
                <div className="chart-container">
                    <h3>Activité des 7 derniers jours</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={stats.chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="completions" fill="#1877f2" name="Habitudes complétées" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    export default DashboardPage;
    