# Data Model: Simple Autonomous Botnet

**Feature**: Simple Autonomous Botnet | **Date**: September 14, 2025  
**Design Phase**: Phase 1 - Entity Definitions and Data Structures

## Overview
This document defines the in-memory data structures for the simple autonomous botnet script. All data is gathered fresh from the NS API each execution cycle, with no persistent storage requirements.

## Core Entities

### ServerInfo
Represents discovered servers in the network with their current state and capabilities.

```typescript
interface ServerInfo {
  hostname: string;                    // Server identifier
  hasAdminRights: boolean;            // Whether server is rooted
  requiredHackingSkill: number;       // Hacking level needed to hack
  minDifficulty: number;              // Base security level
  difficulty: number;                 // Current security level  
  moneyMax: number;                   // Maximum money capacity
  moneyAvailable: number;             // Current money amount
  maxRam: number;                     // Total RAM capacity
  usedRam: number;                    // Currently used RAM
  purchasedByPlayer: boolean;         // Whether player owns server
  backdoorInstalled: boolean;         // Whether backdoor is installed
  requiredPortCount: number;          // Ports needed to nuke
  openPortCount: number;              // Currently open ports
}
```

**Data Source**: `ns.getServer(hostname)` for each discovered server
**Update Frequency**: Every execution cycle (stateless)
**Relationships**: Used by TargetServer and BotnetServer selection

### TargetServer  
Represents servers selected for HWGW operations based on profitability analysis.

```typescript  
interface TargetServer {
  hostname: string;                   // Server identifier
  profitabilityScore: number;         // Calculated profit potential
  maxMoneyPerSecond: number;          // Theoretical maximum income rate
  currentPreparation: {               // Current server state vs optimal
    securityDelta: number;            // Security above minimum
    moneyRatio: number;               // Money as ratio of maximum
    needsPreparation: boolean;        // Whether prep is required
  };
  hackingMetrics: {                   // HWGW timing and thread data
    hackTime: number;                 // Time for hack operation (ms)
    growTime: number;                 // Time for grow operation (ms) 
    weakenTime: number;               // Time for weaken operation (ms)
    hackThreadsFor50Percent: number;  // Threads to hack 50% money
    growThreadsToDouble: number;      // Threads to double money
    weakenThreadsForHack: number;     // Threads to counter hack security
    weakenThreadsForGrow: number;     // Threads to counter grow security
  };
}
```

**Data Source**: Derived from ServerInfo + NS timing/analysis functions
**Update Frequency**: Every target evaluation cycle
**Relationships**: Primary entity for HWGW batch planning

### BotnetServer
Represents rooted servers available for executing HWGW operations (excluding current targets).

```typescript
interface BotnetServer {
  hostname: string;                   // Server identifier
  availableRam: number;               // RAM available for operations
  maxThreads: {                       // Maximum threads per operation type
    hack: number;                     // Max hack threads (1.7GB each)
    grow: number;                     // Max grow threads (1.75GB each) 
    weaken: number;                   // Max weaken threads (1.75GB each)
  };
  currentUtilization: number;         // Percentage of RAM currently used
  isReliable: boolean;                // Whether server is stable for operations
  priority: number;                   // Usage priority (higher RAM = higher priority)
}
```

**Data Source**: Filtered ServerInfo + RAM calculations  
**Update Frequency**: Before each batch execution
**Relationships**: Used for distributing HWGW operations

### OperationBatch
Represents a coordinated HWGW cycle with timing and resource allocation.

```typescript
interface OperationBatch {
  batchId: string;                    // Unique batch identifier
  targetHostname: string;             // Target server for operations
  startTime: number;                  // Batch start time (Date.now())
  operations: {                       // Individual operation details
    hack: {
      threads: number;                // Threads allocated
      servers: string[];              // Servers executing hack
      startDelay: number;             // Delay before hack starts (ms)
      expectedDuration: number;       // Expected completion time (ms)
    };
    grow: {
      threads: number;
      servers: string[];
      startDelay: number; 
      expectedDuration: number;
    };
    weakenHack: {                     // Weaken to counter hack security
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number; 
    };
    weakenGrow: {                     // Weaken to counter grow security
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number;
    };
  };
  expectedCompletion: number;         // When batch should complete
  status: 'planned' | 'executing' | 'completed' | 'failed';
}
```

**Data Source**: Calculated from TargetServer + BotnetServer allocation
**Update Frequency**: Created per batch, tracked during execution
**Relationships**: Links TargetServer with BotnetServer execution

## Supporting Data Structures

### NetworkState  
Overall network status gathered from NS API each cycle.

```typescript
interface NetworkState {
  discoveredServers: Map<string, ServerInfo>;  // All known servers
  playerHackingLevel: number;                   // Current player skill
  totalNetworkServers: number;                  // Count of discovered servers
  rootedServers: number;                        // Count of rooted servers  
  lastUpdateTime: number;                       // When state was gathered
}
```

### BotnetState
Current operational state of the botnet system.

```typescript  
interface BotnetState {
  targets: TargetServer[];                      // Currently selected targets
  botnetServers: BotnetServer[];               // Available execution servers
  activeBatches: Map<string, OperationBatch>;  // Running operations
  totalBotnetRam: number;                       // Combined available RAM
  currentTargetHostname: string | null;        // Primary target
  lastCycleTime: number;                        // Previous cycle completion
  isOperational: boolean;                       // Whether system is ready
}
```

## Data Flow Patterns

### Discovery → Analysis → Execution Flow
1. **Network Discovery**: `ns.scan()` → `ServerInfo[]` in `NetworkState`
2. **Server Analysis**: `ServerInfo[]` → filter/score → `TargetServer[]` 
3. **Resource Planning**: `TargetServer + BotnetServer[]` → `OperationBatch`
4. **Execution**: `OperationBatch` → `ns.exec()` calls across botnet
5. **Status Tracking**: Monitor batch completion, update state

### State Management Strategy
- **Stateless Design**: Rediscover network state each execution cycle
- **In-Memory Only**: All data structures exist only during script execution  
- **Fresh Data**: Always query NS API for current server states
- **No Persistence**: Script restart = complete state rediscovery

## Memory Efficiency Considerations

### Data Structure Sizes
- `ServerInfo`: ~200 bytes per server × 200 servers = ~40KB
- `TargetServer`: ~300 bytes per target × 5 targets = ~1.5KB  
- `BotnetServer`: ~150 bytes per server × 50 servers = ~7.5KB
- `OperationBatch`: ~500 bytes per batch × 10 batches = ~5KB
- **Total Data**: ~55KB (negligible compared to 8GB script budget)

### Update Strategies  
- **Full Refresh**: Complete network rediscovery every ~60 seconds
- **Incremental Updates**: Server state updates every ~10 seconds
- **Batch Tracking**: Operation status checks every ~5 seconds
- **Adaptive Timing**: Faster updates during active operations

## Validation Rules

### Data Integrity
- ServerInfo must have valid hostname and numeric values
- TargetServer profitabilityScore must be > 0
- BotnetServer availableRam must be ≥ 1.7GB for operations
- OperationBatch timing calculations must be positive

### Business Logic
- Never target player-owned servers
- Only target servers with hasAdminRights = true
- Ensure sufficient player hacking level for target access
- Prevent botnet servers from targeting themselves

### Resource Constraints
- Total botnet RAM allocation must not exceed available capacity
- Thread calculations must result in integer values ≥ 1
- Operation timing must prevent overlapping security increases
- Batch execution must respect server RAM limits

---

**Summary**: Simple in-memory data structures support the linear execution flow of network discovery → target selection → batch coordination → execution. All data is gathered fresh from NS API each cycle, ensuring stateless operation and automatic adaptation to changing game conditions.

**Ready for**: Service contracts definition and quickstart scenarios