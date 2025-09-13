# Botnet Script Refactoring - Implementation Tasks

## Task Overview

This document provides detailed implementation tasks for refactoring the `botnet-v3.ts` script from a 485-line monolithic file into a well-organized, maintainable system with 6 core modules. All tasks maintain the single-file constraint while extracting reusable functions, creating proper interfaces, and organizing code into logical sections.

## Prerequisites

- [ ] Verify existing `botnet-v3.ts` functionality with current test scenarios
- [ ] Create backup branch: `git checkout -b botnet-refactor-backup`
- [ ] Create feature branch: `git checkout -b botnet-refactor-implementation`
- [ ] Validate TypeScript compilation: `npx tsc --noEmit`

## Phase 1: Foundation Setup (Configuration & Interfaces)

### Task 1.1: Extract Configuration Management [P]
**Estimated Time**: 45 minutes
**Dependencies**: None
**Risk Level**: Low

**Objective**: Centralize all configuration constants and provide type-safe access

**Sub-tasks**:
1. **Extract configuration constants**:
   - [ ] Identify all magic numbers and configuration values in `botnet-v3.ts:624-662`
   - [ ] Create comprehensive `BotnetConfiguration` interface
   - [ ] Move BOTNET_CONFIG object contents to new interface structure
   - [ ] Add configuration validation methods

2. **Implement ConfigurationManager class**:
   ```typescript
   class ConfigurationManager {
     static readonly DEFAULT_CONFIG: BotnetConfiguration;
     static validateOptions(options: BotnetOptions): string[];
     static mergeConfiguration(options: BotnetOptions): BotnetConfiguration;
   }
   ```

3. **Replace inline constants**:
   - [ ] Replace all hardcoded values with configuration references
   - [ ] Update HWGW timing calculations to use config values
   - [ ] Update repboost parameters to use config values
   - [ ] Update resource management thresholds

**Validation**:
- [ ] TypeScript compilation succeeds
- [ ] All command-line options work identically
- [ ] Configuration validation catches invalid values
- [ ] No functional changes in behavior

### Task 1.2: Consolidate Interface Definitions [P]
**Estimated Time**: 30 minutes
**Dependencies**: None
**Risk Level**: Low

**Objective**: Organize all TypeScript interfaces and types in dedicated section

**Sub-tasks**:
1. **Create interface organization section**:
   ```typescript
   // ===== CORE DATA INTERFACES =====
   // ===== HWGW BATCH INTERFACES =====
   // ===== RESOURCE MANAGEMENT INTERFACES =====
   // ===== SYSTEM STATE INTERFACES =====
   ```

2. **Consolidate existing interfaces**:
   - [ ] Move `ServerData` interface (`botnet-v3.ts:759-773`)
   - [ ] Move `BotnetOptions` interface (`botnet-v3.ts:692-706`)
   - [ ] Move HWGW batch interfaces (`botnet-v3.ts:947-977`)
   - [ ] Move performance tracking interfaces

3. **Add new orchestration interfaces**:
   ```typescript
   interface BatchExecutionPlan {
     hwgwBatches: IHWGWBatch[];
     prepBatches: IPrepBatch[];
     totalThreads: number;
     estimatedRAM: number;
   }
   
   interface BotnetSystemState {
     repboostActive: boolean;
     currentAllocation: ShareAllocation | null;
     performanceMetrics: PerformanceMetrics;
   }
   ```

**Validation**:
- [ ] All existing interfaces preserved
- [ ] New interfaces support planned refactoring
- [ ] TypeScript compilation succeeds
- [ ] No duplicate interface definitions

## Phase 2: Utility Function Extraction

### Task 2.1: Extract Server Management Utilities [P]
**Estimated Time**: 60 minutes
**Dependencies**: Task 1.1, Task 1.2
**Risk Level**: Medium

**Objective**: Extract server-related operations into focused utility namespace

**Sub-tasks**:
1. **Create ServerUtils namespace**:
   ```typescript
   namespace ServerUtils {
     function scanNetworkTopology(ns: NS): string[];
     function buildServerDataset(ns: NS, hostnames: string[]): ServerData[];
     function categorizeServers(servers: ServerData[], playerLevel: number): ServerCategories;
     function performAutomatedRooting(ns: NS, servers: ServerData[]): RootingResult;
   }
   ```

2. **Extract existing functions**:
   - [ ] Extract `getServerList()` function (`botnet-v3.ts:776-779`) → `scanNetworkTopology()`
   - [ ] Extract `buildServerData()` function (`botnet-v3.ts:782-807`) → `buildServerDataset()`
   - [ ] Extract server filtering logic → `categorizeServers()`
   - [ ] Extract `performServerRooting()` function (`botnet-v3.ts:846-859`) → `performAutomatedRooting()`

3. **Extract server purchasing logic**:
   - [ ] Extract `managePurchasedServers()` function (`botnet-v3.ts:861-910`)
   - [ ] Create `ServerPurchaseConfig` interface for purchase parameters
   - [ ] Add purchase validation and error handling

4. **Update function calls**:
   - [ ] Replace all calls to extracted functions with namespace references
   - [ ] Ensure parameter passing maintains existing behavior
   - [ ] Preserve RAM cost optimization patterns

**Validation**:
- [ ] Server discovery works identically
- [ ] Server rooting produces same results
- [ ] Purchase server functionality intact
- [ ] Performance characteristics preserved

### Task 2.2: Extract Resource Management Utilities [P]
**Estimated Time**: 45 minutes
**Dependencies**: Task 2.1
**Risk Level**: Medium

**Objective**: Extract RAM allocation and thread distribution logic

**Sub-tasks**:
1. **Create ResourceManager namespace**:
   ```typescript
   namespace ResourceManager {
     function takeNetworkRAMSnapshot(ns: NS, attackers: ServerData[]): INetworkRAMSnapshot;
     function allocateRAMBudget(snapshot: INetworkRAMSnapshot, reservations: RAMReservations): ResourceAllocation;
     function distributeThreadsAcrossServers(threads: number, servers: ServerData[], ramPerThread: number): ThreadDistribution[];
   }
   ```

2. **Extract existing functions**:
   - [ ] Extract `takeNetworkRAMSnapshot()` function (`botnet-v3.ts:1603-1620`)
   - [ ] Create RAM budget allocation logic from main function
   - [ ] Extract thread distribution from `allocateAndExecuteScript()` (`botnet-v3.ts:1763-1827`)

3. **Add resource optimization**:
   - [ ] Create RAM reservation management for repboost system
   - [ ] Add resource allocation validation
   - [ ] Implement server priority-based allocation

**Validation**:
- [ ] RAM allocation produces same results
- [ ] Thread distribution maintains efficiency
- [ ] Resource reservations work correctly

### Task 2.3: Extract Execution Management Utilities [P]
**Estimated Time**: 45 minutes
**Dependencies**: Task 2.2
**Risk Level**: Medium

**Objective**: Extract script execution and deployment logic

**Sub-tasks**:
1. **Create ExecutionManager namespace**:
   ```typescript
   namespace ExecutionManager {
     function deployRemoteScripts(ns: NS, attackers: ServerData[]): DeploymentResult;
     function executeScript(ns: NS, scriptType: string, allocation: ThreadAllocation): ExecutionResult;
     function cleanupScripts(ns: NS, servers: string[], scriptPattern: string): CleanupResult;
   }
   ```

2. **Extract existing functions**:
   - [ ] Extract remote script deployment logic from main function (`botnet-v3.ts:1102-1107`)
   - [ ] Extract `allocateAndExecuteScript()` function (`botnet-v3.ts:1763-1827`)
   - [ ] Extract script cleanup logic from repboost management (`botnet-v3.ts:1117-1144`)

3. **Add execution validation**:
   - [ ] Create script existence validation
   - [ ] Add PID tracking and validation
   - [ ] Implement execution retry logic

**Validation**:
- [ ] Script deployment maintains reliability
- [ ] Execution success rates preserved
- [ ] Cleanup procedures work correctly

## Phase 3: Core System Module Extraction

### Task 3.1: Create HWGW Batching Engine Module
**Estimated Time**: 90 minutes
**Dependencies**: Task 2.1, Task 2.2, Task 2.3
**Risk Level**: High

**Objective**: Extract HWGW batching logic into focused class module

**Sub-tasks**:
1. **Create HWGWBatchingEngine class**:
   ```typescript
   class HWGWBatchingEngine {
     private config: BotnetConfiguration;
     
     constructor(config: BotnetConfiguration);
     selectHackableTargets(targets: ServerData[]): ServerData[];
     calculateFullHWGWBatch(ns: NS, target: ServerData): IHWGWBatch;
     calculatePrepBatch(ns: NS, target: ServerData, availableRAM: number): IPrepBatch | null;
     planBatchExecution(ns: NS, targets: ServerData[], availableRAM: number): BatchExecutionPlan;
     executeBatchPlan(ns: NS, plan: BatchExecutionPlan, networkSnapshot: INetworkRAMSnapshot): IExecutionResults;
   }
   ```

2. **Extract existing target selection logic**:
   - [ ] Extract `selectHackableTargets()` function (`botnet-v3.ts:1622-1636`)
   - [ ] Move target filtering and sorting logic
   - [ ] Preserve target efficiency calculations

3. **Extract batch calculation functions**:
   - [ ] Extract `calculateFullHWGWBatch()` function (`botnet-v3.ts:1638-1679`)
   - [ ] Extract `calculatePrepBatch()` function (`botnet-v3.ts:1681-1714`)
   - [ ] Preserve HWGW timing coordination logic
   - [ ] Maintain growth analysis capping

4. **Create batch execution orchestration**:
   - [ ] Extract `executeHWGWBatches()` function (`botnet-v3.ts:1716-1761`)
   - [ ] Create unified batch planning logic
   - [ ] Add batch execution validation

5. **Update main function calls**:
   - [ ] Replace target selection calls with engine methods
   - [ ] Replace batch calculation with engine planning
   - [ ] Replace execution with engine batch execution

**Validation**:
- [ ] HWGW batching timing preserved exactly
- [ ] Target selection produces identical results
- [ ] Batch calculations maintain precision
- [ ] Execution coordination works correctly

### Task 3.2: Create Server Management System Module
**Estimated Time**: 75 minutes
**Dependencies**: Task 2.1, Task 3.1
**Risk Level**: High

**Objective**: Extract server lifecycle management into dedicated class module

**Sub-tasks**:
1. **Create ServerManagementSystem class**:
   ```typescript
   class ServerManagementSystem {
     private config: BotnetConfiguration;
     
     constructor(config: BotnetConfiguration);
     async performNetworkDiscovery(ns: NS): Promise<ServerData[]>;
     async performMaintenanceCycle(ns: NS, servers: ServerData[], options: BotnetOptions): Promise<MaintenanceResult>;
     categorizeServers(servers: ServerData[], playerLevel: number): ServerCategories;
   }
   ```

2. **Combine server discovery operations**:
   - [ ] Integrate `ServerUtils.scanNetworkTopology()` and `ServerUtils.buildServerDataset()`
   - [ ] Create unified server discovery method
   - [ ] Add server data caching for performance

3. **Create maintenance cycle orchestration**:
   - [ ] Combine rooting and server management operations
   - [ ] Extract server maintenance from main function (`botnet-v3.ts:1072-1089`)
   - [ ] Add maintenance scheduling and throttling

4. **Extract server categorization**:
   - [ ] Move target/attacker filtering logic
   - [ ] Preserve server sorting algorithms
   - [ ] Add server capability assessment

**Validation**:
- [ ] Network discovery maintains completeness
- [ ] Server maintenance preserves functionality
- [ ] Server categorization produces identical results

### Task 3.3: Create Repboost Management System Module
**Estimated Time**: 90 minutes
**Dependencies**: Task 2.1, Task 2.2, Task 2.3
**Risk Level**: High

**Objective**: Extract repboost functionality into dedicated class module

**Sub-tasks**:
1. **Create RepboostManagementSystem class**:
   ```typescript
   class RepboostManagementSystem {
     private detector: FactionDetector;
     private currentAllocation: ShareAllocation | null = null;
     private lastAllocationTime: number = 0;
     private systemActive: boolean = false;
     
     constructor(private config: BotnetConfiguration);
     updateFactionWorkStatus(): FactionWorkStatus;
     shouldActivateRepboost(status: FactionWorkStatus): boolean;
     async manageRepboostAllocation(ns: NS, servers: ServerData[], options: BotnetOptions): Promise<number>;
     calculateRAMReservation(): number;
     async cleanup(ns: NS, servers: ServerData[]): Promise<void>;
   }
   ```

2. **Extract faction work detection**:
   - [ ] Move FactionDetector instantiation and management (`botnet-v3.ts:933-937`)
   - [ ] Extract faction work status logic (`botnet-v3.ts:1041-1068`)
   - [ ] Preserve detection stability requirements

3. **Extract share allocation management**:
   - [ ] Extract share configuration and validation (`botnet-v3.ts:1169-1180`)
   - [ ] Extract server optimization logic (`botnet-v3.ts:1181-1204`)
   - [ ] Extract allocation calculation (`botnet-v3.ts:1205-1283`)
   - [ ] Preserve RAM calculation and deployment logic

4. **Extract script deployment and cleanup**:
   - [ ] Extract repboost script deployment (`botnet-v3.ts:1223-1270`)
   - [ ] Extract script cleanup logic (`botnet-v3.ts:1117-1144`, `botnet-v3.ts:1294-1303`)
   - [ ] Add deployment validation and retry logic

5. **Create RAM reservation interface**:
   - [ ] Calculate current repboost RAM usage
   - [ ] Provide RAM reservation for HWGW system
   - [ ] Add allocation change detection

**Validation**:
- [ ] Faction detection works identically
- [ ] Share allocation produces same results
- [ ] Repboost system operates identically
- [ ] RAM reservations integrate correctly

### Task 3.4: Create Status Monitoring System Module
**Estimated Time**: 60 minutes
**Dependencies**: Task 3.1, Task 3.2, Task 3.3
**Risk Level**: Medium

**Objective**: Extract status reporting and performance tracking

**Sub-tasks**:
1. **Create StatusMonitoringSystem class**:
   ```typescript
   class StatusMonitoringSystem {
     private startTime: number = Date.now();
     private totalBatchCycles: number = 0;
     
     updatePerformanceMetrics(executionResults: IExecutionResults): void;
     generateStatusReport(ns: NS, servers: ServerData[], systemState: BotnetSystemState, options: BotnetOptions): void;
     printDebugInfo(message: string, data?: any, enabled: boolean): void;
   }
   ```

2. **Extract status reporting logic**:
   - [ ] Extract `printStatus()` function (`botnet-v3.ts:1466-1601`)
   - [ ] Break down into focused status sections
   - [ ] Preserve status formatting and display

3. **Create performance tracking**:
   - [ ] Extract performance metrics tracking
   - [ ] Add batch cycle counting
   - [ ] Create uptime and efficiency calculations

4. **Centralize debug output**:
   - [ ] Extract debug output patterns
   - [ ] Create unified debug interface
   - [ ] Add conditional debug output management

**Validation**:
- [ ] Status output matches original format exactly
- [ ] Performance metrics remain accurate
- [ ] Debug output functions correctly

## Phase 4: Main Function Orchestration

### Task 4.1: Simplify Main Function Control Flow
**Estimated Time**: 75 minutes
**Dependencies**: Task 3.1, Task 3.2, Task 3.3, Task 3.4
**Risk Level**: High

**Objective**: Reduce main function to under 100 lines with clear orchestration

**Sub-tasks**:
1. **Create system initialization**:
   - [ ] Extract option parsing and validation
   - [ ] Create system component instantiation
   - [ ] Add configuration merging and validation

2. **Extract main execution phases**:
   - [ ] Phase 1: Network Discovery & Server Management
   - [ ] Phase 2: Repboost Management  
   - [ ] Phase 3: HWGW Batching
   - [ ] Phase 4: Status & Monitoring

3. **Simplify main function structure**:
   ```typescript
   export async function main(ns: NS): Promise<void> {
     // === INITIALIZATION ===
     ns.disableLog("ALL");
     const options = ns.flags(argsSchema) as unknown as BotnetOptions;
     const config = ConfigurationManager.mergeConfiguration(options);
     
     if (detectExistingInstance(ns)) return;
     
     const systems = initializeSystems(config);
     setupExitHandler(ns);
     
     // === MAIN EXECUTION LOOP ===
     do {
       await executeMainCycle(ns, systems, options);
       await runContinuousLoop(ns, systems, options);
     } while (options.repeat);
   }
   ```

4. **Extract helper functions**:
   - [ ] Extract `detectExistingInstance()` from main function (`botnet-v3.ts:985-991`)
   - [ ] Extract `setupExitHandler()` from main function (`botnet-v3.ts:997-1026`)
   - [ ] Create `initializeSystems()` for component setup
   - [ ] Create `executeMainCycle()` for initial execution

**Validation**:
- [ ] Main function under 100 lines
- [ ] All initialization logic preserved
- [ ] Exit handling works correctly
- [ ] Main flow operates identically

### Task 4.2: Extract Continuous Loop Logic
**Estimated Time**: 60 minutes
**Dependencies**: Task 4.1
**Risk Level**: Medium

**Objective**: Extract continuous operation logic into separate orchestration function

**Sub-tasks**:
1. **Create runContinuousLoop function**:
   ```typescript
   async function runContinuousLoop(
     ns: NS,
     systems: SystemComponents,
     options: BotnetOptions
   ): Promise<void> {
     while (true) {
       await ns.sleep(1000);
       ns.clearLog();
       
       await performIncrementalOperations(ns, systems, options);
       await generateStatusUpdates(ns, systems, options);
       await spawnAdditionalBatches(ns, systems, options);
       
       if (!options.repeat && !hasActiveScripts(ns)) break;
     }
   }
   ```

2. **Extract continuous operations**:
   - [ ] Extract continuous loop from main function (`botnet-v3.ts:1386-1463`)
   - [ ] Extract incremental server management
   - [ ] Extract additional batch spawning logic
   - [ ] Extract exit condition checking

3. **Create helper functions**:
   - [ ] Create `performIncrementalOperations()` for ongoing tasks
   - [ ] Create `generateStatusUpdates()` for monitoring
   - [ ] Create `spawnAdditionalBatches()` for dynamic batching
   - [ ] Create `hasActiveScripts()` for exit detection

**Validation**:
- [ ] Continuous operation maintains identical behavior
- [ ] Status update frequency preserved
- [ ] Dynamic batch spawning works correctly
- [ ] Exit conditions function properly

### Task 4.3: Create System State Management
**Estimated Time**: 45 minutes
**Dependencies**: Task 4.1, Task 4.2
**Risk Level**: Medium

**Objective**: Create unified system state management and coordination

**Sub-tasks**:
1. **Create system state interfaces**:
   ```typescript
   interface SystemComponents {
     hwgwEngine: HWGWBatchingEngine;
     serverManager: ServerManagementSystem;
     repboostManager: RepboostManagementSystem;
     statusMonitor: StatusMonitoringSystem;
   }
   
   interface SystemState {
     servers: ServerData[];
     repboostRAM: number;
     performanceMetrics: PerformanceMetrics;
   }
   ```

2. **Create state coordination functions**:
   - [ ] Create `gatherSystemState()` function
   - [ ] Create `updateSystemState()` function
   - [ ] Add state validation and consistency checks

3. **Integrate system coordination**:
   - [ ] Connect repboost RAM reservations with HWGW planning
   - [ ] Coordinate status updates across systems
   - [ ] Add system health monitoring

**Validation**:
- [ ] System coordination works seamlessly
- [ ] State consistency maintained
- [ ] Performance characteristics preserved

## Phase 5: Integration & Validation

### Task 5.1: RAM Cost Analysis and Optimization
**Estimated Time**: 60 minutes
**Dependencies**: All previous tasks
**Risk Level**: Medium

**Objective**: Validate RAM costs remain identical and optimize where needed

**Sub-tasks**:
1. **Measure current RAM usage**:
   - [ ] Baseline measurement of original `botnet-v3.ts` RAM cost
   - [ ] Document NS API call patterns and costs
   - [ ] Create RAM usage test scenarios

2. **Validate refactored RAM usage**:
   - [ ] Measure refactored `botnet-v3.ts` RAM cost
   - [ ] Compare NS API call patterns
   - [ ] Identify any RAM cost increases

3. **Optimize RAM usage**:
   - [ ] Use namespaces instead of classes where possible for utility functions
   - [ ] Minimize object creation in hot paths
   - [ ] Preserve existing NS API usage patterns

4. **Document RAM optimizations**:
   - [ ] Create RAM cost comparison report
   - [ ] Document optimization techniques used
   - [ ] Validate 25GB browser API bypass techniques preserved

**Validation**:
- [ ] RAM usage identical or improved
- [ ] NS API patterns preserved
- [ ] Browser API bypasses functional

### Task 5.2: Functionality Preservation Testing
**Estimated Time**: 90 minutes
**Dependencies**: Task 5.1
**Risk Level**: High

**Objective**: Comprehensive validation that all functionality operates identically

**Sub-tasks**:
1. **Test core HWGW functionality**:
   - [ ] Test target selection with various server states
   - [ ] Test HWGW batch calculation accuracy
   - [ ] Test batch timing coordination
   - [ ] Test execution allocation across servers

2. **Test server management**:
   - [ ] Test network discovery completeness
   - [ ] Test server rooting functionality
   - [ ] Test purchased server management
   - [ ] Test server categorization accuracy

3. **Test repboost system**:
   - [ ] Test faction work detection
   - [ ] Test share allocation calculation
   - [ ] Test repboost script deployment
   - [ ] Test RAM reservation integration

4. **Test status and monitoring**:
   - [ ] Test status output format
   - [ ] Test performance metrics accuracy
   - [ ] Test debug output functionality
   - [ ] Test continuous operation monitoring

5. **Test command-line options**:
   - [ ] Test all `--debug` functionality
   - [ ] Test `--repeat` mode operation
   - [ ] Test `--rooting` functionality
   - [ ] Test all `--repboost-*` options
   - [ ] Test server purchase options

**Validation**:
- [ ] All features work identically
- [ ] All command-line options functional
- [ ] Error handling preserved
- [ ] Performance characteristics maintained

### Task 5.3: Performance Benchmarking
**Estimated Time**: 45 minutes
**Dependencies**: Task 5.2
**Risk Level**: Medium

**Objective**: Validate execution performance matches original implementation

**Sub-tasks**:
1. **Benchmark execution timing**:
   - [ ] Measure HWGW batch calculation timing
   - [ ] Measure server discovery timing
   - [ ] Measure repboost allocation timing
   - [ ] Measure overall cycle timing

2. **Benchmark resource efficiency**:
   - [ ] Measure RAM allocation efficiency
   - [ ] Measure thread distribution accuracy
   - [ ] Measure script execution success rates
   - [ ] Measure network utilization

3. **Benchmark status reporting**:
   - [ ] Measure status update frequency
   - [ ] Measure debug output performance
   - [ ] Measure continuous operation efficiency

4. **Create performance comparison report**:
   - [ ] Document timing comparisons
   - [ ] Document efficiency metrics
   - [ ] Identify any performance improvements

**Validation**:
- [ ] Execution timing preserved or improved
- [ ] Resource efficiency maintained
- [ ] Status reporting performance consistent

### Task 5.4: Long-running Stability Testing
**Estimated Time**: 120 minutes (background testing)
**Dependencies**: Task 5.3
**Risk Level**: Medium

**Objective**: Validate continuous operation stability and memory management

**Sub-tasks**:
1. **Setup long-running test environment**:
   - [ ] Configure test environment with various server states
   - [ ] Setup monitoring for memory leaks
   - [ ] Setup performance metric collection

2. **Execute extended stability tests**:
   - [ ] Run continuous operation for 2+ hours
   - [ ] Monitor memory usage patterns
   - [ ] Monitor performance consistency
   - [ ] Monitor error rates and recovery

3. **Test edge cases and recovery**:
   - [ ] Test server purchase/upgrade scenarios
   - [ ] Test repboost activation/deactivation cycles
   - [ ] Test network topology changes
   - [ ] Test script execution failures and recovery

4. **Validate cleanup procedures**:
   - [ ] Test exit handler functionality
   - [ ] Test script cleanup completeness
   - [ ] Test resource deallocation
   - [ ] Test state persistence

**Validation**:
- [ ] Long-running operation stable
- [ ] Memory usage consistent
- [ ] Error recovery functional
- [ ] Cleanup procedures complete

## Final Integration Tasks

### Task 6.1: Code Quality and Documentation
**Estimated Time**: 45 minutes
**Dependencies**: Task 5.4
**Risk Level**: Low

**Sub-tasks**:
- [ ] Add TSDoc comments to all public interfaces
- [ ] Update main function documentation
- [ ] Add module-level documentation
- [ ] Create usage examples for new interfaces
- [ ] Update command-line option documentation

### Task 6.2: TypeScript Compilation Validation
**Estimated Time**: 30 minutes
**Dependencies**: Task 6.1
**Risk Level**: Low

**Sub-tasks**:
- [ ] Run `npx tsc --noEmit` to validate TypeScript compilation
- [ ] Fix any remaining compilation errors
- [ ] Validate strict type checking passes
- [ ] Ensure no `any` types in new code

### Task 6.3: Final Integration Testing
**Estimated Time**: 60 minutes
**Dependencies**: Task 6.2
**Risk Level**: Medium

**Sub-tasks**:
- [ ] Side-by-side comparison with original implementation
- [ ] Cross-validation of all test scenarios
- [ ] Performance regression testing
- [ ] Memory usage final validation
- [ ] Feature parity checklist completion

## Success Criteria

### Code Organization
- [ ] Main function under 100 lines (reduced from 485)
- [ ] 6 distinct modules with clear responsibilities
- [ ] Configuration centralized and type-safe
- [ ] All interfaces consolidated and well-defined

### Functional Requirements
- [ ] 100% feature parity with original implementation
- [ ] All command-line options work identically
- [ ] RAM costs identical or improved
- [ ] Performance characteristics preserved

### Quality Requirements
- [ ] TypeScript compilation succeeds with strict mode
- [ ] No functionality regressions
- [ ] Maintainable code structure
- [ ] Clear separation of concerns

### Performance Requirements
- [ ] HWGW timing coordination preserved exactly
- [ ] Resource allocation efficiency maintained
- [ ] Status update frequency consistent
- [ ] Long-running operation stability validated

## Risk Mitigation

### High-Risk Tasks
- **Task 3.1** (HWGW Engine): Critical timing coordination logic
- **Task 3.3** (Repboost System): Complex allocation and deployment logic
- **Task 4.1** (Main Function): Core orchestration logic

### Mitigation Strategies
- Incremental implementation with validation at each step
- Preserve exact algorithms during extraction
- Maintain comprehensive test coverage
- Create rollback points at each phase completion

### Validation Gates
- No progression to next task without current task validation
- Performance benchmarking at each major milestone
- Side-by-side comparison testing throughout
- Memory usage monitoring at each integration point

This task breakdown provides a structured approach to refactoring the botnet-v3.ts script while maintaining all existing functionality and performance characteristics.

## Post-Refactor Integration Task

### Task 7.1: Replace Legacy Botnet with V3 Version [P]
**Estimated Time**: 15 minutes
**Dependencies**: Task 6.3 (Final Integration Testing)
**Risk Level**: Low

**Objective**: Replace the legacy `botnet.ts` file with the refactored `botnet-v3.ts` implementation

**Sub-tasks**:
1. **Backup original botnet.ts**:
   - [ ] Create backup copy of original `botnet.ts`
   - [ ] Ensure backup is committed to version control
   - [ ] Document legacy version location

2. **Replace with refactored version**:
   - [ ] Copy refactored `botnet-v3.ts` content to `botnet.ts`
   - [ ] Update any remaining internal references or comments
   - [ ] Preserve original file header and documentation

3. **Validate replacement**:
   - [ ] Verify `botnet.ts` compiles successfully
   - [ ] Test basic functionality with `run botnet.js`
   - [ ] Confirm all command-line options work
   - [ ] Validate RAM usage matches refactored version

4. **Update documentation references**:
   - [ ] Update any documentation referring to botnet.ts structure
   - [ ] Update AGENTS.md if necessary
   - [ ] Update any related feature documentation

**Validation**:
- [ ] Legacy `botnet.ts` replaced successfully
- [ ] All functionality preserved in replacement
- [ ] Documentation updated accordingly
- [ ] No references to old implementation remain

**Rationale**: The refactored `botnet-v3.ts` represents the advanced HWGW implementation with improved maintainability. Once validated, it should replace the legacy `botnet.ts` as the primary botnet automation script, making the improvements available as the default implementation.