# Data Model: Botnet Share Enhancement

**Feature**: Botnet Share Enhancement  
**Date**: Wed Sep 10 2025  
**Context**: Entity definitions and data structures for share allocation system

## Core Entities

### ShareAllocation
**Purpose**: Represents the current share thread allocation across the botnet
**Lifecycle**: Created when faction work starts, updated during allocation changes, destroyed when faction work ends

**Properties**:
```typescript
interface ShareAllocation {
    isActive: boolean;                    // Whether share allocation is currently active
    totalThreads: number;                 // Total threads allocated across all servers
    totalRAMUsed: number;                 // Total RAM consumed by share allocation (GB)
    ramPercentage: number;                // Percentage of botnet RAM allocated to sharing (10-25%)
    estimatedReputationBonus: number;     // Calculated bonus multiplier (1.25-1.45)
    effectiveThreads: number;             // Intelligence and core-adjusted thread count
    allocationTimestamp: number;          // When allocation was last updated
    serverAllocations: ServerShareAllocation[]; // Per-server allocation details
}
```

**Business Rules**:
- `ramPercentage` must be between 10-25% (configurable via command line)
- `totalThreads` calculated as `totalRAMUsed / 2.4` (share script RAM cost)
- `estimatedReputationBonus` uses formula: `1 + Math.log(effectiveThreads) / 25`
- `effectiveThreads` incorporates intelligence and CPU core bonuses
- `isActive` automatically set based on faction work detection

**Data Sources**:
- RAM percentage from command-line configuration
- Thread calculations from botnet server discovery
- Reputation bonus from mathematical formula
- Server allocations from optimization algorithm

---

### FactionWorkStatus
**Purpose**: Tracks the current faction work state and detection reliability
**Lifecycle**: Continuously updated during botnet execution cycles

**Properties**:
```typescript
interface FactionWorkStatus {
    isWorkingForFaction: boolean;         // Current faction work state
    detectedFactionName: string | null;   // Name of faction being worked for
    lastDetectionTime: number;            // Timestamp of last detection attempt
    detectionMethod: 'dom-text' | 'manual'; // How faction work was detected
    workDuration: number;                 // Milliseconds since faction work started
    consecutiveDetections: number;        // Count of consecutive positive detections
    lastStatusChange: number;             // When faction status last changed
}
```

**Business Rules**:
- `consecutiveDetections` >= 2 required before triggering share allocation
- `detectionMethod` always 'dom-text' for zero-cost detection
- `workDuration` resets to 0 when `isWorkingForFaction` changes to true
- `detectedFactionName` extracted from "Working for [FactionName]" text
- Status changes logged for debugging and performance analysis

**Data Sources**:
- DOM text scanning for "Working for " pattern
- Timestamp tracking for duration calculations
- Game interface text extraction for faction name

---

### ServerShareAllocation
**Purpose**: Details of share thread allocation for a specific server
**Lifecycle**: Created during share allocation, updated if reallocation occurs, destroyed when sharing ends

**Properties**:
```typescript
interface ServerShareAllocation {
    hostname: string;                     // Server identifier
    cpuCores: number;                     // Number of CPU cores on server
    coreBonus: number;                    // Effectiveness multiplier from cores (1 + (cores-1)/16)
    allocatedThreads: number;             // Number of share threads assigned
    allocatedRAM: number;                 // RAM consumed by share threads (GB)
    effectiveThreads: number;             // Core-adjusted thread effectiveness
    scriptPID: number | null;             // Process ID of running share script
    allocationPriority: number;           // Priority ranking for allocation (higher = better)
    deploymentStatus: 'pending' | 'active' | 'failed'; // Current deployment state
    lastAllocationTime: number;           // When threads were last allocated
}
```

**Business Rules**:
- `coreBonus` calculated as `1 + (cpuCores - 1) / 16`
- `effectiveThreads` = `allocatedThreads * coreBonus * intelligenceBonus`
- `allocationPriority` based on `coreBonus` and available RAM
- `allocatedRAM` = `allocatedThreads * 2.4` (share script RAM cost)
- `scriptPID` null until share script successfully deployed
- Servers with `cpuCores >= 4` get higher priority

**Data Sources**:
- Server data from NS API (ns.getServer())
- Thread allocation from optimization algorithm
- Process tracking from ns.exec() and ns.ps()
- Priority calculation from core count analysis

---

### SharePerformanceMetrics
**Purpose**: Real-time performance tracking and optimization data
**Lifecycle**: Continuously updated during share allocation, persisted for analysis

**Properties**:
```typescript
interface SharePerformanceMetrics {
    totalServersUsed: number;             // Count of servers with active share allocation
    averageThreadsPerServer: number;      // Mean thread distribution
    totalEffectiveThreads: number;        // Sum of all effective threads across network
    networkCoreBonus: number;             // Weighted average core bonus across servers
    intelligenceBonus: number;            // Current player intelligence bonus
    actualReputationBonus: number;        // Live calculation of reputation multiplier
    allocationEfficiency: number;         // Percentage of optimal theoretical allocation
    ramUtilizationRate: number;           // Percentage of available botnet RAM used
    deploymentSuccessRate: number;        // Percentage of successful script deployments
    averageAllocationTime: number;        // Mean time to deploy share allocation (ms)
}
```

**Business Rules**:
- `totalEffectiveThreads` used for final reputation bonus calculation
- `allocationEfficiency` compares actual vs theoretical optimal allocation
- `deploymentSuccessRate` tracks script deployment reliability
- `intelligenceBonus` = `1 + (2 * intelligence^0.8) / 600`
- `actualReputationBonus` = `1 + Math.log(totalEffectiveThreads) / 25`
- Metrics updated every allocation cycle for real-time monitoring

**Data Sources**:
- Aggregation from ServerShareAllocation entities
- Player intelligence from NS API
- Mathematical calculations from share formulas
- Performance timing from allocation operations

---

### ShareConfiguration
**Purpose**: User-configurable settings for share allocation behavior
**Lifecycle**: Set from command-line arguments, persists for script execution duration

**Properties**:
```typescript
interface ShareConfiguration {
    enabled: boolean;                     // Whether share functionality is active
    ramPercentage: number;                // Percentage of botnet RAM to allocate (10-25%)
    minimumThreads: number;               // Minimum threads required to activate sharing
    maximumThreads: number;               // Maximum threads to prevent over-allocation
    priorityCoreThreshold: number;        // Minimum cores for high-priority servers (default: 4)
    detectionStabilityDelay: number;      // MS to wait before acting on faction detection
    intelligenceOptimization: boolean;    // Whether to adjust allocation based on intelligence
    debugLogging: boolean;                // Enable detailed share allocation logging
}
```

**Business Rules**:
- `ramPercentage` constrained to 10-25% range for balance
- `minimumThreads` prevents activation with insufficient resources
- `maximumThreads` prevents excessive allocation impacting money farming
- `detectionStabilityDelay` prevents rapid on/off switching (default: 5000ms)
- `intelligenceOptimization` enables dynamic percentage adjustment
- Configuration validated on startup with fallback to defaults

**Data Sources**:
- Command-line arguments parsing
- Default value definitions
- Runtime validation and constraint enforcement

---

## Entity Relationships

### Primary Relationships
```
ShareConfiguration (1) ──> (1) ShareAllocation
ShareAllocation (1) ──> (0..*) ServerShareAllocation  
ShareAllocation (1) ──> (1) SharePerformanceMetrics
FactionWorkStatus (1) ──triggers──> (0..1) ShareAllocation
ServerShareAllocation (0..*) ──aggregates──> (1) SharePerformanceMetrics
```

### Data Flow
1. **FactionWorkStatus** continuously monitors for faction work
2. **ShareConfiguration** provides allocation parameters
3. **ShareAllocation** coordinates thread distribution when faction work detected
4. **ServerShareAllocation** tracks per-server deployment details
5. **SharePerformanceMetrics** aggregates real-time performance data

### State Transitions
- **Inactive → Active**: FactionWorkStatus detects faction work → ShareAllocation created
- **Active → Reallocation**: Server RAM changes → ServerShareAllocation updated  
- **Active → Inactive**: Faction work ends → ShareAllocation destroyed
- **Deployment States**: pending → active (success) or failed (retry/skip)

---

## Data Validation Rules

### Input Validation
- **RAM Percentage**: 10% ≤ ramPercentage ≤ 25%
- **Thread Counts**: 0 ≤ allocatedThreads ≤ (serverRAM / 2.4)
- **Core Counts**: cpuCores ≥ 1 (from NS API)
- **Timestamps**: All timestamps > 0 and ≤ Date.now()
- **Process IDs**: scriptPID null or valid positive integer

### Business Logic Validation
- **Effective Threads**: effectiveThreads = allocatedThreads * coreBonus * intelligenceBonus
- **RAM Accounting**: Sum of allocatedRAM ≤ total available botnet RAM * ramPercentage
- **Bonus Calculation**: reputationBonus = 1 + Math.log(totalEffectiveThreads) / 25
- **Priority Ordering**: Servers with higher coreBonus get allocation preference
- **State Consistency**: deploymentStatus 'active' requires valid scriptPID

### Performance Constraints
- **Allocation Time**: averageAllocationTime < 10000ms (10 second target)
- **Success Rate**: deploymentSuccessRate > 80% for reliable operation
- **RAM Efficiency**: ramUtilizationRate close to configured ramPercentage
- **Thread Distribution**: No single server allocated >50% of total threads
- **Detection Latency**: lastDetectionTime within 5000ms for responsiveness

---

## Storage Considerations

### In-Memory Storage (Runtime Only)
All entities stored in memory during script execution - no persistent storage required per Bitburner automation patterns. Data refreshed each execution cycle from NS API.

### Data Refresh Strategy
- **FactionWorkStatus**: Updated every execution cycle (DOM scanning)
- **ShareAllocation**: Updated when faction status changes or RAM availability changes
- **ServerShareAllocation**: Updated when server data changes or reallocation occurs
- **SharePerformanceMetrics**: Updated after each allocation operation
- **ShareConfiguration**: Set once at startup, immutable during execution

### Memory Optimization
- Entities instantiated only when needed (lazy allocation)
- Server arrays filtered before processing to minimize iterations
- Aggregations calculated incrementally rather than full recalculation
- Cleanup of inactive ServerShareAllocation entities when sharing disabled

---

*Data model designed for zero-persistence Bitburner automation with efficient NS API integration*