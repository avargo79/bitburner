import { getWindowAPI } from '/lib/react-browser-utils';

export interface PlayerState {
    name: string;
    money: number;
    hackingLevel: number;
    hackingExp: number;
    stats: {
        hack: number;
        str: number;
        def: number;
        dex: number;
        agi: number;
        cha: number;
    };
    location: string;
    currentServer: string;
    bitNodeN: number;
    sourceFiles: number[];
    augmentations: string[];
    factions: string[];
    karma: number;
    entropy: number;
    intelligence: number;
}

export interface ServerState {
    hostname: string;
    ip: string;
    maxMoney: number;
    currentMoney: number;
    securityLevel: number;
    minSecurityLevel: number;
    hackTime: number;
    growTime: number;
    weakenTime: number;
    requiredHackingLevel: number;
    numPortsRequired: number;
    hasAdminRights: boolean;
    backdoorInstalled: boolean;
    ramUsed: number;
    maxRam: number;
}

export interface FactionState {
    name: string;
    reputation: number;
    favor: number;
    augmentations: string[];
    isMember: boolean;
    workType: string | null;
}

export interface StockState {
    symbol: string;
    price: number;
    forecast: number;
    volatility: number;
    shares: number;
    avgPrice: number;
    shortShares: number;
    shortAvgPrice: number;
}

export interface GameStateSnapshot {
    timestamp: number;
    player: PlayerState;
    servers: Map<string, ServerState>;
    factions: Map<string, FactionState>;
    stocks: Map<string, StockState>;
    gang: any | null;
    bladeburner: any | null;
    sleeves: any[] | null;
    corporation: any | null;
    hacknet: any | null;
}

export interface StateUpdateEvent {
    type: 'player' | 'server' | 'faction' | 'stock' | 'gang' | 'bladeburner' | 'sleeves' | 'corporation' | 'hacknet';
    data: any;
    timestamp: number;
}

export class ReactGameState {
    private static instance: ReactGameState;
    private currentState: GameStateSnapshot;
    private stateHistory: GameStateSnapshot[] = [];
    private updateListeners: Set<(event: StateUpdateEvent) => void> = new Set();
    private maxHistoryLength = 100;
    private updateInterval = 1000; // 1 second
    private intervalId: number | null = null;
    private isMonitoring = false;

    private constructor() {
        this.currentState = this.createEmptyState();
    }

    static getInstance(): ReactGameState {
        if (!ReactGameState.instance) {
            ReactGameState.instance = new ReactGameState();
        }
        return ReactGameState.instance;
    }

    getCurrentState(): GameStateSnapshot {
        return { ...this.currentState };
    }

    getStateHistory(): GameStateSnapshot[] {
        return [...this.stateHistory];
    }

    getPlayerState(): PlayerState {
        return { ...this.currentState.player };
    }

    getServerState(hostname: string): ServerState | null {
        return this.currentState.servers.get(hostname) || null;
    }

    getAllServers(): Map<string, ServerState> {
        return new Map(this.currentState.servers);
    }

    getFactionState(factionName: string): FactionState | null {
        return this.currentState.factions.get(factionName) || null;
    }

    getAllFactions(): Map<string, FactionState> {
        return new Map(this.currentState.factions);
    }

    getStockState(symbol: string): StockState | null {
        return this.currentState.stocks.get(symbol) || null;
    }

    getAllStocks(): Map<string, StockState> {
        return new Map(this.currentState.stocks);
    }

    updatePlayerState(playerState: Partial<PlayerState>): void {
        const oldState = { ...this.currentState.player };
        this.currentState.player = { ...oldState, ...playerState };
        this.notifyListeners({
            type: 'player',
            data: this.currentState.player,
            timestamp: Date.now()
        });
    }

    updateServerState(hostname: string, serverState: Partial<ServerState>): void {
        const oldState = this.currentState.servers.get(hostname) || this.createEmptyServerState(hostname);
        const newState = { ...oldState, ...serverState };
        this.currentState.servers.set(hostname, newState);
        this.notifyListeners({
            type: 'server',
            data: { hostname, state: newState },
            timestamp: Date.now()
        });
    }

    updateFactionState(factionName: string, factionState: Partial<FactionState>): void {
        const oldState = this.currentState.factions.get(factionName) || this.createEmptyFactionState(factionName);
        const newState = { ...oldState, ...factionState };
        this.currentState.factions.set(factionName, newState);
        this.notifyListeners({
            type: 'faction',
            data: { faction: factionName, state: newState },
            timestamp: Date.now()
        });
    }

    updateStockState(symbol: string, stockState: Partial<StockState>): void {
        const oldState = this.currentState.stocks.get(symbol) || this.createEmptyStockState(symbol);
        const newState = { ...oldState, ...stockState };
        this.currentState.stocks.set(symbol, newState);
        this.notifyListeners({
            type: 'stock',
            data: { symbol, state: newState },
            timestamp: Date.now()
        });
    }

    updateGangState(gangState: any): void {
        this.currentState.gang = gangState;
        this.notifyListeners({
            type: 'gang',
            data: gangState,
            timestamp: Date.now()
        });
    }

    updateBladeburnerState(bladeburnerState: any): void {
        this.currentState.bladeburner = bladeburnerState;
        this.notifyListeners({
            type: 'bladeburner',
            data: bladeburnerState,
            timestamp: Date.now()
        });
    }

    updateSleevesState(sleevesState: any[]): void {
        this.currentState.sleeves = sleevesState;
        this.notifyListeners({
            type: 'sleeves',
            data: sleevesState,
            timestamp: Date.now()
        });
    }

    updateCorporationState(corporationState: any): void {
        this.currentState.corporation = corporationState;
        this.notifyListeners({
            type: 'corporation',
            data: corporationState,
            timestamp: Date.now()
        });
    }

    updateHacknetState(hacknetState: any): void {
        this.currentState.hacknet = hacknetState;
        this.notifyListeners({
            type: 'hacknet',
            data: hacknetState,
            timestamp: Date.now()
        });
    }

    addStateUpdateListener(listener: (event: StateUpdateEvent) => void): void {
        this.updateListeners.add(listener);
    }

    removeStateUpdateListener(listener: (event: StateUpdateEvent) => void): void {
        this.updateListeners.delete(listener);
    }

    startMonitoring(intervalMs?: number): void {
        if (this.isMonitoring) {
            return;
        }

        if (intervalMs) {
            this.updateInterval = intervalMs;
        }

        this.isMonitoring = true;
        this.intervalId = getWindowAPI().setInterval(() => {
            this.captureStateSnapshot();
        }, this.updateInterval);
    }

    stopMonitoring(): void {
        if (!this.isMonitoring || !this.intervalId) {
            return;
        }

        getWindowAPI().clearInterval(this.intervalId);
        this.intervalId = null;
        this.isMonitoring = false;
    }

    isCurrentlyMonitoring(): boolean {
        return this.isMonitoring;
    }

    captureStateSnapshot(): void {
        const snapshot: GameStateSnapshot = {
            timestamp: Date.now(),
            player: { ...this.currentState.player },
            servers: new Map(this.currentState.servers),
            factions: new Map(this.currentState.factions),
            stocks: new Map(this.currentState.stocks),
            gang: this.currentState.gang ? { ...this.currentState.gang } : null,
            bladeburner: this.currentState.bladeburner ? { ...this.currentState.bladeburner } : null,
            sleeves: this.currentState.sleeves ? [...this.currentState.sleeves] : null,
            corporation: this.currentState.corporation ? { ...this.currentState.corporation } : null,
            hacknet: this.currentState.hacknet ? { ...this.currentState.hacknet } : null
        };

        this.stateHistory.push(snapshot);

        // Trim history if it gets too long
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }

    getStateAt(timestamp: number): GameStateSnapshot | null {
        return this.stateHistory.find(state => 
            Math.abs(state.timestamp - timestamp) < 1000
        ) || null;
    }

    getStateChanges(fromTimestamp: number, toTimestamp: number): StateUpdateEvent[] {
        const changes: StateUpdateEvent[] = [];
        
        const fromState = this.getStateAt(fromTimestamp);
        const toState = this.getStateAt(toTimestamp);
        
        if (!fromState || !toState) {
            return changes;
        }

        // Compare player states
        if (JSON.stringify(fromState.player) !== JSON.stringify(toState.player)) {
            changes.push({
                type: 'player',
                data: toState.player,
                timestamp: toTimestamp
            });
        }

        // Compare server states
        for (const [hostname, serverState] of toState.servers) {
            const oldServerState = fromState.servers.get(hostname);
            if (!oldServerState || JSON.stringify(oldServerState) !== JSON.stringify(serverState)) {
                changes.push({
                    type: 'server',
                    data: { hostname, state: serverState },
                    timestamp: toTimestamp
                });
            }
        }

        // Similar comparisons for other state types...

        return changes;
    }

    exportState(): string {
        return JSON.stringify(this.currentState, (key, value) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        });
    }

    importState(stateJson: string): boolean {
        try {
            const imported = JSON.parse(stateJson);
            
            // Convert objects back to Maps
            imported.servers = new Map(Object.entries(imported.servers || {}));
            imported.factions = new Map(Object.entries(imported.factions || {}));
            imported.stocks = new Map(Object.entries(imported.stocks || {}));
            
            this.currentState = imported;
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    reset(): void {
        this.currentState = this.createEmptyState();
        this.stateHistory = [];
        this.stopMonitoring();
    }

    private createEmptyState(): GameStateSnapshot {
        return {
            timestamp: Date.now(),
            player: this.createEmptyPlayerState(),
            servers: new Map(),
            factions: new Map(),
            stocks: new Map(),
            gang: null,
            bladeburner: null,
            sleeves: null,
            corporation: null,
            hacknet: null
        };
    }

    private createEmptyPlayerState(): PlayerState {
        return {
            name: '',
            money: 0,
            hackingLevel: 1,
            hackingExp: 0,
            stats: { hack: 1, str: 1, def: 1, dex: 1, agi: 1, cha: 1 },
            location: 'home',
            currentServer: 'home',
            bitNodeN: 1,
            sourceFiles: [],
            augmentations: [],
            factions: [],
            karma: 0,
            entropy: 0,
            intelligence: 0
        };
    }

    private createEmptyServerState(hostname: string): ServerState {
        return {
            hostname,
            ip: '',
            maxMoney: 0,
            currentMoney: 0,
            securityLevel: 1,
            minSecurityLevel: 1,
            hackTime: 1000,
            growTime: 1000,
            weakenTime: 1000,
            requiredHackingLevel: 1,
            numPortsRequired: 0,
            hasAdminRights: false,
            backdoorInstalled: false,
            ramUsed: 0,
            maxRam: 0
        };
    }

    private createEmptyFactionState(name: string): FactionState {
        return {
            name,
            reputation: 0,
            favor: 0,
            augmentations: [],
            isMember: false,
            workType: null
        };
    }

    private createEmptyStockState(symbol: string): StockState {
        return {
            symbol,
            price: 0,
            forecast: 50,
            volatility: 0,
            shares: 0,
            avgPrice: 0,
            shortShares: 0,
            shortAvgPrice: 0
        };
    }

    private notifyListeners(event: StateUpdateEvent): void {
        for (const listener of this.updateListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in state update listener:', error);
            }
        }
    }
}