# Early Game Autopilot - Pre-Singularity Browser Automation

## Problem Statement

**Core Issue:** Before completing BitNode 4 (Singularity), players lack automation APIs and must manually:
- Navigate UI to join factions
- Purchase augmentations through browser interface
- Manage faction work and reputation
- Coordinate progression decisions

**Constraint:** No Singularity API means all automation must happen through browser DOM manipulation.

## Solution: Browser-First Autopilot

Build on existing `navigator.ts` system to create **intelligent browser automation** that works without Singularity APIs.

## Architecture: Simplified & Focused

```
Early Game Autopilot
├── Game State Reader (NS API + DOM scraping)
├── Decision Engine (Guide system integration)
├── Navigator Controller (Existing navigator.ts)
└── Task Coordinator (Simple queue)
```

## Core Components

### 1. Game State Reader
```typescript
interface EarlyGameState {
    player: {
        money: number;
        hacking: number;
        combat: { str: number; def: number; dex: number; agi: number };
    };
    factions: {
        available: string[];      // Scraped from factions page
        joined: string[];         // From NS API
        reputation: Record<string, number>;  // From NS API
    };
    augmentations: {
        available: string[];      // Scraped from aug pages
        owned: string[];          // From NS API
        costs: Record<string, number>;  // Scraped from UI
    };
}

class EarlyGameStateReader {
    constructor(private ns: NS, private navigator: Navigator) {}
    
    async getGameState(): Promise<EarlyGameState> {
        // Combine NS API data with DOM scraping
        const nsData = this.getNSData();
        const domData = await this.scrapeDOMData();
        return this.mergeState(nsData, domData);
    }
    
    private async scrapeDOMData() {
        // Navigate to pages and scrape faction/aug availability
        const factionsPage = await this.navigator.navigate(GameSection.Factions);
        const availableFactions = await this.scrapeAvailableFactions(factionsPage);
        
        // Similar for augmentations
        return { availableFactions, /* ... */ };
    }
}
```

### 2. Simple Decision Engine
```typescript
class EarlyGameDecisionEngine {
    constructor(private guide: GuideBridge, private state: EarlyGameState) {}
    
    getNextAction(): AutopilotAction | null {
        // Simple decision tree based on current state
        if (this.shouldJoinFaction()) {
            return new JoinFactionAction(this.getBestAvailableFaction());
        }
        
        if (this.shouldBuyAugmentation()) {
            return new BuyAugmentationAction(this.getBestAffordableAug());
        }
        
        if (this.shouldWorkForRep()) {
            return new WorkForFactionAction(this.getBestFactionToWorkFor());
        }
        
        return null; // Continue current activity
    }
}
```

### 3. Browser Automation Actions
```typescript
abstract class AutopilotAction {
    abstract execute(navigator: Navigator): Promise<ActionResult>;
}

class JoinFactionAction extends AutopilotAction {
    constructor(private factionName: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const factionsPage = await navigator.navigate(GameSection.Factions);
        
        // Use existing navigator functionality
        const success = await factionsPage.joinFaction(this.factionName);
        
        return success ? ActionResult.SUCCESS : ActionResult.FAILED;
    }
}

class BuyAugmentationAction extends AutopilotAction {
    constructor(private augName: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const augPage = await navigator.navigate(GameSection.Augmentations);
        return await augPage.buyAugmentation(this.augName);
    }
}

class WorkForFactionAction extends AutopilotAction {
    constructor(private factionName: string, private workType: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const factionsPage = await navigator.navigate(GameSection.Factions);
        // Navigate to specific faction and start work
        return await this.startFactionWork(factionsPage);
    }
}
```

## Implementation Plan

### Phase 1: DOM State Reading (Week 1)
**Goal:** Reliable game state without Singularity API

```typescript
// src/early-game/state-reader.ts
class EarlyGameStateReader {
    async scrapeFactionsPage(): Promise<FactionInfo[]>;
    async scrapeAugmentationsPage(): Promise<AugmentationInfo[]>;
    async getCurrentGameState(): Promise<EarlyGameState>;
}
```

**Success Criteria:**
- [ ] Can detect available factions via DOM scraping
- [ ] Can read augmentation costs and requirements
- [ ] Combines NS API data with scraped data reliably

### Phase 2: Basic Automation (Week 2)
**Goal:** Simple faction joining and rep farming

```typescript
// src/early-game/basic-autopilot.ts
class BasicEarlyGameAutopilot {
    async autoJoinBestFaction(): Promise<boolean>;
    async autoWorkForRep(factionName: string): Promise<boolean>;
    async monitorAndDecide(): Promise<void>;
}
```

**Success Criteria:**
- [ ] Automatically joins CyberSec when requirements met
- [ ] Works for faction reputation automatically
- [ ] Handles basic error cases (faction already joined, etc.)

### Phase 3: Smart Purchasing (Week 3)
**Goal:** Intelligent augmentation decisions

```typescript
// src/early-game/smart-purchaser.ts
class SmartAugmentationPurchaser {
    async evaluateAffordableAugmentations(): Promise<RankedAugmentation[]>;
    async purchaseOptimalAugmentations(): Promise<PurchaseResult[]>;
    async planInstallationTiming(): Promise<InstallationPlan>;
}
```

**Success Criteria:**
- [ ] Uses guide system ROI calculations
- [ ] Purchases augmentations in optimal order
- [ ] Respects budget constraints

### Phase 4: Complete Early Game Loop (Week 4)
**Goal:** Full automation for early game progression

```typescript
// src/early-game-autopilot.ts
export async function main(ns: NS): Promise<void> {
    const autopilot = new EarlyGameAutopilot(ns);
    await autopilot.runEarlyGameLoop();
}
```

**Success Criteria:**
- [ ] Can progress from start to first augmentation installation automatically
- [ ] Handles CyberSec → NiteSec progression
- [ ] Makes intelligent money vs augmentation decisions

## Integration with Existing Systems

### Navigator Integration
```typescript
// Extend existing navigator with autopilot-specific methods
class AutopilotNavigator extends Navigator {
    async autoJoinFaction(factionName: string): Promise<boolean> {
        const page = await this.navigate(GameSection.Factions);
        return await this.findAndClickFactionJoin(factionName);
    }
    
    async autoStartFactionWork(factionName: string, workType: string): Promise<boolean> {
        // Navigate to faction and start optimal work type
    }
}
```

### Guide System Integration
```typescript
// Use existing guide system for decision making
class EarlyGameGuideIntegration {
    constructor(private guide: GuideSystem) {}
    
    getBestFactionForProgression(currentState: EarlyGameState): string {
        // Use guide's faction progression logic
        return this.guide.getNextFactionTarget(currentState);
    }
    
    getOptimalAugmentations(budget: number): EnhancedAugmentData[] {
        // Use guide's ROI analytics
        return this.guide.analyzeAugmentations(budget);
    }
}
```

## File Structure

```
src/
├── early-game-autopilot.ts           # Main entry point
├── early-game/
│   ├── state-reader.ts               # DOM scraping + NS API
│   ├── decision-engine.ts            # Simple decision logic
│   ├── actions/
│   │   ├── faction-actions.ts        # Join, work for factions
│   │   ├── augmentation-actions.ts   # Purchase, install augs
│   │   └── navigation-actions.ts     # Browser automation
│   ├── navigator-extensions.ts       # Extend existing navigator
│   └── guide-integration.ts          # Bridge to guide system
```

## Example Usage

```bash
# Start early game autopilot
run early-game-autopilot.js

# With specific configuration
run early-game-autopilot.js --conservative --target-faction=CyberSec

# Debug mode to see decision making
run early-game-autopilot.js --debug --dry-run
```

## Benefits of This Approach

### 1. **Addresses Real Problem**
- Solves actual pre-Singularity automation gap
- Provides immediate value for early game players
- Works within game constraints

### 2. **Builds on Existing Code**
- Leverages robust navigator system
- Uses guide system intelligence
- Minimal new architecture needed

### 3. **Simple & Focused**
- Clear problem scope
- No complex multi-system coordination
- Easy to understand and maintain

### 4. **Iterative Development**
- Each phase provides working automation
- Can ship basic version quickly
- Natural progression to more features

## Risk Assessment

### Low Risk Items
- **DOM Scraping:** Navigator already proves this works
- **Decision Logic:** Guide system provides proven algorithms
- **Browser Automation:** Navigator framework is robust

### Medium Risk Items
- **Game Updates:** UI changes could break scraping
- **Performance:** DOM automation might be slower than Singularity
- **Edge Cases:** Unexpected game states during automation

### Mitigation Strategies
- **Robust Selectors:** Use multiple fallback DOM selectors
- **Error Recovery:** Graceful fallback when automation fails
- **User Override:** Allow manual intervention when needed

## Success Metrics

### Immediate Goals (4 weeks)
- [ ] CyberSec joining automated
- [ ] First augmentation purchases automated
- [ ] Early faction progression working

### Medium-term Goals (8 weeks)
- [ ] Complete early game automation (start → first install)
- [ ] Multiple BitNode 1 runs without manual intervention
- [ ] Integration with existing botnet for income

### Long-term Vision
- [ ] Bridge to Singularity automation when unlocked
- [ ] Community adoption for early game players
- [ ] Foundation for advanced automation systems

This focused approach solves your actual problem (pre-Singularity automation) using proven technology (your navigator system) with a realistic timeline and scope.