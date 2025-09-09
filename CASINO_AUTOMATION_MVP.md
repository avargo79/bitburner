# Casino Automation MVP - Simple & Effective

## Overview
Minimal viable implementation for automated casino gameplay in Bitburner. This focuses on **working automation quickly** rather than building an enterprise framework.

**Goal**: Navigate to casino, play blackjack with basic strategy, track winnings.

**Implementation Time**: 1-2 days  
**File Count**: 1 main file + utilities  
**Lines of Code**: ~200-300 lines  

## Core Requirements

### 1. Casino Navigation
- Navigate to Aevum → Iker Molina Casino
- Handle any popups or loading states
- Verify casino page loaded successfully

### 2. Blackjack Automation
- Find and click blackjack table
- Implement basic blackjack strategy:
  - Hit on 16 or less
  - Stand on 17 or more
  - Split pairs (optional)
  - Double down on 11 (optional)
- Handle game flow (deal, hit/stand, collect winnings)

### 3. Bankroll Management
- Set betting amount (configurable)
- Track wins/losses
- Stop conditions (max loss, target profit, time limit)
- Basic statistics logging

## Technical Implementation

### Single File Approach: `src/casino-bot.ts`

```typescript
import { NS } from '@ns';
import { getWindowAPI, getDocumentAPI, clickElement } from '/browser-utils';

interface CasinoBotConfig {
  betAmount: number;
  maxLoss: number;
  targetProfit: number;
  maxHands: number;
}

export default class CasinoBot {
  private ns: NS;
  private config: CasinoBotConfig;
  private stats = {
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    netProfit: 0
  };

  constructor(ns: NS, config: CasinoBotConfig) {
    this.ns = ns;
    this.config = config;
  }

  async run(): Promise<void> {
    // 1. Navigate to casino
    if (!await this.navigateToCasino()) {
      this.ns.tprint("Failed to navigate to casino");
      return;
    }

    // 2. Play blackjack
    await this.playBlackjack();

    // 3. Report results
    this.reportStats();
  }

  private async navigateToCasino(): Promise<boolean> {
    const doc = getDocumentAPI();
    
    // Navigate to Aevum
    const aevumBtn = doc.querySelector('[data-city="Aevum"]');
    if (aevumBtn) aevumBtn.click();
    await this.sleep(1000);

    // Navigate to casino
    const casinoBtn = doc.querySelector('[data-location="casino"]');
    if (casinoBtn) {
      casinoBtn.click();
      await this.sleep(2000);
      return true;
    }
    
    return false;
  }

  private async playBlackjack(): Promise<void> {
    const doc = getDocumentAPI();
    
    // Find blackjack table
    const blackjackBtn = doc.querySelector('.blackjack-table, [data-game="blackjack"]');
    if (!blackjackBtn) return;
    
    blackjackBtn.click();
    await this.sleep(1000);

    // Main game loop
    while (this.shouldContinuePlaying()) {
      await this.playHand();
      this.stats.handsPlayed++;
    }
  }

  private async playHand(): Promise<void> {
    const doc = getDocumentAPI();
    
    // Place bet
    const betInput = doc.querySelector('input[type="number"]') as HTMLInputElement;
    if (betInput) betInput.value = this.config.betAmount.toString();
    
    const dealBtn = doc.querySelector('.deal-btn, [data-action="deal"]');
    if (dealBtn) dealBtn.click();
    
    await this.sleep(1000);

    // Play hand with basic strategy
    while (true) {
      const handValue = this.getHandValue();
      if (handValue >= 17) {
        // Stand
        const standBtn = doc.querySelector('.stand-btn, [data-action="stand"]');
        if (standBtn) standBtn.click();
        break;
      } else {
        // Hit
        const hitBtn = doc.querySelector('.hit-btn, [data-action="hit"]');
        if (hitBtn) hitBtn.click();
        await this.sleep(500);
      }
    }

    // Wait for hand to complete and update stats
    await this.sleep(2000);
    this.updateStats();
  }

  private getHandValue(): number {
    const doc = getDocumentAPI();
    const handElement = doc.querySelector('.player-hand-value, .hand-total');
    return handElement ? parseInt(handElement.textContent || '0') : 0;
  }

  private updateStats(): void {
    // Read game result and update win/loss counters
    const doc = getDocumentAPI();
    const resultElement = doc.querySelector('.game-result, .hand-result');
    const result = resultElement?.textContent?.toLowerCase() || '';
    
    if (result.includes('win')) {
      this.stats.wins++;
      this.stats.netProfit += this.config.betAmount;
    } else if (result.includes('lose')) {
      this.stats.losses++;
      this.stats.netProfit -= this.config.betAmount;
    }
  }

  private shouldContinuePlaying(): boolean {
    return (
      this.stats.handsPlayed < this.config.maxHands &&
      this.stats.netProfit > -this.config.maxLoss &&
      this.stats.netProfit < this.config.targetProfit
    );
  }

  private reportStats(): void {
    this.ns.tprint(`Casino Bot Results:`);
    this.ns.tprint(`Hands Played: ${this.stats.handsPlayed}`);
    this.ns.tprint(`Wins: ${this.stats.wins} | Losses: ${this.stats.losses}`);
    this.ns.tprint(`Net Profit: $${this.stats.netProfit.toLocaleString()}`);
    this.ns.tprint(`Win Rate: ${(this.stats.wins / this.stats.handsPlayed * 100).toFixed(1)}%`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage script
export async function main(ns: NS): Promise<void> {
  const config: CasinoBotConfig = {
    betAmount: 1000,
    maxLoss: 50000,
    targetProfit: 100000,
    maxHands: 100
  };

  const bot = new CasinoBot(ns, config);
  await bot.run();
}
```

## Required Utilities

### Browser Utils Integration
Uses existing `src/browser-utils.ts` for zero-cost DOM access:
- `getDocumentAPI()` - Free document access
- Element selection and clicking
- Form interaction

### Configuration
Simple config object passed to constructor - no complex configuration system needed.

## Deployment Strategy

### Phase 1: Basic Implementation (Day 1)
1. Create `src/casino-bot.ts` with core functionality
2. Test navigation to casino
3. Implement basic blackjack gameplay
4. Add simple win/loss tracking

### Phase 2: Enhancement (Day 2)
1. Improve strategy (splits, doubles)
2. Better error handling
3. Enhanced statistics
4. Configuration options

### Phase 3: Integration (Optional)
1. Add to task scheduler if desired
2. Database persistence for long-term stats
3. Advanced strategies

## Success Metrics
- ✅ Can navigate to casino automatically
- ✅ Can play blackjack hands without manual intervention
- ✅ Tracks basic statistics (wins, losses, profit)
- ✅ Respects stop conditions (max loss, target profit)
- ✅ Runs reliably for extended periods

## Advantages of MVP Approach

### Speed
- Working automation in 1-2 days vs 4+ weeks
- Simple debugging and testing
- Quick iterations and improvements

### Maintainability
- Single file - easy to understand and modify
- Minimal dependencies
- Clear, straightforward logic

### Extensibility
- Easy to add features incrementally
- Can evolve into complex system if needed
- Foundation for future casino games

## Future Enhancements (Optional)
Once MVP is working, can add:
- Advanced blackjack strategy (card counting)
- Multiple casino games (poker, slots, roulette)
- Advanced bankroll management
- Machine learning for optimal strategies
- Multi-casino coordination

## Why This Approach Works
1. **Focus on core value**: Working casino automation
2. **Rapid feedback**: See results quickly, iterate fast
3. **Risk reduction**: Small investment, proven concept first
4. **User satisfaction**: Delivers working solution immediately
5. **Foundation for growth**: Can become complex system later if needed

**Philosophy**: Make it work first, then make it sophisticated.