# HWGW Batching Algorithms - Mathematical Reference

## Overview
This document provides the mathematical foundation for HWGW (Hack-Weaken-Grow-Weaken) batching algorithms based on exact Bitburner game mechanics. All formulas are derived from source code analysis and validated against current implementation.

## Core HWGW Principles

### Operation Sequence Requirements
HWGW batches must complete operations in this exact order for optimal effectiveness:
1. **Hack** - Steals money, increases security
2. **Weaken1** - Reduces security from hack operation  
3. **Grow** - Restores money, increases security
4. **Weaken2** - Reduces security from grow operation

### Timing Synchronization Formula

```typescript
// Base timing relationships (from Bitburner source)
const hackTime = ns.getHackTime(target);
const growTime = hackTime * 3.2;    // Exactly 3.2x hack time
const weakenTime = hackTime * 4.0;   // Exactly 4x hack time

// Gap between operation completions (minimum 200ms for game processing)
const gap = 200; // milliseconds

// Calculate start times working backwards from batch deadline
const batchDeadline = Date.now() + weakenTime + safetyBuffer + (batchIndex * staggerTime);

const hackStartTime = batchDeadline - hackTime - (3 * gap);     // Finishes first
const weaken1StartTime = batchDeadline - weakenTime - (2 * gap); // Finishes second  
const growStartTime = batchDeadline - growTime - (1 * gap);      // Finishes third
const weaken2StartTime = batchDeadline - weakenTime;             // Finishes last
```

### Thread Calculation Mathematics

#### 1. Hack Thread Calculation
```typescript
// Target: Steal 50% of server's current money
const targetMoneyToHack = server.moneyAvailable * 0.5;
const baseHackThreads = ns.hackAnalyzeThreads(target, targetMoneyToHack);

// Apply safety margin for state prediction errors
const hackThreads = Math.ceil(baseHackThreads * 1.1); // 10% padding
```

#### 2. Security Impact Calculations
```typescript
// Security increases from operations (exact values from source)
const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreads, target);
const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreads, target);

// Weaken effectiveness (constant rate)
const weakenSecurityDecrease = 0.05; // Per thread, from source code

// Required weaken threads
const weaken1Threads = Math.ceil(hackSecurityIncrease / weakenSecurityDecrease);
const weaken2Threads = Math.ceil(growSecurityIncrease / weakenSecurityDecrease);
```

#### 3. Grow Thread Calculation
```typescript
// Calculate money after hack operation
const moneyAfterHack = server.moneyAvailable - targetMoneyToHack;

// Growth multiplier needed to restore full money
const growthMultiplier = server.moneyMax / Math.max(moneyAfterHack, 1);

// Base grow threads for restoration
const baseGrowThreads = ns.growthAnalyze(target, growthMultiplier);

// Apply safety margin
const growThreads = Math.ceil(baseGrowThreads * 1.1); // 10% padding
```

## Advanced Timing Validation

### Batch Timing Validation Algorithm
```typescript
function validateBatchTiming(batch: HWGWBatch): boolean {
  const scripts = batch.scripts;
  const hackScript = scripts.find(s => s.type === 'hack');
  const weaken1Script = scripts.find(s => s.type === 'weaken1');
  const growScript = scripts.find(s => s.type === 'grow');
  const weaken2Script = scripts.find(s => s.type === 'weaken2');
  
  if (!hackScript || !weaken1Script || !growScript || !weaken2Script) {
    return false; // Missing required operations
  }
  
  // Extract start times
  const hackStart = hackScript.startTime;
  const weaken1Start = weaken1Script.startTime;
  const growStart = growScript.startTime;
  const weaken2Start = weaken2Script.startTime;
  
  // Calculate finish times
  const hackFinish = hackStart + batch.target.hackData.hackTime;
  const weaken1Finish = weaken1Start + batch.target.hackData.weakenTime;
  const growFinish = growStart + batch.target.hackData.growTime;
  const weaken2Finish = weaken2Start + batch.target.hackData.weakenTime;
  
  // Validate finish order with minimum gaps
  const minGap = 50; // Minimum safe gap
  return (hackFinish + minGap <= weaken1Finish) &&
         (weaken1Finish + minGap <= growFinish) &&
         (growFinish + minGap <= weaken2Finish);
}
```

## Multi-Batch Coordination

### Batch Stagger Calculation
```typescript
// Dynamic stagger based on server characteristics
function calculateBatchStagger(target: Server): number {
  const baseStagger = 2000; // Minimum 2 seconds
  const weakenTime = target.hackData.weakenTime;
  
  // Scale with server timing for safety
  const dynamicStagger = weakenTime * 0.1; // 10% of weaken time
  
  return Math.max(baseStagger, dynamicStagger);
}
```

### Continuous Batching Algorithm
```typescript
function scheduleContinuousBatches(target: Server, maxBatches: number): HWGWBatch[] {
  const batches: HWGWBatch[] = [];
  const staggerTime = calculateBatchStagger(target);
  const currentTime = Date.now();
  
  for (let i = 0; i < maxBatches; i++) {
    const batchStartTime = currentTime + (i * staggerTime);
    const batch = createHWGWBatch(target, batchStartTime, i);
    
    if (validateBatchTiming(batch)) {
      batches.push(batch);
    } else {
      break; // Stop if timing becomes impossible
    }
  }
  
  return batches;
}
```

## Resource Allocation Mathematics

### RAM Requirement Calculation
```typescript
function calculateBatchRAMCost(batch: HWGWBatch): number {
  const scriptRAMCosts = {
    hack: 1.7,     // From your current implementation
    weaken: 1.75,  // Simple weaken script
    grow: 1.75     // Simple grow script
  };
  
  return (batch.hackThreads * scriptRAMCosts.hack) +
         (batch.weaken1Threads * scriptRAMCosts.weaken) +
         (batch.growThreads * scriptRAMCosts.grow) +
         (batch.weaken2Threads * scriptRAMCosts.weaken);
}
```

### Multi-Server Thread Allocation
```typescript
function allocateThreadsAcrossServers(
  totalThreads: number, 
  scriptType: string, 
  availableServers: Server[]
): ThreadAllocation[] {
  const allocations: ThreadAllocation[] = [];
  const scriptRAMCost = getScriptRAMCost(scriptType);
  let remainingThreads = totalThreads;
  
  for (const server of availableServers) {
    if (remainingThreads <= 0) break;
    
    const maxThreadsOnServer = Math.floor(server.availableRAM / scriptRAMCost);
    const threadsToAllocate = Math.min(remainingThreads, maxThreadsOnServer);
    
    if (threadsToAllocate > 0) {
      allocations.push({
        hostname: server.hostname,
        threads: threadsToAllocate,
        ramUsed: threadsToAllocate * scriptRAMCost
      });
      remainingThreads -= threadsToAllocate;
    }
  }
  
  return { allocations, remainingThreads };
}
```

## Optimization Algorithms

### Target Profitability Calculation
```typescript
function calculateTargetProfitability(server: Server, player: Player): number {
  const hackChance = ns.formulas.hacking.hackChance(server, player);
  const hackPercent = ns.formulas.hacking.hackPercent(server, player);
  const hackTime = ns.formulas.hacking.hackTime(server, player) / 1000; // Convert to seconds
  
  // Expected money per second
  const expectedMoney = server.moneyMax * hackPercent * hackChance;
  const moneyPerSecond = expectedMoney / hackTime;
  
  // Account for thread costs
  const baseHackThreads = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * 0.5);
  const totalThreads = calculateTotalBatchThreads(server, baseHackThreads);
  const ramRequired = totalThreads * 1.75; // Average script RAM cost
  
  // Profitability: money per second per GB of RAM
  return moneyPerSecond / ramRequired;
}
```

### Adaptive Thread Scaling
```typescript
function calculateAdaptiveThreads(
  server: Server, 
  availableRAM: number, 
  targetEfficiency: number
): BatchThreadCounts {
  const maxPossibleThreads = Math.floor(availableRAM / (4 * 1.75)); // 4 operations avg
  
  // Binary search for optimal thread count
  let low = 1;
  let high = maxPossibleThreads;
  let bestThreads = 1;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const batch = calculateBatchWithThreads(server, mid);
    const efficiency = calculateBatchEfficiency(batch);
    
    if (efficiency >= targetEfficiency) {
      bestThreads = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return calculateFinalBatchThreads(server, bestThreads);
}
```

## Performance Metrics

### Batch Success Rate Calculation
```typescript
function calculateBatchSuccessMetrics(completedBatches: HWGWBatch[]): BatchMetrics {
  let successfulBatches = 0;
  let totalMoneyEarned = 0;
  let totalTimeSpent = 0;
  
  for (const batch of completedBatches) {
    const allOperationsCompleted = batch.scripts.every(script => script.completed);
    const correctSequence = validateCompletionOrder(batch);
    
    if (allOperationsCompleted && correctSequence) {
      successfulBatches++;
      totalMoneyEarned += batch.expectedMoney;
    }
    
    totalTimeSpent += batch.totalDuration;
  }
  
  return {
    successRate: successfulBatches / completedBatches.length,
    averageMoneyPerSecond: totalMoneyEarned / (totalTimeSpent / 1000),
    batchEfficiency: successfulBatches / completedBatches.length
  };
}
```

## Error Handling & Recovery

### Batch Failure Detection
```typescript
function detectBatchFailures(runningBatches: HWGWBatch[]): FailedBatch[] {
  const failedBatches: FailedBatch[] = [];
  const currentTime = Date.now();
  
  for (const batch of runningBatches) {
    // Check for timing violations
    if (batch.expectedCompletionTime + 5000 < currentTime) {
      failedBatches.push({
        batch,
        reason: 'timeout',
        detectedAt: currentTime
      });
      continue;
    }
    
    // Check for script failures
    const failedScripts = batch.scripts.filter(s => s.pid === 0 || !isScriptRunning(s.pid));
    if (failedScripts.length > 0) {
      failedBatches.push({
        batch,
        reason: 'script_failure',
        failedScripts,
        detectedAt: currentTime
      });
    }
  }
  
  return failedBatches;
}
```

### State Recovery Algorithm
```typescript
function recoverFromBatchFailure(failedBatch: FailedBatch, target: Server): RecoveryAction {
  // Assess server state corruption
  const currentMoney = ns.getServerMoneyAvailable(target.hostname);
  const currentSecurity = ns.getServerSecurityLevel(target.hostname);
  const expectedMoney = target.moneyMax;
  const expectedSecurity = target.minDifficulty;
  
  // Determine recovery strategy
  if (currentSecurity > expectedSecurity + 5) {
    return {
      type: 'weaken_recovery',
      threadsNeeded: Math.ceil((currentSecurity - expectedSecurity) / 0.05),
      priority: 'high'
    };
  }
  
  if (currentMoney < expectedMoney * 0.95) {
    const growthNeeded = expectedMoney / Math.max(currentMoney, 1);
    return {
      type: 'grow_recovery', 
      threadsNeeded: Math.ceil(ns.growthAnalyze(target.hostname, growthNeeded)),
      priority: 'medium'
    };
  }
  
  return {
    type: 'no_recovery_needed',
    priority: 'low'
  };
}
```

## Implementation Guidelines

### Critical Success Factors
1. **Exact Timing**: Use precise multipliers (3.2x, 4x) from game source
2. **Safety Margins**: Apply 10% thread padding for state prediction errors
3. **Validation**: Check all batch timing before execution
4. **Monitoring**: Track completion order and success rates
5. **Recovery**: Detect and handle batch failures gracefully

### Performance Optimization Checklist
- [ ] Use exact timing ratios from source code
- [ ] Implement proper batch staggering (minimum 2 seconds)
- [ ] Apply thread padding for reliability
- [ ] Validate timing before batch execution
- [ ] Monitor and recover from failures
- [ ] Optimize target selection by profitability
- [ ] Scale thread allocation based on available resources
- [ ] Track performance metrics for continuous improvement

This mathematical foundation ensures your HWGW implementation achieves optimal performance while maintaining reliability and stability.