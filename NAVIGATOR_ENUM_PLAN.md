# Navigator Enum-Based Architecture Plan

## Core Design Philosophy: Enum-Driven Navigation & Actions 🎯

### **Problem with Method Explosion**
```typescript
// ❌ Current approach leads to method explosion:
class Navigator {
    async terminal(): Promise<TerminalPageImpl>
    async hacknet(): Promise<HacknetPageImpl>
    async augmentations(): Promise<AugmentationsPageImpl>
    async factions(): Promise<FactionsPageImpl>
    async stockMarket(): Promise<StockMarketPageImpl>
    async sleeves(): Promise<SleevesPageImpl>
    async gang(): Promise<GangPageImpl>
    async bladeburner(): Promise<BladeburnerPageImpl>
    // ... 15+ methods just for navigation!
}
```

### **✅ Enum-Based Solution**
```typescript
// Clean, extensible, type-safe approach:
const nav = new Navigator();
const terminal = await nav.navigate(GameSection.Terminal);
const result = await terminal.click(TerminalElement.ConnectButton);
```

## Enum Definitions 📋

### **Core Navigation Enums**
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
    Options = 'Options',
    Tutorial = 'Tutorial',
    DevMenu = 'Dev'
}

export enum TerminalElement {
    // Input/Output
    CommandInput = 'command-input',
    OutputArea = 'output-area',
    
    // Common buttons (if they exist as clickable elements)
    ClearButton = 'clear-button',
    
    // Command shortcuts (for common operations)
    HackCommand = 'hack-command',
    ConnectCommand = 'connect-command',
    HomeCommand = 'home-command'
}

export enum HacknetElement {
    // Node management
    BuyNodeButton = 'buy-node',
    UpgradeLevelButton = 'upgrade-level',
    UpgradeRAMButton = 'upgrade-ram', 
    UpgradeCoresButton = 'upgrade-cores',
    
    // Information displays
    NodeCountDisplay = 'node-count',
    TotalProductionDisplay = 'total-production',
    NodeStatsDisplay = 'node-stats'
}

export enum AugmentationElement {
    // Purchase actions
    BuyButton = 'buy-augmentation',
    InstallAllButton = 'install-all',
    
    // Filtering/sorting
    SortByPriceButton = 'sort-price',
    SortByRepButton = 'sort-reputation',
    FilterOwnedToggle = 'filter-owned',
    
    // Information
    AugmentationList = 'augmentation-list',
    PrerequisitesList = 'prerequisites',
    CostDisplay = 'cost-display'
}

export enum FactionElement {
    // Faction management
    JoinButton = 'join-faction',
    WorkButton = 'work-faction',
    DonateButton = 'donate',
    
    // Work types
    HackingWorkButton = 'hacking-work',
    FieldWorkButton = 'field-work', 
    SecurityWorkButton = 'security-work',
    
    // Information
    ReputationDisplay = 'reputation',
    FavorDisplay = 'favor',
    FactionList = 'faction-list'
}

export enum StockElement {
    // Trading actions
    BuyButton = 'buy-stock',
    SellButton = 'sell-stock',
    BuyMaxButton = 'buy-max',
    SellAllButton = 'sell-all',
    
    // Information
    PortfolioDisplay = 'portfolio',
    StockPriceDisplay = 'stock-price',
    MarketDataDisplay = 'market-data',
    
    // Advanced (if available)
    Short4SButton = 'short-4s',
    Long4SButton = 'long-4s'
}
```

### **Action Type Enums**
```typescript
export enum ActionType {
    Click = 'click',
    Input = 'input',
    Read = 'read',
    Wait = 'wait',
    Hover = 'hover',
    Submit = 'submit'
}

export enum InputType {
    Text = 'text',
    Number = 'number', 
    Currency = 'currency',
    Command = 'command'
}
```

## Unified Page Interface 🏗️

### **Generic Page Implementation**
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
        private logger: Logger
    ) {}
    
    async click(element: any): Promise<boolean> {
        this.logger.debug(`Clicking ${element} on ${this.section}`);
        
        const elementSelector = this.getElementSelector(element);
        const domElement = ElementFinder.findElement(elementSelector);
        
        if (!domElement) {
            this.logger.debug(`Element ${element} not found`);
            return false;
        }
        
        domElement.click();
        return true;
    }
    
    async input(element: any, value: string | number): Promise<boolean> {
        this.logger.debug(`Setting ${element} to ${value} on ${this.section}`);
        
        const elementSelector = this.getElementSelector(element);
        const domElement = ElementFinder.findElement(elementSelector);
        
        if (!domElement) return false;
        
        // Handle different input types
        if (typeof value === 'number') {
            domElement.value = value.toString();
        } else {
            domElement.value = value;
        }
        
        // Trigger input events
        domElement.dispatchEvent(new Event('input', { bubbles: true }));
        domElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true;
    }
    
    async read(element: any): Promise<string> {
        const elementSelector = this.getElementSelector(element);
        const domElement = ElementFinder.findElement(elementSelector);
        
        if (!domElement) return '';
        
        return domElement.textContent || domElement.value || '';
    }
    
    async wait(element: any, timeoutMs: number = 5000): Promise<boolean> {
        const elementSelector = this.getElementSelector(element);
        
        try {
            await waitForElement(elementSelector, timeoutMs);
            return true;
        } catch {
            return false;
        }
    }
    
    async isReady(): Promise<boolean> {
        // Check if page has loaded by looking for section-specific indicators
        const indicators = this.getReadinessIndicators();
        
        for (const indicator of indicators) {
            const element = ElementFinder.findElement(indicator);
            if (element) return true;
        }
        
        return false;
    }
    
    // Abstract methods to be customized per page type
    private getElementSelector(element: any): string {
        return ElementMappings.getSelector(this.section, element);
    }
    
    private getReadinessIndicators(): string[] {
        return ElementMappings.getReadinessIndicators(this.section);
    }
}
```

### **Specialized Page Classes**
```typescript
// =============================================================================
// SPECIALIZED PAGE CLASSES - Enhanced functionality for specific sections
// =============================================================================

export class TerminalPage extends GamePage {
    constructor(logger: Logger) {
        super(GameSection.Terminal, logger);
    }
    
    // Terminal-specific high-level methods
    async executeCommand(command: string): Promise<boolean> {
        const success = await this.input(TerminalElement.CommandInput, command);
        if (!success) return false;
        
        // Simulate Enter key
        const inputElement = ElementFinder.findElement(
            ElementMappings.getSelector(GameSection.Terminal, TerminalElement.CommandInput)
        );
        
        if (inputElement) {
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter', 
                keyCode: 13,
                bubbles: true
            });
            inputElement.dispatchEvent(enterEvent);
        }
        
        return true;
    }
    
    async getOutput(lines: number = 5): Promise<string[]> {
        const output = await this.read(TerminalElement.OutputArea);
        return output.split('\n').slice(-lines);
    }
    
    // Convenience methods for common commands
    async hack(target?: string): Promise<boolean> {
        const command = target ? `hack ${target}` : 'hack';
        return this.executeCommand(command);
    }
    
    async connect(server: string): Promise<boolean> {
        return this.executeCommand(`connect ${server}`);
    }
    
    async scan(): Promise<boolean> {
        return this.executeCommand('scan');
    }
}

export class HacknetPage extends GamePage {
    constructor(logger: Logger) {
        super(GameSection.Hacknet, logger);
    }
    
    async buyNode(): Promise<boolean> {
        return this.click(HacknetElement.BuyNodeButton);
    }
    
    async upgradeNode(nodeIndex: number, upgradeType: 'level' | 'ram' | 'cores'): Promise<boolean> {
        // First select the node (implementation depends on UI)
        // Then click appropriate upgrade button
        
        const elementMap = {
            level: HacknetElement.UpgradeLevelButton,
            ram: HacknetElement.UpgradeRAMButton,
            cores: HacknetElement.UpgradeCoresButton
        };
        
        return this.click(elementMap[upgradeType]);
    }
    
    async getNodeCount(): Promise<number> {
        const countText = await this.read(HacknetElement.NodeCountDisplay);
        return parseInt(countText) || 0;
    }
}
```

## Element Mapping System 🗺️

### **Central Element Mapping**
```typescript
// =============================================================================
// ELEMENT MAPPING SYSTEM - Maps enum values to actual DOM selectors
// =============================================================================

class ElementMappings {
    private static readonly MAPPINGS: Map<string, ElementMapping> = new Map([
        // Terminal mappings
        [`${GameSection.Terminal}.${TerminalElement.CommandInput}`, {
            selectors: [
                'input[class*="terminal"]',
                'input[placeholder*="terminal"]', 
                '.terminal input',
                'div[class*="terminal"] input'
            ],
            textPatterns: []
        }],
        
        [`${GameSection.Terminal}.${TerminalElement.OutputArea}`, {
            selectors: [
                '.terminal',
                '[class*="terminal"]',
                'pre',
                '.terminal-output'
            ],
            textPatterns: []
        }],
        
        // Hacknet mappings
        [`${GameSection.Hacknet}.${HacknetElement.BuyNodeButton}`, {
            selectors: ['button', '.MuiButton-root'],
            textPatterns: ['Buy Node', 'Purchase Node', 'Buy']
        }],
        
        // Navigation mappings
        [`navigation.${GameSection.Terminal}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Terminal', 'terminal', 'TERMINAL']
        }],
        
        [`navigation.${GameSection.Hacknet}`, {
            selectors: ['.MuiListItem-root', '[role="button"]', '.MuiButtonBase-root', 'button', 'a'],
            textPatterns: ['Hacknet', 'hacknet', 'HACKNET']
        }]
    ]);
    
    static getSelector(section: GameSection, element: any): string {
        const key = `${section}.${element}`;
        const mapping = this.MAPPINGS.get(key);
        
        if (!mapping) {
            throw new Error(`No mapping found for ${key}`);
        }
        
        return mapping.selectors[0]; // Return primary selector
    }
    
    static getMapping(section: GameSection, element: any): ElementMapping {
        const key = `${section}.${element}`;
        const mapping = this.MAPPINGS.get(key);
        
        if (!mapping) {
            throw new Error(`No mapping found for ${key}`);
        }
        
        return mapping;
    }
    
    static getNavigationMapping(section: GameSection): ElementMapping {
        const key = `navigation.${section}`;
        const mapping = this.MAPPINGS.get(key);
        
        if (!mapping) {
            throw new Error(`No navigation mapping found for ${section}`);
        }
        
        return mapping;
    }
    
    static getReadinessIndicators(section: GameSection): string[] {
        // Return selectors that indicate the page has loaded
        switch (section) {
            case GameSection.Terminal:
                return ['input[class*="terminal"]', '.terminal'];
            case GameSection.Hacknet:
                return ['.hacknet', '[class*="hacknet"]'];
            default:
                return ['main', '.content', '[role="main"]'];
        }
    }
}

interface ElementMapping {
    selectors: string[];
    textPatterns: string[];
    attributes?: Record<string, string>;
}
```

## Enhanced ElementFinder 🔍

### **Robust Element Detection**
```typescript
// =============================================================================
// ENHANCED ELEMENT FINDER - Multi-strategy element detection
// =============================================================================

class ElementFinder {
    static findElement(mapping: ElementMapping | string): Element | null {
        if (typeof mapping === 'string') {
            // Simple selector
            return querySelector(mapping);
        }
        
        // Try selectors first
        for (const selector of mapping.selectors) {
            const element = querySelector(selector);
            if (element && isElementVisible(element)) {
                return element;
            }
        }
        
        // Try text patterns if selectors fail
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
        const mapping = ElementMappings.getNavigationMapping(section);
        return this.findElement(mapping);
    }
}
```

## Simplified Navigator Class 🧭

### **Clean, Enum-Driven API**
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
    
    // ✨ SINGLE navigation method instead of 15+ methods
    async navigate(section: GameSection): Promise<GamePage> {
        this.logger.debug(`Navigating to ${section}`);
        
        // Find and click navigation element
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
            throw new Error(`Page ${section} failed to load`);
        }
        
        this.currentSection = section;
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
    
    getCurrentSection(): GameSection | null {
        return this.currentSection;
    }
}
```

## Usage Examples 🚀

### **Clean, Type-Safe API**
```typescript
// =============================================================================
// USAGE EXAMPLES - Clean, intuitive API
// =============================================================================

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
    await factions.input(FactionElement.DonateButton, 1000000);
    
    // Read information
    const money = await factions.read(FactionElement.ReputationDisplay);
    ns.tprint(`Current reputation: ${money}`);
}
```

## Benefits of This Approach ✅

### **Developer Experience**
- **Type Safety**: IDE autocomplete and compile-time checking
- **Consistency**: Same pattern for all sections and actions
- **Extensibility**: Add new sections by adding enum values
- **Maintainability**: Central mapping system for all selectors

### **Code Organization**
- **No Method Explosion**: Single `navigate()` method instead of 15+
- **Unified Interface**: All pages implement same interface
- **Central Configuration**: All selectors in one mapping system
- **Easy Testing**: Mock individual enum values

### **Runtime Benefits**
- **Flexible Fallbacks**: Multiple selector strategies per element
- **Self-Healing**: Automatically try different selectors
- **Performance**: Cached element mappings
- **Debugging**: Clear error messages with enum context

This enum-driven approach creates a **much cleaner, more maintainable architecture** while keeping everything in a single file! 🎯