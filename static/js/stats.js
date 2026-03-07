/**
 * Statistics Tracking System for Poker Trainer
 * Tracks and displays player decision accuracy by position
 */

const Stats = {
    data: {
        positions: {
            'UTG': { correct: 0, total: 0 },
            'MP': { correct: 0, total: 0 },
            'CO': { correct: 0, total: 0 },
            'BTN': { correct: 0, total: 0 },
            'SB': { correct: 0, total: 0 },
            'BB': { correct: 0, total: 0 },
            'POSTFLOP': { correct: 0, total: 0 }
        },
        session: {
            handsPlayed: 0,
            correctDecisions: 0,
            totalDecisions: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastDecisionCorrect: false
        },
        lifetime: {
            handsPlayed: 0,
            correctDecisions: 0,
            totalDecisions: 0,
            bestStreak: 0,
            gamesPlayed: 0
        }
    },

    /**
     * Initialize the stats system
     */
    initialize() {
        this.loadStats();
        this.attachEventListeners();
        this.updateStatsDisplay();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Show stats panel
        document.getElementById('stats-btn')?.addEventListener('click', () => {
            this.showStatsPanel();
        });

        // Close stats panel
        document.getElementById('close-stats')?.addEventListener('click', () => {
            this.hideStatsPanel();
        });

        // Reset stats
        document.getElementById('reset-stats-btn')?.addEventListener('click', () => {
            this.showResetConfirmation();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('stats-panel');
            const statsBtn = document.getElementById('stats-btn');
            
            if (panel && !panel.contains(e.target) && e.target !== statsBtn) {
                if (panel.classList.contains('open')) {
                    this.hideStatsPanel();
                }
            }
        });
    },

    /**
     * Record a decision for statistics
     * @param {string} position - Player position or 'POSTFLOP'
     * @param {boolean} isCorrect - Whether the decision was correct
     * @param {string} phase - 'preflop' or 'postflop'
     */
    recordDecision(position, isCorrect, phase = 'preflop') {
        // Update position stats
        if (this.data.positions[position]) {
            this.data.positions[position].total++;
            if (isCorrect) {
                this.data.positions[position].correct++;
            }
        }

        // Update session stats
        this.data.session.totalDecisions++;
        if (isCorrect) {
            this.data.session.correctDecisions++;
        }

        // Update streak
        if (isCorrect) {
            if (this.data.session.lastDecisionCorrect) {
                this.data.session.currentStreak++;
            } else {
                this.data.session.currentStreak = 1;
            }
            
            if (this.data.session.currentStreak > this.data.session.bestStreak) {
                this.data.session.bestStreak = this.data.session.currentStreak;
            }
            
            if (this.data.session.currentStreak > this.data.lifetime.bestStreak) {
                this.data.lifetime.bestStreak = this.data.session.currentStreak;
            }
        } else {
            this.data.session.currentStreak = 0;
        }

        this.data.session.lastDecisionCorrect = isCorrect;

        // Update lifetime stats
        this.data.lifetime.totalDecisions++;
        if (isCorrect) {
            this.data.lifetime.correctDecisions++;
        }

        this.saveStats();
        this.updateStatsDisplay();

        // Show brief feedback
        this.showDecisionFeedback(isCorrect, position, phase);
    },

    /**
     * Record that a hand was played
     */
    recordHandPlayed() {
        this.data.session.handsPlayed++;
        this.data.lifetime.handsPlayed++;
        this.saveStats();
        this.updateStatsDisplay();
    },

    /**
     * Record that a new game started
     */
    recordGameStarted() {
        this.data.lifetime.gamesPlayed++;
        
        // Reset session stats
        this.data.session = {
            handsPlayed: 0,
            correctDecisions: 0,
            totalDecisions: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastDecisionCorrect: false
        };
        
        this.saveStats();
        this.updateStatsDisplay();
    },

    /**
     * Calculate accuracy percentage
     * @param {number} correct - Number of correct decisions
     * @param {number} total - Total number of decisions
     * @returns {number} Percentage (0-100)
     */
    calculateAccuracy(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },

    /**
     * Get overall accuracy across all positions
     * @returns {number} Overall accuracy percentage
     */
    getOverallAccuracy() {
        return this.calculateAccuracy(
            this.data.session.correctDecisions,
            this.data.session.totalDecisions
        );
    },

    /**
     * Get lifetime accuracy
     * @returns {number} Lifetime accuracy percentage
     */
    getLifetimeAccuracy() {
        return this.calculateAccuracy(
            this.data.lifetime.correctDecisions,
            this.data.lifetime.totalDecisions
        );
    },

    /**
     * Get position accuracy
     * @param {string} position - Position name
     * @returns {Object} {accuracy: number, correct: number, total: number}
     */
    getPositionAccuracy(position) {
        const posData = this.data.positions[position];
        if (!posData) return { accuracy: 0, correct: 0, total: 0 };
        
        return {
            accuracy: this.calculateAccuracy(posData.correct, posData.total),
            correct: posData.correct,
            total: posData.total
        };
    },

    /**
     * Update the stats display
     */
    updateStatsDisplay() {
        this.updateOverallStats();
        this.updatePositionStats();
    },

    /**
     * Update overall stats display
     */
    updateOverallStats() {
        // Overall accuracy
        const overallEl = document.getElementById('overall-accuracy');
        if (overallEl) {
            const accuracy = this.getOverallAccuracy();
            overallEl.textContent = `${accuracy}%`;
            overallEl.className = `stat-value ${this.getAccuracyClass(accuracy)}`;
        }

        // Hands played
        const handsEl = document.getElementById('hands-played');
        if (handsEl) {
            handsEl.textContent = this.data.session.handsPlayed.toLocaleString();
        }

        // Add session stats
        this.updateSessionStats();
    },

    /**
     * Update session-specific stats
     */
    updateSessionStats() {
        // Find or create session stats container
        let sessionContainer = document.getElementById('session-stats');
        if (!sessionContainer) {
            sessionContainer = document.createElement('div');
            sessionContainer.id = 'session-stats';
            sessionContainer.className = 'session-stats';
            sessionContainer.innerHTML = `
                <h4>Session Stats</h4>
                <div class="session-stat-grid">
                    <div class="session-stat">
                        <span class="stat-label">Current Streak</span>
                        <span id="current-streak" class="stat-value">0</span>
                    </div>
                    <div class="session-stat">
                        <span class="stat-label">Best Streak</span>
                        <span id="session-best-streak" class="stat-value">0</span>
                    </div>
                    <div class="session-stat">
                        <span class="stat-label">Decisions</span>
                        <span id="total-decisions" class="stat-value">0</span>
                    </div>
                    <div class="session-stat">
                        <span class="stat-label">Lifetime Best</span>
                        <span id="lifetime-best-streak" class="stat-value">0</span>
                    </div>
                </div>
            `;
            
            const statsContent = document.getElementById('stats-content');
            if (statsContent) {
                statsContent.insertBefore(sessionContainer, document.getElementById('position-breakdown')?.parentNode);
            }
        }

        // Update values
        const currentStreakEl = document.getElementById('current-streak');
        if (currentStreakEl) {
            currentStreakEl.textContent = this.data.session.currentStreak;
            currentStreakEl.className = `stat-value ${this.getStreakClass(this.data.session.currentStreak)}`;
        }

        const sessionBestEl = document.getElementById('session-best-streak');
        if (sessionBestEl) {
            sessionBestEl.textContent = this.data.session.bestStreak;
        }

        const totalDecisionsEl = document.getElementById('total-decisions');
        if (totalDecisionsEl) {
            totalDecisionsEl.textContent = this.data.session.totalDecisions;
        }

        const lifetimeBestEl = document.getElementById('lifetime-best-streak');
        if (lifetimeBestEl) {
            lifetimeBestEl.textContent = this.data.lifetime.bestStreak;
        }
    },

    /**
     * Update position breakdown stats
     */
    updatePositionStats() {
        const container = document.getElementById('position-breakdown');
        if (!container) return;

        container.innerHTML = '';

        const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'POSTFLOP'];
        
        positions.forEach(position => {
            const stats = this.getPositionAccuracy(position);
            
            const positionEl = document.createElement('div');
            positionEl.className = 'position-stat';
            
            positionEl.innerHTML = `
                <div class="position-info">
                    <span class="position-name">${position}</span>
                    <span class="position-count">(${stats.total} decisions)</span>
                </div>
                <div class="position-accuracy ${this.getAccuracyClass(stats.accuracy)}">${stats.accuracy}%</div>
                <div class="position-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.accuracy}%"></div>
                    </div>
                </div>
            `;
            
            container.appendChild(positionEl);
        });
    },

    /**
     * Get CSS class based on accuracy level
     */
    getAccuracyClass(accuracy) {
        if (accuracy >= 80) return 'excellent';
        if (accuracy >= 70) return 'good';
        if (accuracy >= 60) return 'average';
        return 'needs-improvement';
    },

    /**
     * Get CSS class for streak display
     */
    getStreakClass(streak) {
        if (streak >= 10) return 'hot-streak';
        if (streak >= 5) return 'good-streak';
        if (streak >= 3) return 'building-streak';
        return '';
    },

    /**
     * Show stats panel
     */
    showStatsPanel() {
        const panel = document.getElementById('stats-panel');
        if (panel) {
            panel.classList.add('open');
            this.updateStatsDisplay(); // Refresh display when opened
        }
    },

    /**
     * Hide stats panel
     */
    hideStatsPanel() {
        const panel = document.getElementById('stats-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    },

    /**
     * Show decision feedback
     */
    showDecisionFeedback(isCorrect, position, phase) {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = `decision-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.innerHTML = `
            <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
            <span class="feedback-text">${isCorrect ? 'Correct!' : 'Mistake'}</span>
            <span class="feedback-position">${position}</span>
        `;
        
        // Add to page
        document.body.appendChild(feedback);
        
        // Show with animation
        setTimeout(() => feedback.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    },

    /**
     * Show reset confirmation dialog
     */
    showResetConfirmation() {
        const confirmed = confirm(
            'Are you sure you want to reset all statistics?\n\n' +
            'This will permanently delete:\n' +
            '• All position accuracy data\n' +
            '• Session statistics\n' +
            '• Lifetime statistics\n' +
            '• Streak records\n\n' +
            'This action cannot be undone.'
        );
        
        if (confirmed) {
            this.resetStats();
        }
    },

    /**
     * Reset all statistics
     */
    resetStats() {
        this.data = {
            positions: {
                'UTG': { correct: 0, total: 0 },
                'MP': { correct: 0, total: 0 },
                'CO': { correct: 0, total: 0 },
                'BTN': { correct: 0, total: 0 },
                'SB': { correct: 0, total: 0 },
                'BB': { correct: 0, total: 0 },
                'POSTFLOP': { correct: 0, total: 0 }
            },
            session: {
                handsPlayed: 0,
                correctDecisions: 0,
                totalDecisions: 0,
                currentStreak: 0,
                bestStreak: 0,
                lastDecisionCorrect: false
            },
            lifetime: {
                handsPlayed: 0,
                correctDecisions: 0,
                totalDecisions: 0,
                bestStreak: 0,
                gamesPlayed: 0
            }
        };
        
        this.saveStats();
        this.updateStatsDisplay();
        
        // Show confirmation
        alert('All statistics have been reset!');
    },

    /**
     * Load stats from localStorage
     */
    loadStats() {
        try {
            const savedStats = localStorage.getItem('poker-trainer-stats');
            if (savedStats) {
                const parsed = JSON.parse(savedStats);
                
                // Merge with defaults to handle new fields
                this.data = {
                    ...this.data,
                    ...parsed,
                    positions: { ...this.data.positions, ...parsed.positions },
                    session: { ...this.data.session, ...parsed.session },
                    lifetime: { ...this.data.lifetime, ...parsed.lifetime }
                };
            }
        } catch (error) {
            console.warn('Failed to load stats from localStorage:', error);
        }
    },

    /**
     * Save stats to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem('poker-trainer-stats', JSON.stringify(this.data));
        } catch (error) {
            console.warn('Failed to save stats to localStorage:', error);
        }
    },

    /**
     * Export stats as JSON
     * @returns {string} JSON string of stats data
     */
    exportStats() {
        return JSON.stringify(this.data, null, 2);
    },

    /**
     * Import stats from JSON
     * @param {string} jsonData - JSON string of stats data
     * @returns {boolean} Success/failure
     */
    importStats(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = importedData;
            this.saveStats();
            this.updateStatsDisplay();
            return true;
        } catch (error) {
            console.error('Failed to import stats:', error);
            return false;
        }
    },

    /**
     * Get performance summary
     * @returns {Object} Summary of player performance
     */
    getPerformanceSummary() {
        const overallAccuracy = this.getOverallAccuracy();
        const lifetimeAccuracy = this.getLifetimeAccuracy();
        
        let rating = 'Beginner';
        if (overallAccuracy >= 85) rating = 'Expert';
        else if (overallAccuracy >= 75) rating = 'Advanced';
        else if (overallAccuracy >= 65) rating = 'Intermediate';
        
        const weakestPosition = this.getWeakestPosition();
        const strongestPosition = this.getStrongestPosition();
        
        return {
            rating: rating,
            overallAccuracy: overallAccuracy,
            lifetimeAccuracy: lifetimeAccuracy,
            currentStreak: this.data.session.currentStreak,
            bestStreak: this.data.lifetime.bestStreak,
            totalDecisions: this.data.lifetime.totalDecisions,
            weakestPosition: weakestPosition,
            strongestPosition: strongestPosition,
            gamesPlayed: this.data.lifetime.gamesPlayed
        };
    },

    /**
     * Find weakest position
     */
    getWeakestPosition() {
        let weakest = { position: '', accuracy: 100, total: 0 };
        
        Object.keys(this.data.positions).forEach(position => {
            const stats = this.getPositionAccuracy(position);
            if (stats.total >= 5 && stats.accuracy < weakest.accuracy) {
                weakest = { position, accuracy: stats.accuracy, total: stats.total };
            }
        });
        
        return weakest.position || 'None';
    },

    /**
     * Find strongest position
     */
    getStrongestPosition() {
        let strongest = { position: '', accuracy: 0, total: 0 };
        
        Object.keys(this.data.positions).forEach(position => {
            const stats = this.getPositionAccuracy(position);
            if (stats.total >= 5 && stats.accuracy > strongest.accuracy) {
                strongest = { position, accuracy: stats.accuracy, total: stats.total };
            }
        });
        
        return strongest.position || 'None';
    }
};

// Add CSS for decision feedback (inject into page)
const feedbackCSS = `
.decision-feedback {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: bold;
    z-index: 1001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    backdrop-filter: blur(10px);
}

.decision-feedback.show {
    transform: translateX(0);
}

.decision-feedback.correct {
    border-left: 4px solid #10b981;
}

.decision-feedback.incorrect {
    border-left: 4px solid #ef4444;
}

.feedback-position {
    font-size: 0.9rem;
    opacity: 0.7;
}

.session-stats {
    margin-bottom: 2rem;
}

.session-stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
}

.session-stat {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 0.8rem;
    color: #9ca3af;
    margin-bottom: 0.25rem;
}

.stat-value.excellent { color: #10b981; }
.stat-value.good { color: #3b82f6; }
.stat-value.average { color: #f59e0b; }
.stat-value.needs-improvement { color: #ef4444; }

.stat-value.hot-streak { color: #f59e0b; animation: pulse 1s infinite; }
.stat-value.good-streak { color: #10b981; }
.stat-value.building-streak { color: #3b82f6; }

.position-stat {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
}

.position-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.position-count {
    font-size: 0.8rem;
    color: #9ca3af;
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #10b981);
    transition: width 0.3s ease;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = feedbackCSS;
document.head.appendChild(style);