# Botnet Management System - Technical Implementation Plan

**Feature**: Botnet Management System  
**Created**: 2025-09-10  
**Last Updated**: 2025-09-12  
**Status**: V3 Implemented with Target Scaling Complete  

## Implementation Overview

The Botnet Management System provides comprehensive automation for the entire botnet lifecycle in Bitburner, from server discovery and compromise to sophisticated HWGW attack coordination. The system has evolved through multiple versions with V3 representing the current state-of-the-art implementation.

## Current V3 Architecture Status

### **Single-Controller Multi-Server Distribution (OPTIMAL)**
- **Main Controller**: `src/botnet-v3.ts` runs on `home` server only
- **Remote Execution**: Distributes HWGW operations across entire botnet
- **Event-Driven Coordination**: Centralized batch tracking with real-time performance monitoring
- **Target**: `foodnstuff` (optimal server identified via target evaluation)
- **Performance**: 50x improvement over n00dles (~$50K-$68K per batch vs ~$1.3K)

### **Target Scaling Results (COMPLETE)**
✅ **Successfully Implemented**:
- Target evaluation system analyzed 32 hackable servers
- Identified `foodnstuff` as optimal target (projected $4.7B/hour vs n00dles $2.4B/hour)  
- Fixed critical RAM issues with optimized thread ratios
- Achieved 100% batch success rate with 0.0-0.4s completion times
- Live performance: $106M+ income increase in minutes

### **Architecture Decision: Why Single-Target-Single-Controller**
**Confirmed Optimal Approach**:
1. **Resource Efficiency**: One controller optimally allocates ALL botnet RAM
2. **No Resource Conflicts**: Single decision maker prevents server competition
3. **Simpler Coordination**: Centralized state management and event handling
4. **Better Performance**: No overhead from multiple competing controllers
5. **Proven Results**: Current architecture delivering exceptional performance

## V3 Technical Architecture Details

### **Event-Driven Coordination System**
```typescript
// V3 Controller manages entire botnet from single location
class BotnetV3Controller {
  // Centralized batch tracking with real-time performance metrics
  private activeBatches = new Map<string, BatchTracker>();
  private serverPerformance = new Map<string, ServerPerformance>();
  private targetPerformance = new Map<string, TargetPerformance>();
  
  // Single target focus with optimal resource allocation
  private config: V3Config = {
    targetServer: 'foodnstuff',    // Optimal target identified
    batchSize: 20,                 // RAM-optimized batch size
    maxActiveBatches: 50,          // High throughput capacity
    eventPort: 9999                // Event coordination port
  };
}
```

### **Distributed Execution Pattern**
```typescript
// Controller finds best server with sufficient RAM
const server = servers.find(s => s.availableRam >= totalRamNeeded);

// Launches coordinated HWGW batch across botnet
const hackPid = ns.exec('remote/hk.js', server.hostname, batchSize, target, timing);
const growPid = ns.exec('remote/gr.js', server.hostname, batchSize * 3, target, timing);
const weaken1Pid = ns.exec('remote/wk.js', server.hostname, weakenThreads1, target, timing);
const weaken2Pid = ns.exec('remote/wk.js', server.hostname, weakenThreads2, target, timing);
```

### **Optimized Thread Ratios (Fixed RAM Issues)**
```typescript
// RAM-efficient thread allocation for foodnstuff
const hackThreads = batchSize;              // 20 threads
const growThreads = batchSize * 3;          // 60 threads (3x multiplier)
const weaken1Threads = batchSize * 0.1;     // 2 threads (hack weaken)
const weaken2Threads = batchSize * 0.2;     // 4 threads (grow weaken)
// Total per batch: ~150GB (manageable across botnet)
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

## Current Performance Results

### **Target Scaling Success Metrics**
- **Previous Performance**: n00dles target ~$1.3K per batch
- **Current Performance**: foodnstuff target $37K-$68K per batch (**50x improvement**)
- **Batch Success Rate**: 100% (0 failures detected)
- **Completion Times**: 0.0-0.4 seconds (optimal timing coordination)
- **Live Income Increase**: $16.932B → $17.038B (+$106M in minutes)

### **System Health Indicators**
- **Resource Utilization**: Optimal RAM allocation across entire botnet
- **Event Processing**: Real-time batch completion tracking
- **Server Distribution**: Intelligent server selection based on available RAM
- **Thread Coordination**: Precise HWGW timing with no conflicts

## Future Development Strategy

### **Confirmed Optimal Architecture**
✅ **KEEP**: Single-controller distributing to multiple servers  
❌ **AVOID**: Multiple controllers competing for same resources  
❌ **AVOID**: Multi-target splitting (reduces per-target optimization)  

### **CRITICAL MISSING COMPONENT: Server Preparation**
🎯 **HIGH PRIORITY**: Complete target preparation system to optimize servers before farming:

**Current Limitation**: Only targeting servers in their "natural" state
**Solution Needed**: Automated server preparation pipeline

```typescript
// Target Selection Should Evaluate Prepared Potential:
const maxMoney = ns.getServerMaxMoney(target);           // Not current money
const minSecurity = ns.getServerMinSecurityLevel(target); // Not current security
const hackLevel = ns.getServerRequiredHackingLevel(target);
const hasRoot = ns.hasRootAccess(target);               // Critical requirement

// Complete Preparation Requirements:
if (!hasRoot) {
  // Root the server using available exploit tools + nuke
  performServerRooting(ns, target);
}
if (currentSecurity > minSecurity) {
  // Run weaken scripts until optimal
}
if (currentMoney < maxMoney) {
  // Run grow scripts until optimal  
}
```

### **Next Evolution Priorities**
1. **🔥 Server Preparation System**: 
   - **Root Access**: Automated rooting using exploit tools (brutessh, ftpcrack, etc.) + nuke
   - **Security Optimization**: Dedicated prep scripts to weaken servers to min security
   - **Money Optimization**: Grow scripts to bring servers to max money
   - **Multi-target prep**: Pipeline system while farming current optimal target
   - **Dramatically expands targeting options and profitability**

2. **Enhanced Target Evaluation**: 
   - Evaluate servers by **prepared potential** not current state
   - Target selection based on: hack level requirement, max money, min security, **rootable status**
   - No artificial distinction between server "types" - all servers evaluated equally
   - Account for exploit tool requirements and port accessibility

3. **Advanced Resource Allocation**:
   - Split botnet resources: 70% farming optimal target, 30% preparing next targets
   - Pipeline approach: Always have 2-3 high-value servers being prepared
   - Dynamic switching when prepared targets become more profitable

4. **Sophisticated Batch Optimization**: More advanced thread ratio calculations and timing

### **Implementation Approach**

**Phase 1: Server Preparation Scripts**
- **Distributed Rooting**: Create `remote/root.ts` script for parallel rooting operations
  - Lightweight script that can be executed on any server with available RAM
  - Check available exploit tools: `ns.fileExists('BruteSSH.exe')`, etc.
  - Determine port requirements: `ns.getServerNumPortsRequired()`
  - Execute rooting sequence: brutessh → ftpcrack → relaysmtp → httpworm → sqlinject → nuke
  - Return success/failure status for coordination
- **Security Prep**: Create dedicated `server-prep.ts` script to weaken to min security
- **Money Prep**: Grow scripts to bring servers to max money
- **Resource allocation**: 70% current target farming, 30% target preparation

**Remote Script Architecture**:
```typescript
// remote/root.ts - Distributed rooting execution
export async function main(ns: NS) {
  const targetServer = ns.args[0] as string;
  
  // Check if already rooted
  if (ns.hasRootAccess(targetServer)) {
    return "already-rooted";
  }
  
  // Execute rooting sequence based on available tools
  const portsRequired = ns.getServerNumPortsRequired(targetServer);
  let portsOpened = 0;
  
  if (ns.fileExists('BruteSSH.exe') && portsOpened < portsRequired) {
    ns.brutessh(targetServer);
    portsOpened++;
  }
  // ... additional exploit tools
  
  if (portsOpened >= portsRequired) {
    ns.nuke(targetServer);
    return "success";
  }
  
  return "insufficient-tools";
}
```

**Controller Integration**:
```typescript
// Execute rooting across available botnet servers
const rootingTasks = unrootedServers.map(target => ({
  server: findBestServerForTask(),
  target: target,
  script: 'remote/root.js'
}));

// Parallel rooting execution
for (const task of rootingTasks) {
  ns.exec('remote/root.js', task.server, 1, task.target);
}
```

**Phase 2: Enhanced Target Evaluation**  
- **Rootability Check**: Evaluate if server can be rooted with available exploit tools
- **Prepared Potential**: Modify `target-evaluator.ts` to evaluate by optimal state
- **Complete Metrics**: `requiredHackingLevel`, `maxMoney`, `minSecurityLevel`, `portsRequired`, `hasRoot`
- Remove artificial server categorization - all servers evaluated equally

**Phase 3: Pipeline Target Management**
- Maintain queue of 2-3 high-value servers in preparation
- Switch to prepared targets when they become more profitable
- Continuous preparation cycle for optimal target rotation

### **Expected Impact**
- **Targeting Pool**: Dramatically expands viable target options
- **Profitability**: Servers at optimal state vs degraded natural state  
- **Scalability**: Always have next high-value target ready
- **Resource Efficiency**: Maximize money extraction from every server

**Current Baseline**: `foodnstuff` $50K+ per batch with natural state optimization
**Prepared Target Potential**: Same servers could yield 2-5x more when optimally prepared

This technical implementation plan now reflects the current V3 architecture status with target scaling complete. The single-controller multi-server distribution pattern has proven optimal, delivering exceptional performance improvements while maintaining system stability and resource efficiency.