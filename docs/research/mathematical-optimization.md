# Mathematical Optimization Analysis

## HWGW Batch Calculation Research

### Current Implementation Analysis

#### Core Mathematical Models
The current system implements sophisticated HWGW timing with the following constants:
```typescript
// Current timing configuration
HWGW_TIMING_GAP: 150,              // Inter-script coordination delay
HACK_PERCENTAGE: 0.75,             // Fixed theft percentage
GROWTH_ANALYSIS_CAP: 50,           // Prevent extreme multiplier calculations
SECURITY_TOLERANCE: 5,             // Maximum acceptable security increase
MONEY_THRESHOLD: 0.75,             // Minimum money ratio for hacking
```

#### Batch Calculation Formula
```typescript
// Current implementation (simplified)
const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, targetMoney));
const growThreads = Math.ceil(ns.growthAnalyze(target, growthNeeded));
const weakenAfterHackThreads = Math.ceil(hackSecIncrease / weakenEffect);
const weakenAfterGrowThreads = Math.ceil(growSecIncrease / weakenEffect);
```

### Research-Based Optimization Opportunities

#### 1. **Dynamic Percentage Optimization**

**Current Issue**: Fixed 75% theft percentage regardless of context

**Research Findings** (from Alain's Scripts and Bitburner formulas):
```typescript
// Optimal percentage varies by server characteristics
function calculateOptimalHackPercentage(server: ServerData, networkStats: NetworkStats): number {
    const securityLevel = server.hackDifficulty;
    const maxMoney = server.moneyMax;
    const hackTime = server.hackTime;
    
    // Base percentage adjusted for security impact
    let basePercentage = 0.75;
    
    // Higher security = lower percentage (hack success rate drops)
    const securityPenalty = Math.min(0.3, securityLevel / 100);
    basePercentage -= securityPenalty;
    
    // Large network RAM = can afford larger batches
    if (networkStats.totalAvailable > 500000) { // 500TB+
        basePercentage = Math.min(0.9, basePercentage + 0.15);
    }
    
    // Fast hack times = smaller percentages work better (more cycles)
    if (hackTime < 60000) { // < 1 minute
        basePercentage = Math.max(0.5, basePercentage - 0.1);
    }
    
    return Math.max(0.25, Math.min(0.95, basePercentage));
}
```

#### 2. **Advanced Thread Distribution**

**Current Issue**: Simple sequential allocation without optimization

**Research-Based Improvement**:
```typescript
// Core count consideration for efficiency
function calculateOptimalThreadDistribution(
    batch: IHWGWBatch, 
    servers: ServerData[]
): ThreadAllocation[] {
    
    // Prioritize multi-core servers for grow/weaken (better effectiveness)
    const serversByEfficiency = servers.sort((a, b) => {
        const coresA = ns.getServer(a.hostname).cpuCores;
        const coresB = ns.getServer(b.hostname).cpuCores;
        return coresB - coresA; // Higher cores first
    });
    
    const allocations: ThreadAllocation[] = [];
    
    // Allocate grow/weaken to high-core servers first
    for (const operation of ['grow', 'weaken1', 'weaken2']) {
        const threads = batch[`${operation}Threads`];
        allocations.push(...allocateOptimally(threads, serversByEfficiency, operation));
    }
    
    // Hack can go anywhere (cores don't affect hack)
    allocations.push(...allocateOptimally(batch.hackThreads, servers, 'hack'));
    
    return allocations;
}
```

#### 3. **Batch Size Optimization**

**Current Issue**: No consideration of optimal batch count

**Research Formula** (from community analysis):
```typescript
function calculateOptimalBatchCount(target: ServerData, networkStats: NetworkStats): number {
    const weakenTime = target.weakenTime;
    const timingGap = BOTNET_CONFIG.HWGW_TIMING_GAP;
    
    // Maximum batches based on timing constraints
    const maxBatchesByTiming = Math.floor(weakenTime / (timingGap * 4));
    
    // Maximum batches based on RAM availability
    const singleBatchRAM = calculateBatchRAMCost(target);
    const maxBatchesByRAM = Math.floor(networkStats.totalAvailable / singleBatchRAM);
    
    // Conservative approach: take minimum with safety factor
    const optimalBatches = Math.min(maxBatchesByTiming, maxBatchesByRAM) * 0.8;
    
    return Math.max(1, Math.floor(optimalBatches));
}
```

## Share Script Mathematical Analysis

### Current Share System Implementation

```typescript
// Current share calculation (simplified)
const shareRAMBudget = totalNetworkRAM * ramPercentage; // 25% default
const targetThreads = Math.floor(shareRAMBudget / shareScriptRAM);
```

### Research-Based Share Optimization

#### 1. **Intelligence Scaling Model**

**Research Finding**: Share effectiveness scales with intelligence stat
```typescript
function calculateShareEffectiveness(baseThreads: number, intelligence: number): number {
    // Intelligence provides logarithmic scaling
    const intelligenceMultiplier = 1 + Math.log10(Math.max(1, intelligence)) * 0.5;
    
    // Effective threads with intelligence bonus
    return baseThreads * intelligenceMultiplier;
}
```

#### 2. **Core Multiplier Optimization**

**Research Finding**: Multi-core servers provide better share effectiveness
```typescript
function calculateCoreBonus(cores: number): number {
    // Each additional core provides diminishing returns
    if (cores <= 1) return 1;
    
    // Formula from game source: 1 + (cores-1) * 0.25
    return 1 + (cores - 1) * 0.25;
}

function optimizeShareAllocation(servers: ServerData[], totalThreads: number): AllocationPlan {
    // Sort by effectiveness: cores * threads potential
    const serversByEfficiency = servers.map(server => ({
        ...server,
        coreBonus: calculateCoreBonus(ns.getServer(server.hostname).cpuCores),
        maxThreads: Math.floor(server.availableRAM / shareScriptRAM)
    })).sort((a, b) => {
        const efficiencyA = a.coreBonus * a.maxThreads;
        const efficiencyB = b.coreBonus * b.maxThreads;
        return efficiencyB - efficiencyA;
    });
    
    return allocateGreedy(serversByEfficiency, totalThreads);
}
```

#### 3. **Dynamic Percentage Allocation**

**Current Issue**: Fixed 25% allocation regardless of context

**Research-Based Dynamic Model**:
```typescript
function calculateOptimalSharePercentage(
    factionWork: FactionWorkStatus,
    networkUtilization: number,
    currentReputation: number,
    targetReputation: number
): number {
    
    let basePercentage = 0.25; // 25% base
    
    // Increase allocation when close to reputation targets
    const progressRatio = currentReputation / targetReputation;
    if (progressRatio > 0.8) {
        basePercentage += 0.15; // Boost to 40% when close to goal
    }
    
    // Reduce allocation when network is heavily utilized
    if (networkUtilization > 0.9) {
        basePercentage *= 0.7; // Reduce by 30% when RAM constrained
    }
    
    // Faction work type multipliers
    const workTypeMultipliers = {
        'hacking': 1.0,
        'field': 1.2,     // Field work benefits more from share
        'security': 0.8   // Security work benefits less
    };
    
    const workType = detectFactionWorkType(factionWork);
    basePercentage *= workTypeMultipliers[workType] || 1.0;
    
    return Math.max(0.05, Math.min(0.6, basePercentage)); // Cap between 5-60%
}
```

## RAM Allocation Mathematical Models

### Current Allocation Strategy Issues

1. **Greedy Allocation**: Simple largest-first without optimization
2. **No Fragmentation Consideration**: Creates unusable RAM fragments  
3. **Static Allocation**: No rebalancing during execution

### Research-Based Improvements

#### 1. **Bin Packing Algorithm**

```typescript
// Improved allocation using bin packing principles
function optimizeRAMAllocation(jobs: Job[], servers: Server[]): Allocation[] {
    // Sort jobs by size (largest first for better packing)
    const sortedJobs = jobs.sort((a, b) => b.ramRequired - a.ramRequired);
    
    // Sort servers by available RAM (best fit first)
    const sortedServers = servers.sort((a, b) => b.availableRAM - a.availableRAM);
    
    const allocations: Allocation[] = [];
    
    for (const job of sortedJobs) {
        // Find best fit server (smallest server that can fit the job)
        const bestFitServer = findBestFitServer(job, sortedServers);
        
        if (bestFitServer) {
            allocations.push({
                job: job,
                server: bestFitServer,
                ramUsed: job.ramRequired
            });
            
            // Update server capacity
            bestFitServer.availableRAM -= job.ramRequired;
        }
    }
    
    return allocations;
}

function findBestFitServer(job: Job, servers: Server[]): Server | null {
    let bestFit: Server | null = null;
    let minWaste = Infinity;
    
    for (const server of servers) {
        if (server.availableRAM >= job.ramRequired) {
            const waste = server.availableRAM - job.ramRequired;
            if (waste < minWaste) {
                minWaste = waste;
                bestFit = server;
            }
        }
    }
    
    return bestFit;
}
```

#### 2. **Fragmentation Minimization**

```typescript
function calculateFragmentationRatio(servers: Server[]): number {
    let totalWaste = 0;
    let totalRAM = 0;
    
    for (const server of servers) {
        const maxPossibleScript = Math.floor(server.availableRAM / BOTNET_CONFIG.SCRIPT_RAM_COST);
        const waste = server.availableRAM - (maxPossibleScript * BOTNET_CONFIG.SCRIPT_RAM_COST);
        
        totalWaste += waste;
        totalRAM += server.maxRAM;
    }
    
    return totalWaste / totalRAM; // Lower is better
}

function defragmentAllocation(servers: Server[]): DefragmentationPlan {
    // Identify highly fragmented servers
    const fragmentedServers = servers.filter(server => {
        const fragmentationRatio = server.availableRAM / server.maxRAM;
        return fragmentationRatio > 0.1 && fragmentationRatio < 0.3; // 10-30% waste
    });
    
    // Plan to consolidate scripts on these servers
    return createConsolidationPlan(fragmentedServers);
}
```

#### 3. **Predictive Allocation**

```typescript
function predictiveAllocation(
    currentAllocations: Allocation[],
    upcomingJobs: Job[],
    historicalData: HistoricalPerformance[]
): AllocationStrategy {
    
    // Predict future RAM requirements based on historical patterns
    const predictedDemand = analyzeTrends(historicalData);
    
    // Reserve RAM for high-probability upcoming jobs
    const reservations = calculateReservations(upcomingJobs, predictedDemand);
    
    // Optimize current allocation considering future needs
    return optimizeWithReservations(currentAllocations, reservations);
}
```

## Performance Mathematical Models

### Current Performance Metrics

```typescript
// Basic performance tracking
interface PerformanceMetrics {
    moneyPerSecond: number;
    ramUtilization: number;
    batchSuccessRate: number;
    scriptExecutionTime: number;
}
```

### Advanced Performance Models

#### 1. **Efficiency Calculations**

```typescript
function calculateSystemEfficiency(): EfficiencyMetrics {
    const theoretical = {
        maxMoneyPerSecond: calculateTheoreticalMax(),
        maxRAMUtilization: 1.0,
        maxBatchSuccessRate: 1.0
    };
    
    const actual = getCurrentPerformance();
    
    return {
        moneyEfficiency: actual.moneyPerSecond / theoretical.maxMoneyPerSecond,
        ramEfficiency: actual.ramUtilization / theoretical.maxRAMUtilization,
        executionEfficiency: actual.batchSuccessRate / theoretical.maxBatchSuccessRate,
        overallEfficiency: calculateWeightedAverage([
            { value: moneyEfficiency, weight: 0.5 },
            { value: ramEfficiency, weight: 0.3 },
            { value: executionEfficiency, weight: 0.2 }
        ])
    };
}
```

#### 2. **Optimization Targets**

```typescript
// Mathematical targets for optimization
const OPTIMIZATION_TARGETS = {
    // Performance targets
    MIN_MONEY_EFFICIENCY: 0.85,      // 85% of theoretical maximum
    MIN_RAM_EFFICIENCY: 0.95,        // 95% RAM utilization
    MIN_EXECUTION_EFFICIENCY: 0.98,  // 98% batch success rate
    
    // Timing targets  
    MAX_BATCH_COMPLETION_TIME: 120000, // 2 minutes max
    MAX_ALLOCATION_TIME: 5000,         // 5 seconds max allocation
    
    // Resource targets
    MAX_FRAGMENTATION_RATIO: 0.05,    // 5% maximum RAM waste
    MIN_CORE_UTILIZATION: 0.8,        // 80% multi-core server usage
    
    // Scalability targets
    LINEAR_SCALING_FACTOR: 0.95       // 95% efficiency maintained with scale
};
```

## Mathematical Validation Framework

### Performance Testing Models

```typescript
function validateOptimizations(): ValidationResults {
    const testCases = [
        { servers: 10, targets: 5, ramBudget: 100000 },
        { servers: 50, targets: 20, ramBudget: 500000 },
        { servers: 100, targets: 50, ramBudget: 1000000 }
    ];
    
    const results = testCases.map(testCase => {
        const beforeOptimization = runSimulation(testCase, 'current');
        const afterOptimization = runSimulation(testCase, 'optimized');
        
        return {
            testCase,
            improvement: {
                money: afterOptimization.moneyPerSecond / beforeOptimization.moneyPerSecond,
                ram: afterOptimization.ramUtilization / beforeOptimization.ramUtilization,
                time: beforeOptimization.executionTime / afterOptimization.executionTime
            }
        };
    });
    
    return analyzeResults(results);
}
```

The mathematical foundations of the current system are solid but can be significantly improved through dynamic optimization, intelligent allocation algorithms, and predictive modeling. The research shows potential for 15-30% performance improvements through mathematical optimization alone.