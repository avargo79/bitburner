# Botnet Script Refactoring - Technical Implementation Plan

## Implementation Strategy

This plan details the technical approach for refactoring `botnet-v3.ts` from a 485-line monolithic script into a well-organized, maintainable system. The refactoring will extract reusable functions, create proper interfaces, and organize code into logical sections while maintaining identical functionality, RAM costs, and performance.

## Current Architecture Analysis

### Current State Assessment
- **Main function**: 485 lines handling multiple responsibilities
- **Inlined classes**: FactionDetector (155 lines), ShareCalculator (200 lines), ServerOptimizer (245 lines)
- **Utility functions**: Scattered throughout with repeated patterns
- **Configuration**: Mixed inline constants and command-line options
- **Control flow**: Linear execution with embedded loops and conditionals

### Performance Characteristics to Preserve
- **RAM efficiency**: Current NS API usage patterns minimize memory costs
- **Execution timing**: HWGW batch coordination requires precise timing
- **Resource allocation**: Dynamic thread distribution across botnet servers
- **Status reporting**: Real-time monitoring with 1-second update cycles

## Target Architecture

### Modular Organization
The refactored system will organize code into focused functional areas while remaining in a single file:

```typescript
// ===== CONFIGURATION SECTION =====
// Centralized constants and configuration management

// ===== INTERFACES & TYPES SECTION =====
// All TypeScript interfaces and type definitions

// ===== UTILITY FUNCTIONS SECTION =====
// Core utilities for server management, data processing

// ===== HWGW BATCHING ENGINE =====
// Target selection, batch calculation, execution

// ===== SERVER MANAGEMENT SYSTEM =====
// Network scanning, rooting, purchasing, upgrading

// ===== REPBOOST MANAGEMENT =====
// Faction detection, share allocation, deployment

// ===== STATUS & MONITORING =====
// Performance tracking, debug output, reporting

// ===== MAIN CONTROLLER =====
// Orchestration logic under 100 lines
```

### Module Design Principles
- **Single responsibility**: Each module handles one functional area
- **Clear interfaces**: Well-defined input/output contracts
- **Minimal coupling**: Modules interact through pure functions and data structures
- **Stateless design**: Functions operate on passed data, no hidden state
- **Self-contained**: No external dependencies beyond NS API

## Detailed Implementation Plan

### Phase 1: Configuration & Interface Extraction

#### 1.1 Configuration Centralization
**Objective**: Consolidate all configuration constants and provide type-safe access

**Current State**: Mixed inline constants and BOTNET_CONFIG object
```typescript
// Scattered throughout code
const HWGW_TIMING_GAP = 150;
// In BOTNET_CONFIG object
HACK_PERCENTAGE: 0.75,
```

**Target State**: Unified configuration management
```typescript
interface BotnetConfiguration {
  // Resource management
  scriptRamCost: number;
  homeRamReserve: number;
  minBatchRamThreshold: number;
  
  // HWGW parameters
  hwgwTimingGap: number;
  hackPercentage: number;
  growthAnalysisCap: number;
  
  // Repboost settings
  shramReallocationInterval: number;
  shramThreadChangeThreshold: number;
  
  // Performance tuning
  statusUpdateInterval: number;
  topTargetsDisplay: number;
}

class ConfigurationManager {
  static readonly DEFAULT_CONFIG: BotnetConfiguration = { /* ... */ };
  static validateOptions(options: BotnetOptions): string[];
  static mergeConfiguration(options: BotnetOptions): BotnetConfiguration;
}
```

**Implementation Steps**:
1. Extract all magic numbers and configuration constants
2. Create comprehensive BotnetConfiguration interface
3. Implement configuration validation and merging
4. Replace inline constants with configuration references

#### 1.2 Interface Consolidation
**Objective**: Organize all TypeScript interfaces and types in dedicated section

**Current State**: Interfaces scattered throughout file with some duplication

**Target State**: Comprehensive type system
```typescript
// ===== CORE DATA INTERFACES =====
interface ServerData { /* existing */ }
interface BotnetOptions { /* existing */ }

// ===== HWGW BATCH INTERFACES =====
interface IHWGWBatch { /* existing */ }
interface IPrepBatch { /* existing */ }
interface BatchExecutionPlan {
  hwgwBatches: IHWGWBatch[];
  prepBatches: IPrepBatch[];
  totalThreads: number;
  estimatedRAM: number;
}

// ===== RESOURCE MANAGEMENT =====
interface ResourceAllocation {
  serverAllocations: ServerAllocation[];
  totalAvailable: number;
  reservedRAM: number;
}

// ===== SYSTEM STATE =====
interface BotnetSystemState {
  repboostActive: boolean;
  currentAllocation: ShareAllocation | null;
  performanceMetrics: PerformanceMetrics;
}
```

### Phase 2: Utility Function Extraction

#### 2.1 Server Management Utilities
**Objective**: Extract server-related operations into focused functions

**Functions to Extract**:
```typescript
namespace ServerUtils {
  function scanNetworkTopology(ns: NS): string[];
  function buildServerDataset(ns: NS, hostnames: string[]): ServerData[];
  function categorizeServers(servers: ServerData[], playerLevel: number): {
    targets: ServerData[];
    attackers: ServerData[];
    purchased: ServerData[];
  };
  
  function performAutomatedRooting(ns: NS, servers: ServerData[]): {
    rootedCount: number;
    failedServers: string[];
  };
  
  async function managePurchasedServers(
    ns: NS, 
    servers: ServerData[], 
    config: ServerManagementConfig
  ): Promise<ServerManagementResult>;
}
```

#### 2.2 Resource Management Utilities
**Objective**: Extract RAM allocation and thread distribution logic

**Functions to Extract**:
```typescript
namespace ResourceManager {
  function takeNetworkRAMSnapshot(ns: NS, attackers: ServerData[]): INetworkRAMSnapshot;
  
  function allocateRAMBudget(
    snapshot: INetworkRAMSnapshot,
    reservations: { repboost: number; home: number }
  ): ResourceAllocation;
  
  function distributeThreadsAcrossServers(
    threads: number,
    servers: ServerData[],
    ramPerThread: number
  ): ThreadDistribution[];
}
```

#### 2.3 Execution Utilities
**Objective**: Extract script execution and deployment logic

**Functions to Extract**:
```typescript
namespace ExecutionManager {
  function deployRemoteScripts(ns: NS, attackers: ServerData[]): boolean;
  
  function executeScript(
    ns: NS,
    scriptType: string,
    allocation: ThreadAllocation
  ): ExecutionResult;
  
  function cleanupScripts(
    ns: NS,
    servers: string[],
    scriptPattern: string
  ): CleanupResult;
}
```

### Phase 3: Core System Module Extraction

#### 3.1 HWGW Batching Engine
**Objective**: Extract HWGW batching logic into focused module

**Current Complexity**: Mixed in main function with target selection, batch calculation, and execution

**Target Module**:
```typescript
class HWGWBatchingEngine {
  private config: BotnetConfiguration;
  
  constructor(config: BotnetConfiguration) {
    this.config = config;
  }
  
  selectHackableTargets(targets: ServerData[]): ServerData[] {
    // Extract current selectHackableTargets logic
  }
  
  calculateFullHWGWBatch(ns: NS, target: ServerData): IHWGWBatch {
    // Extract current calculateFullHWGWBatch logic
  }
  
  calculatePrepBatch(
    ns: NS, 
    target: ServerData, 
    availableRAM: number
  ): IPrepBatch | null {
    // Extract current calculatePrepBatch logic
  }
  
  planBatchExecution(
    ns: NS,
    targets: ServerData[],
    availableRAM: number
  ): BatchExecutionPlan {
    // New orchestration logic combining target selection and batch planning
  }
  
  executeBatchPlan(
    ns: NS,
    plan: BatchExecutionPlan,
    networkSnapshot: INetworkRAMSnapshot
  ): IExecutionResults {
    // Extract and improve current executeHWGWBatches logic
  }
}
```

#### 3.2 Server Management System
**Objective**: Extract server lifecycle management into dedicated module

**Target Module**:
```typescript
class ServerManagementSystem {
  private config: BotnetConfiguration;
  
  constructor(config: BotnetConfiguration) {
    this.config = config;
  }
  
  async performNetworkDiscovery(ns: NS): Promise<ServerData[]> {
    // Combine getServerList and buildServerData
  }
  
  async performMaintenanceCycle(
    ns: NS,
    servers: ServerData[],
    options: BotnetOptions
  ): Promise<MaintenanceResult> {
    // Combine rooting and server management
  }
  
  categorizeServers(
    servers: ServerData[],
    playerLevel: number
  ): ServerCategories {
    // Extract server filtering and sorting
  }
}
```

#### 3.3 Repboost Management System
**Objective**: Extract repboost functionality into dedicated module

**Target Module**:
```typescript
class RepboostManagementSystem {
  private detector: FactionDetector;
  private currentAllocation: ShareAllocation | null = null;
  private lastAllocationTime: number = 0;
  
  constructor(private config: BotnetConfiguration) {
    this.detector = new FactionDetector();
  }
  
  updateFactionWorkStatus(): FactionWorkStatus {
    // Extract faction detection logic
  }
  
  shouldActivateRepboost(status: FactionWorkStatus): boolean {
    // Extract activation logic
  }
  
  async manageRepboostAllocation(
    ns: NS,
    servers: ServerData[],
    options: BotnetOptions
  ): Promise<RepboostAllocationResult> {
    // Extract share allocation and deployment
  }
  
  calculateRAMReservation(): number {
    // Extract RAM calculation for current allocation
  }
  
  async cleanup(ns: NS, servers: ServerData[]): Promise<void> {
    // Extract repboost script cleanup
  }
}
```

### Phase 4: Status & Monitoring System

#### 4.1 Performance Monitoring
**Objective**: Extract status reporting and performance tracking

**Target Module**:
```typescript
class StatusMonitoringSystem {
  private startTime: number = Date.now();
  private totalBatchCycles: number = 0;
  
  updatePerformanceMetrics(executionResults: IExecutionResults): void {
    this.totalBatchCycles++;
  }
  
  generateStatusReport(
    ns: NS,
    servers: ServerData[],
    systemState: BotnetSystemState,
    options: BotnetOptions
  ): void {
    // Extract current printStatus logic
  }
  
  private generateBotnetStatus(/* ... */): StatusSection { }
  private generateRepboostStatus(/* ... */): StatusSection { }
  private generateActiveTargetsStatus(/* ... */): StatusSection { }
  
  printDebugInfo(
    message: string,
    data?: any,
    enabled: boolean = false
  ): void {
    // Centralized debug output
  }
}
```

### Phase 5: Main Function Refactoring

#### 5.1 Control Flow Simplification
**Objective**: Reduce main function to under 100 lines with clear orchestration

**Current Structure**: 485 lines of mixed concerns and embedded logic

**Target Structure**:
```typescript
export async function main(ns: NS): Promise<void> {
  // === INITIALIZATION ===
  ns.disableLog("ALL");
  const options = ns.flags(argsSchema) as unknown as BotnetOptions;
  const config = ConfigurationManager.mergeConfiguration(options);
  
  // Validate single instance
  if (detectExistingInstance(ns)) return;
  
  // Initialize systems
  const hwgwEngine = new HWGWBatchingEngine(config);
  const serverManager = new ServerManagementSystem(config);
  const repboostManager = new RepboostManagementSystem(config);
  const statusMonitor = new StatusMonitoringSystem();
  
  // Setup exit handler
  setupExitHandler(ns);
  
  // === MAIN EXECUTION LOOP ===
  do {
    ns.clearLog();
    
    // Phase 1: Network Discovery & Server Management
    const servers = await serverManager.performNetworkDiscovery(ns);
    await serverManager.performMaintenanceCycle(ns, servers, options);
    
    // Phase 2: Repboost Management
    const repboostRAM = await repboostManager.manageRepboostAllocation(ns, servers, options);
    
    // Phase 3: HWGW Batching
    const { targets, attackers } = serverManager.categorizeServers(servers, ns.getHackingLevel());
    const batchPlan = hwgwEngine.planBatchExecution(ns, targets, calculateAvailableRAM(attackers, repboostRAM));
    const executionResults = hwgwEngine.executeBatchPlan(ns, batchPlan, takeNetworkSnapshot(attackers));
    
    // Phase 4: Status & Monitoring
    statusMonitor.updatePerformanceMetrics(executionResults);
    
    // === CONTINUOUS OPERATION ===
    await runContinuousLoop(ns, { hwgwEngine, serverManager, repboostManager, statusMonitor }, options);
    
  } while (options.repeat);
}
```

#### 5.2 Continuous Loop Extraction
**Objective**: Extract continuous operation logic into separate function

**Target Function**:
```typescript
async function runContinuousLoop(
  ns: NS,
  systems: {
    hwgwEngine: HWGWBatchingEngine;
    serverManager: ServerManagementSystem;
    repboostManager: RepboostManagementSystem;
    statusMonitor: StatusMonitoringSystem;
  },
  options: BotnetOptions
): Promise<void> {
  while (true) {
    await ns.sleep(1000);
    ns.clearLog();
    
    // Incremental operations
    const servers = await systems.serverManager.performNetworkDiscovery(ns);
    await systems.serverManager.performMaintenanceCycle(ns, servers, options);
    
    const { targets, attackers } = systems.serverManager.categorizeServers(servers, ns.getHackingLevel());
    
    // Status reporting
    const systemState = gatherSystemState(systems);
    systems.statusMonitor.generateStatusReport(ns, servers, systemState, options);
    
    // Additional batch spawning if RAM available
    await spawnAdditionalBatches(ns, systems, targets, attackers, options);
    
    // Exit condition check
    if (!options.repeat && !hasActiveScripts(ns, servers)) break;
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Configuration & Interfaces)
**Timeline**: 1-2 hours
**Risk**: Low
**Deliverables**:
- Centralized configuration management
- Consolidated interface definitions
- Type-safe configuration access

**Validation**:
- All existing options work identically
- TypeScript compilation succeeds
- No functional changes in behavior

### Phase 2: Utility Extraction
**Timeline**: 2-3 hours
**Risk**: Medium
**Deliverables**:
- Server management utilities
- Resource allocation utilities
- Execution management utilities

**Validation**:
- Server discovery works identically
- RAM allocation produces same results
- Script execution maintains performance

### Phase 3: Core Module Extraction
**Timeline**: 4-5 hours
**Risk**: High
**Deliverables**:
- HWGWBatchingEngine module
- ServerManagementSystem module
- RepboostManagementSystem module

**Validation**:
- HWGW batching timing preserved
- Server management functionality intact
- Repboost system operates identically

### Phase 4: Status & Main Refactoring
**Timeline**: 2-3 hours
**Risk**: Medium
**Deliverables**:
- StatusMonitoringSystem module
- Simplified main function (<100 lines)
- Extracted continuous loop

**Validation**:
- Status output matches original format
- Performance metrics accurate
- Main flow operates identically

### Phase 5: Integration & Testing
**Timeline**: 2-3 hours
**Risk**: Medium
**Deliverables**:
- Full integration testing
- Performance validation
- Side-by-side comparison

**Validation**:
- RAM usage identical
- Execution timing preserved
- All features functional

## Code Organization Strategy

### File Structure Within botnet-v3.ts
```typescript
// ===== EXTERNAL DEPENDENCIES (PRESERVED) =====
// FactionDetector, ShareCalculator, ServerOptimizer classes remain inline

// ===== CONFIGURATION MANAGEMENT =====
interface BotnetConfiguration { }
class ConfigurationManager { }

// ===== TYPE DEFINITIONS =====
// All interfaces and types consolidated

// ===== UTILITY NAMESPACES =====
namespace ServerUtils { }
namespace ResourceManager { }
namespace ExecutionManager { }

// ===== CORE SYSTEM MODULES =====
class HWGWBatchingEngine { }
class ServerManagementSystem { }
class RepboostManagementSystem { }
class StatusMonitoringSystem { }

// ===== ORCHESTRATION FUNCTIONS =====
function runContinuousLoop() { }
function setupExitHandler() { }
function detectExistingInstance() { }

// ===== MAIN CONTROLLER =====
export async function main(ns: NS): Promise<void> { }
export function autocomplete() { }
```

### Module Interaction Patterns
- **Data Flow**: Unidirectional data flow through function parameters
- **State Management**: Minimal state in module instances, primarily configuration
- **Error Handling**: Preserve existing error recovery patterns
- **Logging**: Centralized through StatusMonitoringSystem

## Performance Considerations

### RAM Optimization
- **Preserve NS API patterns**: Maintain existing cheap API call usage
- **Avoid function overhead**: Use namespaces for utilities to prevent function creation costs
- **Minimize object creation**: Reuse data structures where possible
- **Configuration access**: Ensure configuration lookups don't add RAM costs

### Execution Timing
- **Preserve critical paths**: HWGW timing calculations remain unchanged
- **Minimize function call overhead**: Direct delegation to preserve performance
- **Batch operation timing**: Maintain existing coordination logic
- **Status update frequency**: Preserve 1-second update cycles

### Memory Management
- **Object lifecycle**: Clear references to prevent memory leaks
- **Large data structures**: Efficient handling of server arrays and batch data
- **Cleanup procedures**: Maintain existing script termination logic

## Risk Mitigation

### Critical Path Protection
1. **HWGW timing preservation**: Exact algorithm preservation in extracted modules
2. **RAM cost monitoring**: Continuous validation of memory usage patterns
3. **Performance benchmarking**: Before/after performance comparison
4. **Feature parity testing**: Comprehensive validation of all functionality

### Rollback Strategy
1. **Incremental implementation**: Each phase independently testable
2. **Git branch strategy**: Feature branch with commit per phase
3. **Validation gates**: No progression without passing validation
4. **Backup preservation**: Original implementation preserved for comparison

### Testing Approach
1. **Unit-level testing**: Individual module validation
2. **Integration testing**: System-level functionality verification
3. **Performance testing**: RAM usage and execution timing validation
4. **Long-running testing**: Continuous operation stability verification

## Success Metrics

### Code Quality
- **Line count reduction**: Main function under 100 lines (from 485)
- **Module count**: 6-8 focused modules with clear responsibilities
- **Complexity reduction**: Each function under 10 cyclomatic complexity
- **Maintainability**: Clear separation of concerns and minimal coupling

### Functional Preservation
- **Feature parity**: 100% functionality preservation
- **Performance parity**: No degradation in RAM usage or execution timing
- **Interface consistency**: All command-line options work identically
- **Output consistency**: Status and debug output matches original

### Developer Experience
- **Debuggability**: Individual modules testable in isolation
- **Extensibility**: New features addable without core modifications
- **Readability**: Clear code organization and documentation
- **Configuration management**: Easy modification of system parameters

This refactoring will transform botnet-v3.ts from a monolithic script into a well-structured, maintainable system while preserving all existing functionality and performance characteristics.