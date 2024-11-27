const gameController = require('../controllers/gameController');
const { verifyToken } = require('../middleware/auth');

class WebSocketHandler {
    constructor(wss) {
        this.wss = wss;
        this.activeGames = new Map();
        this.setupWSS();
    }

    setupWSS() {
        this.wss.on('connection', async (ws, req) => {
            try {
                // Extract token from query string
                const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
                const user = await verifyToken(token);
                ws.user = user;

                console.log(`User ${user.username} connected`);
                this.handleConnection(ws);
            } catch (error) {
                ws.close(4001, 'Unauthorized');
            }
        });
    }

    handleConnection(ws) {
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await this.handleMessage(ws, data);
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
            }
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });
    }

    async handleMessage(ws, data) {
        switch (data.type) {
            case 'JOIN_GAME':
                await this.handleJoinGame(ws, data);
                break;
            case 'BID':
                await gameController.handleBid(ws, data);
                break;
            case 'BET':
                await gameController.handleBet(ws, data);
                break;
            case 'DEAL_NOW':
                await this.handleDealNow(ws, data);
                break;
            case 'OPEN_PACKET':
                await this.handleOpenPacket(ws, data);
                break;
            default:
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Unknown message type' }));
        }
    }

    async handleJoinGame(ws, data) {
        const { gameId } = data;
        const gameSession = this.activeGames.get(gameId) || {
            connections: new Set(),
            game: await gameController.startGame(ws)
        };
        
        gameSession.connections.add(ws);
        ws.gameId = gameId;
        this.activeGames.set(gameId, gameSession);
        
        this.broadcastGameState(gameId);
    }

    async handleDealNow(ws, data) {
        const { gameId } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession || ws.user.username !== gameSession.game.banker.username) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized' }));
        }

        await gameController.distributePackets(gameId);
    }

    handleDisconnection(ws) {
        if (ws.gameId) {
            const gameSession = this.activeGames.get(ws.gameId);
            if (gameSession) {
                gameSession.connections.delete(ws);
                if (gameSession.connections.size === 0) {
                    this.activeGames.delete(ws.gameId);
                }
            }
        }
    }

    broadcastGameState(gameId) {
        const gameSession = this.activeGames.get(gameId);
        if (gameSession) {
            const message = JSON.stringify({
                type: 'GAME_UPDATE',
                game: gameSession.game
            });
            
            gameSession.connections.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(message);
                }
            });
        }
    }
}

module.exports = WebSocketHandler; 