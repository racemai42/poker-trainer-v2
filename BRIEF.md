# Poker Trainer V2 — Coach Layer on JS_CSS_Poker

This project is a FORK of JS_CSS_Poker (SourceForge). The game is ALREADY COMPLETE and working.

## CRITICAL RULE: DO NOT MODIFY EXISTING FILES
- DO NOT change poker.js, bot.js, hands.js, gui_if.js, poker.html, or any CSS
- Only ADD new files and ADD a single script tag + small hook in poker.html
- The game must work exactly as before, with the coach as an overlay

## What to read first
1. `static/js/jsholdem/poker.js` — game engine, understand the game state variables
2. `static/js/jsholdem/bot.js` — bot AI, understand hand confidence calculations  
3. `static/js/jsholdem/hands.js` — hand evaluation
4. `static/js/gui_if.js` — GUI interface, understand how actions are triggered
5. `poker.html` — main game page

## Key game state variables to find (read the code!)
- Player's hole cards
- Community cards
- Current betting round (preflop/flop/turn/river)
- Player position relative to dealer
- Pot size
- Current bet to call
- Number of active players

## What to BUILD: coach-overlay.js + coach-overlay.css

### 1. Pre-flop Coach Modal
After the human player acts pre-flop (fold, call, raise), show a modal overlay:

**Content:**
- 13x13 range grid (standard poker chart: rows=first card A-2, cols=second card A-2)
  - Upper-right triangle = suited hands (green if in range)
  - Lower-left triangle = offsuit hands (blue if in range)  
  - Diagonal = pocket pairs (red if in range)
  - Grey = not in range
- Player's actual hand HIGHLIGHTED with bright yellow/orange border + pulsing animation
- Position label (UTG, MP, CO, BTN, SB, BB) based on seat relative to dealer
- Whether their action was correct: ✅ "Correct" or ❌ "Mistake"
- Brief explanation text

**Standard 6-max GTO opening ranges:**
- UTG (~15%): 22+, A2s+, KTs+, QTs+, JTs, T9s, ATo+, KJo+
- MP (~18%): 22+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, A9o+, KTo+, QJo  
- CO (~27%): 22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, A5o+, K9o+, QTo+, JTo
- BTN (~40%): 22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K7o+, Q9o+, J9o+, T9o
- SB (~35%): 22+, A2s+, K4s+, Q7s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, A4o+, K9o+, QTo+, JTo
- BB defend: 40%+ (wider)

### 2. Post-flop Coach Modal
After the human acts on flop/turn/river, show advice:

**Hand Strength Analysis:**
- Classify: nothing, pair (top/middle/bottom/overpair), two pair, trips, straight, flush, full house, quads, straight flush
- Identify draws: flush draw (4 to flush), open-ended straight draw, gutshot, combo draw
- Calculate outs approximately

**Board Texture Analysis:**
- Wet (many draws possible) vs Dry (few draws)
- Paired board
- Monotone/two-tone/rainbow
- Connected (many straight possibilities) vs disconnected

**Recommendation based on:**
- Hand strength + draws
- Position (acting first or last)
- Pot size vs bet size (pot odds)
- Board texture

**Categories of advice:**
- 🟢 **Strong hand (top pair good kicker+)**: "Bet for value. You have a strong hand."
- 🔵 **Drawing hand (flush draw, OESD)**: "Good semi-bluff opportunity" or "Check-call, you have X outs (~Y% to improve)"
- 🟡 **Medium hand (middle pair, weak top pair)**: "Check for pot control" or "Small bet for thin value"
- 🔴 **Weak hand, no draw**: "Consider folding" or "Check and give up"
- ⭐ **Monster (set+, flush, straight)**: "Bet big for value! You have [hand]"

### 3. Stats Tracking (localStorage)
- Track pre-flop decisions: correct/incorrect per position
- Track post-flop decisions: correct/incorrect per street
- Show via a "📊 Stats" button added to the page
- Stats dashboard as a modal

### 4. Implementation approach

**Hooking into the game WITHOUT modifying it:**
- Read the game state by observing DOM elements (card images, bet amounts, etc.)
- OR find global JS variables that expose game state (players array, community cards, etc.)
- Use MutationObserver or setInterval to detect when it's the human's turn and when they act
- Intercept the human's action by detecting button clicks (Fold, Call, Raise)

**Add to poker.html (ONLY addition to existing file):**
```html
<!-- Coach Overlay -->
<link rel="stylesheet" href="static/css/coach-overlay.css">
<script src="static/js/coach-overlay.js"></script>
```

**Create new files:**
- `static/js/coach-overlay.js` — all coach logic, range data, hand evaluation, stats
- `static/css/coach-overlay.css` — modal styling, range grid, animations

### 5. Modal Design
- Dark semi-transparent backdrop
- Centered modal with dark background (#1e2328)
- Green header bar for pre-flop, blue for post-flop
- Close button (X) and auto-dismiss after 8 seconds
- Range grid: 13x13 cells, small but readable (about 400px wide)
- Responsive: works on different screen sizes
- Does not interfere with game controls below

### 6. Position Detection
The game has a dealer button "D". Count seats clockwise from dealer to determine:
- BTN (dealer), SB (+1), BB (+2), UTG (+3), MP (+4), CO (+5) for 6 players
- Adjust for fewer players

## Post-flop coaching detail

The best post-flop coaching combines:
1. **Made hand strength** relative to board (not just absolute)
2. **Draw equity** — how many outs, what's the probability
3. **Relative hand strength** — is your hand likely best right now?
4. **Board texture** — does the board favor the caller or raiser?
5. **Pot odds** — is calling mathematically profitable?
6. **Position** — being in position is a significant advantage

Example coaching messages:
- "You have top pair, top kicker on a dry board. Bet ~60-75% pot for value."
- "You have a flush draw (9 outs, ~19% on turn). Pot odds need 4:1 to call profitably. Semi-bluff is also strong here."
- "Bottom pair on a wet board. You're likely behind. Check-fold unless getting great pot odds."
- "You hit a set! The board is wet. Bet big (75-100% pot) to protect against draws."
- "Nothing on a paired board. Your opponent likely has nothing either. A small bet as a bluff could take the pot."
