# Navigator Refactoring Plan - Enum-Driven Architecture

## Current State: 364 Lines → Target: ~1000 Lines (Single File) 🎯

### **Refactoring Strategy: Incremental Enhancement**
We'll refactor the existing `navigator.ts` by:
1. **Preserving working code** - Keep existing Terminal implementation
2. **Adding enum system** - New type-safe navigation
3. **Replacing broken selectors** - Fix `:contains()` issues
4. **Enhancing functionality** - Add new game sections

## Phase 1: Add Enum Foundation (Lines 1-150) 🏗️

### **Current Lines 1-25: Browser APIs**
```typescript
// ✅ KEEP AS-IS - Working stealth browser access
function getAPI(apiName: string): any
export function getWindowAPI(): any
export function getDocumentAPI(): any
// ... existing browser API functions
```

### **NEW: Add After Line 25 - Enum Definitions**
```typescript
// =============================================================================
// NAVIGATION ENUMS - Type-safe section and element identification  
// =============================================================================

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

export enum AugmentationElement {
    BuyButton = 'buy-augmentation',
    InstallAllButton = 'install-all',
    AugmentationList = 'augmentation-list',
    CostDisplay = 'cost-display'
}

export enum FactionElement {
    JoinButton = 'join-faction',
    WorkButton = 'work-faction',
    DonateButton = 'donate',
    ReputationDisplay = 'reputation',
    FactionList = 'faction-list'
}

export enum StockElement {
    BuyButton = 'buy-stock',
    SellButton = 'sell-stock',
    PortfolioDisplay = 'portfolio',
    StockPriceDisplay = 'stock-price'
}

export enum ActionType {
    Click = 'click',
    Input = 'input', 
    Read = 'read',
    Wait = 'wait'
}
```

## Phase 2: Element Mapping System (Lines 151-250) 🗺️

### **ADD: Element Mapping Infrastructure**
```typescript
// =============================================================================
// ELEMENT MAPPING SYSTEM - Maps enum values to DOM selectors with fallbacks
// =============================================================================

interface ElementMapping {
    selectors: string[];
    textPatterns: string[];
    attributes?: Record<string, string>;
}

class ElementMappings {
    private static readonly MAPPINGS: Map<string, ElementMapping> = new Map([
        // Navigation mappings
        [`navigation.${GameSection.Terminal}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Terminal', 'terminal', 'TERMINAL']
        }],
        
        [`navigation.${GameSection.Hacknet}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Hacknet', 'hacknet', 'HACKNET', 'HackNet']
        }],
        
        [`navigation.${GameSection.Augmentations}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Augmentations', 'augmentations', 'AUGMENTATIONS', 'Augs', 'augs']
        }],
        
        [`navigation.${GameSection.Factions}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Factions', 'factions', 'FACTIONS', 'Faction']
        }],
        
        [`navigation.${GameSection.StockMarket}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Stock Market', 'stock market', 'STOCK MARKET', 'Stocks', 'stocks']
        }],
        
        // Terminal element mappings
        [`${GameSection.Terminal}.${TerminalElement.CommandInput}`, {
            selectors: [
                'input[class*="terminal"]',
                'input[placeholder*="terminal"]',
                '.terminal input',
                'div[class*="terminal"] input',
                'input[type="text"]'
            ],
            textPatterns: []
        }],
        
        [`${GameSection.Terminal}.${TerminalElement.OutputArea}`, {
            selectors: [
                '.terminal',
                '[class*="terminal"]',
                'pre',
                '.terminal-output',
                '.console'
            ],
            textPatterns: []
        }],
        
        // Hacknet element mappings  
        [`${GameSection.Hacknet}.${HacknetElement.BuyNodeButton}`, {
            selectors: ['button', '.MuiButton-root', '[role="button"]'],
            textPatterns: ['Buy Node', 'Purchase Node', 'Buy', '+']
        }],
        
        [`${GameSection.Hacknet}.${HacknetElement.UpgradeLevelButton}`, {
            selectors: ['button', '.MuiButton-root', '[role="button"]'],
            textPatterns: ['Upgrade Level', 'Level', '+', 'Upgrade']
        }]
    ]);
    
    static getMapping(section: GameSection, element?: any): ElementMapping {
        const key = element ? `${section}.${element}` : `navigation.${section}`;
        const mapping = this.MAPPINGS.get(key);
        
        if (!mapping) {
            throw new Error(`No mapping found for ${key}`);
        }
        
        return mapping;
    }
    
    static getReadinessIndicators(section: GameSection): string[] {
        switch (section) {
            case GameSection.Terminal:
                return ['input[class*="terminal"]', '.terminal'];
            case GameSection.Hacknet:
                return ['.hacknet', '[class*="hacknet"]', '[data-testid*="hacknet"]'];
            case GameSection.Augmentations:
                return ['.augmentations', '[class*="augment"]', '[data-testid*="aug"]'];
            default:
                return ['main', '.content', '[role="main"]'];
        }
    }
}
```

## Phase 3: Enhanced Element Detection (Lines 251-350) 🔍

### **REPLACE: Lines 32-40 (Basic DOM utilities)**
Keep existing functions but enhance with new robust finder:

```typescript
// =============================================================================
// ENHANCED ELEMENT DETECTION - Multi-strategy robust element finding
// =============================================================================

// ✅ KEEP existing querySelector, etc. but add new functions:

export function findElementByText(selector: string, text: string, exact: boolean = false): Element | null {
    try {
        const elements = querySelectorAll(selector);
        return Array.from(elements).find(el => {
            const textContent = el.textContent || '';
            return exact ? textContent.trim() === text : textContent.includes(text);
        }) || null;
    } catch (e) {
        return null;
    }
}

export function isElementVisible(element: Element): boolean {
    try {
        const style = getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    } catch (e) {
        return true; // Assume visible if we can't check
    }
}

class ElementFinder {
    static findElement(mapping: ElementMapping): Element | null {
        // Try selectors first
        for (const selector of mapping.selectors) {
            const element = querySelector(selector);
            if (element && isElementVisible(element)) {
                return element;
            }
        }
        
        // Try text patterns with selectors
        for (const selector of mapping.selectors) {
            for (const textPattern of mapping.textPatterns) {
                const element = findElementByText(selector, textPattern);
                if (element && isElementVisible(element)) {
                    return element;
                }
            }
        }
        
        return null;
    }
    
    static findNavigation(section: GameSection): Element | null {
        const mapping = ElementMappings.getMapping(section);
        return this.findElement(mapping);
    }
    
    static findPageElement(section: GameSection, element: any): Element | null {
        const mapping = ElementMappings.getMapping(section, element);
        return this.findElement(mapping);
    }
}
```

## Phase 4: Unified Page Interface (Lines 351-500) 🏗️

### **ADD: Generic Page Implementation**
```typescript
// =============================================================================
// UNIFIED PAGE INTERFACE - Common pattern for all game sections
// =============================================================================

export interface IGamePage {
    readonly section: GameSection;
    click(element: any): Promise<boolean>;
    input(element: any, value: string | number): Promise<boolean>;
    read(element: any): Promise<string>;
    wait(element: any, timeoutMs?: number): Promise<boolean>;
    isReady(): Promise<boolean>;
}

export class GamePage implements IGamePage {
    constructor(
        public readonly section: GameSection,
        protected logger: Logger
    ) {}
    
    async click(element: any): Promise<boolean> {
        this.logger.debug(`Clicking ${element} on ${this.section}`);
        
        const domElement = ElementFinder.findPageElement(this.section, element);
        if (!domElement) {
            this.logger.debug(`Element ${element} not found on ${this.section}`);
            return false;
        }
        
        try {
            domElement.click();
            return true;
        } catch (e) {
            this.logger.debug(`Failed to click ${element}: ${e}`);
            return false;
        }
    }
    
    async input(element: any, value: string | number): Promise<boolean> {
        this.logger.debug(`Setting ${element} to ${value} on ${this.section}`);
        
        const domElement = ElementFinder.findPageElement(this.section, element);
        if (!domElement) return false;
        
        try {
            const stringValue = typeof value === 'number' ? value.toString() : value;
            domElement.value = stringValue;
            
            // Trigger input events
            domElement.dispatchEvent(new Event('input', { bubbles: true }));
            domElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            return true;
        } catch (e) {
            this.logger.debug(`Failed to input to ${element}: ${e}`);
            return false;
        }
    }
    
    async read(element: any): Promise<string> {
        const domElement = ElementFinder.findPageElement(this.section, element);
        if (!domElement) return '';
        
        return domElement.textContent || domElement.value || '';
    }
    
    async wait(element: any, timeoutMs: number = 5000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            const domElement = ElementFinder.findPageElement(this.section, element);
            if (domElement) return true;
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }
    
    async isReady(): Promise<boolean> {
        const indicators = ElementMappings.getReadinessIndicators(this.section);
        
        for (const indicator of indicators) {
            const element = querySelector(indicator);
            if (element && isElementVisible(element)) return true;
        }
        
        return false;
    }
}
```

## Phase 5: Enhanced Terminal Page (Lines 501-700) 🔧

### **REFACTOR: Lines 192-340 (TerminalPageImpl)**
Keep existing functionality but integrate with new enum system:

```typescript
// =============================================================================
// ENHANCED TERMINAL PAGE - Extends GamePage with terminal-specific functionality
// =============================================================================

export class TerminalPage extends GamePage {
    constructor(debug: boolean = false, ns?: any) {
        super(GameSection.Terminal, new Logger(debug, ns, 'Terminal'));
    }
    
    // ✅ KEEP existing methods but enhance element finding:
    async executeCommand(command: string): Promise<boolean> {
        try {
            this.logger.debug(`Executing command: ${command}`);

            // 🔧 REPLACE broken selector with ElementFinder
            const terminalInput = ElementFinder.findPageElement(GameSection.Terminal, TerminalElement.CommandInput);

            if (!terminalInput) {
                this.logger.debug('Could not find terminal input field');
                return false;
            }

            terminalInput.value = '';
            terminalInput.focus();
            terminalInput.value = command;

            terminalInput.dispatchEvent(new Event('input', { bubbles: true }));
            terminalInput.dispatchEvent(new Event('change', { bubbles: true }));

            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            terminalInput.dispatchEvent(enterEvent);

            this.logger.debug(`Command executed: ${command}`);
            return true;
        } catch (e) {
            this.logger.debug(`Error executing command: ${e}`);
            return false;
        }
    }
    
    getRecentOutput(lines: number = 5): string[] {
        try {
            const terminalContainer = ElementFinder.findPageElement(GameSection.Terminal, TerminalElement.OutputArea);

            if (!terminalContainer) {
                return [];
            }

            const outputText = terminalContainer.textContent || '';
            const outputLines = outputText.split('\n').filter((line: string) => line.trim().length > 0);
            
            return outputLines.slice(-lines);
        } catch (e) {
            this.logger.debug(`Error getting output: ${e}`);
            return [];
        }
    }
    
    // ✅ KEEP all other existing methods:
    // waitForOutput, getServerFromPrompt, readFile, connectToServer, ls, parseLsOutput
}
```

## Phase 6: New Game Page Classes (Lines 701-850) 🎮

### **ADD: Specialized Page Implementations**
```typescript
// =============================================================================
// SPECIALIZED GAME PAGES - Enhanced functionality for specific sections
// =============================================================================

export class HacknetPage extends GamePage {
    constructor(logger: Logger) {
        super(GameSection.Hacknet, logger);
    }
    
    async buyNode(): Promise<boolean> {
        return this.click(HacknetElement.BuyNodeButton);
    }
    
    async upgradeNode(nodeIndex: number, upgradeType: 'level' | 'ram' | 'cores'): Promise<boolean> {
        const elementMap = {
            level: HacknetElement.UpgradeLevelButton,
            ram: HacknetElement.UpgradeRAMButton,
            cores: HacknetElement.UpgradeCoresButton
        };
        
        // TODO: Add node selection logic based on nodeIndex
        return this.click(elementMap[upgradeType]);
    }
    
    async getNodeCount(): Promise<number> {
        const countText = await this.read(HacknetElement.NodeCountDisplay);
        return parseInt(countText) || 0;
    }
}

export class AugmentationPage extends GamePage {
    constructor(logger: Logger) {
        super(GameSection.Augmentations, logger);
    }
    
    async buyAugmentation(augName: string): Promise<boolean> {
        // TODO: Find specific augmentation by name and click buy
        return this.click(AugmentationElement.BuyButton);
    }
    
    async installAll(): Promise<boolean> {
        return this.click(AugmentationElement.InstallAllButton);
    }
    
    async getAvailableAugmentations(): Promise<string[]> {
        const listText = await this.read(AugmentationElement.AugmentationList);
        // TODO: Parse augmentation list
        return listText.split('\n').filter(line => line.trim().length > 0);
    }
}

export class FactionPage extends GamePage {
    constructor(logger: Logger) {
        super(GameSection.Factions, logger);
    }
    
    async joinFaction(factionName: string): Promise<boolean> {
        // TODO: Find specific faction and join
        return this.click(FactionElement.JoinButton);
    }
    
    async donate(amount: number): Promise<boolean> {
        const success = await this.input(FactionElement.DonateButton, amount);
        if (success) {
            return this.click(FactionElement.DonateButton);
        }
        return false;
    }
}
```

## Phase 7: Refactored Navigator (Lines 851-950) 🧭

### **REPLACE: Lines 342-364 (Navigator class)**
```typescript
// =============================================================================
// MAIN NAVIGATOR CLASS - Enum-driven navigation with unified interface  
// =============================================================================

export class Navigator {
    private logger: Logger;
    private currentSection: GameSection | null = null;
    
    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Navigator');
    }
    
    // 🚀 SINGLE navigation method replaces multiple methods
    async navigate(section: GameSection): Promise<GamePage> {
        this.logger.debug(`Navigating to ${section}`);
        
        // Find and click navigation element using new ElementFinder
        const navElement = ElementFinder.findNavigation(section);
        if (!navElement) {
            throw new Error(`Cannot find navigation for ${section}`);
        }
        
        navElement.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create appropriate page instance
        const page = this.createPageInstance(section);
        
        // Wait for page to be ready
        const ready = await page.isReady();
        if (!ready) {
            this.logger.debug(`Page ${section} may not be fully loaded`);
        }
        
        this.currentSection = section;
        return page;
    }
    
    private createPageInstance(section: GameSection): GamePage {
        switch (section) {
            case GameSection.Terminal:
                return new TerminalPage(this.logger.debugMode, this.logger.ns);
            case GameSection.Hacknet:
                return new HacknetPage(this.logger);
            case GameSection.Augmentations:
                return new AugmentationPage(this.logger);
            case GameSection.Factions:
                return new FactionPage(this.logger);
            default:
                return new GamePage(section, this.logger);
        }
    }
    
    getCurrentSection(): GameSection | null {
        return this.currentSection;
    }
    
    // 🔄 DEPRECATED: Keep for backward compatibility but mark as deprecated
    async terminal(): Promise<TerminalPage> {
        this.logger.debug('DEPRECATED: Use navigate(GameSection.Terminal) instead');
        return this.navigate(GameSection.Terminal) as Promise<TerminalPage>;
    }
}
```

## Phase 8: Storage & Workflows (Lines 951-1000) 🔄

### **ENHANCE: Lines 155-190 (storage)**
Keep existing storage object, add workflow class:

```typescript
// ✅ KEEP existing storage object (lines 155-190)

// =============================================================================
// AUTOMATION WORKFLOWS - High-level automation using enum-driven navigation
// =============================================================================

export class AutomationWorkflows {
    constructor(private nav: Navigator) {}
    
    async autoHacknet(budget: number): Promise<boolean> {
        try {
            const hacknet = await this.nav.navigate(GameSection.Hacknet);
            
            // Simple automation: buy nodes if affordable
            let remainingBudget = budget;
            let nodesBought = 0;
            
            while (remainingBudget > 1000) { // Assume 1000 minimum cost
                const success = await hacknet.buyNode();
                if (!success) break;
                
                nodesBought++;
                remainingBudget -= 1000; // Rough cost estimate
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            return nodesBought > 0;
        } catch (e) {
            return false;
        }
    }
    
    async autoAugmentations(): Promise<boolean> {
        try {
            const augs = await this.nav.navigate(GameSection.Augmentations);
            return augs.installAll();
        } catch (e) {
            return false;
        }
    }
}
```

## Implementation Steps 📋

### **Step 1: Add Enum Foundation** 
- Insert enum definitions after line 25
- Add ElementMapping class and mappings
- Test compilation

### **Step 2: Enhance Element Detection**
- Add `findElementByText` and `isElementVisible` functions
- Add `ElementFinder` class
- Test with simple element finding

### **Step 3: Add GamePage Classes**
- Add `IGamePage` interface and `GamePage` base class
- Add specialized page classes
- Test basic page operations

### **Step 4: Fix Navigator Class**
- Replace broken `:contains()` selector in terminal method
- Add new `navigate()` method
- Keep old `terminal()` method for compatibility

### **Step 5: Add Enhanced Terminal**
- Refactor `TerminalPageImpl` to extend `GamePage`
- Fix element finding using new system
- Test terminal operations

### **Step 6: Add Workflows**
- Add `AutomationWorkflows` class
- Test high-level automation

## Testing Strategy 🧪

### **Incremental Testing**
After each phase:
1. **Compilation check**: `npx tsc --noEmit`
2. **Basic functionality**: Test in Bitburner terminal
3. **Element detection**: Verify new finder works
4. **Navigation**: Test enum-driven navigation

### **Backward Compatibility**
- Keep existing `terminal()` method working
- Ensure existing code doesn't break
- Add deprecation warnings for old methods

## Success Metrics 🎯

### **Phase 1 Success**
- [ ] Enums defined and compile correctly
- [ ] ElementMappings class works
- [ ] Basic element finding functional

### **Phase 2 Success**  
- [ ] CSS selector issue fixed
- [ ] Navigation to terminal works with new system
- [ ] GamePage interface operational

### **Phase 3 Success**
- [ ] All game sections navigable via enums
- [ ] Specialized page classes functional
- [ ] Workflows demonstrate automation capabilities

**Target Result**: A robust, enum-driven navigator that's maintainable, extensible, and fixes all current issues while keeping single-file benefits! 🚀