const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    banker: {
        username: String,
        bid: Number,
        packetValue: Number
    },
    players: [{
        username: String,
        bet: Number,
        packetValue: Number
    }],
    status: {
        type: String,
        enum: ['WAITING', 'BIDDING', 'BETTING', 'DEALING', 'COMPLETED'],
        default: 'WAITING'
    },
    startTime: Date,
    endTime: Date,
    result: {
        bankerWin: Boolean,
        winningValue: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Game', gameSchema); 