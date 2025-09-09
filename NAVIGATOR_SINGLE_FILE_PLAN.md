# Navigator Single-File Organization Plan

## Current Status: 364 Lines → Target: ~1200 Lines ✅

### **File Structure Strategy: Logical Sections with Clear Boundaries**

```typescript
// =============================================================================
// NAVIGATOR.TS - Complete Bitburner Browser Automation (Target: ~1200 lines)
// =============================================================================

// =============================================================================
// SECTION 1: BROWSER API LAYER (Lines 1-60)
// Zero-cost browser API access via stealth technique
// =============================================================================

// =============================================================================  
// SECTION 2: DOM UTILITIES (Lines 61-160)
// Core DOM manipulation and element interaction
// =============================================================================

// =============================================================================
// SECTION 3: ELEMENT DETECTION SYSTEM (Lines 161-260)
// Robust element finding with fallback strategies
// =============================================================================

// =============================================================================
// SECTION 4: GAME STATE MONITORING (Lines 261-360) 
// Player stats, money, skills tracking without NS API
// =============================================================================

// =============================================================================
// SECTION 5: TERMINAL IMPLEMENTATION (Lines 361-660)
// Complete terminal automation (EXISTING - needs CSS fix)
// =============================================================================

// =============================================================================
// SECTION 6: GAME PAGE IMPLEMENTATIONS (Lines 661-1000)
// Individual page classes for each game section
// =============================================================================

// =============================================================================
// SECTION 7: MAIN NAVIGATOR CLASS (Lines 1001-1100) 
// Central navigation controller and page factory
// =============================================================================

// =============================================================================
// SECTION 8: AUTOMATION WORKFLOWS (Lines 1101-1200)
// High-level automated strategies and workflows
// =============================================================================
```

## Detailed Section Planning 📋

### **SECTION 1: Browser API Layer (Lines 1-60)**
**Status: ✅ COMPLETE - No changes needed**

```typescript
// =============================================================================
// BROWSER API LAYER - Zero-cost browser access via stealth technique
// Provides safe access to window, document, navigator APIs without 25GB penalty
// =============================================================================

function getAPI(apiName: string): any
export function getWindowAPI(): any
export function getDocumentAPI(): any  
export function getNavigatorAPI(): any
export function getLocationAPI(): any
export function getHistoryAPI(): any
```

### **SECTION 2: DOM Utilities (Lines 61-160)**
**Status: ✅ MOSTLY COMPLETE - Minor enhancements needed**

```typescript
// =============================================================================
// DOM UTILITIES - Core DOM manipulation and element interaction
// Basic building blocks for all browser automation
// =============================================================================

// ✅ Existing (keep as-is)
export function createElement(tagName: string): any
export function querySelector(selector: string): any
export function querySelectorAll(selector: string): any
export function getElementById(id: string): any
export function getBody(): any
export function getHead(): any

// ✅ Existing (keep as-is)  
export function clickElement(selector: string): boolean
export function setElementValue(selector: string, value: string): boolean
export function getElementText(selector: string): string
export function waitForElement(selector: string, timeoutMs?: number): Promise<any>

// 🔄 ADD: Enhanced DOM utilities
export function findElementByText(selector: string, text: string, exact?: boolean): Element | null
export function findElementByAttribute(attr: string, value: string): Element | null
export function isElementVisible(element: Element): boolean
export function scrollElementIntoView(element: Element): void
export function triggerEvent(element: Element, eventType: string): void
```

### **SECTION 3: Element Detection System (Lines 161-260)**
**Status: 🔥 CRITICAL - Must implement to fix navigation**

```typescript
// =============================================================================
// ELEMENT DETECTION SYSTEM - Robust element finding with fallback strategies
// Replaces broken :contains() selectors with multi-strategy approach
// =============================================================================

class ElementFinder {
    // 🔥 CRITICAL: Fix navigation
    static findNavItem(text: string): Element | null {
        const strategies = [
            () => findElementByText('.MuiListItem-root', text),
            () => findElementByText('[role="button"]', text),
            () => findElementByText('.MuiButtonBase-root', text),
            () => findElementByText('button', text),
            () => findElementByText('a', text),
            () => findElementByText('[data-tooltip]', text),
            () => findElementByText('[title]', text)
        ];
        
        for (const strategy of strategies) {
            const element = strategy();
            if (element && isElementVisible(element)) return element;
        }
        return null;
    }

    static findButton(text: string): Element | null
    static findInput(placeholder: string): Element | null  
    static findByDataAttribute(attr: string, value: string): Element | null
    static findContainer(className: string): Element | null
}

// Game-specific element patterns
class GameElementPatterns {
    static readonly NAVIGATION = {
        terminal: ['Terminal', 'terminal', 'TERMINAL'],
        hacknet: ['Hacknet', 'hacknet', 'HACKNET'],
        augmentations: ['Augmentations', 'augs', 'AUGMENTATIONS'],
        factions: ['Factions', 'faction', 'FACTIONS'],
        stocks: ['Stock Market', 'stocks', 'STOCK'],
        sleeves: ['Sleeves', 'sleeve', 'SLEEVES']
    };
    
    static readonly TERMINAL = {
        input: ['input[class*="terminal"]', 'input[placeholder*="terminal"]', '.terminal input'],
        output: ['.terminal', '[class*="terminal"]', 'pre']
    };
}
```

### **SECTION 4: Game State Monitoring (Lines 261-360)**
**Status: 🆕 NEW - Essential for automation**

```typescript
// =============================================================================
// GAME STATE MONITORING - Track player stats, money, skills without NS API
// Provides real-time game state information via DOM reading
// =============================================================================

export class GameStateMonitor {
    // Player information
    static async getPlayerMoney(): Promise<number> {
        // Find money display element and parse value
    }
    
    static async getPlayerStats(): Promise<PlayerStats> {
        // Extract hacking, combat stats from UI
    }
    
    static async getCurrentServer(): Promise<string> {
        // Read current server from terminal prompt or UI
    }
    
    // Real-time monitoring  
    static onMoneyChange(callback: (newAmount: number) => void): void {
        // Use MutationObserver to watch money changes
    }
    
    static onServerChange(callback: (newServer: string) => void): void {
        // Watch for server navigation changes
    }
    
    // Game state validation
    static async isGameLoaded(): Promise<boolean>
    static async waitForGameReady(timeoutMs?: number): Promise<boolean>
}

interface PlayerStats {
    hacking: number;
    strength: number;
    defense: number;
    dexterity: number;
    agility: number;
    charisma: number;
    intelligence: number;
}
```

### **SECTION 5: Terminal Implementation (Lines 361-660)**
**Status: ✅ MOSTLY COMPLETE - Fix CSS selectors only**

```typescript
// =============================================================================
// TERMINAL IMPLEMENTATION - Complete terminal automation system
// Provides programmatic control over all terminal operations
// =============================================================================

export class TerminalPageImpl {
    // ✅ Keep existing implementation (196 lines)
    // 🔄 ONLY CHANGE: Fix CSS selectors in executeCommand()
    
    // Replace querySelector calls with ElementFinder.findInput()
    async executeCommand(command: string): Promise<boolean> {
        // Change line ~203-206 from:
        // const terminalInput = querySelector('input[class*="terminal"]') || ...
        
        // To:
        // const terminalInput = ElementFinder.findInput('terminal') ||
        //                      ElementFinder.findByDataAttribute('data-testid', 'terminal-input');
    }
    
    // ✅ Keep all other methods unchanged:
    // - getRecentOutput, waitForOutput, getServerFromPrompt
    // - readFile, connectToServer, ls, parseLsOutput
}
```

### **SECTION 6: Game Page Implementations (Lines 661-1000)**
**Status: 🆕 NEW - Core automation features**

```typescript
// =============================================================================
// GAME PAGE IMPLEMENTATIONS - Individual automation for each game section
// Each page class provides complete automation for its game area
// =============================================================================

export class HacknetPageImpl {
    constructor(private logger: Logger) {}
    
    async getNodeCount(): Promise<number>
    async getNodeStats(index: number): Promise<HacknetNodeStats>
    async buyNode(): Promise<boolean>
    async upgradeLevel(nodeIndex: number): Promise<boolean>
    async upgradeRAM(nodeIndex: number): Promise<boolean>
    async upgradeCores(nodeIndex: number): Promise<boolean>
    async getUpgradeCosts(nodeIndex: number): Promise<UpgradeCosts>
    
    // High-level automation
    async autoOptimize(budget: number): Promise<OptimizationResult>
}

export class AugmentationsPageImpl {
    constructor(private logger: Logger) {}
    
    async getAvailable(): Promise<Augmentation[]>
    async getOwned(): Promise<Augmentation[]>
    async getPrerequisites(augName: string): Promise<string[]>
    async getCost(augName: string): Promise<{money: number, rep: number}>
    async buyAugmentation(augName: string): Promise<boolean>
    async installAll(): Promise<boolean>
}

export class FactionsPageImpl {
    constructor(private logger: Logger) {}
    
    async getJoined(): Promise<Faction[]>
    async getInvitations(): Promise<Faction[]>
    async joinFaction(factionName: string): Promise<boolean>
    async donate(faction: string, amount: number): Promise<boolean>
    async workForFaction(faction: string, workType: WorkType): Promise<boolean>
    async getReputation(faction: string): Promise<number>
}

export class StockMarketPageImpl {
    constructor(private logger: Logger) {}
    
    async getPortfolio(): Promise<StockPosition[]>
    async getStockPrice(symbol: string): Promise<number>
    async buyStock(symbol: string, shares: number): Promise<boolean>
    async sellStock(symbol: string, shares: number): Promise<boolean>
    async getMarketData(): Promise<MarketData[]>
}

// Supporting interfaces
interface HacknetNodeStats {
    level: number;
    ram: number;
    cores: number;
    production: number;
}

interface Augmentation {
    name: string;
    cost: number;
    repReq: number;
    owned: boolean;
}

interface Faction {
    name: string;
    reputation: number;
    favor: number;
    joined: boolean;
}
```

### **SECTION 7: Main Navigator Class (Lines 1001-1100)**
**Status: 🔄 ENHANCE - Expand navigation capabilities**

```typescript
// =============================================================================
// MAIN NAVIGATOR CLASS - Central navigation controller and page factory
// Provides unified access to all game sections with smart navigation
// =============================================================================

export class Navigator {
    private logger: Logger;
    private currentPage: string | null = null;
    
    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Navigator');
    }
    
    // ✅ EXISTING (fix CSS selector)
    async terminal(): Promise<TerminalPageImpl> {
        // Fix the :contains() selector issue
        await this.navigateToSection('Terminal');
        return new TerminalPageImpl(this.logger.debugMode, this.logger.ns);
    }
    
    // 🆕 NEW page implementations
    async hacknet(): Promise<HacknetPageImpl> {
        await this.navigateToSection('Hacknet');
        return new HacknetPageImpl(this.logger);
    }
    
    async augmentations(): Promise<AugmentationsPageImpl> {
        await this.navigateToSection('Augmentations');
        return new AugmentationsPageImpl(this.logger);
    }
    
    async factions(): Promise<FactionsPageImpl> {
        await this.navigateToSection('Factions');
        return new FactionsPageImpl(this.logger);
    }
    
    async stockMarket(): Promise<StockMarketPageImpl> {
        await this.navigateToSection('Stock Market');
        return new StockMarketPageImpl(this.logger);
    }
    
    // 🔄 ENHANCED navigation core
    private async navigateToSection(sectionName: string): Promise<boolean> {
        this.logger.debug(`Navigating to ${sectionName}`);
        
        const navElement = ElementFinder.findNavItem(sectionName);
        if (!navElement) {
            this.logger.debug(`Could not find navigation for ${sectionName}`);
            return false;
        }
        
        navElement.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.currentPage = sectionName;
        return true;
    }
    
    // Utility methods
    getCurrentPage(): string | null { return this.currentPage; }
    async waitForPageLoad(timeoutMs: number = 5000): Promise<boolean>
    async isPageReady(): Promise<boolean>
}
```

### **SECTION 8: Automation Workflows (Lines 1101-1200)**
**Status: 🆕 NEW - High-level automation**

```typescript
// =============================================================================
// AUTOMATION WORKFLOWS - High-level automated strategies and workflows  
// Combines multiple page operations into intelligent automation sequences
// =============================================================================

export class AutomationWorkflows {
    constructor(private nav: Navigator) {}
    
    // Complete network automation
    async autoHackNetwork(options: NetworkHackOptions): Promise<HackResult> {
        const terminal = await this.nav.terminal();
        
        // 1. Discover network
        const servers = await terminal.scanNetwork(options.maxDepth || 3);
        
        // 2. Compromise servers
        const compromisedServers = [];
        for (const [server, depth] of servers) {
            const success = await terminal.compromiseServer(server);
            if (success) compromisedServers.push(server);
        }
        
        // 3. Deploy hack scripts
        for (const server of compromisedServers) {
            await terminal.deployScript('hack.js', server, 1, server);
        }
        
        return { compromised: compromisedServers.length, total: servers.size };
    }
    
    // Resource optimization
    async optimizeIncome(strategy: IncomeStrategy): Promise<void> {
        switch (strategy.type) {
            case 'hacknet':
                const hacknet = await this.nav.hacknet();
                await hacknet.autoOptimize(strategy.budget);
                break;
                
            case 'stocks':
                const stocks = await this.nav.stockMarket();
                // Implement stock trading logic
                break;
        }
    }
    
    // Progression automation
    async autoProgression(goals: ProgressionGoals): Promise<void> {
        // Check current state
        const stats = await GameStateMonitor.getPlayerStats();
        const money = await GameStateMonitor.getPlayerMoney();
        
        // Determine best action based on goals
        if (goals.targetHackingLevel > stats.hacking) {
            // Focus on hacking experience
            await this.autoHackNetwork({ maxDepth: 2 });
        }
        
        if (goals.targetMoney > money) {
            // Focus on income optimization
            await this.optimizeIncome({ type: 'hacknet', budget: money * 0.8 });
        }
    }
}

// Supporting types
interface NetworkHackOptions {
    maxDepth?: number;
    targetServers?: string[];
    scriptName?: string;
}

interface HackResult {
    compromised: number;
    total: number;
    errors?: string[];
}

interface IncomeStrategy {
    type: 'hacknet' | 'stocks' | 'hacking';
    budget: number;
    riskLevel?: 'low' | 'medium' | 'high';
}

interface ProgressionGoals {
    targetHackingLevel?: number;
    targetMoney?: number;
    targetAugmentations?: string[];
    targetFactions?: string[];
}
```

## Implementation Priority 🎯

### **Phase 1: Critical Fix (1-2 hours)**
1. **Fix CSS Selectors** - Replace `:contains()` with `findElementByText()`
2. **Add ElementFinder class** - Robust element detection
3. **Test basic navigation** - Ensure terminal access works

### **Phase 2: Core Foundation (4-6 hours)**  
1. **GameStateMonitor** - Player stats and money tracking
2. **Enhanced DOM utilities** - Additional helper functions
3. **Navigation improvements** - Better page detection

### **Phase 3: Game Pages (8-10 hours)**
1. **HacknetPageImpl** - Hacknet automation
2. **AugmentationsPageImpl** - Augmentation management  
3. **FactionsPageImpl** - Faction interactions
4. **StockMarketPageImpl** - Trading automation

### **Phase 4: Workflows (4-6 hours)**
1. **AutomationWorkflows** - High-level strategies
2. **Integration testing** - End-to-end automation
3. **Performance optimization** - Ensure <2GB RAM

## File Organization Benefits ✅

### **Development**
- **Clear sections** with visual boundaries (`===` separators)
- **Logical flow** from low-level → high-level functionality  
- **Easy navigation** with section comments for IDE jumping
- **Consistent patterns** across all implementations

### **Maintenance**
- **Single source of truth** - no import/export management
- **Easy refactoring** - find/replace across entire system
- **Version control** - single file history tracking
- **Deployment** - copy one file to get everything

### **Runtime**  
- **Zero import overhead** - no module resolution
- **Fast loading** - single file read
- **Memory efficient** - no duplicate code across modules
- **Error resilience** - no missing dependency issues

**Target Result**: A comprehensive, single-file browser automation system that transforms Bitburner gameplay while maintaining <2GB RAM usage and maximum portability! 🚀