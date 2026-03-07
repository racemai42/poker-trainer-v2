/**
 * Coaching System for Poker Trainer V2
 * Adapted from v0 to work with JS_CSS_Poker game engine
 * Provides real-time feedback on pre-flop and post-flop decisions
 */

const Coach = {
    isEnabled: true,
    currentAdvice: null,
    
    /**
     * Initialize the coaching system
     */
    initialize() {
        this.attachEventListeners();
        this.createRangeGrid();
        this.hideCoachPanel();
        this.hookIntoGameEngine();
    },

    /**
     * Hook into JS_CSS_Poker game engine
     */
    hookIntoGameEngine() {
        // Save original functions
        this._origHumanCall = window.human_call;
        this._origHumanFold = window.human_fold;
        this._origHandleHumanBet = window.handle_human_bet;

        // Override human action functions
        const self = this;

        window.human_call = function() {
            if (self._origHumanCall) {
                self._origHumanCall.call(this);
            }
            self.trackPlayerAction('call');
        };

        window.human_fold = function() {
            if (self._origHumanFold) {
                self._origHumanFold.call(this);
            }
            self.trackPlayerAction('fold');
        };

        window.handle_human_bet = function(amount) {
            if (self._origHandleHumanBet) {
                self._origHandleHumanBet.call(this, amount);
            }
            self.trackPlayerAction('raise', amount);
        };
    },

    /**
     * Track player actions and evaluate them
     */
    trackPlayerAction(action, betAmount = 0) {
        // Small delay to let the game state update
        setTimeout(() => {
            this.evaluatePlayerAction(action, betAmount);
        }, 100);
    },

    /**
     * Evaluate the player's action
     */
    evaluatePlayerAction(action, betAmount) {
        if (!this.isEnabled || !players || !players[0]) return;

        const isPreflop = this.getCurrentStreet() === 'preflop';
        
        if (isPreflop) {
            this.evaluatePreflopAction(action, betAmount);
        } else {
            this.evaluatePostflopAction(action, betAmount);
        }
    },

    /**
     * Evaluate pre-flop action
     */
    evaluatePreflopAction(action, betAmount) {
        const position = this.getPlayerPosition();
        const playerHand = this.getPlayerHandNotation();
        
        if (!playerHand) return;

        const recommendation = Ranges.getRecommendedAction(playerHand, position, 'open');
        const isCorrect = this.actionsMatch(action, recommendation.action);
        
        // Create advice object
        const advice = {
            phase: 'preflop',
            hand: playerHand,
            position: position,
            action: action,
            recommended: recommendation.action,
            isCorrect: isCorrect,
            reasoning: recommendation.reasoning,
            context: 'open',
            timestamp: Date.now()
        };

        this.currentAdvice = advice;
        
        // Track in stats
        Stats.recordDecision(position, isCorrect, 'preflop');
        
        // Show feedback
        this.displayPreFlopFeedback(advice);
        this.updateRangeGrid(playerHand, position);
        
        // Auto-show panel if decision was incorrect
        if (!isCorrect) {
            setTimeout(() => this.showCoachPanel(), 500);
        }
    },

    /**
     * Evaluate post-flop action
     */
    evaluatePostflopAction(action, betAmount) {
        const holeCards = this.getPlayerHoleCards();
        const communityCards = this.getCommunityCards();
        
        if (!holeCards || !communityCards) return;

        const handStrength = this.evaluateHandStrength(holeCards, communityCards);
        const boardTexture = this.analyzeBoardTexture(communityCards);
        const recommendation = this.getPostFlopRecommendation(handStrength, boardTexture, 0, betAmount);
        
        const isCorrect = this.evaluatePostFlopCorrectness(action, recommendation, handStrength);
        
        // Create advice object
        const advice = {
            phase: 'postflop',
            handStrength: handStrength,
            boardTexture: boardTexture,
            action: action,
            recommended: recommendation.action,
            isCorrect: isCorrect,
            reasoning: recommendation.reasoning,
            betSize: betAmount,
            pot: 0, // TODO: calculate pot
            timestamp: Date.now()
        };

        this.currentAdvice = advice;
        
        // Track in stats
        Stats.recordDecision('POSTFLOP', isCorrect, 'postflop');
        
        // Show feedback
        this.displayPostFlopFeedback(advice);
        
        // Auto-show panel for significant mistakes
        if (!isCorrect && handStrength.category >= 2) {
            setTimeout(() => this.showCoachPanel(), 500);
        }
    },

    /**
     * Get current street (preflop, flop, turn, river)
     */
    getCurrentStreet() {
        if (!board || !board[0]) return 'preflop';
        if (!board[3]) return 'flop';
        if (!board[4]) return 'turn';
        return 'river';
    },

    /**
     * Get player position relative to button
     */
    getPlayerPosition() {
        if (!players || typeof button_index === 'undefined') return 'UTG';
        
        const humanIndex = 0; // Human player is always at index 0
        const activePlayers = [];
        
        // Build ordered list of active seat indices, starting from button going clockwise
        for (let i = 0; i < players.length; i++) {
            const seatIdx = (button_index + i) % players.length;
            if (players[seatIdx].status !== 'BUST') {
                activePlayers.push(seatIdx);
            }
        }
        
        const numPlayers = activePlayers.length;
        const relativePosition = activePlayers.indexOf(humanIndex);
        
        if (numPlayers === 6) {
            switch (relativePosition) {
                case 0: return 'BTN';
                case 1: return 'SB'; 
                case 2: return 'BB';
                case 3: return 'UTG';
                case 4: return 'MP';
                case 5: return 'CO';
                default: return 'UTG';
            }
        } else if (numPlayers === 5) {
            switch (relativePosition) {
                case 0: return 'BTN';
                case 1: return 'SB';
                case 2: return 'BB'; 
                case 3: return 'UTG';
                case 4: return 'CO';
                default: return 'UTG';
            }
        } else if (numPlayers <= 3) {
            switch (relativePosition) {
                case 0: return 'BTN';
                case 1: return 'SB';
                case 2: return 'BB';
                default: return 'BTN';
            }
        }
        
        return 'UTG'; // Default fallback
    },

    /**
     * Convert JS_CSS_Poker card format to readable format
     */
    convertCard(cardStr) {
        if (!cardStr) return null;
        
        const suit = cardStr.charAt(0); // 'h', 'd', 'c', 's'
        const rank = parseInt(cardStr.substring(1)); // 2-14
        
        const ranks = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits = { 'h': 'h', 'd': 'd', 'c': 'c', 's': 's' };
        
        return {
            rank: ranks[rank],
            suit: suits[suit]
        };
    },

    /**
     * Get player hand in readable notation (AKs, 72o, etc.)
     */
    getPlayerHandNotation() {
        if (!players || !players[0] || !players[0].carda || !players[0].cardb) return null;
        
        const card1 = this.convertCard(players[0].carda);
        const card2 = this.convertCard(players[0].cardb);
        
        if (!card1 || !card2) return null;
        
        return Ranges.cardsToHand(card1, card2);
    },

    /**
     * Get player hole cards as objects
     */
    getPlayerHoleCards() {
        if (!players || !players[0] || !players[0].carda || !players[0].cardb) return null;
        
        return [
            this.convertCard(players[0].carda),
            this.convertCard(players[0].cardb)
        ];
    },

    /**
     * Get community cards as objects
     */
    getCommunityCards() {
        if (!board) return [];
        
        const communityCards = [];
        for (let i = 0; i < 5 && board[i]; i++) {
            const card = this.convertCard(board[i]);
            if (card) communityCards.push(card);
        }
        
        return communityCards;
    },

    /**
     * Attach event listeners for coach panel
     */
    attachEventListeners() {
        // Toggle coach panel
        document.getElementById('toggle-coach-btn')?.addEventListener('click', () => {
            this.toggleCoachPanel();
        });

        // Close coach panel
        document.getElementById('close-coach')?.addEventListener('click', () => {
            this.hideCoachPanel();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('coach-panel');
            const toggleBtn = document.getElementById('toggle-coach-btn');
            
            if (panel && !panel.contains(e.target) && e.target !== toggleBtn) {
                if (panel.classList.contains('open')) {
                    this.hideCoachPanel();
                }
            }
        });
    },

    /**
     * Toggle coach panel visibility
     */
    toggleCoachPanel() {
        const panel = document.getElementById('coach-panel');
        if (panel) {
            panel.classList.toggle('open');
            if (panel.classList.contains('open')) {
                this.updateCoachDisplay();
            }
        }
    },

    /**
     * Show coach panel
     */
    showCoachPanel() {
        const panel = document.getElementById('coach-panel');
        if (panel) {
            panel.classList.add('open');
            this.updateCoachDisplay();
        }
    },

    /**
     * Hide coach panel
     */
    hideCoachPanel() {
        const panel = document.getElementById('coach-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    },

    /**
     * Check if two actions match (with some flexibility)
     */
    actionsMatch(playerAction, recommendedAction) {
        // Normalize actions
        const normalize = (action) => {
            if (action === 'check' || action === 'call') return 'passive';
            if (action === 'raise' || action === 'bet' || action === '3bet') return 'aggressive';
            return action;
        };

        return normalize(playerAction) === normalize(recommendedAction);
    },

    /**
     * Create the range grid display
     */
    createRangeGrid() {
        const gridContainer = document.getElementById('range-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        
        const hands = Ranges.HAND_ORDER;
        
        for (let row = 0; row < 13; row++) {
            for (let col = 0; col < 13; col++) {
                const cell = document.createElement('div');
                cell.className = 'range-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const card1 = hands[row];
                const card2 = hands[col];
                
                if (row === col) {
                    // Pocket pairs (diagonal)
                    cell.textContent = card1 + card2;
                    cell.classList.add('pair');
                } else if (row < col) {
                    // Suited hands (upper right)
                    cell.textContent = card1 + card2 + 's';
                    cell.classList.add('suited');
                } else {
                    // Offsuit hands (lower left)
                    cell.textContent = card2 + card1 + 'o';
                    cell.classList.add('offsuit');
                }
                
                gridContainer.appendChild(cell);
            }
        }
    },

    /**
     * Update range grid to show optimal range and highlight player's hand
     */
    updateRangeGrid(playerHand, position) {
        const gridContainer = document.getElementById('range-grid');
        if (!gridContainer) return;

        const cells = gridContainer.querySelectorAll('.range-cell');
        
        cells.forEach(cell => {
            const cellHand = cell.textContent;
            const inRange = Ranges.isHandInRange(cellHand, position);
            const isPlayerHand = cellHand === playerHand;
            
            // Reset classes
            cell.classList.remove('not-in-range', 'player-hand');
            
            // Add appropriate classes
            if (isPlayerHand) {
                cell.classList.add('player-hand');
                // Add a small delay to ensure the styling is noticeable
                setTimeout(() => {
                    cell.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'center' 
                    });
                }, 100);
            }
            
            if (!inRange) {
                cell.classList.add('not-in-range');
            }
        });
    },

    /**
     * Display pre-flop feedback
     */
    displayPreFlopFeedback(advice) {
        const feedbackEl = document.getElementById('preflop-feedback');
        if (!feedbackEl) return;

        const status = advice.isCorrect ? 'Correct!' : 'Mistake!';
        const statusClass = advice.isCorrect ? 'correct' : 'incorrect';
        
        feedbackEl.innerHTML = `
            <div class="feedback-header ${statusClass}">
                <span class="feedback-icon">${advice.isCorrect ? '✅' : '❌'}</span>
                <span class="feedback-status">${status}</span>
            </div>
            <div class="feedback-details">
                <p><strong>Your Hand:</strong> ${advice.hand}</p>
                <p><strong>Position:</strong> ${advice.position}</p>
                <p><strong>Your Action:</strong> ${advice.action}</p>
                <p><strong>Recommended:</strong> ${advice.recommended}</p>
            </div>
            <div class="feedback-reasoning">
                <p>${advice.reasoning}</p>
            </div>
        `;
    },

    /**
     * Display post-flop feedback
     */
    displayPostFlopFeedback(advice) {
        const feedbackEl = document.getElementById('postflop-feedback');
        if (!feedbackEl) return;

        const status = advice.isCorrect ? 'Good play!' : 'Consider this...';
        const statusClass = advice.isCorrect ? 'correct' : 'suggestion';
        
        feedbackEl.innerHTML = `
            <div class="feedback-header ${statusClass}">
                <span class="feedback-icon">${advice.isCorrect ? '✅' : '💡'}</span>
                <span class="feedback-status">${status}</span>
            </div>
            <div class="feedback-details">
                <p><strong>Hand Strength:</strong> ${this.getHandStrengthDescription(advice.handStrength)}</p>
                <p><strong>Board:</strong> ${this.getBoardDescription(advice.boardTexture)}</p>
                <p><strong>Your Action:</strong> ${advice.action}</p>
                ${advice.betSize ? `<p><strong>Bet Size:</strong> $${advice.betSize}</p>` : ''}
            </div>
            <div class="feedback-reasoning">
                <p>${advice.reasoning}</p>
            </div>
        `;
    },

    /**
     * Update the entire coach display
     */
    updateCoachDisplay() {
        if (this.currentAdvice) {
            if (this.currentAdvice.phase === 'preflop') {
                this.displayPreFlopFeedback(this.currentAdvice);
                this.updateRangeGrid(this.currentAdvice.hand, this.currentAdvice.position);
            } else {
                this.displayPostFlopFeedback(this.currentAdvice);
            }
        }
    },

    /**
     * Evaluate hand strength for post-flop analysis
     */
    evaluateHandStrength(holeCards, communityCards) {
        if (!holeCards || !communityCards) {
            return { category: 0, strength: 0, draws: 0, description: 'No cards' };
        }

        // Simplified hand evaluation
        const allCards = [...holeCards, ...communityCards];
        
        // Basic hand strength evaluation (simplified)
        let category = 1; // Default to high card
        let description = 'High Card';
        
        // Check for pairs, straights, flushes, etc.
        // This is a simplified version - in a real implementation,
        // you'd use the existing hand evaluation functions from the game
        
        return {
            category: category,
            strength: category / 10, // Normalize to 0-1
            draws: this.countDraws(holeCards, communityCards),
            description: description
        };
    },

    /**
     * Count potential draws (simplified)
     */
    countDraws(holeCards, communityCards) {
        // Simplified draw counting
        return 0;
    },

    /**
     * Analyze board texture
     */
    analyzeBoardTexture(communityCards) {
        if (!communityCards || communityCards.length === 0) {
            return { wetness: 0, description: 'No flop yet' };
        }

        let wetness = 0;
        let description = 'Dry board';
        
        // Basic board texture analysis
        // In a real implementation, you'd do more sophisticated analysis
        
        return {
            wetness: wetness,
            description: description
        };
    },

    /**
     * Get post-flop recommendation
     */
    getPostFlopRecommendation(handStrength, boardTexture, pot, betSize) {
        // Simplified post-flop recommendations
        return {
            action: 'check',
            reasoning: 'Post-flop analysis is simplified in this version.'
        };
    },

    /**
     * Evaluate if post-flop action was correct
     */
    evaluatePostFlopCorrectness(playerAction, recommendation, handStrength) {
        // Simplified correctness evaluation - being generous for now
        return true;
    },

    /**
     * Get hand strength description
     */
    getHandStrengthDescription(handStrength) {
        return handStrength.description || 'Unknown';
    },

    /**
     * Get board description
     */
    getBoardDescription(boardTexture) {
        return boardTexture.description || 'Unknown board';
    },

    /**
     * Enable/disable coaching
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        const toggleBtn = document.getElementById('toggle-coach-btn');
        if (toggleBtn) {
            toggleBtn.textContent = enabled ? '🎓 Coach' : '🎓 Coach: Off';
            toggleBtn.style.opacity = enabled ? '1' : '0.6';
        }
    },

    /**
     * Clear current advice
     */
    clearAdvice() {
        this.currentAdvice = null;
        
        // Clear feedback displays
        const preflopEl = document.getElementById('preflop-feedback');
        const postflopEl = document.getElementById('postflop-feedback');
        
        if (preflopEl) preflopEl.innerHTML = '<p>Play a hand to see pre-flop analysis...</p>';
        if (postflopEl) postflopEl.innerHTML = '<p>Post-flop analysis will appear here...</p>';
        
        // Clear range grid highlights
        const cells = document.querySelectorAll('.range-cell');
        cells.forEach(cell => {
            cell.classList.remove('player-hand', 'not-in-range');
        });
    }
};