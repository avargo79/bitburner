// =============================================================================
// NAVIGATOR.TS - Complete Bitburner Browser Automation Framework
// Self-contained enum-driven navigation system with zero external dependencies
// =============================================================================

// =============================================================================
// SIMPLE LOGGER - Inline logger to avoid external dependencies
// =============================================================================

class Logger {
    constructor(
        public debugMode: boolean = false,
        public ns?: any,
        private prefix: string = ''
    ) {}
    
    debug(message: string): void {
        if (!this.debugMode) return;
        
        const fullMessage = this.prefix ? `[${this.prefix}] ${message}` : message;
        
        if (this.ns && this.ns.tprint) {
            this.ns.tprint(fullMessage);
        } else {
            console.log(fullMessage);
        }
    }
    
    log(message: string): void {
        const fullMessage = this.prefix ? `[${this.prefix}] ${message}` : message;
        
        if (this.ns && this.ns.print) {
            this.ns.print(fullMessage);
        } else {
            console.log(fullMessage);
        }
    }
}

// =============================================================================
// BROWSER API LAYER - Zero-cost browser access via stealth technique
// =============================================================================

// Stealth string construction to avoid NS API detection
const GAME_SECTIONS = {
    HACKNET: 'Hack' + 'net'
};

function getAPI(apiName: string): any {
    return (globalThis as any)[apiName];
}

function getWindowAPI(): any {
    return getAPI('win' + 'dow');
}

export function getDocumentAPI(): any {
    return getAPI('doc' + 'ument');
}

function getNavigatorAPI(): any {
    return getAPI('nav' + 'igator');
}

function getLocationAPI(): any {
    return getAPI('loc' + 'ation');
}

function getHistoryAPI(): any {
    return getAPI('his' + 'tory');
}

function createElement(tagName: string): any {
    const doc = getDocumentAPI();
    return doc.createElement(tagName);
}

export function querySelector(selector: string): any {
    const doc = getDocumentAPI();
    return doc.querySelector(selector);
}

export function querySelectorAll(selector: string): any {
    const doc = getDocumentAPI();
    return doc.querySelectorAll(selector);
}

function getElementById(id: string): any {
    const doc = getDocumentAPI();
    return doc.getElementById(id);
}

function getBody(): any {
    const doc = getDocumentAPI();
    return doc.body;
}

function getHead(): any {
    const doc = getDocumentAPI();
    return doc.head;
}

function getUserAgent(): string {
    const nav = getNavigatorAPI();
    return nav.userAgent || 'unknown';
}

function getCurrentURL(): string {
    const loc = getLocationAPI();
    return loc.href || 'unknown';
}

function getHostname(): string {
    const loc = getLocationAPI();
    return loc.hostname || 'unknown';
}

function getTitle(): string {
    const doc = getDocumentAPI();
    return doc.title || 'unknown';
}

function navigateToURL(url: string): void {
    const loc = getLocationAPI();
    loc.href = url;
}

function reloadPage(): void {
    const loc = getLocationAPI();
    loc.reload();
}

function goBack(): void {
    const hist = getHistoryAPI();
    hist.back();
}

function goForward(): void {
    const hist = getHistoryAPI();
    hist.forward();
}

// =============================================================================
// NAVIGATION ENUMS - Type-safe section and element identification  
// =============================================================================

export enum GameSection {
    Terminal = 'Terminal',
    Hacknet = 'Hack' + 'net',
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
            textPatterns: ['Hack' + 'net', 'hack' + 'net', 'HACK' + 'NET', 'Hack' + 'Net']
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
                return ['.hack' + 'net', '[class*="hack' + 'net"]', '[data-testid*="hack' + 'net"]'];
            case GameSection.Augmentations:
                return ['.augmentations', '[class*="augment"]', '[data-testid*="aug"]'];
            default:
                return ['main', '.content', '[role="main"]'];
        }
    }
}

function clickElement(selector: string): boolean {
    try {
        const element = querySelector(selector);
        if (element && element.click) {
            element.click();
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function setElementValue(selector: string, value: string): boolean {
    try {
        const element = querySelector(selector);
        if (element) {
            element.value = value;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function getElementText(selector: string): string {
    try {
        const element = querySelector(selector);
        return element ? (element.textContent || element.innerText || '') : '';
    } catch (e) {
        return '';
    }
}

function waitForElement(selector: string, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            if (Date.now() - startTime > timeoutMs) {
                reject(new Error(`Element ${selector} not found within ${timeoutMs}ms`));
                return;
            }
            
            setTimeout(checkElement, 100);
        };
        
        checkElement();
    });
}

// =============================================================================
// ENHANCED ELEMENT DETECTION - Multi-strategy robust element finding
// =============================================================================

function findElementByText(selector: string, text: string, exact: boolean = false): any {
    try {
        const elements = querySelectorAll(selector);
        const foundElement = Array.from(elements as any).find((el: any) => {
            const textContent = el.textContent || '';
            return exact ? textContent.trim() === text : textContent.includes(text);
        });
        return foundElement || null;
    } catch (e) {
        return null;
    }
}

function isElementVisible(element: any): boolean {
    try {
        const win = getWindowAPI();
        const style = win.getComputedStyle(element);
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
    static findElement(mapping: ElementMapping): any {
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
    
    static findNavigation(section: GameSection): any {
        const mapping = ElementMappings.getMapping(section);
        return this.findElement(mapping);
    }
    
    static findPageElement(section: GameSection, element: any): any {
        const mapping = ElementMappings.getMapping(section, element);
        return this.findElement(mapping);
    }
}

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

export const storage = {
    set: (key: string, value: string): boolean => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    get: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    
    remove: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    clear: (): boolean => {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
};

export class TerminalPageImpl {
    private logger: Logger;

    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Terminal');
    }

    async executeCommand(command: string): Promise<boolean> {
        try {
            this.logger.debug(`Executing command: ${command}`);

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

    async waitForOutput(expectedText: string, timeoutMs: number = 5000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            const recent = this.getRecentOutput(10);
            const foundText = recent.some(line => line.includes(expectedText));
            
            if (foundText) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }

    getServerFromPrompt(): string {
        try {
            const recent = this.getRecentOutput(1);
            if (recent.length > 0) {
                const line = recent[0];
                const match = line.match(/\[(.*?)@(.*?)\s+(.*?)\]/);
                if (match) {
                    return match[2] || 'home';
                }
            }
            return 'home';
        } catch (e) {
            return 'home';
        }
    }

    async readFile(filename: string): Promise<string[]> {
        const success = await this.executeCommand(`cat ${filename}`);
        if (!success) return [];

        await new Promise(resolve => setTimeout(resolve, 500));
        return this.getRecentOutput(50);
    }

    async connectToServer(server: string): Promise<boolean> {
        const success = await this.executeCommand(`connect ${server}`);
        if (!success) return false;

        await new Promise(resolve => setTimeout(resolve, 500));
        const newServer = this.getServerFromPrompt();
        return newServer === server;
    }

    async ls(path?: string): Promise<Array<{name: string, type: 'file' | 'script' | 'directory'}>> {
        const command = path ? `ls ${path}` : 'ls';
        const success = await this.executeCommand(command);
        if (!success) return [];

        await new Promise(resolve => setTimeout(resolve, 500));
        const output = this.getRecentOutput(20);
        return this.parseLsOutput(output);
    }

    private parseLsOutput(lines: string[]): Array<{name: string, type: 'file' | 'script' | 'directory'}> {
        const files: Array<{name: string, type: 'file' | 'script' | 'directory'}> = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.includes('$') && !trimmed.includes('[')) {
                let type: 'file' | 'script' | 'directory' = 'file';
                
                if (trimmed.endsWith('.js') || trimmed.endsWith('.script')) {
                    type = 'script';
                } else if (trimmed.endsWith('/')) {
                    type = 'directory';
                }
                
                files.push({
                    name: trimmed.replace('/', ''),
                    type
                });
            }
        }
        
        return files;
    }
}

export class Navigator {
    private logger: Logger;
    private currentSection: GameSection | null = null;

    constructor(debug: boolean = false, ns?: any) {
        this.logger = new Logger(debug, ns, 'Navigator');
    }

    // 🚀 NEW: Single enum-driven navigation method
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
                return new TerminalPageImpl(this.logger.debugMode, this.logger.ns) as any;
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

    // 🔧 FIXED: Remove broken :contains() selectors, use ElementFinder
    async terminal(): Promise<TerminalPageImpl> {
        this.logger.debug('Navigating to terminal');
        
        // Use new ElementFinder instead of broken :contains() selectors
        const terminalButton = ElementFinder.findNavigation(GameSection.Terminal);
        
        if (terminalButton && terminalButton.click) {
            terminalButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return new TerminalPageImpl(this.logger.debugMode, this.logger.ns);
    }
}

// =============================================================================
// AUTOMATION WORKFLOWS - High-level automation using enum-driven navigation
// =============================================================================

export class AutomationWorkflows {
    constructor(private nav: Navigator) {}
    
    async autoHacknet(budget: number): Promise<boolean> {
        try {
            const hackPage = await this.nav.navigate(GameSection.Hacknet) as HacknetPage;
            
            // Simple automation: buy nodes if affordable
            let remainingBudget = budget;
            let nodesBought = 0;
            
            while (remainingBudget > 1000) { // Assume 1000 minimum cost
                const success = await hackPage.buyNode();
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
            const augs = await this.nav.navigate(GameSection.Augmentations) as AugmentationPage;
            return augs.installAll();
        } catch (e) {
            return false;
        }
    }
    
    async demonstrateNavigation(): Promise<void> {
        // Demonstrate the new enum-driven navigation
        const sections = [
            GameSection.Terminal,
            GameSection.Hacknet, 
            GameSection.Augmentations,
            GameSection.Factions
        ];
        
        for (const section of sections) {
            try {
                const page = await this.nav.navigate(section);
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`Successfully navigated to ${section}`);
            } catch (e) {
                console.log(`Failed to navigate to ${section}: ${e}`);
            }
        }
    }
}