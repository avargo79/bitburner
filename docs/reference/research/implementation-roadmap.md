# Implementation Roadmap

## Project Overview

This roadmap outlines the transformation of the current monolithic botnet into a world-class, enterprise-grade automation framework. The plan prioritizes maintainability, performance, and extensibility while preserving all existing functionality.

## Current State Summary

### **Assets to Preserve ✅**
- **8 Well-Designed Library Modules**: Excellent separation of concerns in `/lib/botnet-*`
- **Comprehensive TypeScript Interfaces**: 40+ interfaces providing strong type safety
- **Advanced Feature Set**: Sequential RAM allocation, faction work detection, sophisticated HWGW timing
- **Recent Performance Fix**: Share system now achieving 118x improvement (49,191 threads vs 416)

### **Critical Issues to Address 🔴**
- **Monolithic Main Function**: 940+ lines handling 6 distinct responsibilities
- **Global State Dependencies**: Hidden dependencies affecting testability
- **Mixed Abstraction Levels**: High-level orchestration mixed with low-level calculations
- **No Testing Framework**: 0% test coverage hampering safe refactoring

## Implementation Strategy

### **Guiding Principles**
1. **Incremental Evolution**: No big-bang rewrites, preserve functionality at each step
2. **Backward Compatibility**: Existing scripts continue working during transition
3. **Performance First**: Every change must maintain or improve current performance
4. **Quality Gates**: Comprehensive testing before deployment
5. **Community Patterns**: Follow established Bitburner automation best practices

## Phase 1: Foundation and Extraction (Week 1-2)

### **Priority 1: Extract Core Components**

#### **A. HWGW Batch Engine Extraction**
**Current**: 91 lines embedded in main function
**Target**: Standalone `HWGWBatchEngine` class

```typescript
class HWGWBatchEngine {
    calculateBatch(target: ServerData): IHWGWBatch
    optimizePercentage(target: ServerData, networkStats: NetworkRAMSnapshot): number
    scheduleBatch(batch: IHWGWBatch, networkSnapshot: NetworkRAMSnapshot): Promise<boolean>
    executePrep(targets: ServerData[], networkSnapshot: NetworkRAMSnapshot): Promise<void>
}
```

**Benefits**:
- Isolated batch calculation logic for easier testing
- Pluggable percentage optimization strategies
- Independent performance tuning for HWGW operations

**Effort**: 2-3 days
**Risk**: Low (well-defined boundaries)

#### **B. Resource Allocation Manager**
**Current**: 185 lines scattered across functions
**Target**: Centralized `ResourceManager` class

```typescript
class ResourceManager {
    takeSnapshot(): NetworkRAMSnapshot
    allocateRAM(jobs: Job[], constraints: AllocationConstraints): AllocationResult
    subtractAllocation(snapshot: NetworkRAMSnapshot, allocation: any): NetworkRAMSnapshot
    optimizeFragmentation(servers: ServerData[]): DefragmentationPlan
}
```

**Benefits**:
- Single source of truth for RAM allocation logic
- Pluggable allocation strategies (greedy, bin-packing, predictive)
- Centralized fragmentation optimization

**Effort**: 3-4 days
**Risk**: Medium (complex state management)

#### **C. Server Management Extraction**
**Current**: ~200 lines mixed with main botnet logic
**Target**: Standalone `server-manager.ts` script

```typescript
// New standalone script
export async function main(ns: NS): Promise<void> {
    const manager = new ServerManager(ns, parseArguments(ns));
    await manager.runContinuous();
}
```

**Benefits**:
- Independent lifecycle management
- Reduced main botnet complexity
- Specialized optimization for server operations
- Fault isolation between management and execution

**Effort**: 4-5 days  
**Risk**: Medium (inter-script communication complexity)

### **Priority 2: Pipeline Architecture**

#### **Main Function Restructuring**
**Current**: Monolithic 940-line function
**Target**: Clean pipeline orchestration <100 lines

```typescript
export async function main(ns: NS): Promise<void> {
    const context = await initializeBotnetContext(ns);
    const pipeline = new BotnetPipeline(context);
    
    pipeline.addStage(new ServerDiscoveryStage());
    pipeline.addStage(new ResourceAllocationStage());
    pipeline.addStage(new ShareSystemStage());
    pipeline.addStage(new HWGWExecutionStage());
    pipeline.addStage(new StatusMonitoringStage());
    
    await pipeline.execute();
}
```

**Benefits**:
- Single Responsibility Principle compliance
- Easy addition/removal of features
- Clear execution flow
- Independent stage testing

**Effort**: 3-4 days
**Risk**: High (core architecture change)

### **Phase 1 Success Metrics**
- ✅ Main function <100 lines
- ✅ 5 extracted, testable components
- ✅ No performance regression
- ✅ All existing functionality preserved

## Phase 2: Quality and Performance (Week 3-4)

### **Priority 3: Testing Infrastructure**

#### **Unit Testing Framework Setup**
```typescript
// Example test structure
describe('HWGWBatchEngine', [
    {
        name: 'calculateBatch_returns_valid_threads',
        test: () => {
            const engine = new HWGWBatchEngine();
            const batch = engine.calculateBatch(mockServer);
            
            assert(batch.hackThreads > 0);
            assert(batch.totalThreads < 100000);
        }
    }
]);
```

**Target Coverage**: 80% for extracted components
**Effort**: 5-6 days
**Risk**: Low (foundational work)

#### **Performance Benchmarking**
```typescript
class PerformanceBenchmark {
    async benchmarkAllocation(serverCount: number, jobCount: number): Promise<BenchmarkResult>
    async benchmarkBatchCalculation(targetCount: number): Promise<BenchmarkResult>
    compareWithBaseline(results: BenchmarkResult[]): PerformanceReport
}
```

**Targets**:
- RAM allocation: <1 second for 100 servers
- Batch calculation: <500ms for 50 targets
- Full cycle: <5 seconds total

**Effort**: 2-3 days
**Risk**: Low

### **Priority 4: Advanced Error Handling**

#### **Circuit Breaker Implementation**
```typescript
const hwgwCircuitBreaker = new CircuitBreaker();
const shareCircuitBreaker = new CircuitBreaker();

// Usage in pipeline stages
await hwgwCircuitBreaker.execute(
    () => executeHWGWBatching(targets, networkSnapshot),
    'hwgw_execution'
);
```

**Benefits**:
- Prevent cascade failures during resource contention
- Automatic recovery from temporary issues
- Detailed failure analysis and reporting

**Effort**: 2-3 days
**Risk**: Low

#### **Graceful Degradation System**
```typescript
const degradationManager = new GracefulDegradationManager();

const fallbackOperations = new Map([
    ['limited_ram', () => executeReducedBatching()],
    ['single_target', () => executeSingleTargetMode()],
    ['maintenance', () => executeMaintenanceMode()]
]);

await degradationManager.executeWithDegradation(
    () => executeFullBotnet(),
    fallbackOperations
);
```

**Benefits**:
- Continued operation during adverse conditions
- Automatic adaptation to resource constraints
- Transparent fallback for users

**Effort**: 3-4 days
**Risk**: Medium

### **Phase 2 Success Metrics**
- ✅ 80%+ test coverage for core components
- ✅ <1% error rate under normal conditions
- ✅ Graceful handling of resource constraints
- ✅ 15%+ performance improvement from optimization

## Phase 3: Advanced Features (Week 5-6)

### **Priority 5: Configuration Management**

#### **External Configuration System**
```json
// botnet-config.json
{
    "environment": "production",
    "hwgw": {
        "hackPercentage": 0.75,
        "timingGap": 150,
        "dynamicOptimization": true
    },
    "share": {
        "ramPercentage": 0.25,
        "intelligenceOptimization": true,
        "dynamicAllocation": true
    },
    "performance": {
        "cacheTimeout": 30000,
        "predictiveAllocation": true,
        "fragmentationThreshold": 0.05
    }
}
```

**Benefits**:
- Runtime configuration changes without script restart
- Environment-specific settings (development, production)
- A/B testing of optimization strategies

**Effort**: 3-4 days
**Risk**: Low

### **Priority 6: Advanced Monitoring**

#### **Metrics Collection Framework**
```typescript
const metrics = new MetricsCollector();

const earningsMetric = metrics.register({
    name: 'hacking_earnings_per_second',
    type: 'gauge',
    description: 'Money earned per second'
});

const batchMetric = metrics.register({
    name: 'batch_executions_total', 
    type: 'counter',
    description: 'Total HWGW batches executed'
});
```

**Features**:
- Real-time performance dashboards
- Historical trend analysis
- Automated alert system
- Performance regression detection

**Effort**: 4-5 days
**Risk**: Low

### **Priority 7: Mathematical Optimization**

#### **Dynamic Percentage Optimization**
```typescript
function calculateOptimalHackPercentage(
    server: ServerData, 
    networkStats: NetworkStats,
    historicalData: PerformanceHistory[]
): number {
    // Dynamic optimization based on:
    // - Server security level
    // - Available network RAM
    // - Historical success rates
    // - Market conditions (if applicable)
}
```

#### **Predictive RAM Allocation**
```typescript
class PredictiveAllocator {
    predictDemand(historicalData: AllocationHistory[]): DemandForecast
    reserveRAM(forecast: DemandForecast): ReservationPlan
    optimizeAllocation(currentJobs: Job[], forecast: DemandForecast): AllocationPlan
}
```

**Expected Improvements**:
- 10-15% better RAM utilization
- 5-10% higher money generation rate
- Reduced allocation conflicts

**Effort**: 6-8 days
**Risk**: Medium

### **Phase 3 Success Metrics**
- ✅ External configuration system operational
- ✅ Real-time performance dashboards
- ✅ 10%+ improvement in resource utilization
- ✅ Predictive allocation reducing conflicts by 50%

## Phase 4: Enterprise Features (Week 7-8)

### **Priority 8: Plugin Architecture**

#### **Plugin System Framework**
```typescript
interface BotnetPlugin {
    name: string;
    version: string;
    initialize(context: BotnetContext): Promise<void>;
    execute(context: BotnetContext): Promise<void>;
}

// Example plugins
class StockManipulationPlugin implements BotnetPlugin { /* */ }
class ContractSolverPlugin implements BotnetPlugin { /* */ }
class CustomTargetingPlugin implements BotnetPlugin { /* */ }
```

**Benefits**:
- Community-contributed enhancements
- Optional features without core complexity
- Experimental feature development
- BitNode-specific optimizations

**Effort**: 5-6 days
**Risk**: Medium

### **Priority 9: Advanced Analytics**

#### **Machine Learning Integration**
```typescript
class MLOptimizer {
    trainModel(historicalData: PerformanceData[]): OptimizationModel
    predictOptimalParameters(currentState: BotnetState): ParameterSet
    adaptStrategy(performance: PerformanceMetrics): StrategyAdjustment
}
```

**Features**:
- Automatic parameter tuning
- Performance pattern recognition
- Anomaly detection
- Predictive maintenance

**Effort**: 8-10 days
**Risk**: High

### **Phase 4 Success Metrics**
- ✅ Plugin system supporting 3+ community plugins
- ✅ ML-driven optimization showing 5%+ improvement
- ✅ Automated parameter tuning
- ✅ Community adoption and contributions

## Risk Mitigation Strategies

### **Technical Risks**

#### **Performance Regression** 🔴 High Impact
**Mitigation**:
- Comprehensive benchmarking before each change
- Performance gates in testing pipeline
- Rollback procedures for each phase
- A/B testing of optimization strategies

#### **Functionality Loss** 🔴 High Impact
**Mitigation**:
- Extensive regression testing
- Feature flags for new functionality
- Incremental deployment with monitoring
- User acceptance testing

#### **Complexity Explosion** 🟡 Medium Impact
**Mitigation**:
- Strict adherence to SOLID principles
- Code review requirements
- Complexity metrics monitoring
- Regular architecture reviews

### **Resource Risks**

#### **Development Time Overrun** 🟡 Medium Impact
**Mitigation**:
- Buffer time in each phase (20%)
- Scope reduction options identified
- Regular progress reviews
- Parallel workstream where possible

#### **Testing Overhead** 🟢 Low Impact
**Mitigation**:
- Automated testing framework
- Test-driven development approach
- Continuous integration setup
- Shared testing utilities

## Success Criteria

### **Quantitative Metrics**
- **Code Quality**: <100 lines per function, <10 cyclomatic complexity
- **Performance**: 0% performance regression, 15%+ optimization gains
- **Reliability**: <1% error rate, 99.9% uptime
- **Maintainability**: 80%+ test coverage, <3 dependencies per module

### **Qualitative Metrics**
- **Developer Experience**: Easy to add new features, clear debugging
- **User Experience**: Reliable operation, informative status reporting
- **Community Impact**: Reusable patterns, contribution-friendly architecture

## Long-Term Vision (3-6 months)

### **Community Ecosystem**
- Open-source plugin marketplace
- Shared optimization strategies
- Collaborative development tools
- Educational resources and documentation

### **Advanced Capabilities**
- Multi-BitNode adaptation
- Cross-server coordination
- Market manipulation integration
- Advanced AI-driven optimization

### **Enterprise Features**
- High-availability clustering
- Distributed computing coordination
- Advanced monitoring and analytics
- Professional support and documentation

This roadmap transforms the current functional botnet into a world-class automation framework while maintaining the excellent foundation already established. Each phase builds upon the previous one, ensuring continuous value delivery and risk mitigation throughout the evolution process.