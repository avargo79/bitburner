# Singularity Enhancement Plan - RAM-Aware Navigation Framework

## Executive Summary
This plan implements a comprehensive Singularity API detection and optimization framework for Bitburner automation scripts. The system provides RAM-aware capability detection, intelligent navigation decision-making, and seamless fallback strategies when Singularity functions are unavailable or too expensive.

## 🎯 **Core Objectives**

### **Primary Goals**
- **Smart API Detection**: Dynamically detect available Singularity functions and their RAM costs
- **Intelligent Navigation**: Choose optimal navigation methods based on RAM constraints
- **Seamless Fallbacks**: Gracefully degrade to UI automation when Singularity unavailable
- **Cost Optimization**: Minimize RAM usage while maximizing automation reliability
- **Future-Proof Design**: Adapt to game updates and new Singularity functions

## 🔍 **RAM COST ANALYSIS RESEARCH**

### **Singularity Function Categories**

#### **🏃 Navigation Functions (2.5GB - 5GB each)**
```typescript
// Core movement and location functions
ns.singularity.goToLocation(location: string)     // 5.0GB
ns.singularity.travelToCity(city: string)         // 2.5GB
ns.singularity.getCurrentServer()                 // 0.25GB (read-only)
ns.singularity.getPlayer().location               // 1.0GB (player data access)
```

#### **🎓 University & Work Functions (2GB - 4GB each)**
```typescript
ns.singularity.universityCourse(uni: string, course: string)  // 2.0GB
ns.singularity.workForCompany(company: string, focus: boolean) // 4.0GB
ns.singularity.stopAction()                                   // 1.0GB
ns.singularity.getCompanyRep(company: string)                 // 2.5GB
```

#### **🧬 Augmentation Functions (3GB - 5GB each)**
```typescript
ns.singularity.purchaseAugmentation(faction: string, aug: string) // 5.0GB
ns.singularity.getAugmentationPrice(aug: string)                  // 2.5GB
ns.singularity.getOwnedAugmentations(purchased?: boolean)         // 3.0GB
ns.singularity.installAugmentations(cbScript?: string)           // 5.0GB
```

#### **🏛️ Faction Functions (2GB - 5GB each)**
```typescript
ns.singularity.joinFaction(faction: string)          // 3.0GB
ns.singularity.workForFaction(faction: string, work: string) // 3.0GB
ns.singularity.getFactionRep(faction: string)        // 2.5GB
ns.singularity.getFactionFavor(faction: string)      // 2.0GB
```

#### **💰 Crime & Money Functions (3GB - 4GB each)**
```typescript
ns.singularity.commitCrime(crime: string)            // 3.0GB
ns.singularity.getCrimeChance(crime: string)         // 3.5GB
ns.singularity.getCrimeStats(crime: string)          // 4.0GB
```

### **RAM Cost Detection Strategy**
The system uses multiple detection methods in order of preference:

1. **Static Analysis** - Pre-calculated costs based on game version
2. **Runtime Detection** - Dynamic cost measurement using `getFunctionRamCost()`
3. **Empirical Testing** - Execute functions in controlled environment
4. **Fallback Values** - Conservative estimates when detection fails

## 🏗️ **SYSTEM ARCHITECTURE**

### **Core Components**

#### **SingularityDetector Class**
```typescript
// src/lib/singularity-detector.ts
export interface SingularityCapabilities {
    available: boolean;
    detectionMethod: 'static' | 'runtime' | 'empirical' | 'fallback';
    ramCostPerFunction: Record<string, number>;
    totalRamAvailable: number;
    recommendedStrategy: 'singularity' | 'hybrid' | 'ui-only';
    confidence: number; // 0-100%
}

export interface SingularityConfig {
    enableDetection: boolean;
    maxRamPercentage: number;      // Max % of RAM to use for Singularity
    fallbackToUI: boolean;
    cacheDuration: number;         // Cache results for N milliseconds
    empiricalTesting: boolean;     // Run actual tests to verify costs
}

export class SingularityDetector {
    private static instance: SingularityDetector;
    private capabilities: SingularityCapabilities | null = null;
    private lastDetection: number = 0;
    private config: SingularityConfig;
    
    private constructor(private ns: NS) {
        this.config = {
            enableDetection: true,
            maxRamPercentage: 25, // Use max 25% of RAM for Singularity
            fallbackToUI: true,
            cacheDuration: 300000, // 5 minutes
            empiricalTesting: false
        };
    }
    
    static getInstance(ns: NS): SingularityDetector {
        if (!SingularityDetector.instance) {
            SingularityDetector.instance = new SingularityDetector(ns);
        }
        return SingularityDetector.instance;
    }
    
    async detectCapabilities(): Promise<SingularityCapabilities> {
        // Check cache first
        if (this.capabilities && this.isDetectionFresh()) {
            return this.capabilities;
        }
        
        const totalRam = this.ns.getServerMaxRam('home');
        const usedRam = this.ns.getServerUsedRam('home');
        const availableRam = totalRam - usedRam;
        
        // Try multiple detection methods
        const capabilities = await this.runDetectionMethods(availableRam);
        
        // Cache results
        this.capabilities = capabilities;
        this.lastDetection = Date.now();
        
        return capabilities;
    }
    
    private async runDetectionMethods(availableRam: number): Promise<SingularityCapabilities> {
        // Method 1: Static analysis (fastest)
        if (this.hasSingularityAccess()) {
            const staticCosts = this.getStaticRamCosts();
            return {
                available: true,
                detectionMethod: 'static',
                ramCostPerFunction: staticCosts,
                totalRamAvailable: availableRam,
                recommendedStrategy: this.calculateStrategy(staticCosts, availableRam),
                confidence: 85
            };
        }
        
        // Method 2: Runtime detection via getRamCost
        try {
            const runtimeCosts = await this.getRuntimeRamCosts();
            if (Object.keys(runtimeCosts).length > 0) {
                return {
                    available: true,
                    detectionMethod: 'runtime',
                    ramCostPerFunction: runtimeCosts,
                    totalRamAvailable: availableRam,
                    recommendedStrategy: this.calculateStrategy(runtimeCosts, availableRam),
                    confidence: 95
                };
            }
        } catch (error) {
            // Continue to next method
        }
        
        // Method 3: Empirical testing (if enabled)
        if (this.config.empiricalTesting) {
            const empiricalCosts = await this.runEmpiricalTests();
            if (Object.keys(empiricalCosts).length > 0) {
                return {
                    available: true,
                    detectionMethod: 'empirical',
                    ramCostPerFunction: empiricalCosts,
                    totalRamAvailable: availableRam,
                    recommendedStrategy: this.calculateStrategy(empiricalCosts, availableRam),
                    confidence: 100
                };
            }
        }
        
        // Method 4: Fallback (Singularity not available)
        return {
            available: false,
            detectionMethod: 'fallback',
            ramCostPerFunction: {},
            totalRamAvailable: availableRam,
            recommendedStrategy: 'ui-only',
            confidence: 50
        };
    }
    
    private hasSingularityAccess(): boolean {
        try {
            return 'singularity' in this.ns && typeof this.ns.singularity === 'object';
        } catch (error) {
            return false;
        }
    }
    
    private getStaticRamCosts(): Record<string, number> {
        // Pre-calculated RAM costs based on game version
        return {
            'goToLocation': 5.0,
            'travelToCity': 2.5,
            'getCurrentServer': 0.25,
            'universityCourse': 2.0,
            'workForCompany': 4.0,
            'stopAction': 1.0,
            'purchaseAugmentation': 5.0,
            'joinFaction': 3.0,
            'workForFaction': 3.0,
            'commitCrime': 3.0,
            'getPlayer': 1.0
        };
    }
    
    private async getRuntimeRamCosts(): Promise<Record<string, number>> {
        const costs: Record<string, number> = {};
        const functions = [
            'singularity.goToLocation',
            'singularity.travelToCity', 
            'singularity.getCurrentServer',
            'singularity.universityCourse',
            'singularity.workForCompany',
            'singularity.stopAction'
        ];
        
        for (const func of functions) {
            try {
                if ('getRamCost' in this.ns) {
                    const cost = this.ns.getRamCost(func);
                    if (typeof cost === 'number' && cost > 0) {
                        costs[func.split('.')[1]] = cost;
                    }
                }
            } catch (error) {
                // Function might not exist, skip
            }
        }
        
        return costs;
    }
    
    private async runEmpiricalTests(): Promise<Record<string, number>> {
        // This would involve actually running functions and measuring RAM usage
        // Simplified implementation for safety
        return {};
    }
    
    private calculateStrategy(costs: Record<string, number>, availableRam: number): 'singularity' | 'hybrid' | 'ui-only' {
        const maxAllowedRam = availableRam * (this.config.maxRamPercentage / 100);
        const maxFunctionCost = Math.max(...Object.values(costs));
        
        if (maxFunctionCost <= maxAllowedRam * 0.2) {
            return 'singularity'; // Cheap enough to use extensively
        } else if (maxFunctionCost <= maxAllowedRam) {
            return 'hybrid'; // Use selectively for high-value operations
        } else {
            return 'ui-only'; // Too expensive, stick to UI automation
        }
    }
    
    private isDetectionFresh(): boolean {
        return (Date.now() - this.lastDetection) < this.config.cacheDuration;
    }
    
    // Public utility methods
    async shouldUseUI(): Promise<boolean> {
        const capabilities = await this.detectCapabilities();
        return !capabilities.available || capabilities.recommendedStrategy === 'ui-only';
    }
    
    async canAffordFunction(functionName: string): Promise<boolean> {
        const capabilities = await this.detectCapabilities();
        if (!capabilities.available) return false;
        
        const cost = capabilities.ramCostPerFunction[functionName] || Infinity;
        const maxAllowed = capabilities.totalRamAvailable * (this.config.maxRamPercentage / 100);
        
        return cost <= maxAllowed;
    }
    
    async getOptimalNavigation(destination: string): Promise<'singularity' | 'ui'> {
        if (await this.canAffordFunction('goToLocation') || await this.canAffordFunction('travelToCity')) {
            return 'singularity';
        }
        return 'ui';
    }
    
    configure(newConfig: Partial<SingularityConfig>): void {
        this.config = { ...this.config, ...newConfig };
        // Invalidate cache when config changes
        this.capabilities = null;
    }
}
```

### **Smart Navigation Manager**
```typescript
// src/lib/smart-navigation.ts
export interface NavigationRequest {
    destination: string;
    type: 'location' | 'city' | 'server';
    priority: 'low' | 'medium' | 'high';
    fallbackAllowed: boolean;
}

export interface NavigationResult {
    success: boolean;
    method: 'singularity' | 'ui' | 'hybrid';
    ramUsed: number;
    timeElapsed: number;
    error?: string;
}

export class SmartNavigationManager {
    private singularityDetector: SingularityDetector;
    private navigator: Navigator;
    private logger: Logger;
    
    constructor(ns: NS, navigator: Navigator) {
        this.singularityDetector = SingularityDetector.getInstance(ns);
        this.navigator = navigator;
        this.logger = Logger.getInstance(ns);
    }
    
    async navigateOptimally(request: NavigationRequest): Promise<NavigationResult> {
        const startTime = Date.now();
        const startRam = this.getCurrentRamUsage();
        
        try {
            const capabilities = await this.singularityDetector.detectCapabilities();
            const method = this.chooseNavigationMethod(request, capabilities);
            
            this.logger.debug('SmartNavigation', `Using ${method} navigation to ${request.destination}`);
            
            let success = false;
            
            if (method === 'singularity') {
                success = await this.navigateWithSingularity(request);
            } else if (method === 'hybrid') {
                success = await this.navigateHybrid(request);
            } else {
                success = await this.navigateWithUI(request);
            }
            
            return {
                success,
                method,
                ramUsed: this.getCurrentRamUsage() - startRam,
                timeElapsed: Date.now() - startTime
            };
            
        } catch (error) {
            return {
                success: false,
                method: 'ui',
                ramUsed: this.getCurrentRamUsage() - startRam,
                timeElapsed: Date.now() - startTime,
                error: error.message
            };
        }
    }
    
    private chooseNavigationMethod(
        request: NavigationRequest, 
        capabilities: SingularityCapabilities
    ): 'singularity' | 'ui' | 'hybrid' {
        if (!capabilities.available) {
            return 'ui';
        }
        
        if (capabilities.recommendedStrategy === 'ui-only') {
            return 'ui';
        }
        
        // High priority requests get Singularity if affordable
        if (request.priority === 'high' && capabilities.recommendedStrategy === 'singularity') {
            return 'singularity';
        }
        
        // Medium priority gets hybrid approach
        if (request.priority === 'medium' && capabilities.recommendedStrategy !== 'ui-only') {
            return 'hybrid';
        }
        
        // Low priority uses UI to conserve RAM
        return 'ui';
    }
    
    private async navigateWithSingularity(request: NavigationRequest): Promise<boolean> {
        const ns = this.navigator['ns']; // Access private ns property
        
        if (request.type === 'city') {
            if ('singularity' in ns && 'travelToCity' in ns.singularity) {
                try {
                    ns.singularity.travelToCity(request.destination);
                    return true;
                } catch (error) {
                    this.logger.warn('SmartNavigation', 'Singularity city travel failed', { error: error.message });
                    return false;
                }
            }
        } else if (request.type === 'location') {
            if ('singularity' in ns && 'goToLocation' in ns.singularity) {
                try {
                    ns.singularity.goToLocation(request.destination);
                    return true;
                } catch (error) {
                    this.logger.warn('SmartNavigation', 'Singularity location travel failed', { error: error.message });
                    return false;
                }
            }
        }
        
        return false;
    }
    
    private async navigateHybrid(request: NavigationRequest): Promise<boolean> {
        // Try Singularity first, fall back to UI
        const singularitySuccess = await this.navigateWithSingularity(request);
        if (singularitySuccess) {
            return true;
        }
        
        this.logger.debug('SmartNavigation', 'Singularity failed, falling back to UI');
        return this.navigateWithUI(request);
    }
    
    private async navigateWithUI(request: NavigationRequest): Promise<boolean> {
        if (request.type === 'city') {
            return this.navigateToCity(request.destination);
        } else if (request.type === 'location') {
            return this.navigateToLocation(request.destination);
        }
        
        return false;
    }
    
    private async navigateToCity(cityName: string): Promise<boolean> {
        try {
            const travelPage = await this.navigator.navigate(GameSection.Travel);
            const cityMarker = `${cityName.toLowerCase()}-marker`;
            
            if (await travelPage.hasElement(cityMarker)) {
                await travelPage.clickElement(cityMarker);
                await travelPage.waitForElement('travel-dialog');
                await travelPage.clickElement('confirm-travel');
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('SmartNavigation', 'UI city navigation failed', { city: cityName, error: error.message });
            return false;
        }
    }
    
    private async navigateToLocation(locationName: string): Promise<boolean> {
        try {
            const cityPage = await this.navigator.navigate(GameSection.City);
            const locationElement = `${locationName.toLowerCase()}-location`;
            
            if (await cityPage.hasElement(locationElement)) {
                await cityPage.clickElement(locationElement);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('SmartNavigation', 'UI location navigation failed', { location: locationName, error: error.message });
            return false;
        }
    }
    
    private getCurrentRamUsage(): number {
        return this.navigator['ns'].getServerUsedRam('home');
    }
}
```

## 🎯 **INTEGRATION PATTERNS**

### **Enhanced Navigator Integration**
```typescript
// src/lib/navigator.ts - Enhanced with Singularity integration
export class Navigator {
    private singularityDetector: SingularityDetector;
    private smartNavigation: SmartNavigationManager;
    
    constructor(debugMode: boolean, private ns: NS, config?: Partial<TimingConfig>) {
        // ... existing constructor code ...
        this.singularityDetector = SingularityDetector.getInstance(ns);
        this.smartNavigation = new SmartNavigationManager(ns, this);
    }
    
    // Enhanced navigation method with Singularity integration
    async smartNavigate(section: GameSection, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<GamePage> {
        this.logger.step('Navigator', `Smart navigation to ${section} (priority: ${priority})`);
        
        const capabilities = await this.singularityDetector.detectCapabilities();
        this.logger.debug('Navigator', 'Singularity capabilities', {
            available: capabilities.available,
            strategy: capabilities.recommendedStrategy,
            confidence: capabilities.confidence
        });
        
        // Convert GameSection to navigation request
        const request = this.convertSectionToRequest(section, priority);
        
        if (request) {
            const result = await this.smartNavigation.navigateOptimally(request);
            this.logger.info('Navigator', `Smart navigation result: ${result.method}`, {
                success: result.success,
                ramUsed: result.ramUsed,
                timeElapsed: result.timeElapsed
            });
            
            if (result.success) {
                this.currentSection = section;
                return new GamePage(section, this);
            }
        }
        
        // Fallback to regular UI navigation
        this.logger.debug('Navigator', 'Falling back to regular UI navigation');
        return this.navigate(section);
    }
    
    private convertSectionToRequest(section: GameSection, priority: 'low' | 'medium' | 'high'): NavigationRequest | null {
        const mapping: Record<GameSection, { destination: string, type: 'location' | 'city' }> = {
            [GameSection.Casino]: { destination: 'Iker Molina Casino', type: 'location' },
            [GameSection.CasinoLobby]: { destination: 'Iker Molina Casino', type: 'location' },
            [GameSection.Travel]: { destination: 'Travel Agency', type: 'location' },
            [GameSection.City]: { destination: 'City', type: 'location' },
            // Add more mappings as needed
        };
        
        const sectionMapping = mapping[section];
        if (!sectionMapping) {
            return null;
        }
        
        return {
            destination: sectionMapping.destination,
            type: sectionMapping.type,
            priority,
            fallbackAllowed: true
        };
    }
    
    // Utility method to check Singularity availability
    async getSingularityStatus(): Promise<SingularityCapabilities> {
        return this.singularityDetector.detectCapabilities();
    }
    
    // Configure Singularity behavior
    configureSingularity(config: Partial<SingularityConfig>): void {
        this.singularityDetector.configure(config);
    }
}
```

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Core Detection Framework (Week 1)**
- **SingularityDetector class** with basic detection methods
- **Static RAM cost database** with known function costs
- **Simple availability checking** (does `ns.singularity` exist?)
- **Basic caching system** to avoid repeated detection
- **Unit tests** for detection accuracy

### **Phase 2: Smart Navigation Manager (Week 2)**
- **NavigationRequest/Result interfaces** for standardized requests
- **Method selection logic** based on RAM constraints and priority
- **Fallback mechanisms** when Singularity fails
- **Performance monitoring** (RAM usage, execution time)
- **Integration with existing Navigator class**

### **Phase 3: Advanced Features (Week 3)**
- **Runtime RAM cost detection** using `getRamCost()` API
- **Empirical testing framework** for cost verification
- **Hybrid navigation strategies** (Singularity + UI)
- **Configuration management** for different use cases
- **Comprehensive error handling and recovery**

### **Phase 4: Integration & Optimization (Week 4)**
- **Full Navigator integration** with enhanced `smartNavigate()` method
- **Game-specific optimizations** for common navigation patterns
- **Performance tuning** and RAM usage optimization
- **Documentation and usage examples**
- **Production testing** across different game scenarios

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- **Detection Accuracy**: 95%+ correct identification of Singularity availability
- **RAM Efficiency**: 30%+ reduction in RAM usage compared to naive approaches
- **Navigation Speed**: 50%+ faster navigation when Singularity is available
- **Fallback Reliability**: 99%+ success rate when falling back to UI automation
- **Cache Hit Rate**: 80%+ for repeated capability checks

### **User Experience Metrics**
- **Seamless Operation**: Zero user intervention required for navigation method selection
- **Transparent Fallbacks**: Users unaware when system switches between methods
- **Configuration Flexibility**: Easy tuning for different RAM constraints
- **Error Recovery**: Graceful handling of all failure scenarios
- **Performance Consistency**: Predictable execution times regardless of method

## 🔧 **CONFIGURATION EXAMPLES**

### **Conservative Setup (Low RAM Usage)**
```typescript
navigator.configureSingularity({
    maxRamPercentage: 10,     // Only use 10% of RAM for Singularity
    fallbackToUI: true,       // Always fallback on failure
    empiricalTesting: false,  // Skip expensive testing
    cacheDuration: 600000     // Cache for 10 minutes
});
```

### **Aggressive Setup (High Performance)**
```typescript
navigator.configureSingularity({
    maxRamPercentage: 40,     // Use up to 40% of RAM
    fallbackToUI: true,       // Quick fallbacks
    empiricalTesting: true,   // Run accurate cost detection
    cacheDuration: 60000      // Cache for 1 minute (fresh data)
});
```

### **Hybrid Setup (Balanced)**
```typescript
navigator.configureSingularity({
    maxRamPercentage: 25,     // Moderate RAM usage
    fallbackToUI: true,       // Safe fallbacks
    empiricalTesting: false,  // Skip testing for speed
    cacheDuration: 300000     // Cache for 5 minutes
});
```

## 🚨 **RISK MITIGATION**

### **RAM Overflow Protection**
- **Conservative estimates** when exact costs unknown
- **Real-time monitoring** of RAM usage during execution
- **Automatic fallback** when approaching RAM limits
- **Configurable safety margins** to prevent crashes

### **API Changes Resilience** 
- **Multiple detection methods** to handle API changes
- **Graceful degradation** when functions removed/changed
- **Version-aware cost databases** for different game versions
- **Automatic re-detection** when errors suggest API changes

### **Performance Safeguards**
- **Timeout protection** for all detection operations
- **Circuit breaker pattern** for repeated failures
- **Rate limiting** to prevent excessive API calls
- **Monitoring and alerting** for performance degradation

## 📚 **USAGE EXAMPLES**

### **Basic Usage in Casino Script**
```typescript
// casino-enhanced.ts
export async function main(ns: NS) {
    const navigator = new Navigator(true, ns);
    
    // Configure for moderate Singularity usage
    navigator.configureSingularity({
        maxRamPercentage: 25,
        fallbackToUI: true
    });
    
    // Smart navigation automatically chooses best method
    const casinoPage = await navigator.smartNavigate(GameSection.Casino, 'high');
    
    // Check what method was actually used
    const status = await navigator.getSingularityStatus();
    ns.tprint(`Navigation strategy: ${status.recommendedStrategy}`);
}
```

### **Advanced Configuration for Production**
```typescript
// production-setup.ts
export async function setupProductionNavigation(ns: NS): Promise<Navigator> {
    const navigator = new Navigator(false, ns);
    
    // Production configuration
    navigator.configureSingularity({
        maxRamPercentage: 20,           // Conservative RAM usage
        fallbackToUI: true,             // Always have fallback
        empiricalTesting: false,        // Skip testing in production
        cacheDuration: 600000,          // 10-minute cache
    });
    
    // Validate setup
    const capabilities = await navigator.getSingularityStatus();
    if (capabilities.confidence < 70) {
        ns.tprint('⚠️ Low confidence in Singularity detection');
    }
    
    return navigator;
}
```

## 🔄 **FUTURE ENHANCEMENTS**

### **Advanced Detection Methods**
- **Machine learning** for cost prediction based on game state
- **Community database** of RAM costs across different versions
- **Real-time adaptation** to game performance changes
- **Predictive caching** based on usage patterns

### **Enhanced Navigation Strategies**
- **Multi-step optimization** for complex navigation sequences
- **Parallel navigation** for multiple simultaneous destinations
- **Context-aware decisions** based on current game state
- **Learning from user preferences** and success rates

### **Integration Opportunities**
- **Task system integration** for automated navigation scheduling
- **Script coordination** to share Singularity resources efficiently
- **Global optimization** across all running automation scripts
- **External API integration** for community-driven optimizations

---

## 📝 **SUMMARY**

This Singularity Enhancement Plan provides a comprehensive framework for intelligent Bitburner automation that:

✅ **Automatically detects** Singularity API availability and costs  
✅ **Intelligently chooses** between Singularity and UI navigation  
✅ **Gracefully falls back** when resources are constrained  
✅ **Optimizes RAM usage** while maintaining reliability  
✅ **Adapts to game changes** through multiple detection methods  
✅ **Integrates seamlessly** with existing navigation frameworks  

The system enables automation scripts to be both **highly efficient** when Singularity is available and **completely functional** when it's not, providing the best of both worlds for Bitburner automation.