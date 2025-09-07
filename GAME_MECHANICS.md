# Bitburner Game Mechanics Reference

## Overview
This document contains exact formulas and mechanics extracted from the Bitburner source code to enable precise automation calculations. All formulas are based on the current game version and provide mathematical certainty for optimization algorithms.

## Core Hacking Formulas

### Hacking Success Chance
```typescript
// Source: src/Hacking.ts - calculateHackingChance()
function calculateHackingChance(server: IServer, person: IPerson): number {
  const hackDifficulty = server.hackDifficulty ?? 100;
  const requiredHackingSkill = server.requiredHackingSkill ?? 1e9;
  
  // Unrooted or unhackable server
  if (!server.hasAdminRights || hackDifficulty >= 100) return 0;
  
  const hackFactor = 1.75;
  const difficultyMult = (100 - hackDifficulty) / 100;
  const skillMult = clampNumber(hackFactor * person.skills.hacking, 1);
  const skillChance = (skillMult - requiredHackingSkill) / skillMult;
  
  const chance = skillChance * difficultyMult * person.mults.hacking_chance * 
                 calculateIntelligenceBonus(person.skills.intelligence, 1);
  
  return clampNumber(chance, 0, 1);
}
```

### Money Hacked Percentage
```typescript
// Source: src/Hacking.ts - calculatePercentMoneyHacked()
function calculatePercentMoneyHacked(server: IServer, person: IPerson): number {
  const hackDifficulty = server.hackDifficulty ?? 100;
  if (hackDifficulty >= 100) return 0;
  
  const requiredHackingSkill = server.requiredHackingSkill ?? 1e9;
  const balanceFactor = 240; // Divisor for final calculation
  
  const difficultyMult = (100 - hackDifficulty) / 100;
  const skillMult = (person.skills.hacking - (requiredHackingSkill - 1)) / person.skills.hacking;
  
  const percentMoneyHacked = (difficultyMult * skillMult * person.mults.hacking_money * 
                              currentNodeMults.ScriptHackMoney) / balanceFactor;
  
  return Math.min(1, Math.max(percentMoneyHacked, 0));
}
```

### Hacking Experience Gain
```typescript
// Source: src/Hacking.ts - calculateHackingExpGain()
function calculateHackingExpGain(server: IServer, person: IPerson): number {
  const baseDifficulty = server.baseDifficulty;
  if (!baseDifficulty) return 0;
  
  const baseExpGain = 3;
  const diffFactor = 0.3;
  let expGain = baseExpGain;
  expGain += baseDifficulty * diffFactor;
  
  return expGain * person.mults.hacking_exp * currentNodeMults.HackExpGain;
}
```

## Operation Timing Formulas

### Base Hacking Time
```typescript
// Source: src/Hacking.ts - calculateHackingTime()
function calculateHackingTime(server: IServer, person: IPerson): number {
  const { hackDifficulty, requiredHackingSkill } = server;
  if (typeof hackDifficulty !== "number" || typeof requiredHackingSkill !== "number") return Infinity;
  
  const difficultyMult = requiredHackingSkill * hackDifficulty;
  const baseDiff = 500;
  const baseSkill = 50;
  const diffFactor = 2.5;
  
  let skillFactor = diffFactor * difficultyMult + baseDiff;
  skillFactor /= person.skills.hacking + baseSkill;
  
  const hackTimeMultiplier = 5;
  const hackingTime = (hackTimeMultiplier * skillFactor) /
    (person.mults.hacking_speed * currentNodeMults.HackingSpeedMultiplier * 
     calculateIntelligenceBonus(person.skills.intelligence, 1));
  
  return hackingTime;
}
```

### Grow Time (Relative to Hack Time)
```typescript
// Source: src/Hacking.ts - calculateGrowTime()
function calculateGrowTime(server: IServer, person: IPerson): number {
  const growTimeMultiplier = 3.2; // Critical: Exactly 3.2x hack time
  return growTimeMultiplier * calculateHackingTime(server, person);
}
```

### Weaken Time (Relative to Hack Time)
```typescript
// Source: src/Hacking.ts - calculateWeakenTime()
function calculateWeakenTime(server: IServer, person: IPerson): number {
  const weakenTimeMultiplier = 4; // Critical: Exactly 4x hack time
  return weakenTimeMultiplier * calculateHackingTime(server, person);
}
```

## Server Growth Mechanics

### Server Growth Calculation
```typescript
// Source: src/Server/formulas/grow.ts - calculateServerGrowth()
function calculateServerGrowth(server: IServer, threads: number, p: IPerson, cores = 1): number {
  if (!server.serverGrowth) return 0;
  return Math.exp(calculateServerGrowthLog(server, threads, p, cores));
}

function calculateServerGrowthLog(server: IServer, threads: number, p: IPerson, cores = 1): number {
  if (!server.serverGrowth) return -Infinity;
  const hackDifficulty = server.hackDifficulty ?? 100;
  const numServerGrowthCycles = Math.max(threads, 0);
  
  // Adjusted growth log (accounts for server security)
  let adjGrowthLog = Math.log1p(ServerConstants.ServerBaseGrowthIncr / hackDifficulty);
  if (adjGrowthLog >= ServerConstants.ServerMaxGrowthLog) {
    adjGrowthLog = ServerConstants.ServerMaxGrowthLog;
  }
  
  const serverGrowthPercentage = server.serverGrowth / 100;
  const serverGrowthPercentageAdjusted = serverGrowthPercentage * currentNodeMults.ServerGrowthRate;
  
  // Core bonus: 1 + (cores - 1) * (1/16)
  const coreBonus = 1 + (cores - 1) * (1 / 16);
  
  return adjGrowthLog * serverGrowthPercentageAdjusted * p.mults.hacking_grow * 
         coreBonus * numServerGrowthCycles;
}
```

### Actual Money After Growth
```typescript
// Source: src/Server/formulas/grow.ts - calculateGrowMoney()
function calculateGrowMoney(server: IServer, threads: number, p: IPerson, cores = 1): number {
  let serverGrowth = calculateServerGrowth(server, threads, p, cores);
  if (serverGrowth < 1) {
    console.warn("serverGrowth calculated to be less than 1");
    serverGrowth = 1;
  }
  
  let moneyAvailable = server.moneyAvailable ?? Number.NaN;
  moneyAvailable += threads; // Critical: Can grow even with no money
  moneyAvailable *= serverGrowth;
  
  // Cap at max money
  if (server.moneyMax !== undefined && isValidNumber(server.moneyMax) &&
      (moneyAvailable > server.moneyMax || isNaN(moneyAvailable))) {
    moneyAvailable = server.moneyMax;
  }
  return moneyAvailable;
}
```

## Critical Constants

### Operation Time Multipliers
```typescript
// From Bitburner source - EXACT values
const HACK_TIME_MULTIPLIER = 1.0;    // Base timing
const GROW_TIME_MULTIPLIER = 3.2;    // 16/5 = 3.2x hack time
const WEAKEN_TIME_MULTIPLIER = 4.0;  // 4x hack time
```

### Security Impact
```typescript
// Server security affects all operations
const ServerBaseGrowthIncr = 0.03;   // Base growth increment
const ServerMaxGrowthLog = 50;       // Maximum growth log
const balanceFactor = 240;           // Money hack balance divisor
```

### Core Scaling
```typescript
// Core bonus for grow operations
const coreBonus = 1 + (cores - 1) * (1 / 16);
// Example: 1 core = 1.0x, 2 cores = 1.0625x, 4 cores = 1.1875x
```

## Security Mechanics

### Security Changes
- **Hack**: Increases security by `0.002 * threads`
- **Grow**: Increases security by `0.004 * threads`
- **Weaken**: Decreases security by `0.05 * threads`

### Security Impact on Operations
- Higher security = longer operation times
- Higher security = lower success rates
- Higher security = less money hacked
- Security affects growth rate through `hackDifficulty` parameter

## HWGW Batch Timing Requirements

### Perfect Timing Sequence
```typescript
// For operations to finish in order: Hack → Weaken1 → Grow → Weaken2
const gap = 200; // Minimum milliseconds between completions
const batchDeadline = Date.now() + maxOperationTime + safetyBuffer;

// Start times (working backwards from deadline)
const hackStart = batchDeadline - hackTime - (3 * gap);
const weaken1Start = batchDeadline - weakenTime - (2 * gap);
const growStart = batchDeadline - growTime - (1 * gap);
const weaken2Start = batchDeadline - weakenTime; // Finishes last
```

### Thread Calculations
```typescript
// For 50% money hack with proper recovery
const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, targetMoney * 0.5));
const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads, target);
const weaken1Threads = Math.ceil(hackSecIncrease / 0.05);

const growMultiplier = targetMoneyMax / (targetMoney - stolenMoney);
const growThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));
const growSecIncrease = ns.growthAnalyzeSecurity(growThreads, target);
const weaken2Threads = Math.ceil(growSecIncrease / 0.05);
```

## NS API Functions Reference

### Core Analysis Functions
- `ns.hackAnalyzeThreads(target, moneyToHack)` - Threads needed to hack specific amount
- `ns.hackAnalyzeSecurity(threads, target)` - Security increase from hack
- `ns.growthAnalyze(target, growthMultiplier)` - Threads needed for growth
- `ns.growthAnalyzeSecurity(threads, target)` - Security increase from grow
- `ns.weakenAnalyze(threads)` - Security decrease from weaken (always 0.05 * threads)

### Timing Functions
- `ns.getHackTime(target)` - Returns hack time in milliseconds
- `ns.getGrowTime(target)` - Returns grow time in milliseconds (3.2x hack time)
- `ns.getWeakenTime(target)` - Returns weaken time in milliseconds (4x hack time)

## RAM Costs
```typescript
// Critical for resource allocation
const RAM_COSTS = {
  hack: 0.1,
  grow: 0.75,
  weaken: 0.15,
  hackAnalyzeThreads: 1.0,
  growthAnalyze: 1.0,
  getHackTime: 0.05,
  getGrowTime: 0.05,
  getWeakenTime: 0.05
};
```

## Optimization Insights

### Key Findings from Source Analysis
1. **Exact Timing Ratios**: Grow is exactly 3.2x hack time, Weaken is exactly 4x hack time
2. **Core Scaling**: Diminishing returns formula `1 + (cores-1)/16`
3. **Growth Mechanics**: Adding threads before multiplying by growth rate
4. **Security Scaling**: Linear relationship between security and operation efficiency
5. **Money Hack Balance**: Fixed divisor of 240 in money calculation

### Performance Optimization Opportunities
1. **Thread Allocation**: Account for exact core bonus scaling
2. **Timing Precision**: Use exact multipliers instead of estimates
3. **Security Management**: Precise weaken thread calculations
4. **State Prediction**: Account for additive thread bonus in growth

This documentation provides the mathematical foundation for optimal automation algorithms based on the actual game source code.