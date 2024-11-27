require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const path = require('path');
const WebSocketHandler = require('./websocket/wsHandler');
const { authenticateRequest } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(wss);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use('/api', authenticateRequest);
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/games', require('./routes/games'));

// Catch-all route for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 