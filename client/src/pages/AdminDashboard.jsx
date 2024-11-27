import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [games, setGames] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchGames();
    }, []);

    const fetchUsers = async () => {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
    };

    const fetchGames = async () => {
        const response = await fetch('/api/games');
        const data = await response.json();
        setGames(data);
    };

    const handlePointsAdjustment = async (userId, amount) => {
        try {
            const response = await fetch(`/api/users/${userId}/points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adjustment: amount }),
            });

            if (response.ok) {
                fetchUsers(); // Refresh user list
            }
        } catch (error) {
            console.error('Error adjusting points:', error);
        }
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            <div className="dashboard-grid">
                <div className="users-section">
                    <h2>Users</h2>
                    <div className="user-list">
                        {users.map(user => (
                            <div key={user._id} className="user-item">
                                <div className="user-info">
                                    <span>{user.username}</span>
                                    <span>Points: {user.points}</span>
                                </div>
                                <div className="user-actions">
                                    <button onClick={() => handlePointsAdjustment(user._id, 100)}>
                                        +100
                                    </button>
                                    <button onClick={() => handlePointsAdjustment(user._id, -100)}>
                                        -100
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="games-section">
                    <h2>Recent Games</h2>
                    <div className="game-list">
                        {games.map(game => (
                            <div key={game._id} className="game-item">
                                <div>Banker: {game.banker?.username}</div>
                                <div>Status: {game.status}</div>
                                <div>Players: {game.players.length}</div>
                                <div>
                                    Result: {game.result?.bankerWin ? 'Banker Won' : 'Players Won'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 