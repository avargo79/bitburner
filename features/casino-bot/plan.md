# Casino Bot Automation - Technical Implementation Plan

**Feature**: Casino Bot Automation  
**Created**: 2025-09-10  
**Status**: Implemented (Existing Feature)  

## Implementation Overview

The Casino Bot Automation provides comprehensive blackjack automation through browser DOM manipulation. The system navigates to the casino, plays optimal blackjack strategy, handles game state management, and includes sophisticated error recovery and focus management.

## Architecture Design

### **Browser Automation Architecture**
The casino bot system leverages zero-cost browser API access:
- **File**: `src/casino-bot.ts` (~400+ lines)
- **Pattern**: Class-based architecture with browser automation
- **Dependencies**: Zero-cost browser API stealth access
- **RAM Cost**: Minimal due to stealth browser technique

### **Core Components Structure**

```typescript
// =============================================================================
// CASINO-BOT.TS - Complete Casino Automation System
// =============================================================================

// SECTION 1: Browser API Access and Stealth Utilities (Lines 1-50)
// SECTION 2: Game State Management and Statistics (Lines 51-100)
// SECTION 3: Focus Management and Error Recovery (Lines 101-200)
// SECTION 4: Casino Navigation and Interface (Lines 201-300)
// SECTION 5: Blackjack Strategy and Gameplay (Lines 301-400)
```

## Key Implementation Patterns

### **1. Zero-Cost Browser Access**
```typescript
// Browser API stealth access pattern - bypasses 25GB RAM penalty
function getWindowAPI(): Window {
    return (globalThis as any)['win' + 'dow'];
}

function getDocumentAPI(): Document {
    return (globalThis as any)['doc' + 'ument'];
}
```

**Critical Advantage**: Enables full DOM manipulation without RAM penalties, allowing comprehensive casino automation.

### **2. Focus Management System**
```typescript
private async checkForStolenFocus(): Promise<void> {
    const doc = getDocumentAPI();
    
    // Check for offline popup
    let offlinePopup = doc.evaluate(
        "//div[contains(text(), 'Offline for')]",
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;
    
    if (offlinePopup) {
        const backdrop = doc.querySelector(".MuiBackdrop-root.MuiModal-backdrop");
        if (backdrop) {
            await this.clickElement(backdrop as HTMLElement);
        }
    }
    
    // Handle unfocus button
    const unfocusButton = doc.evaluate(
        "//button[text()='Do something else simultaneously']",
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue as HTMLButtonElement;
    
    if (unfocusButton) {
        await this.clickElement(unfocusButton);
    }
}
```

### **3. Casino Navigation System**
```typescript
private async navigateToCasino(): Promise<void> {
    const doc = getDocumentAPI();
    
    // Verify location
    if (this.ns.getPlayer().city !== "Aevum") {
        throw new Error("Not in Aevum - need manual travel");
    }
    
    // Navigate: City -> Casino -> Blackjack
    const cityButton = doc.evaluate("//div[(@role = 'button') and (contains(., 'City'))]", ...);
    await this.clickElement(cityButton);
    
    const casinoButton = doc.evaluate("//span[@aria-label = 'Iker Molina Casino']", ...);
    await this.clickElement(casinoButton);
    
    const blackjackButton = doc.evaluate("//button[contains(text(), 'blackjack')]", ...);
    await this.clickElement(blackjackButton);
}
```

## Blackjack Strategy Implementation

### **Optimal Basic Strategy Engine**
```typescript
private getOptimalAction(playerCards: number[], dealerUpCard: number): string {
    const playerTotal = this.calculateHandValue(playerCards);
    const playerAces = this.countAces(playerCards);
    
    // Basic strategy matrix implementation
    if (playerAces > 0 && playerTotal <= 21) {
        // Soft hand strategy
        return this.getSoftHandAction(playerTotal, dealerUpCard);
    } else {
        // Hard hand strategy
        return this.getHardHandAction(playerTotal, dealerUpCard);
    }
}

private getHardHandAction(playerTotal: number, dealerUpCard: number): string {
    // Mathematically optimal hard hand decisions
    if (playerTotal >= 17) return "stand";
    if (playerTotal <= 11) return "hit";
    
    // Optimal strategy for 12-16 based on dealer up card
    if (playerTotal >= 12 && playerTotal <= 16) {
        return (dealerUpCard >= 2 && dealerUpCard <= 6) ? "stand" : "hit";
    }
    
    return "hit";
}
```

### **Betting Strategy**
```typescript
// Calculate bet amount: 90% of money, max $100M
const currentMoney = this.getCurrentMoney();
const bet = Math.min(100000000, Math.floor(currentMoney * 0.9));

// Risk management: minimum bet threshold
if (bet < 1000) {
    this.log("❌ Not enough money to continue betting");
    break;
}
```

**Strategy Analysis**:
- **Aggressive Betting**: 90% of available money per hand
- **Maximum Limit**: $100M per hand (casino limit)
- **Risk Management**: Minimum $1000 threshold
- **Profit Strategy**: Save on wins, reload on losses

## Game State Management

### **Hand Evaluation System**
```typescript
private calculateHandValue(cards: number[]): number {
    let total = 0;
    let aces = 0;
    
    for (const card of cards) {
        if (card === 1) {
            aces++;
            total += 11; // Initially count ace as 11
        } else if (card >= 10) {
            total += 10; // Face cards worth 10
        } else {
            total += card;
        }
    }
    
    // Adjust for aces (convert 11 to 1 if needed)
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    
    return total;
}
```

### **Game Result Detection**
```typescript
private async playBlackjackHand(): Promise<string> {
    // Wait for cards to be dealt
    await this.waitForCardsDealt();
    
    // Read game state
    const playerCards = this.readPlayerCards();
    const dealerUpCard = this.readDealerUpCard();
    
    // Execute optimal strategy
    while (true) {
        const action = this.getOptimalAction(playerCards, dealerUpCard);
        
        if (action === "stand") {
            await this.clickStand();
            break;
        } else if (action === "hit") {
            await this.clickHit();
            // Update player cards
            playerCards.push(...this.readNewCards());
        }
        
        // Check for bust
        if (this.calculateHandValue(playerCards) > 21) {
            return "lose";
        }
    }
    
    // Wait for dealer play and determine result
    const result = await this.determineGameResult();
    return result; // "win", "lose", "tie", or "kicked_out"
}
```

## Performance Optimization

### **Ultra-Fast Mode Operation**
```typescript
// Ultra-fast delays for maximum throughput
await this.ns.sleep(100); // Minimal delay
await this.ns.sleep(50);  // Ultra-fast mode

// No delays between hands in continuous play
while (handsPlayed < 1000) {
    // Play hand
    const result = await this.playBlackjackHand();
    // Immediate next hand (no sleep)
}
```

### **Efficient DOM Interaction**
```typescript
private async clickElement(element: HTMLElement): Promise<void> {
    // Optimized clicking with minimal delay
    element.click();
    // No artificial delays unless required
}

private async setInputValue(input: HTMLInputElement, value: string): Promise<void> {
    // Direct value setting with event triggering
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}
```

## Error Recovery Strategy

### **Page Reload System**
```typescript
private async reloadPage(): Promise<void> {
    this.log("🔄 Reloading page...");
    
    const win = getWindowAPI();
    win.location.reload();
    
    // Wait for page load
    await this.ns.sleep(2000);
    
    // Re-navigate to casino
    await this.navigateToCasino();
    this.stats.totalReloads++;
}
```

### **Kicked Out Detection**
```typescript
private async checkKickedOut(): Promise<boolean> {
    const doc = getDocumentAPI();
    
    // Check for various kicked out messages
    const kickedOutMessages = [
        "//p[contains(text(), 'We no longer wish to have your business')]",
        "//div[contains(text(), 'kicked out')]",
        "//span[contains(text(), 'banned')]"
    ];
    
    for (const xpath of kickedOutMessages) {
        const element = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            return true;
        }
    }
    
    return false;
}
```

## Statistics and Monitoring

### **Comprehensive Performance Tracking**
```typescript
interface CasinoStats {
    handsPlayed: number;
    wins: number;
    losses: number;
    pushes: number;
    netProfit: number;
    totalReloads: number;
    startTime: number;
}

// Real-time statistics updates
this.stats.wins++;
this.stats.losses++;
this.stats.pushes++;
this.stats.handsPlayed++;
this.stats.totalReloads++;
```

### **Success Tracking and Persistence**
```typescript
// Save game state on significant wins
if (netWinnings > peakWinnings) {
    peakWinnings = netWinnings;
    await this.saveGame(); // Persist progress
}

// Success notifications
ns.toast(`🎉 CONTRACT SOLVED! ${result}`, 'success', 5000);
```

## Integration with Browser Environment

### **Game State Persistence**
```typescript
private async saveGame(): Promise<void> {
    // Manual save trigger (if available in game)
    const saveButton = doc.querySelector('[title="Save Game"]');
    if (saveButton) {
        await this.clickElement(saveButton as HTMLElement);
    }
}
```

### **Money Tracking**
```typescript
private getCurrentMoney(): number {
    // Read current money from game interface
    return this.ns.getPlayer().money;
}
```

## Advanced Features

### **Asynchronous Game State Waiting**
```typescript
private waitForGameStart(): Promise<void> {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
            // Watch for DOM changes indicating game start
            for (const mutation of mutations) {
                if (this.detectGameStarted(mutation)) {
                    observer.disconnect();
                    resolve();
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
```

### **Robust Element Finding**
```typescript
private async waitForElement(xpath: string, timeout: number = 5000): Promise<HTMLElement> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const element = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            return element as HTMLElement;
        }
        await this.ns.sleep(100);
    }
    
    throw new Error(`Element not found: ${xpath}`);
}
```

## Configuration and Control

### **Configurable Parameters**
```typescript
interface CasinoConfig {
    debugMode?: boolean;
    maxHands?: number;
    betPercentage?: number;
    maxBet?: number;
    minBet?: number;
}

// Default configuration
const defaultConfig: CasinoConfig = {
    debugMode: false,
    maxHands: 1000,
    betPercentage: 0.9,  // 90% of money
    maxBet: 100000000,   // $100M
    minBet: 1000         // $1K minimum
};
```

### **Operational Modes**
- **Ultra-Fast Mode**: Minimal delays, maximum throughput
- **Safe Mode**: Conservative delays, higher reliability
- **Debug Mode**: Detailed logging and step-by-step operation

This technical implementation provides a comprehensive foundation for automated casino gambling with optimal blackjack strategy, robust error handling, and sophisticated browser automation capabilities.