# Navigator Consolidated Plan - Complete Bitburner Browser Automation

## Overview: Single-File Enum-Driven Architecture 🎯

**Current Status**: 364 lines → **Target**: ~1200 lines  
**Goal**: Transform Navigator into a comprehensive browser automation framework using enum-driven architecture while maintaining single-file benefits.

## Core Design Philosophy

### **Problem with Current Approach**
- **Broken CSS Selectors**: `:contains()` pseudo-selector not supported in modern browsers
- **Method Explosion**: Would need 15+ navigation methods (`terminal()`, `hacknet()`, `augmentations()`, etc.)
- **Limited Functionality**: Only basic terminal navigation implemented
- **No Game State Tracking**: No monitoring of player stats, money, resources

### **✅ Enum-Based Solution**
```typescript
// Clean, extensible, type-safe approach:
const nav = new Navigator();
const terminal = await nav.navigate(GameSection.Terminal);
const result = await terminal.click(TerminalElement.CommandInput);
```

## Architecture: Logical Sections with Clear Boundaries

```typescript
// =============================================================================
// NAVIGATOR.TS - Complete Bitburner Browser Automation (~1200 lines)
// =============================================================================

// SECTION 1: BROWSER API LAYER (Lines 1-60) ✅ COMPLETE
// SECTION 2: DOM UTILITIES (Lines 61-160) ✅ MOSTLY COMPLETE  
// SECTION 3: ELEMENT DETECTION SYSTEM (Lines 161-260) 🔥 CRITICAL
// SECTION 4: GAME STATE MONITORING (Lines 261-360) 🆕 NEW
// SECTION 5: TERMINAL IMPLEMENTATION (Lines 361-660) ✅ FIX CSS ONLY
// SECTION 6: GAME PAGE IMPLEMENTATIONS (Lines 661-1000) 🆕 NEW
// SECTION 7: MAIN NAVIGATOR CLASS (Lines 1001-1100) 🔄 ENHANCE
// SECTION 8: AUTOMATION WORKFLOWS (Lines 1101-1200) 🆕 NEW
```

## Enum Definitions

### **Core Navigation & Element Enums**
```typescript
export enum GameSection {
    Terminal = 'Terminal',
    Hacknet = 'Hacknet', 
    Augmentations = 'Augmentations',
    Factions = 'Factions',
    StockMarket = 'Stock Market',
    Sleeves = 'Sleeves',
    Gang = 'Gang',
    Bladeburner = 'Bladeburner',
    Corporation = 'Corporation',
    Stats = 'Stats',
    Options = 'Options'
}

export enum TerminalElement {
    CommandInput = 'command-input',
    OutputArea = 'output-area',
    ClearButton = 'clear-button'
}

export enum HacknetElement {
    BuyNodeButton = 'buy-node',
    UpgradeLevelButton = 'upgrade-level',
    UpgradeRAMButton = 'upgrade-ram',
    UpgradeCoresButton = 'upgrade-cores',
    NodeCountDisplay = 'node-count',
    TotalProductionDisplay = 'total-production'
}

export enum ActionType {
    Click = 'click',
    Input = 'input',
    Read = 'read',
    Wait = 'wait'
}
```

## Key Implementation Sections

### **SECTION 3: Element Detection System** 🔥 CRITICAL
**Fixes the core CSS selector problem**

```typescript
class ElementFinder {
    static findNavItem(text: string): Element | null {
        const strategies = [
            () => findElementByText('.MuiListItem-root', text),
            () => findElementByText('[role="button"]', text),
            () => findElementByText('.MuiButtonBase-root', text),
            () => findElementByText('button', text),
            () => findElementByText('a', text)
        ];
        
        for (const strategy of strategies) {
            const element = strategy();
            if (element && isElementVisible(element)) return element;
        }
        return null;
    }
}

export function findElementByText(selector: string, text: string, exact = false): Element | null {
    const elements = querySelectorAll(selector);
    return Array.from(elements).find(el => {
        const textContent = el.textContent || '';
        return exact ? textContent.trim() === text : textContent.includes(text);
    }) || null;
}
```

### **SECTION 4: Game State Monitoring** 🆕 NEW
**Essential for automation without NS API**

```typescript
export class GameStateMonitor {
    static async getPlayerMoney(): Promise<number> {
        // Find money display element and parse value
    }
    
    static async getPlayerStats(): Promise<PlayerStats> {
        // Extract hacking, combat stats from UI
    }
    
    static async getCurrentServer(): Promise<string> {
        // Read current server from terminal prompt or UI
    }
    
    // Real-time monitoring with MutationObserver
    static onMoneyChange(callback: (newAmount: number) => void): void
    static onServerChange(callback: (newServer: string) => void): void
}
```

### **SECTION 6: Game Page Implementations** 🆕 NEW
**Unified interface for all game sections**

```typescript
export interface IGamePage {
    readonly section: GameSection;
    click(element: any): Promise<boolean>;
    input(element: any, value: string | number): Promise<boolean>;
    read(element: any): Promise<string>;
    wait(element: any, timeoutMs?: number): Promise<boolean>;
    isReady(): Promise<boolean>;
}

export class HacknetPage extends GamePage {
    async buyNode(): Promise<boolean> {
        return this.click(HacknetElement.BuyNodeButton);
    }
    
    async upgradeNode(nodeIndex: number, upgradeType: 'level' | 'ram' | 'cores'): Promise<boolean> {
        const elementMap = {
            level: HacknetElement.UpgradeLevelButton,
            ram: HacknetElement.UpgradeRAMButton,
            cores: HacknetElement.UpgradeCoresButton
        };
        return this.click(elementMap[upgradeType]);
    }
}
```

### **SECTION 7: Enhanced Navigator** 🔄 ENHANCE
**Single navigation method replaces method explosion**

```typescript
export class Navigator {
    // ✨ SINGLE navigation method instead of 15+ methods
    async navigate(section: GameSection): Promise<GamePage> {
        this.logger.debug(`Navigating to ${section}`);
        
        const navElement = ElementFinder.findNavItem(section);
        if (!navElement) {
            throw new Error(`Cannot find navigation for ${section}`);
        }
        
        navElement.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const page = this.createPageInstance(section);
        const ready = await page.isReady();
        if (!ready) {
            throw new Error(`Page ${section} failed to load`);
        }
        
        return page;
    }
    
    private createPageInstance(section: GameSection): GamePage {
        switch (section) {
            case GameSection.Terminal:
                return new TerminalPage(this.logger);
            case GameSection.Hacknet:
                return new HacknetPage(this.logger);
            default:
                return new GamePage(section, this.logger);
        }
    }
}
```

### **SECTION 8: Automation Workflows** 🆕 NEW
**High-level automation strategies**

```typescript
export class AutomationWorkflows {
    async autoHackNetwork(options: NetworkHackOptions): Promise<HackResult> {
        const terminal = await this.nav.navigate(GameSection.Terminal);
        
        // 1. Discover network
        // 2. Compromise servers  
        // 3. Deploy hack scripts
        
        return { compromised: servers.length, total: discovered.length };
    }
    
    async optimizeIncome(strategy: IncomeStrategy): Promise<void> {
        switch (strategy.type) {
            case 'hacknet':
                const hacknet = await this.nav.navigate(GameSection.Hacknet);
                await hacknet.autoOptimize(strategy.budget);
                break;
        }
    }
}
```

## Implementation Roadmap 📅

### **Phase 1: Critical Fix (1-2 hours)** 🔥
**PRIORITY: Fix broken navigation**
- [ ] Replace `:contains()` selectors with `findElementByText()`
- [ ] Add ElementFinder class with multiple strategies
- [ ] Fix terminal navigation issue
- [ ] Test basic navigation works

### **Phase 2: Core Foundation (4-6 hours)**
- [ ] Add enhanced DOM utilities (`findElementByText`, `isElementVisible`)
- [ ] Implement GameStateMonitor for player stats/money tracking
- [ ] Add element mapping system for robust detection
- [ ] Enhance navigation with better page detection

### **Phase 3: Game Pages (8-10 hours)**
- [ ] Implement unified IGamePage interface
- [ ] Add HacknetPage with node management
- [ ] Add AugmentationsPage with purchase automation
- [ ] Add FactionsPage with reputation management
- [ ] Add StockMarketPage with trading automation

### **Phase 4: Advanced Features (4-6 hours)**
- [ ] Implement AutomationWorkflows class
- [ ] Add high-level strategies (network hacking, income optimization)
- [ ] Add real-time monitoring with MutationObserver
- [ ] Performance optimization and testing

## Usage Examples 🚀

### **Clean, Type-Safe API**
```typescript
export async function main(ns: any) {
    const nav = new Navigator(true, ns);
    
    // Navigate to terminal and execute commands
    const terminal = await nav.navigate(GameSection.Terminal);
    await terminal.executeCommand('scan');
    await terminal.connect('n00dles');
    
    // Navigate to hacknet and buy nodes
    const hacknet = await nav.navigate(GameSection.Hacknet);
    await hacknet.buyNode();
    await hacknet.upgradeNode(0, 'level');
    
    // Generic page operations
    const factions = await nav.navigate(GameSection.Factions);
    await factions.click(FactionElement.JoinButton);
    
    // High-level automation
    const workflows = new AutomationWorkflows(nav);
    await workflows.autoHackNetwork({ maxDepth: 3 });
}
```

## Critical Issues Fixed ✅

### **CSS Selector Problem**
- **Before**: `querySelector('.MuiListItem-root:contains("Terminal")') // BROKEN`
- **After**: `findElementByText('.MuiListItem-root', 'Terminal') // WORKS`

### **Method Explosion Prevention**
- **Before**: Need 15+ methods (`terminal()`, `hacknet()`, `augmentations()`, etc.)
- **After**: Single `navigate(GameSection.Terminal)` method

### **No Game State Access**
- **Before**: No way to read player stats, money, server info
- **After**: `GameStateMonitor` provides real-time access via DOM

### **Limited Automation**
- **Before**: Only basic terminal commands
- **After**: Complete automation for all game sections

## Benefits of This Approach ✅

### **Developer Experience**
- **Type Safety**: IDE autocomplete and compile-time checking
- **Consistency**: Same pattern for all sections and actions
- **Extensibility**: Add new sections by adding enum values
- **Maintainability**: Central mapping system for all selectors

### **Code Organization**
- **No Method Explosion**: Single `navigate()` method instead of 15+
- **Single File**: No import/export management complexity
- **Clear Sections**: Visual boundaries with `===` separators
- **Logical Flow**: Low-level → high-level functionality

### **Runtime Benefits**
- **Zero RAM Cost**: Maintains stealth browser API usage
- **Flexible Fallbacks**: Multiple selector strategies per element
- **Self-Healing**: Automatically try different selectors
- **Performance**: Cached element mappings and efficient DOM queries

## Success Metrics 🎯

### **Technical**
- **RAM Usage**: Maintain < 2GB total
- **Response Time**: < 100ms for common operations
- **Success Rate**: > 95% for element detection
- **Error Recovery**: < 1s for automatic recovery

### **Functional**
- **Coverage**: Support all major game sections
- **Automation**: Enable full hands-free gameplay
- **Reliability**: 24/7 operation capability
- **Adaptability**: Handle game updates gracefully

This consolidated plan transforms the Navigator from basic terminal automation into a **comprehensive browser automation framework** that enables sophisticated AI-driven gameplay optimization while maintaining single-file simplicity and zero-cost browser API access! 🚀