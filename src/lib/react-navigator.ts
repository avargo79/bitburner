import { ReactGamePage } from '/lib/react-game-page';
import { ReactGameState } from '/lib/react-game-state';
import { ReactGameStateSync } from '/lib/react-game-state-sync';
import { ReactGameStateMonitor } from '/lib/react-game-state-monitor';
import { getWindowAPI } from '/lib/react-browser-utils';

// Import all page implementations
import { ReactTerminalPage } from '/lib/react-pages/react-terminal-page';
import { ReactStatsPage } from '/lib/react-pages/react-stats-page';
import { ReactHacknetPage } from '/lib/react-pages/react-hacknet-page';
import { ReactCorporationPage } from '/lib/react-pages/react-corporation-page';
import { ReactBitVersePage } from '/lib/react-pages/react-bitverse-page';
import { ReactFactionsPage } from '/lib/react-pages/react-factions-page';
import { ReactCityPage } from '/lib/react-pages/react-city-page';
import { ReactGangPage } from '/lib/react-pages/react-gang-page';
import { ReactBladeburnerPage } from '/lib/react-pages/react-bladeburner-page';
import { ReactSleevesPage } from '/lib/react-pages/react-sleeves-page';
import { ReactAugmentationsPage } from '/lib/react-pages/react-augmentations-page';
import { ReactStockMarketPage } from '/lib/react-pages/react-stock-market-page';

export type PageType = 
    | 'terminal' | 'stats' | 'hacknet' | 'corporation' | 'bitverse' 
    | 'factions' | 'city' | 'gang' | 'bladeburner' | 'sleeves' 
    | 'augmentations' | 'stockmarket';

export interface NavigationTask {
    id: string;
    name: string;
    description: string;
    page: PageType;
    action: string;
    parameters: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    result?: any;
    error?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}

export interface NavigationResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
    page: PageType;
    action: string;
}

export interface NavigatorConfig {
    enableStateSync: boolean;
    enableMonitoring: boolean;
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export class ReactNavigator {
    private static instance: ReactNavigator;
    private pages: Map<PageType, ReactGamePage> = new Map();
    private gameState: ReactGameState;
    private stateSync: ReactGameStateSync;
    private monitor: ReactGameStateMonitor;
    private taskQueue: NavigationTask[] = [];
    private runningTasks: Set<string> = new Set();
    private taskHistory: NavigationTask[] = [];
    private config: NavigatorConfig;
    private isInitialized = false;
    private processingInterval: number | null = null;

    private constructor() {
        this.gameState = ReactGameState.getInstance();
        this.stateSync = ReactGameStateSync.getInstance();
        this.monitor = ReactGameStateMonitor.getInstance();
        
        this.config = {
            enableStateSync: true,
            enableMonitoring: true,
            maxConcurrentTasks: 3,
            taskTimeout: 30000,
            retryAttempts: 2,
            retryDelay: 2000
        };
        
        this.initializePages();
    }

    static getInstance(): ReactNavigator {
        if (!ReactNavigator.instance) {
            ReactNavigator.instance = new ReactNavigator();
        }
        return ReactNavigator.instance;
    }

    async initialize(config?: Partial<NavigatorConfig>): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Initialize state management systems
        if (this.config.enableStateSync) {
            this.stateSync.initialize({
                syncInterval: 1000,
                enableRealTimeSync: true,
                persistToStorage: true
            });
        }

        if (this.config.enableMonitoring) {
            this.monitor.startMonitoring(1000);
        }

        // Start task processing
        this.startTaskProcessing();

        this.isInitialized = true;
    }

    // Page access methods
    getTerminalPage(): ReactTerminalPage {
        return this.pages.get('terminal') as ReactTerminalPage;
    }

    getStatsPage(): ReactStatsPage {
        return this.pages.get('stats') as ReactStatsPage;
    }

    getHacknetPage(): ReactHacknetPage {
        return this.pages.get('hacknet') as ReactHacknetPage;
    }

    getCorporationPage(): ReactCorporationPage {
        return this.pages.get('corporation') as ReactCorporationPage;
    }

    getBitVersePage(): ReactBitVersePage {
        return this.pages.get('bitverse') as ReactBitVersePage;
    }

    getFactionsPage(): ReactFactionsPage {
        return this.pages.get('factions') as ReactFactionsPage;
    }

    getCityPage(): ReactCityPage {
        return this.pages.get('city') as ReactCityPage;
    }

    getGangPage(): ReactGangPage {
        return this.pages.get('gang') as ReactGangPage;
    }

    getBladeburnerPage(): ReactBladeburnerPage {
        return this.pages.get('bladeburner') as ReactBladeburnerPage;
    }

    getSleevesPage(): ReactSleevesPage {
        return this.pages.get('sleeves') as ReactSleevesPage;
    }

    getAugmentationsPage(): ReactAugmentationsPage {
        return this.pages.get('augmentations') as ReactAugmentationsPage;
    }

    getStockMarketPage(): ReactStockMarketPage {
        return this.pages.get('stockmarket') as ReactStockMarketPage;
    }

    // Navigation methods
    async navigateToPage(pageType: PageType): Promise<boolean> {
        const page = this.pages.get(pageType);
        if (!page) {
            throw new Error(`Page ${pageType} not found`);
        }

        return await page.ensureOnPage();
    }

    async executeAction(pageType: PageType, action: string, parameters?: any): Promise<NavigationResult> {
        const startTime = Date.now();
        const page = this.pages.get(pageType);
        
        if (!page) {
            return {
                success: false,
                error: `Page ${pageType} not found`,
                executionTime: Date.now() - startTime,
                page: pageType,
                action
            };
        }

        try {
            // Ensure we're on the correct page
            await page.ensureOnPage();
            
            // Execute the action
            let result;
            const method = (page as any)[action];
            
            if (typeof method !== 'function') {
                throw new Error(`Action ${action} not found on page ${pageType}`);
            }

            if (parameters) {
                result = await method.call(page, ...parameters);
            } else {
                result = await method.call(page);
            }

            // Sync state after action
            if (this.config.enableStateSync) {
                await this.syncPageState(pageType, page);
            }

            return {
                success: true,
                data: result,
                executionTime: Date.now() - startTime,
                page: pageType,
                action
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown error',
                executionTime: Date.now() - startTime,
                page: pageType,
                action
            };
        }
    }

    // Task management
    addTask(task: Omit<NavigationTask, 'id' | 'status' | 'progress' | 'createdAt'>): string {
        const id = this.generateTaskId();
        const fullTask: NavigationTask = {
            id,
            status: 'pending',
            progress: 0,
            createdAt: Date.now(),
            ...task
        };

        this.taskQueue.push(fullTask);
        this.sortTaskQueue();
        
        return id;
    }

    getTask(taskId: string): NavigationTask | null {
        return this.taskQueue.find(task => task.id === taskId) ||
               this.taskHistory.find(task => task.id === taskId) ||
               null;
    }

    getAllTasks(): NavigationTask[] {
        return [...this.taskQueue, ...this.taskHistory];
    }

    getPendingTasks(): NavigationTask[] {
        return this.taskQueue.filter(task => task.status === 'pending');
    }

    getRunningTasks(): NavigationTask[] {
        return this.taskQueue.filter(task => task.status === 'running');
    }

    cancelTask(taskId: string): boolean {
        const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
        if (taskIndex >= 0) {
            const task = this.taskQueue[taskIndex];
            task.status = 'cancelled';
            task.completedAt = Date.now();
            
            this.taskHistory.push(task);
            this.taskQueue.splice(taskIndex, 1);
            this.runningTasks.delete(taskId);
            
            return true;
        }
        return false;
    }

    clearCompletedTasks(): void {
        this.taskHistory = this.taskHistory.filter(task => 
            Date.now() - (task.completedAt || 0) < 24 * 60 * 60 * 1000 // Keep for 24 hours
        );
    }

    // Batch operations
    async executeBatch(operations: Array<{
        page: PageType;
        action: string;
        parameters?: any;
    }>): Promise<NavigationResult[]> {
        const results: NavigationResult[] = [];
        
        for (const operation of operations) {
            const result = await this.executeAction(
                operation.page,
                operation.action,
                operation.parameters
            );
            results.push(result);
            
            // Short delay between operations
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }

    // Quick access methods for common operations
    async getPlayerStats(): Promise<any> {
        return await this.executeAction('stats', 'getPlayerStats');
    }

    async getCurrentMoney(): Promise<number> {
        const result = await this.executeAction('stats', 'getPlayerStats');
        return result.success ? result.data.money : 0;
    }

    async buyAugmentation(augName: string, factionName?: string): Promise<boolean> {
        const result = await this.executeAction('augmentations', 'buyAugmentation', [augName, factionName]);
        return result.success && result.data;
    }

    async buyStock(symbol: string, shares: number): Promise<boolean> {
        const result = await this.executeAction('stockmarket', 'buyStock', [symbol, shares]);
        return result.success && result.data;
    }

    async executeTerminalCommand(command: string): Promise<string> {
        const result = await this.executeAction('terminal', 'executeCommand', [command]);
        return result.success ? result.data : '';
    }

    async travelToCity(cityName: string): Promise<boolean> {
        const result = await this.executeAction('city', 'travelToLocation', [cityName]);
        return result.success && result.data;
    }

    // Configuration
    updateConfig(updates: Partial<NavigatorConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    getConfig(): NavigatorConfig {
        return { ...this.config };
    }

    // State access
    getGameState(): ReactGameState {
        return this.gameState;
    }

    getStateSync(): ReactGameStateSync {
        return this.stateSync;
    }

    getMonitor(): ReactGameStateMonitor {
        return this.monitor;
    }

    // Private methods
    private initializePages(): void {
        this.pages.set('terminal', new ReactTerminalPage());
        this.pages.set('stats', new ReactStatsPage());
        this.pages.set('hacknet', new ReactHacknetPage());
        this.pages.set('corporation', new ReactCorporationPage());
        this.pages.set('bitverse', new ReactBitVersePage());
        this.pages.set('factions', new ReactFactionsPage());
        this.pages.set('city', new ReactCityPage());
        this.pages.set('gang', new ReactGangPage());
        this.pages.set('bladeburner', new ReactBladeburnerPage());
        this.pages.set('sleeves', new ReactSleevesPage());
        this.pages.set('augmentations', new ReactAugmentationsPage());
        this.pages.set('stockmarket', new ReactStockMarketPage());
    }

    private startTaskProcessing(): void {
        if (this.processingInterval) {
            return;
        }

        const win = getWindowAPI();
        this.processingInterval = win.setInterval(() => {
            this.processTaskQueue();
        }, 1000);
    }

    private async processTaskQueue(): Promise<void> {
        // Check for timed out tasks
        this.checkTaskTimeouts();
        
        // Start new tasks if under limit
        const availableSlots = this.config.maxConcurrentTasks - this.runningTasks.size;
        const pendingTasks = this.taskQueue.filter(task => task.status === 'pending');
        
        for (let i = 0; i < Math.min(availableSlots, pendingTasks.length); i++) {
            const task = pendingTasks[i];
            this.executeTask(task);
        }
    }

    private async executeTask(task: NavigationTask): Promise<void> {
        task.status = 'running';
        task.startedAt = Date.now();
        task.progress = 0;
        this.runningTasks.add(task.id);

        try {
            const result = await this.executeAction(task.page, task.action, task.parameters);
            
            if (result.success) {
                task.status = 'completed';
                task.result = result.data;
                task.progress = 100;
            } else {
                task.status = 'failed';
                task.error = result.error;
                task.progress = 0;
            }
        } catch (error: any) {
            task.status = 'failed';
            task.error = error.message || 'Unknown error';
            task.progress = 0;
        }

        task.completedAt = Date.now();
        this.runningTasks.delete(task.id);
        
        // Move completed task to history
        const taskIndex = this.taskQueue.indexOf(task);
        if (taskIndex >= 0) {
            this.taskQueue.splice(taskIndex, 1);
            this.taskHistory.push(task);
        }
    }

    private checkTaskTimeouts(): void {
        const now = Date.now();
        const runningTasks = this.taskQueue.filter(task => task.status === 'running');
        
        for (const task of runningTasks) {
            if (task.startedAt && now - task.startedAt > this.config.taskTimeout) {
                task.status = 'failed';
                task.error = 'Task timeout';
                task.completedAt = now;
                this.runningTasks.delete(task.id);
                
                const taskIndex = this.taskQueue.indexOf(task);
                if (taskIndex >= 0) {
                    this.taskQueue.splice(taskIndex, 1);
                    this.taskHistory.push(task);
                }
            }
        }
    }

    private sortTaskQueue(): void {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        this.taskQueue.sort((a, b) => {
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return a.createdAt - b.createdAt;
        });
    }

    private async syncPageState(pageType: PageType, page: ReactGamePage): Promise<void> {
        try {
            // This would extract and sync relevant state from the page
            // Implementation depends on the specific page type
            const stateData = await this.extractPageState(pageType, page);
            if (stateData) {
                await this.stateSync.syncFromPage(pageType, stateData);
            }
        } catch (error) {
            console.error(`Failed to sync state for page ${pageType}:`, error);
        }
    }

    private async extractPageState(pageType: PageType, page: ReactGamePage): Promise<any> {
        // Extract relevant state based on page type
        switch (pageType) {
            case 'stats':
                return { player: await (page as any).getPlayerStats?.() || null };
            case 'hacknet':
                return { hacknet: await (page as ReactHacknetPage).getHacknetNodes() };
            case 'factions':
                return { factions: await (page as ReactFactionsPage).getAllFactions() };
            case 'stockmarket':
                return { stocks: await (page as ReactStockMarketPage).getAllStocks() };
            // Add more cases as needed
            default:
                return null;
        }
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy(): void {
        if (this.processingInterval) {
            const win = getWindowAPI();
            win.clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        this.monitor.destroy();
        this.taskQueue = [];
        this.runningTasks.clear();
        this.isInitialized = false;
    }
}