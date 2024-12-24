class AiPlayer {
    constructor(username = 'AI', initialChips = 100) {
        this.username = username;
        this.chips = initialChips;
    }

    makeMove(hand, gameState) {
        console.log(`${this.username} is making a move...`);
        return this.calculateMove(hand, gameState);
    }

    calculateMove(hand, gameState) {
        // Implement AI decision logic based on the current hand and game state
        const { discardPile, playerSpreads } = gameState;

        if (this.shouldDrop(hand, gameState)) {
            return { action: 'drop' };
        }

        const validHit = this.findValidHit(hand, playerSpreads);
        if (validHit) {
            return { action: 'hit', ...validHit };
        }

        return {
            action: discardPile.length > 0 && Math.random() > 0.5 ? 'draw_discard' : 'draw_deck'
        };
    }

    shouldDrop(hand, gameState) {
        const points = this.calculatePoints(hand);
        return points <= 5; // AI drops if points are 5 or less
    }

    findValidHit(hand, playerSpreads) {
        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            for (let j = 0; j < playerSpreads.length; j++) {
                for (let k = 0; k < playerSpreads[j].length; k++) {
                    if (this.isValidHit(card, playerSpreads[j][k])) {
                        return { card, targetPlayerIndex: j, targetSpreadIndex: k };
                    }
                }
            }
        }
        return null;
    }

    isValidHit(card, spread) {
        if (spread.length === 0) return false;

        const spreadRank = spread[0].rank;
        const spreadSuit = spread[0].suit;

        const isSet = spread.every(c => c.rank === spreadRank);
        if (isSet && card.rank === spreadRank) {
            return true;
        }

        const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
        const cardRankIndex = ranks.indexOf(card.rank);
        const spreadRankIndices = spread.map(c => ranks.indexOf(c.rank));
        const isRun = spread.every(c => c.suit === spreadSuit);

        if (isRun) {
            const minRankIndex = Math.min(...spreadRankIndices);
            const maxRankIndex = Math.max(...spreadRankIndices);

            if (card.suit === spreadSuit && (cardRankIndex === minRankIndex - 1 || cardRankIndex === maxRankIndex + 1)) {
                return true;
            }
        }

        return false;
    }

    calculatePoints(hand) {
        const pointValues = { 'ace': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10 };
        return hand.reduce((sum, card) => sum + pointValues[card.rank], 0);
    }

    updateChips(amount) {
        this.chips += amount;
    }
}

export default AiPlayer;
