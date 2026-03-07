/**
 * Pre-flop Ranges for 6-max Texas Hold'em
 * Based on standard GTO-inspired opening ranges
 */

const Ranges = {
    // Hand rankings for easy lookup
    HAND_ORDER: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
    
    // Opening ranges by position (percentage of hands)
    POSITION_RANGES: {
        'UTG': {
            percentage: 15,
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs',
                'QJs', 'QTs',
                'JTs',
                'T9s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo',
                'KQo', 'KJo'
            ]
        },
        
        'MP': {
            percentage: 18,
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs', 'K9s',
                'QJs', 'QTs', 'Q9s',
                'JTs', 'J9s',
                'T9s',
                '98s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
                'KQo', 'KJo', 'KTo',
                'QJo'
            ]
        },
        
        'CO': {
            percentage: 27,
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
                'QJs', 'QTs', 'Q9s', 'Q8s',
                'JTs', 'J9s', 'J8s',
                'T9s', 'T8s',
                '98s', '97s',
                '87s',
                '76s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
                'KQo', 'KJo', 'KTo', 'K9o',
                'QJo', 'QTo',
                'JTo'
            ]
        },
        
        'BTN': {
            percentage: 40,
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
                'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
                'JTs', 'J9s', 'J8s', 'J7s',
                'T9s', 'T8s', 'T7s',
                '98s', '97s', '96s',
                '87s', '86s',
                '76s', '75s',
                '65s',
                '54s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
                'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
                'QJo', 'QTo', 'Q9o',
                'JTo', 'J9o',
                'T9o'
            ]
        },
        
        'SB': {
            percentage: 35,
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
                'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
                'JTs', 'J9s', 'J8s',
                'T9s', 'T8s',
                '98s', '97s',
                '87s', '86s',
                '76s',
                '65s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o',
                'KQo', 'KJo', 'KTo', 'K9o',
                'QJo', 'QTo',
                'JTo'
            ]
        },
        
        'BB': {
            percentage: 40,
            // Big blind defending range vs raise (wider than opening)
            pairs: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22'],
            suited: [
                'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
                'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
                'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
                'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
                'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
                '98s', '97s', '96s', '95s', '94s', '93s', '92s',
                '87s', '86s', '85s', '84s', '83s', '82s',
                '76s', '75s', '74s', '73s', '72s',
                '65s', '64s', '63s', '62s',
                '54s', '53s', '52s',
                '43s', '42s',
                '32s'
            ],
            offsuit: [
                'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
                'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
                'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
                'JTo', 'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
                'T9o', 'T8o', 'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
                '98o', '97o', '96o', '95o', '94o', '93o', '92o',
                '87o', '86o', '85o', '84o', '83o', '82o'
            ],
            // 3-bet range from BB
            threeBet: [
                'AA', 'KK', 'QQ', 'JJ', 'TT',
                'AKs', 'AQs', 'AJs', 'ATs',
                'AKo'
            ]
        }
    },

    /**
     * Check if a hand is in the opening range for a position
     * @param {string} hand - Hand like "AKs", "72o", "AA"
     * @param {string} position - Position like "UTG", "BTN"
     * @param {string} action - Action context: "open", "call", "3bet"
     * @returns {boolean}
     */
    isHandInRange(hand, position, action = 'open') {
        const range = this.POSITION_RANGES[position];
        if (!range) return false;

        // Handle 3-bet range for BB
        if (action === '3bet' && position === 'BB' && range.threeBet) {
            return range.threeBet.includes(hand);
        }

        // Check if it's a pocket pair
        if (hand.length === 2 && hand[0] === hand[1]) {
            return range.pairs.includes(hand);
        }

        // Check suited and offsuit hands
        if (hand.endsWith('s')) {
            return range.suited.includes(hand);
        } else if (hand.endsWith('o')) {
            return range.offsuit.includes(hand);
        }

        return false;
    },

    /**
     * Generate a 13x13 range grid for display
     * @param {string} position - Position like "UTG", "BTN"
     * @param {string} playerHand - Player's actual hand to highlight
     * @returns {Array} Grid data for rendering
     */
    generateRangeGrid(position, playerHand = null) {
        const grid = [];
        const hands = this.HAND_ORDER;

        for (let row = 0; row < 13; row++) {
            for (let col = 0; col < 13; col++) {
                const card1 = hands[row];
                const card2 = hands[col];
                let hand, type;

                if (row === col) {
                    // Pocket pairs (diagonal)
                    hand = card1 + card2;
                    type = 'pair';
                } else if (row < col) {
                    // Suited hands (upper right)
                    hand = card1 + card2 + 's';
                    type = 'suited';
                } else {
                    // Offsuit hands (lower left)
                    hand = card2 + card1 + 'o';
                    type = 'offsuit';
                }

                const inRange = this.isHandInRange(hand, position);
                const isPlayerHand = playerHand && this.handsEqual(hand, playerHand);

                grid.push({
                    hand: hand,
                    type: type,
                    inRange: inRange,
                    isPlayerHand: isPlayerHand,
                    row: row,
                    col: col
                });
            }
        }

        return grid;
    },

    /**
     * Compare two hands for equality (handles different formats)
     * @param {string} hand1 
     * @param {string} hand2 
     * @returns {boolean}
     */
    handsEqual(hand1, hand2) {
        // Normalize hands for comparison
        const normalize = (h) => {
            if (h.length === 2) return h; // Pocket pairs
            if (h.includes('s') || h.includes('o')) return h;
            return h; // Just return as-is if unclear
        };

        return normalize(hand1) === normalize(hand2);
    },

    /**
     * Convert hole cards to hand notation
     * @param {Object} card1 - First card {rank, suit}
     * @param {Object} card2 - Second card {rank, suit}
     * @returns {string} Hand notation like "AKs", "72o", "AA"
     */
    cardsToHand(card1, card2) {
        if (!card1 || !card2) return null;

        const rank1 = card1.rank;
        const rank2 = card2.rank;
        const suit1 = card1.suit;
        const suit2 = card2.suit;

        // Pocket pairs
        if (rank1 === rank2) {
            return rank1 + rank2;
        }

        // Order by rank (higher rank first)
        const order = this.HAND_ORDER;
        const idx1 = order.indexOf(rank1);
        const idx2 = order.indexOf(rank2);

        let highRank = idx1 < idx2 ? rank1 : rank2;
        let lowRank = idx1 < idx2 ? rank2 : rank1;

        // Add suited/offsuit
        const suited = suit1 === suit2;
        return highRank + lowRank + (suited ? 's' : 'o');
    },

    /**
     * Get recommended action for a hand in a position
     * @param {string} hand - Hand notation
     * @param {string} position - Player position
     * @param {string} context - Game context: "open", "facing_raise", "facing_3bet"
     * @returns {Object} { action: "fold/call/raise", reasoning: "explanation" }
     */
    getRecommendedAction(hand, position, context = 'open') {
        const inRange = this.isHandInRange(hand, position, context);

        if (context === 'open') {
            if (inRange) {
                return {
                    action: 'raise',
                    reasoning: `${hand} is in the optimal opening range for ${position}. You should raise.`
                };
            } else {
                return {
                    action: 'fold',
                    reasoning: `${hand} is too weak to open from ${position}. You should fold.`
                };
            }
        }

        // For other contexts, provide basic recommendations
        if (context === 'facing_raise') {
            if (this.isHandInRange(hand, position, '3bet')) {
                return {
                    action: '3bet',
                    reasoning: `${hand} is strong enough to 3-bet from ${position}.`
                };
            } else if (this.isHandInRange(hand, position, 'call')) {
                return {
                    action: 'call',
                    reasoning: `${hand} is good enough to call from ${position}.`
                };
            } else {
                return {
                    action: 'fold',
                    reasoning: `${hand} is too weak to continue against a raise from ${position}.`
                };
            }
        }

        return {
            action: 'fold',
            reasoning: 'Unable to determine optimal action.'
        };
    }
};