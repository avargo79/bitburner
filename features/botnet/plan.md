# Botnet Management System - Technical Implementation Plan

**Feature**: Botnet Management System  
**Created**: 2025-09-10  
**Status**: Implemented (Existing Feature)  

## Implementation Overview

The Botnet Management System provides comprehensive automation for the entire botnet lifecycle in Bitburner, from server discovery and compromise to sophisticated HWGW attack coordination. The system is implemented as a single standalone script that operates autonomously across the entire network.

## Architecture Design

### **Single-File Standalone Architecture**
The botnet system follows the established pattern of self-contained scripts:
- **File**: `src/botnet.ts` (~600 lines)
- **Pattern**: Single main(ns) function with complete functionality
- **Dependencies**: None (all interfaces and utilities inline)
- **RAM Cost**: Variable based on operations and thread allocation

### **Core Components Structure**

```typescript
// =============================================================================
// BOTNET.TS - Complete Botnet Lifecycle Automation
// =============================================================================

// SECTION 1: Interfaces and Types (Lines 1-100)
// SECTION 2: Network Discovery and Utilities (Lines 101-200)  
// SECTION 3: Server Management and Rooting (Lines 201-300)
// SECTION 4: HWGW Batch Calculation and Timing (Lines 301-450)
// SECTION 5: Thread Allocation and Execution (Lines 451-550)
// SECTION 6: Main Control Loop and Statistics (Lines 551-600)
```

## Key Implementation Patterns

### **1. Network Discovery System**
```typescript
function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    // Recursive network scanning
    // Breadth-first traversal of entire network
    // Returns complete server list for botnet operations
}

function buildServerData(ns: NS): ServerData[] {
    // Gather comprehensive server information
    // Security levels, money capacity, hack requirements
    // RAM availability and current usage
}
```

### **2. Automated Server Rooting**
```typescript
function performServerRooting(ns: NS, servers: ServerData[]): number {
    // Automatic exploit tool usage
    // Sequential application: brutessh, ftpcrack, relaysmtp, httpworm, sqlinject
    // Nuke execution for root access
    // Port requirement validation
}
```

### **3. Dynamic Server Purchasing**
```typescript
function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number) {
    // Automatic server purchase up to configured limits
    // RAM upgrade optimization based on available funds
    // Cost-benefit analysis for server investments
}
```

### **4. Advanced HWGW Batching**
```typescript
interface IHWGWBatch {
    target: ServerData;
    hackThreads: number;
    weaken1Threads: number;
    growThreads: number;
    weaken2Threads: number;
    totalThreads: number;
    hackStartDelay: number;
    weaken1StartDelay: number;
    growStartDelay: number;
    weaken2StartDelay: number;
}
```

**HWGW Timing Coordination**:
- **Hack**: Steals 50% of server money, increases security
- **Weaken1**: Reduces security from hack operation
- **Grow**: Restores money to maximum, increases security  
- **Weaken2**: Reduces security from grow operation

**Precise Timing Relationships**:
```typescript
const hackTime = ns.getHackTime(target);
const growTime = hackTime * 3.2;    // Exactly 3.2x hack time
const weakenTime = hackTime * 4.0;   // Exactly 4x hack time
```

## Resource Management Strategy

### **Multi-Server Thread Allocation**
```typescript
function allocateThreadsOptimally(
    batchThreads: IHWGWBatch,
    availableServers: ServerData[]
): ThreadAllocation[] {
    // Distribute threads across available RAM
    // Prioritize servers by available capacity
    // Handle thread splitting across multiple servers
}
```

### **RAM Optimization Patterns**
- **Script RAM Costs**: hack(1.7GB), weaken(1.75GB), grow(1.75GB)
- **Thread Padding**: 10% safety margin for state prediction errors
- **Dynamic Allocation**: Adapt to changing server availability

### **Target Selection Algorithm**
```typescript
function calculateTargetProfitability(server: ServerData, playerLevel: number): number {
    // Money per second calculation
    // RAM efficiency analysis
    // Risk assessment based on hack success probability
}
```

## Configuration System

### **Command-Line Options**
```typescript
const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],           // Enable detailed debug output
    ['repeat', true],           // Run continuously vs single batch
    ['rooting', true],          // Enable automatic server rooting
    ['max-servers', 25],        // Maximum purchased servers
    ['target-ram-power', 13],   // Target RAM power (2^13 = 8GB)
];
```

### **Adaptive Behavior**
- **Skill Scaling**: Automatically discovers new servers as hacking skill increases
- **Resource Scaling**: Purchases servers when beneficial for income
- **Performance Monitoring**: Tracks success rates and adjusts strategies

## Execution Flow Design

### **Main Control Loop**
```typescript
do {
    // PHASE 1: Server Management
    if (options.rooting) {
        performServerRooting(ns, servers);
    }
    managePurchasedServers(ns, servers, maxServers, targetRamPower);
    
    // PHASE 2: Target Analysis
    const targets = findBestTargets(servers, playerHackLevel);
    
    // PHASE 3: HWGW Coordination
    for (const target of targets) {
        const batch = calculateHWGWBatch(target, availableRAM);
        executeHWGWBatch(ns, batch, botnetServers);
    }
    
    // PHASE 4: Monitoring and Statistics
    updatePerformanceMetrics();
    await ns.sleep(30000); // 30-second cycle
} while (options.repeat);
```

### **Error Handling and Recovery**
- **Script Failure Detection**: Monitor PIDs and restart failed operations
- **State Corruption Recovery**: Detect and correct server money/security issues
- **Resource Exhaustion**: Gracefully handle RAM limits and thread failures

## Performance Characteristics

### **Scalability Metrics**
- **Network Size**: Handles 100+ servers efficiently
- **Concurrent Operations**: Coordinates multiple HWGW batches simultaneously
- **Thread Distribution**: Optimally allocates 1000+ threads across botnet
- **Response Time**: 30-second monitoring cycles with real-time adaptation

### **Resource Efficiency**
- **RAM Usage**: Variable based on network size and thread allocation
- **CPU Impact**: Minimal due to optimized sleep cycles and batch processing
- **Memory Management**: Efficient data structures with periodic cleanup

## Integration Patterns

### **Script Coordination**
```typescript
// Cleanup on exit - kills all remote scripts
ns.atExit(() => {
    const allServers = getServerList(ns);
    for (const hostname of allServers) {
        const runningScripts = ns.ps(hostname);
        for (const script of runningScripts) {
            if (script.filename.includes('simple-')) {
                ns.scriptKill(script.filename, hostname);
            }
        }
    }
});
```

### **Remote Script Deployment**
- **simple-hack.js**: Basic hack script for HWGW batches
- **simple-weaken.js**: Security reduction for batch coordination
- **simple-grow.js**: Money restoration for optimal cycling

## Mathematical Foundation

### **Thread Calculation Algorithms**
Refer to `HWGW_ALGORITHMS.md` for complete mathematical formulas:

- **Hack Threads**: `ns.hackAnalyzeThreads(target, targetMoney * 0.5)`
- **Security Calculation**: Exact formulas for security impact and weaken requirements
- **Growth Restoration**: Precise thread calculation for money restoration
- **Timing Coordination**: Mathematical synchronization of operation completion

### **Optimization Functions**
- **Profitability Analysis**: Money per second per GB RAM
- **Resource Allocation**: Dynamic thread distribution across available servers
- **Batch Scheduling**: Optimal timing for continuous operation cycles

## Debugging and Monitoring

### **Debug Output System**
```typescript
if (options.debug) {
    ns.print(`Batch targeting ${target.hostname}:`);
    ns.print(`  Hack threads: ${batch.hackThreads}`);
    ns.print(`  Total threads: ${batch.totalThreads}`);
    ns.print(`  Expected income: $${expectedIncome}/s`);
}
```

### **Performance Tracking**
- **Success Rate Monitoring**: Track completed vs failed batches
- **Income Analysis**: Real-time money generation statistics
- **Resource Utilization**: RAM usage and thread efficiency metrics

## Configuration Recommendations

### **Optimal Settings for Different Scenarios**

**Early Game** (Limited RAM):
```bash
run botnet.js --max-servers=5 --target-ram-power=10 --debug=true
```

**Mid Game** (Moderate Resources):
```bash
run botnet.js --max-servers=15 --target-ram-power=12 --repeat=true
```

**End Game** (Maximum Efficiency):
```bash
run botnet.js --max-servers=25 --target-ram-power=15 --rooting=true
```

## Future Enhancement Opportunities

### **Potential Optimizations**
1. **Dynamic Target Selection**: Real-time profitability recalculation
2. **Batch Overlap Optimization**: More aggressive batch scheduling
3. **Resource Prediction**: Predictive server purchasing based on income trends
4. **Failure Recovery**: More sophisticated error detection and recovery

### **Integration Possibilities**
- **Task System Integration**: Coordinate with other automation scripts
- **Browser Automation**: Integrate with Navigator for UI-based operations
- **Database Persistence**: Store performance metrics and optimization data

This technical implementation provides a comprehensive foundation for understanding and enhancing the botnet system while maintaining its autonomous operation and high performance characteristics.