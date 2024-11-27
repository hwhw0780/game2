class RedPacketDistributor {
    static generatePacketValue() {
        // Generate a random value between 0.1 and 2.0
        const baseValue = Math.random() * 1.9 + 0.1;
        // Round to 2 decimal places
        return Math.round(baseValue * 100) / 100;
    }

    static async distributePackets(game) {
        // Generate banker's packet
        const bankerPacket = this.generatePacketValue();
        game.banker.packetValue = bankerPacket;

        // Generate packets for all players
        game.players.forEach(player => {
            player.packetValue = this.generatePacketValue();
        });

        // Determine winners and calculate payouts
        const bankerWins = game.players.every(player => player.packetValue < bankerPacket);
        
        game.result = {
            bankerWin: bankerWins,
            winningValue: bankerPacket,
            playerValues: game.players.map(p => ({
                username: p.username,
                value: p.packetValue
            }))
        };

        return game;
    }

    static calculatePayout(game) {
        const payouts = new Map();
        const { banker, players, result } = game;

        if (result.bankerWin) {
            // Banker wins - collects all bets
            const totalWinnings = players.reduce((sum, player) => sum + player.bet, 0);
            payouts.set(banker.username, totalWinnings);
            
            // Players lose their bets
            players.forEach(player => {
                payouts.set(player.username, -player.bet);
            });
        } else {
            // Banker loses - pays out proportionally
            const totalBets = players.reduce((sum, player) => sum + player.bet, 0);
            
            players.forEach(player => {
                const winningRatio = player.bet / totalBets;
                const payout = winningRatio * banker.bid;
                payouts.set(player.username, payout);
            });
            
            payouts.set(banker.username, -banker.bid);
        }

        return payouts;
    }
}

module.exports = RedPacketDistributor; 