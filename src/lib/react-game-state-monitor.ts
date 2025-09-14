import { ReactGameState, StateUpdateEvent, GameStateSnapshot } from '/lib/react-game-state';
import { ReactGameStateSync } from '/lib/react-game-state-sync';
import { getWindowAPI } from '/lib/react-browser-utils';

export interface MonitoringRule {
    id: string;
    name: string;
    description: string;
    condition: (state: GameStateSnapshot) => boolean;
    action: (state: GameStateSnapshot) => void;
    priority: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    lastTriggered?: number;
    cooldownMs?: number;
}

export interface StateAlert {
    id: string;
    ruleId: string;
    timestamp: number;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    data: any;
    acknowledged: boolean;
}

export interface MonitoringMetrics {
    moneyPerSecond: number;
    experiencePerSecond: number;
    reputationPerSecond: Map<string, number>;
    scriptExecutionTime: number;
    memoryUsage: number;
    serverUtilization: Map<string, number>;
    lastUpdate: number;
}

export class ReactGameStateMonitor {
    private static instance: ReactGameStateMonitor;
    private gameState: ReactGameState;
    private gameStateSync: ReactGameStateSync;
    private monitoringRules: Map<string, MonitoringRule> = new Map();
    private alerts: StateAlert[] = [];
    private metrics: MonitoringMetrics;
    private isMonitoring = false;
    private monitoringInterval: number | null = null;
    private metricsInterval: number | null = null;
    private alertListeners: Set<(alert: StateAlert) => void> = new Set();
    private previousState: GameStateSnapshot | null = null;

    private constructor() {
        this.gameState = ReactGameState.getInstance();
        this.gameStateSync = ReactGameStateSync.getInstance();
        this.metrics = this.createEmptyMetrics();
        this.setupDefaultRules();
    }

    static getInstance(): ReactGameStateMonitor {
        if (!ReactGameStateMonitor.instance) {
            ReactGameStateMonitor.instance = new ReactGameStateMonitor();
        }
        return ReactGameStateMonitor.instance;
    }

    startMonitoring(intervalMs: number = 1000): void {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        
        // Start main monitoring loop
        const win = getWindowAPI();
        this.monitoringInterval = win.setInterval(() => {
            this.performMonitoringCheck();
        }, intervalMs);

        // Start metrics calculation (more frequent)
        this.metricsInterval = win.setInterval(() => {
            this.updateMetrics();
        }, Math.min(intervalMs, 500));

        // Start game state monitoring
        this.gameState.startMonitoring(intervalMs);
    }

    stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        const win = getWindowAPI();
        
        if (this.monitoringInterval) {
            win.clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.metricsInterval) {
            win.clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        this.gameState.stopMonitoring();
        this.isMonitoring = false;
    }

    addRule(rule: Omit<MonitoringRule, 'id'>): string {
        const id = this.generateRuleId();
        const fullRule: MonitoringRule = {
            id,
            ...rule
        };
        
        this.monitoringRules.set(id, fullRule);
        return id;
    }

    removeRule(ruleId: string): boolean {
        return this.monitoringRules.delete(ruleId);
    }

    updateRule(ruleId: string, updates: Partial<MonitoringRule>): boolean {
        const rule = this.monitoringRules.get(ruleId);
        if (!rule) {
            return false;
        }

        this.monitoringRules.set(ruleId, { ...rule, ...updates });
        return true;
    }

    enableRule(ruleId: string): boolean {
        return this.updateRule(ruleId, { enabled: true });
    }

    disableRule(ruleId: string): boolean {
        return this.updateRule(ruleId, { enabled: false });
    }

    getAllRules(): MonitoringRule[] {
        return Array.from(this.monitoringRules.values());
    }

    getActiveAlerts(): StateAlert[] {
        return this.alerts.filter(alert => !alert.acknowledged);
    }

    getAllAlerts(): StateAlert[] {
        return [...this.alerts];
    }

    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }

    clearAcknowledgedAlerts(): void {
        this.alerts = this.alerts.filter(alert => !alert.acknowledged);
    }

    addAlertListener(listener: (alert: StateAlert) => void): void {
        this.alertListeners.add(listener);
    }

    removeAlertListener(listener: (alert: StateAlert) => void): void {
        this.alertListeners.delete(listener);
    }

    getCurrentMetrics(): MonitoringMetrics {
        return { ...this.metrics };
    }

    getMetricsHistory(durationMs: number): MonitoringMetrics[] {
        // Would implement metrics history storage
        return [];
    }

    exportMonitoringData(): string {
        return JSON.stringify({
            rules: Array.from(this.monitoringRules.values()),
            alerts: this.alerts,
            metrics: this.metrics,
            timestamp: Date.now()
        });
    }

    importMonitoringData(data: string): boolean {
        try {
            const imported = JSON.parse(data);
            
            if (imported.rules) {
                this.monitoringRules.clear();
                for (const rule of imported.rules) {
                    this.monitoringRules.set(rule.id, rule);
                }
            }
            
            if (imported.alerts) {
                this.alerts = imported.alerts;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import monitoring data:', error);
            return false;
        }
    }

    private performMonitoringCheck(): void {
        const currentState = this.gameState.getCurrentState();
        
        // Check each enabled rule
        for (const rule of this.monitoringRules.values()) {
            if (!rule.enabled) {
                continue;
            }

            // Check cooldown
            if (rule.cooldownMs && rule.lastTriggered) {
                const timeSinceTriggered = Date.now() - rule.lastTriggered;
                if (timeSinceTriggered < rule.cooldownMs) {
                    continue;
                }
            }

            try {
                if (rule.condition(currentState)) {
                    // Update last triggered time
                    rule.lastTriggered = Date.now();
                    
                    // Execute action
                    rule.action(currentState);
                    
                    // Create alert
                    this.createAlert(rule, currentState);
                }
            } catch (error) {
                console.error(`Error in monitoring rule ${rule.id}:`, error);
                this.createErrorAlert(rule, error as Error);
            }
        }

        this.previousState = currentState;
    }

    private updateMetrics(): void {
        const currentState = this.gameState.getCurrentState();
        const now = Date.now();
        
        if (this.previousState && this.metrics.lastUpdate > 0) {
            const deltaTime = (now - this.metrics.lastUpdate) / 1000; // Convert to seconds
            
            // Calculate money per second
            const moneyDelta = currentState.player.money - this.previousState.player.money;
            this.metrics.moneyPerSecond = moneyDelta / deltaTime;
            
            // Calculate experience per second
            const expDelta = currentState.player.hackingExp - this.previousState.player.hackingExp;
            this.metrics.experiencePerSecond = expDelta / deltaTime;
            
            // Calculate reputation per second for each faction
            this.metrics.reputationPerSecond.clear();
            for (const [factionName, currentFaction] of currentState.factions) {
                const previousFaction = this.previousState.factions.get(factionName);
                if (previousFaction) {
                    const repDelta = currentFaction.reputation - previousFaction.reputation;
                    this.metrics.reputationPerSecond.set(factionName, repDelta / deltaTime);
                }
            }
            
            // Calculate server utilization
            this.metrics.serverUtilization.clear();
            for (const [hostname, server] of currentState.servers) {
                const utilization = server.maxRam > 0 ? (server.ramUsed / server.maxRam) * 100 : 0;
                this.metrics.serverUtilization.set(hostname, utilization);
            }
        }
        
        this.metrics.lastUpdate = now;
    }

    private createAlert(rule: MonitoringRule, state: GameStateSnapshot): void {
        const alert: StateAlert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            timestamp: Date.now(),
            severity: this.rulePriorityToSeverity(rule.priority),
            message: `Rule "${rule.name}" triggered: ${rule.description}`,
            data: { rule: rule.name, state: state.timestamp },
            acknowledged: false
        };
        
        this.alerts.push(alert);
        
        // Trim alerts if too many
        if (this.alerts.length > 1000) {
            this.alerts.shift();
        }
        
        // Notify listeners
        for (const listener of this.alertListeners) {
            try {
                listener(alert);
            } catch (error) {
                console.error('Error in alert listener:', error);
            }
        }
    }

    private createErrorAlert(rule: MonitoringRule, error: Error): void {
        const alert: StateAlert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            timestamp: Date.now(),
            severity: 'error',
            message: `Error in rule "${rule.name}": ${error.message}`,
            data: { error: error.message, stack: error.stack },
            acknowledged: false
        };
        
        this.alerts.push(alert);
        
        // Notify listeners
        for (const listener of this.alertListeners) {
            try {
                listener(alert);
            } catch (error) {
                console.error('Error in alert listener:', error);
            }
        }
    }

    private setupDefaultRules(): void {
        // Low money warning
        this.addRule({
            name: 'Low Money Warning',
            description: 'Player money is below $1M',
            condition: (state) => state.player.money < 1000000,
            action: (state) => console.warn('Low money:', state.player.money),
            priority: 'medium',
            enabled: true,
            cooldownMs: 30000 // 30 seconds
        });

        // High server utilization
        this.addRule({
            name: 'High RAM Usage',
            description: 'Server RAM usage is above 90%',
            condition: (state) => {
                for (const [hostname, server] of state.servers) {
                    if (server.maxRam > 0) {
                        const utilization = server.ramUsed / server.maxRam;
                        if (utilization > 0.9) {
                            return true;
                        }
                    }
                }
                return false;
            },
            action: (state) => console.warn('High RAM usage detected'),
            priority: 'medium',
            enabled: true,
            cooldownMs: 60000 // 1 minute
        });

        // Stock market crash detection
        this.addRule({
            name: 'Stock Market Alert',
            description: 'Major stock price movement detected',
            condition: (state) => {
                for (const [symbol, stock] of state.stocks) {
                    if (Math.abs(stock.forecast - 50) > 40) {
                        return true;
                    }
                }
                return false;
            },
            action: (state) => console.info('Stock market movement detected'),
            priority: 'low',
            enabled: true,
            cooldownMs: 10000 // 10 seconds
        });

        // Faction reputation milestone
        this.addRule({
            name: 'Faction Reputation Milestone',
            description: 'Faction reputation reached milestone',
            condition: (state) => {
                for (const [factionName, faction] of state.factions) {
                    if (faction.reputation > 0 && faction.reputation % 100000 < 1000) {
                        return true;
                    }
                }
                return false;
            },
            action: (state) => console.info('Faction reputation milestone reached'),
            priority: 'low',
            enabled: true,
            cooldownMs: 120000 // 2 minutes
        });
    }

    private createEmptyMetrics(): MonitoringMetrics {
        return {
            moneyPerSecond: 0,
            experiencePerSecond: 0,
            reputationPerSecond: new Map(),
            scriptExecutionTime: 0,
            memoryUsage: 0,
            serverUtilization: new Map(),
            lastUpdate: 0
        };
    }

    private rulePriorityToSeverity(priority: MonitoringRule['priority']): StateAlert['severity'] {
        switch (priority) {
            case 'critical': return 'critical';
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'info';
        }
    }

    private generateRuleId(): string {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy(): void {
        this.stopMonitoring();
        this.monitoringRules.clear();
        this.alerts = [];
        this.alertListeners.clear();
    }
}