const Game = require('../models/Game');
const User = require('../models/User');

// Store active games and their WebSocket connections
const activeGames = new Map();

const gameController = {
    // Start a new game session
    startGame: async (ws) => {
        const game = new Game({
            status: 'WAITING',
            startTime: new Date()
        });
        await game.save();
        
        activeGames.set(game._id.toString(), {
            game,
            connections: new Set([ws])
        });
        
        return game;
    },

    // Handle banker bid
    handleBid: async (ws, data) => {
        const { username, amount } = data;
        const game = await Game.findOne({ status: 'WAITING' });
        
        if (!game) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'No active game found' }));
        }

        // Verify user has enough points
        const user = await User.findOne({ username });
        if (user.points < amount) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Insufficient points' }));
        }

        game.banker = { username, bid: amount };
        game.status = 'BIDDING';
        await game.save();

        // Broadcast update to all connected clients
        broadcastGameState(game);
    },

    // Handle player bet
    handleBet: async (ws, data) => {
        const { username, amount } = data;
        const game = await Game.findOne({ status: 'BETTING' });
        
        if (!game) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'No active betting phase' }));
        }

        // Verify user has enough points
        const user = await User.findOne({ username });
        if (user.points < amount) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Insufficient points' }));
        }

        game.players.push({ username, bet: amount });
        await game.save();

        // Broadcast update to all connected clients
        broadcastGameState(game);
    },

    // Handle packet distribution
    distributePackets: async (gameId) => {
        const game = await Game.findById(gameId);
        if (!game || game.status !== 'DEALING') return;

        // Generate random packet values
        const bankerValue = Math.random() * 2; // Random value between 0 and 2
        game.banker.packetValue = bankerValue;

        game.players.forEach(player => {
            player.packetValue = Math.random() * 2;
        });

        // Determine results
        game.result = {
            bankerWin: game.players.every(player => player.packetValue < bankerValue),
            winningValue: bankerValue
        };

        game.status = 'COMPLETED';
        game.endTime = new Date();
        await game.save();

        // Update user points
        await updateUserPoints(game);

        // Broadcast final results
        broadcastGameState(game);
    }
};

// Helper function to broadcast game state to all connected clients
const broadcastGameState = (game) => {
    const gameConnections = activeGames.get(game._id.toString());
    if (gameConnections) {
        const message = JSON.stringify({
            type: 'GAME_UPDATE',
            game
        });
        gameConnections.connections.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }
};

// Helper function to update user points after game completion
const updateUserPoints = async (game) => {
    const bankerUser = await User.findOne({ username: game.banker.username });
    const bankerWin = game.result.bankerWin;

    if (bankerWin) {
        // Banker wins
        bankerUser.points += game.players.reduce((sum, player) => sum + player.bet, 0);
        await bankerUser.save();

        // Players lose their bets
        for (const player of game.players) {
            const playerUser = await User.findOne({ username: player.username });
            playerUser.points -= player.bet;
            await playerUser.save();
        }
    } else {
        // Banker loses
        bankerUser.points -= game.banker.bid;
        await bankerUser.save();

        // Players win proportionally
        for (const player of game.players) {
            const playerUser = await User.findOne({ username: player.username });
            const winnings = (player.bet / game.banker.bid) * game.banker.bid;
            playerUser.points += winnings;
            await playerUser.save();
        }
    }
};

module.exports = gameController; 