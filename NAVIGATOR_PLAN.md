# Navigator Plan - Complete Bitburner Browser Automation

## Current Status: Phase 1 Complete ✅

### ✅ What We Have (1.60GB RAM)
- **Core Browser APIs**: Zero-cost access to DOM, window, document via stealth technique
- **Basic Terminal**: Command execution, file operations, server navigation
- **Logger System**: Debug/production logging without NS dependencies  
- **DOM Utilities**: Element selection, clicking, text extraction, waiting
- **Storage Integration**: localStorage wrapper for persistence

### ⚠️ Current Issues
- **CSS Selector Problem**: `:contains()` pseudo-selector not supported in modern browsers
- **Limited Navigation**: Only terminal navigation implemented
- **No Game State Tracking**: No monitoring of player stats, money, resources
- **Basic UI Detection**: Need more robust element finding strategies

## Phase 2: Fix CSS Selectors & Core Navigation 🔧

### Priority 1: Selector System Overhaul
Replace all `:contains()` selectors with proper DOM traversal:

```typescript
// ❌ Current (broken):
querySelector('.MuiListItem-root:contains("Terminal")')

// ✅ Target implementation:
function findElementByText(selector: string, text: string, exact = false): Element | null {
    const elements = querySelectorAll(selector);
    return Array.from(elements).find(el => {
        const textContent = el.textContent || '';
        return exact ? textContent.trim() === text : textContent.includes(text);
    }) || null;
}
```

### Priority 2: Robust Navigation System
Complete game section navigation:

```typescript
export class Navigator {
    // ✅ Existing
    async terminal(): Promise<TerminalPageImpl>
    
    // 🔄 Need to implement
    async hacknet(): Promise<HacknetPageImpl>
    async augmentations(): Promise<AugmentationsPageImpl> 
    async factions(): Promise<FactionsPageImpl>
    async sleeves(): Promise<SleevesPageImpl>
    async stockMarket(): Promise<StockMarketPageImpl>
    async gang(): Promise<GangPageImpl>
    async bladeburner(): Promise<BladeburnerPageImpl>
    async corporation(): Promise<CorporationPageImpl>
    async stats(): Promise<StatsPageImpl>
    async options(): Promise<OptionsPageImpl>
}
```

### Priority 3: Element Finding Strategy
Multi-layered approach for reliable element detection:

```typescript
class ElementFinder {
    // Try multiple selectors in order of preference
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
            if (element) return element;
        }
        return null;
    }
}
```

## Phase 3: Complete Game Section Implementation 🎮

### Hacknet Management
```typescript
export class HacknetPageImpl {
    async getNodes(): Promise<HacknetNode[]>
    async buyNode(): Promise<boolean>
    async upgradeLevel(nodeIndex: number): Promise<boolean>
    async upgradeRAM(nodeIndex: number): Promise<boolean>
    async upgradeCores(nodeIndex: number): Promise<boolean>
    async getUpgradeCosts(nodeIndex: number): Promise<UpgradeCosts>
    async autoOptimize(budget: number): Promise<OptimizationResult>
}
```

### Augmentation System
```typescript
export class AugmentationsPageImpl {
    async getAvailable(): Promise<Augmentation[]>
    async getOwned(): Promise<Augmentation[]>
    async buyAugmentation(name: string): Promise<boolean>
    async getPrerequisites(name: string): Promise<string[]>
    async getCost(name: string): Promise<{money: number, rep: number}>
    async installAll(): Promise<boolean>
}
```

### Faction Management
```typescript
export class FactionsPageImpl {
    async getJoined(): Promise<Faction[]>
    async getInvitations(): Promise<Faction[]>
    async joinFaction(name: string): Promise<boolean>
    async donate(faction: string, amount: number): Promise<boolean>
    async workForFaction(faction: string, workType: string): Promise<boolean>
    async getReputation(faction: string): Promise<number>
}
```

### Stock Market Trading
```typescript
export class StockMarketPageImpl {
    async getPortfolio(): Promise<StockPosition[]>
    async getStockPrice(symbol: string): Promise<number>
    async buyStock(symbol: string, shares: number): Promise<boolean>
    async sellStock(symbol: string, shares: number): Promise<boolean>
    async getMarketData(): Promise<MarketData[]>
    async autoTrade(strategy: TradingStrategy): Promise<TradeResult>
}
```

### Sleeves System
```typescript
export class SleevesPageImpl {
    async getSleeveCount(): Promise<number>
    async getSleeveStats(index: number): Promise<SleeveStats>
    async setSleeveTask(index: number, task: SleeveTask): Promise<boolean>
    async buySleeveAugmentation(index: number, aug: string): Promise<boolean>
    async synchronizeSleeve(index: number): Promise<boolean>
}
```

## Phase 4: Advanced Automation Features 🤖

### Game State Monitoring
```typescript
export class GameStateMonitor {
    async getPlayerStats(): Promise<PlayerStats>
    async getMoney(): Promise<number>
    async getSkills(): Promise<Skills>
    async getServerInfo(server: string): Promise<ServerInfo>
    async isGamePaused(): Promise<boolean>
    async waitForGameReady(): Promise<boolean>
    
    // Real-time monitoring
    onMoneyChange(callback: (newAmount: number) => void): void
    onSkillChange(callback: (skill: string, newLevel: number) => void): void
    onServerChange(callback: (newServer: string) => void): void
}
```

### Automated Workflows
```typescript
export class AutomationWorkflows {
    // Complete server takeover
    async autoHackNetwork(options: NetworkHackOptions): Promise<HackResult>
    
    // Resource optimization
    async optimizeIncome(strategy: IncomeStrategy): Promise<void>
    
    // Progression automation  
    async autoProgression(goals: ProgressionGoals): Promise<void>
    
    // Emergency responses
    async handleGameReset(): Promise<void>
    async recoverFromError(): Promise<boolean>
}
```

### Smart Element Detection
```typescript
export class SmartDetection {
    // Adaptive element finding based on game version
    async detectGameVersion(): Promise<string>
    async updateSelectors(): Promise<void>
    
    // Dynamic UI analysis
    async mapGameInterface(): Promise<InterfaceMap>
    async findNewElements(): Promise<Element[]>
    
    // Self-healing selectors
    async repairBrokenSelectors(): Promise<RepairResult>
}
```

## Phase 5: Performance & Reliability 🚀

### Caching & Optimization
```typescript
export class NavigatorCache {
    // Cache element references
    private elementCache: Map<string, Element> = new Map();
    
    // Cache DOM queries
    private queryCache: Map<string, Element[]> = new Map();
    
    // Intelligent cache invalidation
    async invalidateOnPageChange(): Promise<void>
    async preloadCommonElements(): Promise<void>
}
```

### Error Recovery
```typescript
export class ErrorRecovery {
    async retryOperation<T>(
        operation: () => Promise<T>, 
        maxRetries: number = 3
    ): Promise<T>
    
    async recoverFromStaleElements(): Promise<void>
    async resetToSafeState(): Promise<void>
    async diagnoseFailure(error: Error): Promise<DiagnosisResult>
}
```

### Performance Monitoring
```typescript
export class NavigatorMetrics {
    private operationTimes: Map<string, number[]> = new Map();
    
    async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T>
    async getAverageTime(operation: string): Promise<number>
    async optimizeSlowOperations(): Promise<void>
}
```

## Phase 6: Advanced Browser Integration 🌐

### Multi-Tab Coordination
```typescript
export class MultiTabManager {
    async openNewTab(url: string): Promise<void>
    async switchToTab(index: number): Promise<void>
    async coordinateAcrossTabs(): Promise<void>
    async syncGameState(): Promise<void>
}
```

### Background Processing
```typescript
export class BackgroundWorker {
    // Use Web Workers for heavy computations
    async calculateOptimalStrategy(data: GameData): Promise<Strategy>
    async monitorNetworkChanges(): Promise<void>
    async processMarketData(): Promise<MarketAnalysis>
}
```

### Real-Time Communication
```typescript
export class RealtimeSync {
    // BroadcastChannel for cross-script communication
    async broadcastGameState(): Promise<void>
    async subscribeToUpdates(): Promise<void>
    async coordinateMultipleScripts(): Promise<void>
}
```

## Implementation Roadmap 📅

### Week 1: Core Fixes
- [ ] Fix CSS selector issues
- [ ] Implement robust element finding
- [ ] Complete basic navigation system
- [ ] Add comprehensive error handling

### Week 2: Game Sections  
- [ ] Hacknet page implementation
- [ ] Augmentations page implementation
- [ ] Factions page implementation
- [ ] Stock market page implementation

### Week 3: Advanced Features
- [ ] Game state monitoring
- [ ] Automated workflows
- [ ] Performance optimization
- [ ] Caching system

### Week 4: Polish & Integration
- [ ] Comprehensive testing
- [ ] Documentation completion
- [ ] Integration with existing codebase
- [ ] Performance benchmarking

## Architecture Goals 🏗️

### Maintainability
- **Modular Design**: Each game section as separate class
- **Consistent APIs**: Common patterns across all implementations
- **Type Safety**: Full TypeScript coverage with interfaces
- **Documentation**: Comprehensive inline and external docs

### Reliability  
- **Fault Tolerance**: Graceful degradation when elements not found
- **Self-Healing**: Automatic recovery from common failures
- **Retry Logic**: Built-in retry for transient failures
- **State Validation**: Verify operations succeeded

### Performance
- **Zero RAM Cost**: Maintain stealth browser API usage
- **Efficient Caching**: Cache DOM queries and element references
- **Lazy Loading**: Load sections only when needed
- **Optimized Queries**: Minimize DOM traversal

### Extensibility
- **Plugin Architecture**: Easy to add new game sections
- **Hook System**: Allow custom behavior injection
- **Strategy Pattern**: Configurable automation strategies
- **Event System**: Subscribe to game state changes

## Success Metrics 📊

### Technical Metrics
- **RAM Usage**: Maintain < 2GB total
- **Response Time**: < 100ms for common operations
- **Success Rate**: > 95% for element detection
- **Error Recovery**: < 1s for automatic recovery

### Functional Metrics
- **Coverage**: Support all major game sections
- **Automation**: Enable full hands-free gameplay
- **Reliability**: 24/7 operation capability
- **Adaptability**: Handle game updates gracefully

## Future Vision 🔮

The completed Navigator will transform Bitburner automation from basic scripting to **comprehensive browser automation**, enabling:

- **Full Game Control**: Every clickable element programmable
- **Intelligent Automation**: Context-aware decision making
- **Cross-Session Persistence**: Survive game resets and updates
- **Advanced Strategies**: Complex multi-step optimization
- **Real-Time Adaptation**: Dynamic response to game changes

This will make the Navigator the **definitive automation framework** for Bitburner, providing the foundation for sophisticated AI-driven gameplay optimization.