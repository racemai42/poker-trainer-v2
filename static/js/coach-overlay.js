"use strict";

// Coach Overlay for Poker Trainer V2 - Range Image Version
// Hooks into existing JS_CSS_Poker game without modifying core files

// Stats tracking
let coachStats = {
    preflop: { correct: 0, total: 0 },
    postflop: { correct: 0, total: 0 },
    byPosition: {
        UTG: { correct: 0, total: 0 },
        MP: { correct: 0, total: 0 },
        CO: { correct: 0, total: 0 },
        BTN: { correct: 0, total: 0 },
        SB: { correct: 0, total: 0 },
        BB: { correct: 0, total: 0 }
    }
};

// Pre-flop GTO ranges (6-max) - same data used to generate the images
const openingRanges = {
    UTG: {
        percentage: "~15%",
        hands: ["22+", "A2s+", "KTs+", "QTs+", "JTs", "T9s", "ATo+", "KJo+"]
    },
    MP: {
        percentage: "~18%", 
        hands: ["22+", "A2s+", "K9s+", "Q9s+", "J9s+", "T9s", "98s", "A9o+", "KTo+", "QJo"]
    },
    CO: {
        percentage: "~27%",
        hands: ["22+", "A2s+", "K5s+", "Q8s+", "J8s+", "T8s+", "97s+", "87s", "76s", "A5o+", "K9o+", "QTo+", "JTo"]
    },
    BTN: {
        percentage: "~40%",
        hands: ["22+", "A2s+", "K2s+", "Q5s+", "J7s+", "T7s+", "96s+", "86s+", "75s+", "65s", "54s", "A2o+", "K7o+", "Q9o+", "J9o+", "T9o"]
    },
    SB: {
        percentage: "~35%",
        hands: ["22+", "A2s+", "K4s+", "Q7s+", "J8s+", "T8s+", "97s+", "86s+", "76s", "65s", "A4o+", "K9o+", "QTo+", "JTo"]
    },
    BB: {
        percentage: "~40%",
        hands: ["22+", "A2s+", "K2s+", "Q2s+", "J5s+", "T6s+", "96s+", "86s+", "75s+", "65s", "54s", "A2o+", "K5o+", "Q8o+", "J8o+", "T8o+", "98o"]
    }
};

// Grid mapping constants
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const IMAGE_BASE_X = 44;
const IMAGE_BASE_Y = 36;
const CELL_SIZE = 42;

// Hand parser to convert "AKs", "22", etc. to check against player's cards
function parseRangeToHands(rangeArray) {
    const hands = new Set();
    
    rangeArray.forEach(range => {
        if (range.includes("+")) {
            // Handle range like "22+", "A2s+", etc.
            const base = range.replace("+", "");
            if (base.match(/^\d\d$/)) {
                // Pocket pairs like "22+"
                const rank = parseInt(base[0]);
                for (let r = rank; r <= 14; r++) {
                    const rankStr = r === 14 ? "A" : (r > 10 ? ["J", "Q", "K"][r-11] : r.toString());
                    hands.add(rankStr + rankStr);
                }
            } else if (base.match(/^[AKQJT2-9]\ds$/)) {
                // Suited hands like "A2s+"
                const highCard = base[0];
                const lowRank = base[1] === "T" ? 10 : (isNaN(base[1]) ? {"J": 11, "Q": 12, "K": 13, "A": 14}[base[1]] : parseInt(base[1]));
                const highRank = highCard === "T" ? 10 : (isNaN(highCard) ? {"J": 11, "Q": 12, "K": 13, "A": 14}[highCard] : parseInt(highCard));
                
                for (let r = lowRank; r < highRank; r++) {
                    const rankStr = r === 14 ? "A" : (r === 10 ? "T" : (r > 10 ? ["J", "Q", "K"][r-11] : r.toString()));
                    hands.add(highCard + rankStr + "s");
                }
            } else if (base.match(/^[AKQJT2-9]\do$/)) {
                // Offsuit hands like "ATo+"
                const highCard = base[0];
                const lowRank = base[1] === "T" ? 10 : (isNaN(base[1]) ? {"J": 11, "Q": 12, "K": 13, "A": 14}[base[1]] : parseInt(base[1]));
                const highRank = highCard === "T" ? 10 : (isNaN(highCard) ? {"J": 11, "Q": 12, "K": 13, "A": 14}[highCard] : parseInt(highCard));
                
                for (let r = lowRank; r < highRank; r++) {
                    const rankStr = r === 14 ? "A" : (r === 10 ? "T" : (r > 10 ? ["J", "Q", "K"][r-11] : r.toString()));
                    hands.add(highCard + rankStr + "o");
                }
            }
        } else {
            // Direct hand like "AKs", "22", "AKo"
            hands.add(range);
        }
    });
    
    return hands;
}

function getPlayerPosition() {
    if (!players || !players.length) return "UTG";
    
    const humanIndex = 0; // Human player is always at index 0
    const numPlayers = players.filter(p => p.status !== "BUST").length;
    
    // Calculate position relative to button
    let position = (humanIndex - button_index + players.length) % players.length;
    
    if (numPlayers === 6) {
        switch (position) {
            case 0: return "BTN";
            case 1: return "SB"; 
            case 2: return "BB";
            case 3: return "UTG";
            case 4: return "MP";
            case 5: return "CO";
            default: return "UTG";
        }
    } else if (numPlayers === 5) {
        switch (position) {
            case 0: return "BTN";
            case 1: return "SB";
            case 2: return "BB"; 
            case 3: return "UTG";
            case 4: return "CO";
            default: return "UTG";
        }
    } else if (numPlayers <= 3) {
        switch (position) {
            case 0: return "BTN";
            case 1: return "SB";
            case 2: return "BB";
            default: return "BTN";
        }
    }
    
    return "UTG"; // Default fallback
}

function convertCardToRange(card1, card2) {
    // Convert internal card format "h14", "s12" to range format "AKs", "QQ", etc.
    const rank1 = get_rank(card1);
    const rank2 = get_rank(card2);
    const suit1 = get_suit(card1);
    const suit2 = get_suit(card2);
    
    const rankToStr = (r) => {
        if (r === 14) return "A";
        if (r === 13) return "K";
        if (r === 12) return "Q";
        if (r === 11) return "J";
        if (r === 10) return "T";
        return r.toString();
    };
    
    if (rank1 === rank2) {
        // Pocket pair
        return rankToStr(rank1) + rankToStr(rank1);
    } else {
        // Non-pair - put higher rank first
        const high = rank1 > rank2 ? rank1 : rank2;
        const low = rank1 > rank2 ? rank2 : rank1;
        const suited = suit1 === suit2 ? "s" : "o";
        return rankToStr(high) + rankToStr(low) + suited;
    }
}

function isHandInRange(hand, rangeSet) {
    return rangeSet.has(hand);
}

function getHandGridPosition(hand) {
    // Convert hand to grid coordinates for highlighting on the image
    let rank1, rank2, suited = false;
    
    if (hand.length === 2) {
        // Pocket pair like "AA", "KK"
        rank1 = rank2 = hand[0];
    } else if (hand.length === 3) {
        // Non-pair like "AKs" or "AKo"
        rank1 = hand[0];
        rank2 = hand[1];
        suited = hand[2] === 's';
    }
    
    const row = RANKS.indexOf(rank1);
    const col = RANKS.indexOf(rank2);
    
    if (row === -1 || col === -1) return null;
    
    let finalRow, finalCol;
    
    if (row === col) {
        // Pocket pair - use diagonal
        finalRow = finalCol = row;
    } else if (suited) {
        // Suited - upper triangle (row < col)
        finalRow = Math.min(row, col);
        finalCol = Math.max(row, col);
    } else {
        // Offsuit - lower triangle (row > col)
        finalRow = Math.max(row, col);
        finalCol = Math.min(row, col);
    }
    
    return {
        x: IMAGE_BASE_X + finalCol * CELL_SIZE,
        y: IMAGE_BASE_Y + finalRow * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE
    };
}

function createRangeImageDisplay(position, playerHand, isCorrect) {
    const imagePath = `static/images/ranges/${position}.png`;
    const handPosition = getHandGridPosition(playerHand);
    
    const containerId = `range-container-${Date.now()}`;
    const canvasId = `range-canvas-${Date.now()}`;
    
    let html = `
        <div class="range-image-container" id="${containerId}">
            <img src="${imagePath}" alt="${position} Range" class="range-image" onload="highlightPlayerHand('${canvasId}', ${JSON.stringify(handPosition).replace(/"/g, '&quot;')})">
            <canvas id="${canvasId}" class="range-overlay-canvas"></canvas>
        </div>
    `;
    
    return html;
}

function highlightPlayerHand(canvasId, position) {
    if (!position) return;
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const img = canvas.previousElementSibling;
    if (!img) return;
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Draw highlight rectangle
    ctx.strokeStyle = '#ff6b35'; // Bright orange
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 10;
    
    // Draw pulsing border
    let alpha = 1;
    let increasing = false;
    
    function drawPulse() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = alpha;
        ctx.strokeRect(position.x, position.y, position.width, position.height);
        
        // Add inner glow
        ctx.strokeStyle = '#ffeb3b'; // Yellow inner glow
        ctx.lineWidth = 1;
        ctx.strokeRect(position.x + 1, position.y + 1, position.width - 2, position.height - 2);
        
        // Reset for next frame
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        
        // Update alpha for pulsing effect
        if (increasing) {
            alpha += 0.03;
            if (alpha >= 1) increasing = false;
        } else {
            alpha -= 0.03;
            if (alpha <= 0.4) increasing = true;
        }
    }
    
    // Start pulsing animation
    const pulseInterval = setInterval(drawPulse, 50);
    drawPulse();
    
    // Stop pulsing when modal is closed
    setTimeout(() => {
        clearInterval(pulseInterval);
    }, 8000);
}

function showPreflopCoaching(action, betAmount) {
    const position = getPlayerPosition();
    const card1 = players[0].carda;
    const card2 = players[0].cardb;
    const playerHand = convertCardToRange(card1, card2);
    const rangeData = openingRanges[position];
    const rangeSet = parseRangeToHands(rangeData.hands);
    const shouldPlay = isHandInRange(playerHand, rangeSet);
    
    let isCorrect = false;
    if (action === "fold") {
        isCorrect = !shouldPlay;
    } else {
        isCorrect = shouldPlay;
    }
    
    // Update stats
    coachStats.preflop.total++;
    coachStats.byPosition[position].total++;
    if (isCorrect) {
        coachStats.preflop.correct++;
        coachStats.byPosition[position].correct++;
    }
    saveStats();
    
    const rangeImageHTML = createRangeImageDisplay(position, playerHand, isCorrect);
    
    const correctnessIcon = isCorrect ? "✅" : "❌";
    const correctnessText = isCorrect ? "Correct!" : "Mistake!";
    const correctnessClass = isCorrect ? "correct" : "mistake";
    
    let explanation = "";
    if (isCorrect && shouldPlay) {
        explanation = `Your ${playerHand} is in the ${position} opening range. Good play!`;
    } else if (isCorrect && !shouldPlay) {
        explanation = `${playerHand} is not in the ${position} opening range. Good fold!`;
    } else if (!isCorrect && shouldPlay) {
        explanation = `${playerHand} is a profitable hand for ${position}. Consider playing it more often.`;
    } else {
        explanation = `${playerHand} is usually too weak for ${position}. Folding saves money in the long run.`;
    }
    
    const modalContent = `
        <div class="coach-modal preflop-modal">
            <div class="coach-header">
                <h3>Pre-flop Analysis</h3>
                <button class="coach-close" onclick="closeCoachModal()">&times;</button>
            </div>
            <div class="coach-content">
                <div class="position-info">
                    <div class="position-label">${position} Position</div>
                    <div class="percentage-label">${rangeData.percentage}</div>
                    <div class="correctness ${correctnessClass}">
                        <span class="icon">${correctnessIcon}</span>
                        <span class="text">${correctnessText}</span>
                    </div>
                </div>
                
                <div class="range-display">
                    <h4>${position} Opening Range Chart</h4>
                    ${rangeImageHTML}
                </div>
                
                <div class="explanation">
                    <strong>Your hand: ${playerHand}</strong><br>
                    ${explanation}
                </div>
            </div>
        </div>
    `;
    
    showCoachModal(modalContent);
}

// Post-flop analysis functions
function analyzeHand() {
    const humanPlayer = players[0];
    const handResult = analyzePlayerHand(humanPlayer);
    return handResult;
}

function analyzePlayerHand(player) {
    // Use existing hand evaluation functions
    const straightFlush = test_straight_flush(player);
    const fourKind = test_four_of_a_kind(player);
    const fullHouse = test_full_house(player);
    const flush = test_flush(player);
    const straight = test_straight(player);
    const trips = test_three_of_a_kind(player);
    const twoPair = test_two_pair(player);
    const onePair = test_one_pair(player);
    
    if (straightFlush.num_needed === 0) return { strength: "monster", hand: straightFlush };
    if (fourKind.num_needed === 0) return { strength: "monster", hand: fourKind };
    if (fullHouse.num_needed === 0) return { strength: "monster", hand: fullHouse };
    if (flush.num_needed === 0) return { strength: "strong", hand: flush };
    if (straight.num_needed === 0) return { strength: "strong", hand: straight };
    if (trips.num_needed === 0) return { strength: "strong", hand: trips };
    if (twoPair.num_needed === 0) return { strength: "medium", hand: twoPair };
    if (onePair.num_needed === 0) return { strength: "medium", hand: onePair };
    
    // Check for draws
    const flushDraw = flush.num_needed === 1;
    const straightDraw = straight.num_needed === 1;
    
    if (flushDraw && straightDraw) {
        return { strength: "draw", hand: { hand_name: "Combo Draw" }, draw: true };
    } else if (flushDraw) {
        return { strength: "draw", hand: { hand_name: "Flush Draw" }, draw: true };
    } else if (straightDraw) {
        return { strength: "draw", hand: { hand_name: "Straight Draw" }, draw: true };
    }
    
    return { strength: "weak", hand: { hand_name: "High Card" } };
}

function analyzeBoardTexture() {
    const boardCards = board.slice(0, 5).filter(card => card && card !== "");
    
    let paired = false;
    let monotone = false;
    let twotone = false;
    let connected = false;
    
    if (boardCards.length >= 3) {
        // Check for pairs
        const ranks = boardCards.map(card => get_rank(card));
        const rankCounts = {};
        ranks.forEach(rank => {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });
        paired = Object.values(rankCounts).some(count => count >= 2);
        
        // Check suit texture
        const suits = boardCards.map(card => get_suit(card));
        const suitCounts = {};
        suits.forEach(suit => {
            suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        });
        const maxSuitCount = Math.max(...Object.values(suitCounts));
        
        if (maxSuitCount >= 3 && Object.keys(suitCounts).length === 1) {
            monotone = true;
        } else if (maxSuitCount >= 3) {
            twotone = true;
        }
        
        // Check connectivity (simplified)
        const sortedRanks = ranks.sort((a, b) => b - a);
        for (let i = 0; i < sortedRanks.length - 2; i++) {
            if (sortedRanks[i] - sortedRanks[i + 2] <= 4) {
                connected = true;
                break;
            }
        }
    }
    
    let texture = "dry";
    if ((connected && (monotone || twotone)) || (monotone && paired)) {
        texture = "very wet";
    } else if (connected || monotone || twotone) {
        texture = "wet";
    } else if (paired) {
        texture = "paired";
    }
    
    return { texture, paired, monotone, twotone, connected };
}

function getPostflopRecommendation(handAnalysis, boardAnalysis, position) {
    const { strength, hand, draw } = handAnalysis;
    const { texture } = boardAnalysis;
    
    let recommendation = "";
    let reasoning = "";
    let color = "";
    
    if (strength === "monster") {
        color = "green";
        recommendation = "Value bet big!";
        reasoning = `${hand.hand_name} is a monster hand. Bet 75-100% pot to build value and protect against draws.`;
    } else if (strength === "strong") {
        color = "green";
        if (texture === "very wet" || texture === "wet") {
            recommendation = "Bet for value and protection";
            reasoning = `${hand.hand_name} is strong but the ${texture} board is dangerous. Bet 60-75% pot.`;
        } else {
            recommendation = "Value bet";
            reasoning = `${hand.hand_name} on this ${texture} board. Bet 50-75% pot for value.`;
        }
    } else if (strength === "draw") {
        color = "yellow";
        if (draw) {
            const outs = hand.hand_name.includes("Combo") ? "12+" : (hand.hand_name.includes("Flush") ? "9" : "8");
            recommendation = "Semi-bluff or check-call";
            reasoning = `You have a ${hand.hand_name} with ~${outs} outs. Good spot to bet as a semi-bluff or check-call for pot odds.`;
        }
    } else if (strength === "medium") {
        color = "yellow";
        if (texture === "very wet" || texture === "wet") {
            recommendation = "Check for pot control";
            reasoning = `${hand.hand_name} is vulnerable on this ${texture} board. Consider checking or betting small.`;
        } else {
            recommendation = "Thin value bet or check";
            reasoning = `${hand.hand_name} likely has some value on this ${texture} board.`;
        }
    } else {
        color = "red";
        recommendation = "Check and give up";
        reasoning = "High card hands have little value. Check behind or fold to big bets.";
    }
    
    return { recommendation, reasoning, color };
}

function showPostflopCoaching(action, betAmount) {
    const handAnalysis = analyzeHand();
    const boardAnalysis = analyzeBoardTexture();
    const position = getPlayerPosition();
    const rec = getPostflopRecommendation(handAnalysis, boardAnalysis, position);
    
    // Update stats (simplified correctness)
    coachStats.postflop.total++;
    coachStats.postflop.correct++; // Being generous on post-flop
    saveStats();
    
    const street = !board[0] ? "Pre-flop" : (!board[3] ? "Flop" : (!board[4] ? "Turn" : "River"));
    
    const modalContent = `
        <div class="coach-modal postflop-modal">
            <div class="coach-header">
                <h3>${street} Analysis</h3>
                <button class="coach-close" onclick="closeCoachModal()">&times;</button>
            </div>
            <div class="coach-content">
                <div class="hand-strength">
                    <h4>Hand Strength</h4>
                    <div class="strength-info">
                        <span class="hand-name">${handAnalysis.hand.hand_name}</span>
                        <span class="strength-level ${handAnalysis.strength}">${handAnalysis.strength.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="board-texture">
                    <h4>Board Texture: ${boardAnalysis.texture.toUpperCase()}</h4>
                    <div class="texture-features">
                        ${boardAnalysis.paired ? '<span class="feature">Paired</span>' : ''}
                        ${boardAnalysis.monotone ? '<span class="feature">Monotone</span>' : ''}
                        ${boardAnalysis.twotone ? '<span class="feature">Two-tone</span>' : ''}
                        ${boardAnalysis.connected ? '<span class="feature">Connected</span>' : ''}
                    </div>
                </div>
                
                <div class="recommendation ${rec.color}">
                    <h4>💡 Recommendation</h4>
                    <div class="rec-text">${rec.recommendation}</div>
                    <div class="reasoning">${rec.reasoning}</div>
                </div>
            </div>
        </div>
    `;
    
    showCoachModal(modalContent);
}

function showCoachModal(content) {
    let modal = document.getElementById('coach-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'coach-modal';
        modal.className = 'coach-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = content;
    modal.style.display = 'flex';
    
    // Auto-close after 8 seconds
    setTimeout(() => {
        closeCoachModal();
    }, 8000);
}

function closeCoachModal() {
    const modal = document.getElementById('coach-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Stats functionality
function saveStats() {
    localStorage.setItem('coachStats', JSON.stringify(coachStats));
}

function loadStats() {
    const saved = localStorage.getItem('coachStats');
    if (saved) {
        coachStats = { ...coachStats, ...JSON.parse(saved) };
    }
}

function showStats() {
    const preflopPct = coachStats.preflop.total > 0 ? 
        Math.round(100 * coachStats.preflop.correct / coachStats.preflop.total) : 0;
    const postflopPct = coachStats.postflop.total > 0 ? 
        Math.round(100 * coachStats.postflop.correct / coachStats.postflop.total) : 0;
    
    let positionStats = "";
    Object.entries(coachStats.byPosition).forEach(([pos, stats]) => {
        if (stats.total > 0) {
            const pct = Math.round(100 * stats.correct / stats.total);
            positionStats += `<div class="stat-row">${pos}: ${stats.correct}/${stats.total} (${pct}%)</div>`;
        }
    });
    
    const modalContent = `
        <div class="coach-modal stats-modal">
            <div class="coach-header">
                <h3>📊 Poker Coach Stats</h3>
                <button class="coach-close" onclick="closeCoachModal()">&times;</button>
            </div>
            <div class="coach-content">
                <div class="stats-section">
                    <h4>Overall Performance</h4>
                    <div class="stat-row">Pre-flop: ${coachStats.preflop.correct}/${coachStats.preflop.total} (${preflopPct}%)</div>
                    <div class="stat-row">Post-flop: ${coachStats.postflop.correct}/${coachStats.postflop.total} (${postflopPct}%)</div>
                </div>
                <div class="stats-section">
                    <h4>By Position</h4>
                    ${positionStats}
                </div>
                <button class="reset-stats" onclick="resetStats()">Reset Stats</button>
            </div>
        </div>
    `;
    
    showCoachModal(modalContent);
}

function resetStats() {
    coachStats = {
        preflop: { correct: 0, total: 0 },
        postflop: { correct: 0, total: 0 },
        byPosition: {
            UTG: { correct: 0, total: 0 },
            MP: { correct: 0, total: 0 },
            CO: { correct: 0, total: 0 },
            BTN: { correct: 0, total: 0 },
            SB: { correct: 0, total: 0 },
            BB: { correct: 0, total: 0 }
        }
    };
    saveStats();
    closeCoachModal();
}

// Hook into existing game functions
let lastAction = null;
let lastBetAmount = 0;

function monitorGameState() {
    // Check if human player just acted
    if (players && players[0]) {
        const humanPlayer = players[0];
        
        // Detect human action
        if (current_bettor_index !== 0) {
            // Human just finished acting
            if (lastAction) {
                const isPreflop = !board[0];
                
                if (isPreflop && lastAction) {
                    setTimeout(() => showPreflopCoaching(lastAction, lastBetAmount), 500);
                } else if (lastAction) {
                    setTimeout(() => showPostflopCoaching(lastAction, lastBetAmount), 500);
                }
                lastAction = null;
            }
        }
    }
}

// Override human action functions to track actions
const originalHumanCall = window.human_call;
window.human_call = function() {
    lastAction = current_bet_amount === players[0].subtotal_bet ? "check" : "call";
    lastBetAmount = current_bet_amount - players[0].subtotal_bet;
    originalHumanCall.call(this);
};

const originalHumanFold = window.human_fold;
window.human_fold = function() {
    lastAction = "fold";
    lastBetAmount = 0;
    originalHumanFold.call(this);
};

const originalHandleHumanBet = window.handle_human_bet;
window.handle_human_bet = function(betAmount) {
    lastAction = "raise";
    lastBetAmount = betAmount;
    originalHandleHumanBet.call(this, betAmount);
};

// Add stats button to the UI
function addStatsButton() {
    const setupOptions = document.getElementById('setup-options');
    if (setupOptions && !document.getElementById('coach-stats-button')) {
        const statsButton = document.createElement('div');
        statsButton.id = 'coach-stats-button';
        statsButton.className = 'setup-button';
        statsButton.textContent = '📊 Stats';
        statsButton.onclick = showStats;
        setupOptions.appendChild(statsButton);
    }
}

// Initialize coaching system
function initCoach() {
    loadStats();
    addStatsButton();
    
    // Monitor game state every second
    setInterval(monitorGameState, 1000);
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoach);
} else {
    initCoach();
}

// Make functions globally accessible for onclick handlers
window.closeCoachModal = closeCoachModal;
window.showStats = showStats;
window.resetStats = resetStats;
window.highlightPlayerHand = highlightPlayerHand;