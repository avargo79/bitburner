# Botnet Architecture Analysis

## Current State Assessment

### System Overview
The current botnet implementation represents a sophisticated but monolithic automation framework with 940+ lines in the main function and 8 specialized library modules. While functionally robust, it suffers from architectural debt that limits maintainability and extensibility.

### Architecture Strengths ✅

#### 1. **Comprehensive Modular Library System**
- **8 Focused Modules**: Clean separation into `/lib/botnet-*` pattern
- **Strong TypeScript Foundation**: 40+ interfaces, comprehensive type safety
- **Centralized Configuration**: BOTNET_CONFIG with 30+ tunable parameters
- **Advanced Logging**: Category-based system with debug levels

#### 2. **Sophisticated Feature Set**
- **Sequential RAM Allocation**: Eliminates resource conflicts (recent fix)
- **Advanced HWGW Timing**: 4-phase coordination with configurable delays
- **Faction Work Detection**: DOM-based faction activity monitoring
- **Real-time Status Monitoring**: Comprehensive performance dashboards

#### 3. **Robust Error Handling**
- **Automatic Cleanup**: `ns.atExit()` cleanup handlers
- **Graceful Degradation**: Falls back to prep mode when no targets available
- **RAM Penalty Avoidance**: Dynamic string construction for browser API access

### Critical Architectural Weaknesses ⚠️

#### 1. **Monolithic Main Function (940+ lines)**
```typescript
// Current: Everything in main()
export async function main(ns: NS): Promise<void> {
    // 50 lines: Initialization
    // 200 lines: Server management
    // 300 lines: Sequential allocation
    // 150 lines: HWGW batching  
    // 100 lines: Status monitoring
    // 140 lines: Error handling
}
```

**Problems:**
- **Single Responsibility Violation**: Function handles 6 distinct responsibilities
- **Difficult Testing**: Cannot test individual components in isolation
- **Poor Readability**: Complex nested logic hard to follow
- **Maintenance Burden**: Changes require understanding entire system

#### 2. **Global State Dependencies**
```typescript
// Global variables scattered throughout
let options: BotnetOptions;
let logger: BotnetLogger;
let repboostDetector: FactionDetector | null = null;
let repboostSystemActive = false;
let currentShareAllocation: any = null;
```

**Issues:**
- **Hidden Dependencies**: Functions depend on global state without explicit parameters
- **Testing Complexity**: Must mock global state for unit tests
- **Race Conditions**: Shared mutable state across async operations
- **Poor Encapsulation**: Internal state exposed at module level

#### 3. **Mixed Abstraction Levels**
```typescript
// High-level orchestration mixed with low-level calculations
const shareRAMBudget = totalNetworkRAM * ramPercentage;
const maxPossibleThreads = Math.floor(shareRAMBudget / shareScriptRAM);
await executeBasicHWGWBatchingWithSnapshot(ns, targets, attackers, options, availableNetworkSnapshot);
```

**Problems:**
- **Cognitive Overload**: Readers must understand both strategy and implementation
- **Reusability Issues**: Low-level logic embedded in high-level functions
- **Inconsistent Abstractions**: Some operations abstracted, others inline

### Dependency Analysis

#### Current Module Dependencies
```
botnet.ts (940 lines)
├── botnet-types.ts (214 lines) ✅ Clean interfaces
├── botnet-config.ts (89 lines) ✅ Constants only
├── botnet-utils.ts (152 lines) ✅ Pure functions
├── botnet-server-management.ts (129 lines) ✅ Focused responsibility
├── botnet-logger.ts ✅ Singleton pattern
├── botnet-faction-detection.ts ✅ DOM utilities
├── botnet-share-system.ts ✅ Mathematical calculations
└── botnet-status.ts ✅ Monitoring only
```

**Coupling Analysis:**
- **Low Coupling**: Library modules are well-isolated
- **High Coupling**: Main function imports everything
- **Circular Dependencies**: None detected ✅
- **Interface Segregation**: Well-defined, focused interfaces ✅

### Performance Bottlenecks

#### 1. **Sequential Processing Model**
```typescript
// Current: Linear execution phases
await executeServerManagementCycle();    // Phase 1
await executeRepboostSystem();           // Phase 2  
await executeBasicHWGWBatching();        // Phase 3
```

**Impact:**
- **Underutilized Resources**: RAM sits idle during phase transitions
- **Poor Scalability**: Processing time grows linearly with complexity
- **Missed Opportunities**: Cannot optimize across phases

#### 2. **Expensive NS API Calls**
```typescript
// Repeated expensive operations
const networkRAMSnapshot = takeNetworkRAMSnapshot(ns, attackers); // O(n) servers
runningScripts.forEach(script => ns.ps(script.server));          // O(n) processes
```

**Optimization Opportunities:**
- **Caching Strategy**: Cache `ns.ps()` results between cycles
- **Batch Operations**: Group NS API calls to reduce overhead
- **Lazy Evaluation**: Only gather data when needed

#### 3. **RAM Fragmentation**
```typescript
// Current: Largest-first allocation without fragmentation consideration
const maxThreadsOnServer = Math.floor(availableRAM / scriptRAM);
const threadsToAllocate = Math.min(remainingThreads, maxThreadsOnServer);
```

**Issues:**
- **Suboptimal Packing**: Leaves unusable RAM fragments
- **No Consolidation**: No defragmentation strategies
- **Poor Resource Utilization**: ~5-10% RAM waste due to fragmentation

## Architectural Quality Metrics

### Current Metrics
| Metric | Current | Target | Status |
|--------|---------|---------|--------|
| **Main Function Lines** | 940+ | <100 | 🔴 Critical |
| **Cyclomatic Complexity** | ~45 | <10 | 🔴 Critical |
| **Module Coupling** | High | Low | 🟡 Moderate |
| **Test Coverage** | 0% | 80%+ | 🔴 Critical |
| **Documentation Coverage** | 30% | 90%+ | 🟡 Moderate |

### Technical Debt Assessment

#### Critical Issues (Fix Immediately)
1. **Monolithic Main Function**: Extract into pipeline architecture
2. **Global State Management**: Implement dependency injection
3. **Mixed Abstractions**: Separate strategy from implementation

#### High Priority (Next Sprint)
1. **Performance Optimization**: Implement caching and batch operations
2. **Error Handling**: Add circuit breakers and retry logic
3. **Testing Infrastructure**: Unit test framework setup

#### Medium Priority (Future Iterations)
1. **Documentation**: Comprehensive API documentation
2. **Configuration Management**: External config file support
3. **Monitoring Enhancement**: Advanced metrics collection

## Recommended Architecture Evolution

### Phase 1: Extraction and Modularization
1. **Extract HWGW Engine**: Dedicated batch calculation and execution
2. **Extract Resource Manager**: Centralized RAM allocation logic
3. **Extract Pipeline Orchestrator**: Clean phase management

### Phase 2: Performance and Reliability
1. **Implement Caching Layer**: Reduce NS API overhead
2. **Add Circuit Breakers**: Prevent cascade failures
3. **Enhanced Error Recovery**: Sophisticated fallback strategies

### Phase 3: Advanced Features
1. **Predictive Allocation**: ML-based resource optimization
2. **Dynamic Configuration**: Runtime parameter adjustment
3. **Community Integration**: Plugin architecture for extensions

## Success Metrics

### Performance Targets
- **Startup Time**: <5 seconds (current: ~10-15 seconds)
- **RAM Efficiency**: >95% utilization (current: ~85-90%)
- **Error Rate**: <1% batch failures (current: ~3-5%)
- **Code Maintainability**: <100 lines per function (current: 940+ in main)

### Quality Targets
- **Test Coverage**: 80%+ unit test coverage
- **Documentation**: 90%+ API documentation coverage
- **Complexity**: <10 cyclomatic complexity per function
- **Dependencies**: <3 module dependencies per component

The current architecture provides a solid foundation but requires significant refactoring to achieve enterprise-grade maintainability and performance. The modular library system is excellent and should be preserved, while the monolithic main function needs complete restructuring into a clean pipeline architecture.