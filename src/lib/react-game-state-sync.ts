import { ReactGameState, StateUpdateEvent, PlayerState, ServerState, FactionState, StockState } from '/lib/react-game-state';
import { getWindowAPI } from '/lib/react-browser-utils';

export interface StateSyncOptions {
    syncInterval: number;
    enableRealTimeSync: boolean;
    persistToStorage: boolean;
    storageKey: string;
}

export interface StateSubscription {
    id: string;
    type: 'player' | 'server' | 'faction' | 'stock' | 'gang' | 'bladeburner' | 'sleeves' | 'corporation' | 'hacknet' | 'all';
    callback: (event: StateUpdateEvent) => void;
    filter?: (event: StateUpdateEvent) => boolean;
}

export class ReactGameStateSync {
    private static instance: ReactGameStateSync;
    private gameState: ReactGameState;
    private subscriptions: Map<string, StateSubscription> = new Map();
    private syncTimer: number | null = null;
    private options: StateSyncOptions;
    private isInitialized = false;

    private constructor() {
        this.gameState = ReactGameState.getInstance();
        this.options = {
            syncInterval: 1000,
            enableRealTimeSync: true,
            persistToStorage: true,
            storageKey: 'bitburner_game_state'
        };
    }

    static getInstance(): ReactGameStateSync {
        if (!ReactGameStateSync.instance) {
            ReactGameStateSync.instance = new ReactGameStateSync();
        }
        return ReactGameStateSync.instance;
    }

    initialize(options?: Partial<StateSyncOptions>): void {
        if (this.isInitialized) {
            return;
        }

        if (options) {
            this.options = { ...this.options, ...options };
        }

        // Set up global state listener
        this.gameState.addStateUpdateListener(this.handleStateUpdate.bind(this));

        // Load persisted state if enabled
        if (this.options.persistToStorage) {
            this.loadPersistedState();
        }

        // Start real-time sync if enabled
        if (this.options.enableRealTimeSync) {
            this.startRealTimeSync();
        }

        this.isInitialized = true;
    }

    subscribe(subscription: Omit<StateSubscription, 'id'>): string {
        const id = this.generateSubscriptionId();
        const fullSubscription: StateSubscription = {
            id,
            ...subscription
        };

        this.subscriptions.set(id, fullSubscription);
        return id;
    }

    unsubscribe(subscriptionId: string): boolean {
        return this.subscriptions.delete(subscriptionId);
    }

    subscribeToPlayerUpdates(callback: (playerState: PlayerState) => void): string {
        return this.subscribe({
            type: 'player',
            callback: (event) => {
                if (event.type === 'player') {
                    callback(event.data);
                }
            }
        });
    }

    subscribeToServerUpdates(hostname: string, callback: (serverState: ServerState) => void): string {
        return this.subscribe({
            type: 'server',
            callback: (event) => {
                if (event.type === 'server' && event.data.hostname === hostname) {
                    callback(event.data.state);
                }
            }
        });
    }

    subscribeToFactionUpdates(factionName: string, callback: (factionState: FactionState) => void): string {
        return this.subscribe({
            type: 'faction',
            callback: (event) => {
                if (event.type === 'faction' && event.data.faction === factionName) {
                    callback(event.data.state);
                }
            }
        });
    }

    subscribeToStockUpdates(symbol: string, callback: (stockState: StockState) => void): string {
        return this.subscribe({
            type: 'stock',
            callback: (event) => {
                if (event.type === 'stock' && event.data.symbol === symbol) {
                    callback(event.data.state);
                }
            }
        });
    }

    subscribeToAllUpdates(callback: (event: StateUpdateEvent) => void): string {
        return this.subscribe({
            type: 'all',
            callback
        });
    }

    async syncFromPage(pageName: string, data: any): Promise<void> {
        try {
            switch (pageName) {
                case 'terminal':
                    await this.syncTerminalData(data);
                    break;
                case 'stats':
                    await this.syncStatsData(data);
                    break;
                case 'hacknet':
                    await this.syncHacknetData(data);
                    break;
                case 'corporation':
                    await this.syncCorporationData(data);
                    break;
                case 'bitverse':
                    await this.syncBitVerseData(data);
                    break;
                case 'factions':
                    await this.syncFactionsData(data);
                    break;
                case 'city':
                    await this.syncCityData(data);
                    break;
                case 'gang':
                    await this.syncGangData(data);
                    break;
                case 'bladeburner':
                    await this.syncBladeburnerData(data);
                    break;
                case 'sleeves':
                    await this.syncSleevesData(data);
                    break;
                case 'augmentations':
                    await this.syncAugmentationsData(data);
                    break;
                case 'stockmarket':
                    await this.syncStockMarketData(data);
                    break;
                default:
                    console.warn(`Unknown page type for sync: ${pageName}`);
            }
        } catch (error) {
            console.error(`Failed to sync data from ${pageName}:`, error);
        }
    }

    broadcastStateChange(type: string, data: any): void {
        const event: StateUpdateEvent = {
            type: type as any,
            data,
            timestamp: Date.now()
        };

        this.handleStateUpdate(event);
    }

    getSharedState(): any {
        return {
            player: this.gameState.getPlayerState(),
            servers: Object.fromEntries(this.gameState.getAllServers()),
            factions: Object.fromEntries(this.gameState.getAllFactions()),
            stocks: Object.fromEntries(this.gameState.getAllStocks()),
            timestamp: Date.now()
        };
    }

    saveStateSnapshot(name: string): boolean {
        try {
            const win = getWindowAPI();
            const snapshot = this.gameState.getCurrentState();
            win.localStorage.setItem(`${this.options.storageKey}_snapshot_${name}`, JSON.stringify(snapshot));
            return true;
        } catch (error) {
            console.error('Failed to save state snapshot:', error);
            return false;
        }
    }

    loadStateSnapshot(name: string): boolean {
        try {
            const win = getWindowAPI();
            const snapshotData = win.localStorage.getItem(`${this.options.storageKey}_snapshot_${name}`);
            if (snapshotData) {
                return this.gameState.importState(snapshotData);
            }
            return false;
        } catch (error) {
            console.error('Failed to load state snapshot:', error);
            return false;
        }
    }

    clearAllSnapshots(): void {
        try {
            const win = getWindowAPI();
            const keys = Object.keys(win.localStorage);
            const snapshotKeys = keys.filter(key => key.startsWith(`${this.options.storageKey}_snapshot_`));
            
            for (const key of snapshotKeys) {
                win.localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Failed to clear snapshots:', error);
        }
    }

    private startRealTimeSync(): void {
        if (this.syncTimer) {
            return;
        }

        const win = getWindowAPI();
        this.syncTimer = win.setInterval(() => {
            this.performPeriodicSync();
        }, this.options.syncInterval);
    }

    private stopRealTimeSync(): void {
        if (this.syncTimer) {
            const win = getWindowAPI();
            win.clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    private async performPeriodicSync(): Promise<void> {
        // This would trigger a sync from the currently active page
        // Implementation depends on which page is currently active
        const currentUrl = getWindowAPI().location.pathname;
        
        try {
            // Emit a custom event that pages can listen for
            const win = getWindowAPI();
            win.dispatchEvent(new CustomEvent('bitburner-state-sync-request', {
                detail: { url: currentUrl, timestamp: Date.now() }
            }));
        } catch (error) {
            console.error('Failed to request periodic sync:', error);
        }
    }

    private handleStateUpdate(event: StateUpdateEvent): void {
        // Notify subscribers
        for (const subscription of this.subscriptions.values()) {
            try {
                if (subscription.type === 'all' || subscription.type === event.type) {
                    if (!subscription.filter || subscription.filter(event)) {
                        subscription.callback(event);
                    }
                }
            } catch (error) {
                console.error(`Error in subscription ${subscription.id}:`, error);
            }
        }

        // Persist to storage if enabled
        if (this.options.persistToStorage) {
            this.persistCurrentState();
        }
    }

    private persistCurrentState(): void {
        try {
            const win = getWindowAPI();
            const state = this.gameState.exportState();
            win.localStorage.setItem(this.options.storageKey, state);
        } catch (error) {
            console.error('Failed to persist state:', error);
        }
    }

    private loadPersistedState(): void {
        try {
            const win = getWindowAPI();
            const persistedState = win.localStorage.getItem(this.options.storageKey);
            if (persistedState) {
                this.gameState.importState(persistedState);
            }
        } catch (error) {
            console.error('Failed to load persisted state:', error);
        }
    }

    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Specialized sync methods for different page types
    private async syncTerminalData(data: any): Promise<void> {
        if (data.currentServer) {
            this.gameState.updatePlayerState({ currentServer: data.currentServer });
        }
    }

    private async syncStatsData(data: any): Promise<void> {
        if (data.player) {
            this.gameState.updatePlayerState(data.player);
        }
    }

    private async syncHacknetData(data: any): Promise<void> {
        if (data.hacknet) {
            this.gameState.updateHacknetState(data.hacknet);
        }
    }

    private async syncCorporationData(data: any): Promise<void> {
        if (data.corporation) {
            this.gameState.updateCorporationState(data.corporation);
        }
    }

    private async syncBitVerseData(data: any): Promise<void> {
        if (data.bitNode) {
            this.gameState.updatePlayerState({ bitNodeN: data.bitNode });
        }
        if (data.sourceFiles) {
            this.gameState.updatePlayerState({ sourceFiles: data.sourceFiles });
        }
    }

    private async syncFactionsData(data: any): Promise<void> {
        if (data.factions && Array.isArray(data.factions)) {
            for (const faction of data.factions) {
                this.gameState.updateFactionState(faction.name, faction);
            }
        }
    }

    private async syncCityData(data: any): Promise<void> {
        if (data.location) {
            this.gameState.updatePlayerState({ location: data.location });
        }
    }

    private async syncGangData(data: any): Promise<void> {
        if (data.gang) {
            this.gameState.updateGangState(data.gang);
        }
    }

    private async syncBladeburnerData(data: any): Promise<void> {
        if (data.bladeburner) {
            this.gameState.updateBladeburnerState(data.bladeburner);
        }
    }

    private async syncSleevesData(data: any): Promise<void> {
        if (data.sleeves) {
            this.gameState.updateSleevesState(data.sleeves);
        }
    }

    private async syncAugmentationsData(data: any): Promise<void> {
        if (data.augmentations) {
            this.gameState.updatePlayerState({ augmentations: data.augmentations });
        }
    }

    private async syncStockMarketData(data: any): Promise<void> {
        if (data.stocks && Array.isArray(data.stocks)) {
            for (const stock of data.stocks) {
                this.gameState.updateStockState(stock.symbol, stock);
            }
        }
    }

    destroy(): void {
        this.stopRealTimeSync();
        this.subscriptions.clear();
        this.isInitialized = false;
    }
}