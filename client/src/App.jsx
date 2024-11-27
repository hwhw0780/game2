import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameLobby from './pages/GameLobby';
import AdminDashboard from './pages/AdminDashboard';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
    return (
        <WebSocketProvider>
            <Router>
                <Routes>
                    <Route path="/:username" element={<GameLobby />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </WebSocketProvider>
    );
}

export default App; 