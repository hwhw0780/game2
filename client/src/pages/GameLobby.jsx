import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../styles/GameLobby.css';

const GameLobby = () => {
    const { username } = useParams();
    const { sendMessage } = useWebSocket();
    const [gameState, setGameState] = useState({
        banker: null,
        players: [],
        currentBid: 0,
        bidCountdown: null,
        betCountdown: null,
        phase: 'WAITING' // WAITING, BIDDING, BETTING, DEALING
    });

    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        // Fetch user points when component mounts
        fetch(`/api/users/${username}/points`)
            .then(res => res.json())
            .then(data => setUserPoints(data.points));
    }, [username]);

    const handleBidBanker = () => {
        const bidAmount = prompt('Enter bid amount:');
        if (bidAmount && !isNaN(bidAmount)) {
            sendMessage('BID', {
                username,
                amount: Number(bidAmount)
            });
        }
    };

    const handlePlaceBet = () => {
        const betAmount = prompt('Enter bet amount:');
        if (betAmount && !isNaN(betAmount)) {
            sendMessage('BET', {
                username,
                amount: Number(betAmount)
            });
        }
    };

    return (
        <div className="game-lobby">
            <div className="logo">
                <img src="/assets/logo.png" alt="Red Packet Game" />
            </div>

            <div className="user-info">
                <h2>{username}</h2>
                <p>Points: {userPoints}</p>
            </div>

            <div className="game-boxes">
                <div className="banker-box">
                    <h3>Banker</h3>
                    {gameState.banker ? (
                        <div>
                            <p>Username: {gameState.banker.username}</p>
                            <p>Bid: {gameState.banker.bid}</p>
                            <p>Get: {gameState.banker.get}</p>
                        </div>
                    ) : (
                        <p>No banker yet</p>
                    )}
                </div>

                <div className="player-box">
                    <h3>Players</h3>
                    {gameState.players.map(player => (
                        <div key={player.username}>
                            <p>Username: {player.username}</p>
                            <p>Bet: {player.bet}</p>
                            <p>Get: {player.get}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="game-controls">
                <button 
                    onClick={handleBidBanker}
                    disabled={gameState.phase !== 'WAITING'}
                >
                    Bid Banker
                </button>
                <button 
                    onClick={handlePlaceBet}
                    disabled={gameState.phase !== 'BETTING'}
                >
                    Place Bet
                </button>
            </div>
        </div>
    );
};

export default GameLobby; 