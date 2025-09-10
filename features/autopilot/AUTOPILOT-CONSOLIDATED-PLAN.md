# Bitburner Autopilot System - Consolidated Implementation Plan

## Executive Summary

The Bitburner Autopilot System provides hands-off gameplay automation by integrating with existing navigator and guide systems. The system monitors game state changes and executes optimal progression strategies automatically, adapting to different BitNodes and game phases.

**Key Innovation:** Browser-first automation that works before unlocking Singularity APIs, using proven navigator system and zero-cost DOM access techniques.

## Problem & Solution

### **Current Limitations**
- Manual oversight required for faction joining and augmentation purchases
- No automation available before BitNode 4 (Singularity) completion
- Coordination needed between botnet, navigator, and guide systems
- BitNode-specific optimization requires manual strategy changes

### **Autopilot Solution**
- **Browser-first automation** using existing navigator system (no Singularity required)
- **Intelligent decision making** based on guide system ROI analytics
- **Zero-cost DOM access** using stealth techniques (`globalThis['doc' + 'ument']`)
- **Minimal integration** with existing proven systems

## Implementation Strategy: Iterative & Practical

### **Approach Decision: Early Game Focus**
After analyzing three approaches (Full System PRD, Framework Architecture, Early Game Focus), the **Early Game Focus** approach is optimal because:

- ✅ **Immediate value** - Works from game start, no Singularity required
- ✅ **Proven foundation** - Builds on robust navigator system
- ✅ **Manageable scope** - Clear problem boundaries, realistic timeline
- ✅ **Natural progression** - Can evolve toward full system later

## Technical Architecture

### **Core Components**
```
Early Game Autopilot
├── Game State Reader (NS API + DOM scraping)
├── Decision Engine (Guide system integration)  
├── Navigator Controller (Existing navigator.ts)
└── Task Coordinator (Priority queue)
```

### **Game State Management**
```typescript
interface EarlyGameState {
    player: {
        money: number;
        hacking: number;
        combat: { str: number; def: number; dex: number; agi: number };
        charisma: number;
        intelligence?: number;
    };
    factions: {
        available: string[];      // Scraped from factions page
        joined: string[];         // From NS API  
        reputation: Record<string, number>;  // From NS API
        currentWork?: string;     // Detected from "Working for " text
    };
    augmentations: {
        available: string[];      // Scraped from aug pages
        owned: string[];          // From NS API
        costs: Record<string, number>;  // Scraped from UI
        affordable: string[];     // Calculated from budget
    };
    bitNode: { current: number; level: number };
    timestamp: number;
}

class EarlyGameStateReader {
    constructor(private ns: NS, private navigator: Navigator) {}
    
    async getGameState(): Promise<EarlyGameState> {
        // Combine NS API data with DOM scraping
        const nsData = this.getNSData();
        const domData = await this.scrapeDOMData();
        return this.mergeState(nsData, domData);
    }
    
    async scrapeDOMData() {
        // Navigate to pages and scrape faction/aug availability
        const factionsPage = await this.navigator.navigate(GameSection.Factions);
        const availableFactions = await this.scrapeAvailableFactions(factionsPage);
        
        const augsPage = await this.navigator.navigate(GameSection.Augmentations);
        const availableAugs = await this.scrapeAugmentations(augsPage);
        
        return { availableFactions, availableAugs };
    }
}
```

### **Decision Engine**
```typescript
class EarlyGameDecisionEngine {
    constructor(private guide: GuideBridge, private config: AutopilotConfig) {}
    
    getNextAction(state: EarlyGameState): AutopilotAction | null {
        // Priority-based decision tree
        
        // CRITICAL: Red Pill progression
        if (this.shouldPursueRedPill(state)) {
            return this.getRedPillAction(state);
        }
        
        // HIGH: Essential augmentation purchases
        if (this.shouldBuyAugmentation(state)) {
            const bestAug = this.guide.getOptimalAugmentation(state.player.money, state.augmentations.available);
            return new BuyAugmentationAction(bestAug.name);
        }
        
        // HIGH: Join high-value factions
        if (this.shouldJoinFaction(state)) {
            const targetFaction = this.guide.getNextFactionTarget(state);
            return new JoinFactionAction(targetFaction);
        }
        
        // MEDIUM: Work for faction reputation
        if (this.shouldWorkForRep(state)) {
            const bestFaction = this.getBestFactionToWorkFor(state);
            const workType = this.getOptimalWorkType(state, bestFaction);
            return new WorkForFactionAction(bestFaction, workType);
        }
        
        return null; // Continue current activity (botnet farming)
    }
    
    private shouldBuyAugmentation(state: EarlyGameState): boolean {
        const budget = state.player.money * this.config.priorities.maxSpendingRatio;
        const affordableAugs = this.guide.getAffordableAugmentations(budget);
        return affordableAugs.length > 0;
    }
    
    private shouldJoinFaction(state: EarlyGameState): boolean {
        const targetFaction = this.guide.getNextFactionTarget(state);
        return targetFaction && !state.factions.joined.includes(targetFaction);
    }
    
    private shouldWorkForRep(state: EarlyGameState): boolean {
        // Only work if not already working and have joined factions needing rep
        return !state.factions.currentWork && this.guide.needsMoreReputation(state);
    }
}
```

### **Browser Automation Actions**
```typescript
abstract class AutopilotAction {
    abstract execute(navigator: Navigator): Promise<ActionResult>;
    abstract getDescription(): string;
    abstract getEstimatedTime(): number;
}

class JoinFactionAction extends AutopilotAction {
    constructor(private factionName: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const factionsPage = await navigator.navigate(GameSection.Factions);
        
        // Use existing navigator functionality with error handling
        try {
            const success = await factionsPage.joinFaction(this.factionName);
            return success ? ActionResult.SUCCESS : ActionResult.FAILED;
        } catch (error) {
            return ActionResult.ERROR;
        }
    }
    
    getDescription(): string { return `Join ${this.factionName} faction`; }
    getEstimatedTime(): number { return 5000; } // 5 seconds
}

class BuyAugmentationAction extends AutopilotAction {
    constructor(private augName: string, private factionName: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const augPage = await navigator.navigate(GameSection.Augmentations);
        return await augPage.buyAugmentation(this.augName, this.factionName);
    }
    
    getDescription(): string { return `Buy ${this.augName} from ${this.factionName}`; }
    getEstimatedTime(): number { return 8000; } // 8 seconds
}

class WorkForFactionAction extends AutopilotAction {
    constructor(private factionName: string, private workType: string) { super(); }
    
    async execute(navigator: Navigator): Promise<ActionResult> {
        const factionsPage = await navigator.navigate(GameSection.Factions);
        return await this.startFactionWork(factionsPage);
    }
    
    getDescription(): string { return `Work for ${this.factionName} (${this.workType})`; }
    getEstimatedTime(): number { return 10000; } // 10 seconds
}

enum ActionResult {
    SUCCESS = 'success',
    FAILED = 'failed', 
    ERROR = 'error',
    RETRY = 'retry'
}
```

## Implementation Plan

### **Phase 1: Foundation (Week 1)**
**Goal:** Game state monitoring and basic decision framework

#### Tasks:
1. **Create autopilot entry point** (`src/autopilot.ts`)
2. **Implement EarlyGameStateReader** with DOM scraping
3. **Basic decision engine** with simple faction joining logic
4. **Integration with existing navigator system**

#### Success Criteria:
- [ ] Can detect available factions via DOM scraping
- [ ] Basic faction joining automation works
- [ ] Integration with guide system for faction recommendations
- [ ] Command-line interface functional

### **Phase 2: Automation Core (Week 2)**
**Goal:** Essential faction and augmentation automation

#### Tasks:
1. **Faction work automation** with optimal work type selection
2. **Augmentation purchase logic** using guide system ROI
3. **Error handling and recovery** for UI automation failures
4. **Status monitoring and logging**

#### Success Criteria:
- [ ] Automatically works for faction reputation
- [ ] Purchases augmentations based on ROI analysis
- [ ] Handles common error scenarios gracefully
- [ ] Provides clear status information to user

### **Phase 3: Intelligence (Week 3)**
**Goal:** Smart decision making and optimization

#### Tasks:
1. **Budget management** with spending ratio controls
2. **Faction conflict resolution** (city factions, etc.)
3. **Work type optimization** based on player stats
4. **Installation timing** for augmentations

#### Success Criteria:
- [ ] Makes intelligent spending decisions within budget
- [ ] Handles faction conflicts appropriately
- [ ] Optimizes work types for efficiency
- [ ] Plans augmentation installation timing

### **Phase 4: Complete Loop (Week 4)**
**Goal:** Full early game progression automation

#### Tasks:
1. **End-to-end testing** from game start to first augmentation install
2. **Performance optimization** and monitoring
3. **Advanced configuration options**
4. **Documentation and user guide**

#### Success Criteria:
- [ ] Can progress from start to first install automatically
- [ ] Handles CyberSec → NiteSec → other faction progression
- [ ] Performance acceptable with existing botnet
- [ ] User documentation complete

## Configuration System

### **Basic Configuration**
```typescript
interface AutopilotConfig {
    enabled: boolean;
    mode: 'conservative' | 'balanced' | 'aggressive';
    
    priorities: {
        maxSpendingRatio: number;        // Max % of money to spend (0.1-0.8)
        factionRepBuffer: number;        // Extra rep before switching (1.0-2.0)
        augmentCostThreshold: number;    // Cost threshold for auto-purchase
        minCashReserve: number;          // Emergency fund to maintain
    };
    
    restrictions: {
        neverPurchase: string[];         // Augments to never buy automatically
        priorityPurchase: string[];      // Augments to prioritize
        excludeFactions: string[];       // Factions to avoid joining
        targetCity?: string;             // Restrict to specific city
    };
    
    automation: {
        autoJoinFactions: boolean;       // Enable faction joining
        autoWorkForRep: boolean;         // Enable faction work
        autoBuyAugments: boolean;        // Enable augmentation purchases
        autoInstallAugments: boolean;    // Enable installation
    };
}
```

### **Predefined Configurations**
```typescript
const AUTOPILOT_PRESETS = {
    conservative: {
        priorities: { maxSpendingRatio: 0.2, factionRepBuffer: 2.0 },
        automation: { autoInstallAugments: false } // Manual install approval
    },
    
    balanced: {
        priorities: { maxSpendingRatio: 0.5, factionRepBuffer: 1.5 },
        automation: { autoInstallAugments: true }
    },
    
    aggressive: {
        priorities: { maxSpendingRatio: 0.8, factionRepBuffer: 1.2 },
        automation: { autoInstallAugments: true }
    }
};
```

## Command-Line Interface

### **Basic Usage**
```bash
# Start early game autopilot with defaults
run autopilot.js

# Use predefined configuration
run autopilot.js --config=conservative
run autopilot.js --config=balanced  
run autopilot.js --config=aggressive

# Custom settings
run autopilot.js --max-spending=0.3 --target-faction=CyberSec

# Debug and testing
run autopilot.js --debug --dry-run
```

### **Runtime Control**
```bash
# Status and monitoring
run autopilot.js status
run autopilot.js pause
run autopilot.js resume

# Configuration management  
run autopilot.js config --set maxSpendingRatio=0.4
run autopilot.js config --show
```

## Integration with Existing Systems

### **Navigator Integration**
- **Leverages existing browser automation** with 97.9% RAM optimization
- **Extends navigation capabilities** for autopilot-specific actions
- **Maintains compatibility** with manual navigator usage
- **Zero conflicts** with existing UI automation

### **Guide System Integration**
- **Uses proven ROI analytics** for augmentation decisions
- **Leverages faction progression logic** for optimal targeting
- **Integrates BitNode strategies** for adaptive optimization
- **Maintains guide independence** for manual consultation

### **Botnet Coordination**
- **Monitors income rates** for budget planning
- **Coordinates timing** to avoid conflicts during UI automation
- **Integrates with botnet share feature** for faction work optimization
- **Maintains botnet independence** for standalone money farming

## File Structure

### **New Files**
```
src/
├── autopilot.ts                        # Main entry point and orchestration
├── autopilot/
│   ├── state-reader.ts                 # Game state monitoring with DOM scraping
│   ├── decision-engine.ts              # Decision making logic
│   ├── config-manager.ts               # Configuration management
│   ├── actions/
│   │   ├── faction-actions.ts          # Faction joining and work automation
│   │   ├── augmentation-actions.ts     # Purchase and install automation
│   │   └── coordination-actions.ts     # System coordination tasks
│   └── integrations/
│       ├── navigator-bridge.ts         # Navigator system integration
│       ├── guide-bridge.ts             # Guide system integration
│       └── botnet-bridge.ts            # Botnet coordination
```

### **Integration Points**
- **Navigator**: Extend existing `src/navigator.ts` with autopilot methods
- **Guide**: Use existing `src/guide.ts` for ROI and strategy logic
- **Botnet**: Coordinate with `src/botnet.ts` for income and timing

## Implementation Details

### **Phase 1: Foundation (Week 1)**

#### 1.1 Main Entry Point
```typescript
// src/autopilot.ts
export async function main(ns: NS): Promise<void> {
    const config = loadConfiguration(ns.args);
    const navigator = new Navigator(ns);
    const guide = new GuideSystem(ns);
    
    const stateReader = new EarlyGameStateReader(ns, navigator);
    const decisionEngine = new EarlyGameDecisionEngine(guide, config);
    const taskCoordinator = new TaskCoordinator();
    
    await runAutopilotLoop(stateReader, decisionEngine, taskCoordinator);
}
```

#### 1.2 Command-Line Options
```typescript
const argsSchema: [string, string | number | boolean | string[]][] = [
    ['config', 'balanced'],              // Preset configuration
    ['max-spending', 0.5],               // Max spending ratio
    ['target-faction', ''],              // Specific faction focus
    ['dry-run', false],                  // Show actions without executing
    ['debug', false],                    // Enable debug output
    ['auto-install', true],              // Enable augmentation installation
];
```

#### 1.3 Game State Reader
```typescript
// src/autopilot/state-reader.ts
export class EarlyGameStateReader {
    async getGameState(): Promise<EarlyGameState> {
        const nsData = {
            player: {
                money: this.ns.getServerMoneyAvailable('home'),
                hacking: this.ns.getHackingLevel(),
                combat: {
                    str: this.ns.getPlayer().skills.strength,
                    def: this.ns.getPlayer().skills.defense,
                    dex: this.ns.getPlayer().skills.dexterity,
                    agi: this.ns.getPlayer().skills.agility
                }
            },
            factions: {
                joined: this.ns.getPlayer().factions,
                reputation: this.getFactionsReputation()
            },
            augmentations: {
                owned: this.ns.singularity?.getOwnedAugmentations() || []
            }
        };
        
        // Scrape DOM for data not available via NS API
        const domData = await this.scrapeDOMData();
        
        return this.mergeState(nsData, domData);
    }
    
    private async scrapeDOMData() {
        // Use zero-cost DOM access
        const doc = globalThis['doc' + 'ument'];
        
        // Check if currently doing faction work
        const currentWork = doc.body.textContent.includes('Working for ') ? 
            this.extractCurrentWork(doc.body.textContent) : null;
        
        // Navigate and scrape faction availability
        const factionsPage = await this.navigator.navigate(GameSection.Factions);
        const availableFactions = await this.scrapeAvailableFactions();
        
        return { currentWork, availableFactions };
    }
}
```

### **Phase 2: Decision Engine (Week 2)**

#### 2.1 Core Decision Logic
```typescript
// src/autopilot/decision-engine.ts
export class EarlyGameDecisionEngine {
    getNextAction(state: EarlyGameState): AutopilotAction | null {
        // Use guide system for intelligent decisions
        const recommendations = this.guide.getProgressionRecommendations(state);
        
        // Priority 1: Critical augmentations (Red Pill path)
        const criticalAug = recommendations.criticalAugmentations[0];
        if (criticalAug && this.canAfford(criticalAug, state.player.money)) {
            return new BuyAugmentationAction(criticalAug.name, criticalAug.faction);
        }
        
        // Priority 2: Join required factions
        const targetFaction = recommendations.nextFaction;
        if (targetFaction && state.factions.available.includes(targetFaction)) {
            return new JoinFactionAction(targetFaction);
        }
        
        // Priority 3: Work for reputation if needed
        const repNeeded = recommendations.reputationNeeded;
        if (repNeeded && !state.factions.currentWork) {
            return new WorkForFactionAction(repNeeded.faction, repNeeded.workType);
        }
        
        return null;
    }
}
```

#### 2.2 Guide System Bridge
```typescript
// src/autopilot/integrations/guide-bridge.ts
export class GuideBridge {
    constructor(private guide: GuideSystem) {}
    
    getProgressionRecommendations(state: EarlyGameState): ProgressionRecommendations {
        // Leverage existing guide analytics
        const optimalAugs = this.guide.analyzeAugmentations(state.player.money);
        const nextFaction = this.guide.getOptimalFactionProgression(state);
        
        return {
            criticalAugmentations: optimalAugs.filter(a => a.priority === 'critical'),
            nextFaction: nextFaction,
            reputationNeeded: this.calculateReputationNeeds(state, optimalAugs)
        };
    }
}
```

### **Phase 3: Action Implementation (Week 3)**

#### 3.1 Faction Actions
```typescript
// src/autopilot/actions/faction-actions.ts
export class FactionJoinAction extends AutopilotAction {
    async execute(navigator: Navigator): Promise<ActionResult> {
        try {
            // Navigate to factions page
            await navigator.navigate(GameSection.Factions);
            
            // Use DOM manipulation to find and click join button
            const doc = globalThis['doc' + 'ument'];
            const factionElement = this.findFactionElement(doc, this.factionName);
            
            if (factionElement) {
                const joinButton = this.findJoinButton(factionElement);
                if (joinButton) {
                    joinButton.click();
                    await this.waitForJoinConfirmation();
                    return ActionResult.SUCCESS;
                }
            }
            
            return ActionResult.FAILED;
        } catch (error) {
            return ActionResult.ERROR;
        }
    }
}

export class FactionWorkAction extends AutopilotAction {
    async execute(navigator: Navigator): Promise<ActionResult> {
        try {
            await navigator.navigate(GameSection.Factions);
            
            // Navigate to specific faction page
            const success = await this.navigateToFaction(this.factionName);
            if (!success) return ActionResult.FAILED;
            
            // Start optimal work type
            return await this.startWorkType(this.workType);
        } catch (error) {
            return ActionResult.ERROR;
        }
    }
}
```

#### 3.2 Augmentation Actions  
```typescript
// src/autopilot/actions/augmentation-actions.ts
export class AugmentationPurchaseAction extends AutopilotAction {
    async execute(navigator: Navigator): Promise<ActionResult> {
        try {
            await navigator.navigate(GameSection.Augmentations);
            
            // Find augmentation and purchase
            const doc = globalThis['doc' + 'ument'];
            const augElement = this.findAugmentationElement(doc, this.augName);
            
            if (augElement && this.canAffordAugmentation(augElement)) {
                const buyButton = this.findBuyButton(augElement);
                if (buyButton) {
                    buyButton.click();
                    await this.waitForPurchaseConfirmation();
                    return ActionResult.SUCCESS;
                }
            }
            
            return ActionResult.FAILED;
        } catch (error) {
            return ActionResult.ERROR;
        }
    }
}
```

### **Phase 4: Integration & Polish (Week 4)**

#### 4.1 Main Autopilot Loop
```typescript
// src/autopilot.ts - Main execution loop
async function runAutopilotLoop(
    stateReader: EarlyGameStateReader,
    decisionEngine: EarlyGameDecisionEngine,
    taskCoordinator: TaskCoordinator
): Promise<void> {
    
    while (true) {
        try {
            // Get current game state
            const gameState = await stateReader.getGameState();
            
            // Decide next action
            const nextAction = decisionEngine.getNextAction(gameState);
            
            if (nextAction) {
                ns.print(`🤖 Next action: ${nextAction.getDescription()}`);
                
                if (!config.dryRun) {
                    const result = await taskCoordinator.executeAction(nextAction);
                    ns.print(`📊 Result: ${result}`);
                }
            } else {
                ns.print(`✅ No action needed - continuing current activity`);
            }
            
            // Wait before next evaluation
            await ns.sleep(30000); // 30 second evaluation cycle
            
        } catch (error) {
            ns.print(`❌ Autopilot error: ${error}`);
            await ns.sleep(60000); // Longer wait on errors
        }
    }
}
```

#### 4.2 Status Display
```typescript
function displayAutopilotStatus(state: EarlyGameState, action: AutopilotAction | null) {
    ns.clearLog();
    ns.print('═══ EARLY GAME AUTOPILOT ═══');
    ns.print(`Money: $${ns.formatNumber(state.player.money)}`);
    ns.print(`Hacking: ${state.player.hacking}`);
    ns.print(`Factions: ${state.factions.joined.length} joined`);
    ns.print(`Augments: ${state.augmentations.owned.length} owned`);
    
    if (state.factions.currentWork) {
        ns.print(`Currently: ${state.factions.currentWork}`);
    }
    
    if (action) {
        ns.print(`Next: ${action.getDescription()}`);
    } else {
        ns.print(`Status: Monitoring (no action needed)`);
    }
    
    ns.print('─'.repeat(30));
}
```

## Risk Assessment & Mitigation

### **Technical Risks**
1. **DOM Changes**: Game UI updates breaking automation
   - **Mitigation**: Multiple selector fallbacks, graceful degradation
2. **Performance Impact**: DOM scraping causing lag
   - **Mitigation**: Efficient selectors, caching, rate limiting
3. **Integration Conflicts**: Autopilot interfering with manual play
   - **Mitigation**: Easy pause/resume, manual override options

### **Project Risks**
1. **Scope Creep**: Adding too many features
   - **Mitigation**: Focus on early game only, clear phase boundaries
2. **Complexity**: Over-engineering the decision logic
   - **Mitigation**: Simple decision tree, leverage existing guide system
3. **User Adoption**: System too complex for users
   - **Mitigation**: Conservative defaults, simple CLI, clear documentation

## Success Metrics

### **Technical Success**
- [ ] **Automation Rate**: >80% of early game actions automated successfully
- [ ] **Error Rate**: <10% failure rate for individual actions
- [ ] **Performance**: <5% impact on game responsiveness
- [ ] **Compatibility**: Zero conflicts with existing systems

### **User Success**  
- [ ] **Time Savings**: 50%+ reduction in manual gameplay time
- [ ] **Decision Quality**: Matches or exceeds manual decision making
- [ ] **Ease of Use**: Setup and configuration in <5 minutes
- [ ] **Reliability**: Runs unattended for multiple hours without issues

## Future Evolution Path

### **Immediate Post-MVP (Month 2)**
- **Singularity API Integration**: Add support for post-BitNode 4 automation
- **Advanced Strategies**: More sophisticated decision algorithms
- **Performance Optimization**: Caching, prediction, efficiency improvements

### **Long-term Vision (Months 3-6)**
- **Full BitNode Automation**: Complete progression automation
- **Machine Learning**: Learn from player preferences and outcomes
- **Multi-BitNode Support**: Adapt strategies for different BitNode types
- **Community Features**: Share configurations and strategies

## Development Guidelines

### **Core Principles**
1. **Build on existing systems** - Navigator, guide, botnet integration
2. **Browser-first approach** - DOM automation before Singularity APIs
3. **Conservative defaults** - Safe settings that work reliably
4. **Iterative delivery** - Working automation at each phase
5. **Zero-cost techniques** - Use stealth DOM access to avoid RAM penalties

### **Quality Standards**
- **Error handling**: Graceful degradation on failures
- **Performance**: Minimal impact on game responsiveness
- **Compatibility**: No conflicts with existing automation
- **Usability**: Simple configuration and clear status information

---

## Next Steps

### **Implementation Priority**
1. **✅ Ready to Start**: All specifications complete
2. **🎯 First Sprint**: Phase 1 foundation (1 week)
3. **📈 Value Delivery**: Working faction automation in 2 weeks
4. **🚀 Complete MVP**: Full early game automation in 4 weeks

### **Success Indicators**
- Week 1: Can join CyberSec automatically
- Week 2: Can work for reputation and buy first augmentation
- Week 3: Makes intelligent progression decisions
- Week 4: Complete early game loop without manual intervention

This consolidated plan combines the best elements from all three approaches: the comprehensive vision of the PRD, the iterative framework thinking, and the practical focus of the early game spec. The result is an **implementation-ready plan** that delivers immediate value while providing a foundation for future automation expansion.