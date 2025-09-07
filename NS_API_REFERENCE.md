# Netscript API Reference - Automation Framework

## Overview
Quick reference for critical NS functions with exact RAM costs, behaviors, and formulas extracted from Bitburner source code. All values are current as of the latest game version.

## Core Hacking Functions

### ns.hack(target)
**RAM Cost**: 0.1 GB  
**Returns**: Money stolen (number) or 0 if failed  
**Behavior**: 
- Steals money from target server
- Increases server security by `0.002 * threads`
- Success depends on hacking skill and server security
- Amount stolen based on `calculatePercentMoneyHacked()` formula

```typescript
// Usage in automation
const moneyStolen = await ns.hack(target);
const expectedMoney = ns.getServerMoneyAvailable(target) * ns.formulas.hacking.hackPercent(target, ns.getPlayer());
```

### ns.grow(target)
**RAM Cost**: 0.75 GB  
**Returns**: Growth multiplier (number)  
**Behavior**:
- Grows server money toward maximum
- Increases server security by `0.004 * threads`
- Growth rate depends on server growth rate and security level
- Uses `calculateServerGrowth()` formula from source

```typescript
// Usage in automation
const growthMultiplier = await ns.grow(target);
const moneyAfterGrow = ns.getServerMoneyAvailable(target) * growthMultiplier;
```

### ns.weaken(target)
**RAM Cost**: 0.15 GB  
**Returns**: Security decrease amount (number)  
**Behavior**:
- Reduces server security level
- Always decreases security by exactly `0.05 * threads`
- Most reliable operation (no failure chance)

```typescript
// Usage in automation
const securityDecrease = await ns.weaken(target);
// securityDecrease will always equal threads * 0.05
```

## Analysis Functions

### ns.hackAnalyzeThreads(target, moneyToHack)
**RAM Cost**: 1.0 GB  
**Returns**: Number of threads needed (number)  
**Purpose**: Calculate threads required to hack specific amount of money

```typescript
// Example: Calculate threads to hack 50% of server money
const currentMoney = ns.getServerMoneyAvailable(target);
const threadsNeeded = ns.hackAnalyzeThreads(target, currentMoney * 0.5);
```

### ns.hackAnalyzeSecurity(threads, target)
**RAM Cost**: 1.0 GB  
**Returns**: Security increase amount (number)  
**Formula**: `threads * 0.002`

```typescript
// Calculate security increase from hack operation
const hackThreads = 100;
const securityIncrease = ns.hackAnalyzeSecurity(hackThreads, target);
// securityIncrease = 100 * 0.002 = 0.2
```

### ns.growthAnalyze(target, growthMultiplier)
**RAM Cost**: 1.0 GB  
**Returns**: Number of threads needed (number)  
**Purpose**: Calculate threads to achieve specific growth multiplier

```typescript
// Example: Calculate threads to double server money
const threadsToDouble = ns.growthAnalyze(target, 2.0);

// Example: Restore money after hack
const moneyBefore = ns.getServerMaxMoney(target);
const moneyAfter = ns.getServerMoneyAvailable(target);
const growthNeeded = moneyBefore / Math.max(moneyAfter, 1);
const threadsToRestore = ns.growthAnalyze(target, growthNeeded);
```

### ns.growthAnalyzeSecurity(threads, target)
**RAM Cost**: 1.0 GB  
**Returns**: Security increase amount (number)  
**Formula**: `threads * 0.004`

```typescript
// Calculate security increase from grow operation  
const growThreads = 250;
const securityIncrease = ns.growthAnalyzeSecurity(growThreads, target);
// securityIncrease = 250 * 0.004 = 1.0
```

### ns.weakenAnalyze(threads)
**RAM Cost**: 1.0 GB  
**Returns**: Security decrease amount (number)  
**Formula**: `threads * 0.05`

```typescript
// Calculate security decrease from weaken operation
const weakenThreads = 20;
const securityDecrease = ns.weakenAnalyze(weakenThreads);
// securityDecrease = 20 * 0.05 = 1.0
```

## Timing Functions

### ns.getHackTime(target)
**RAM Cost**: 0.05 GB  
**Returns**: Hack time in milliseconds (number)  
**Source Formula**: From `calculateHackingTime()` * 1000

```typescript
const hackTimeMs = ns.getHackTime(target);
const hackTimeSeconds = hackTimeMs / 1000;
```

### ns.getGrowTime(target)
**RAM Cost**: 0.05 GB  
**Returns**: Grow time in milliseconds (number)  
**Source Formula**: `calculateHackingTime() * 3.2 * 1000`

```typescript
const growTimeMs = ns.getGrowTime(target);
// Always exactly 3.2x hack time
const hackTimeMs = ns.getHackTime(target);
console.log(growTimeMs / hackTimeMs); // Always 3.2
```

### ns.getWeakenTime(target)
**RAM Cost**: 0.05 GB  
**Returns**: Weaken time in milliseconds (number)  
**Source Formula**: `calculateHackingTime() * 4.0 * 1000`

```typescript
const weakenTimeMs = ns.getWeakenTime(target);
// Always exactly 4.0x hack time
const hackTimeMs = ns.getHackTime(target);
console.log(weakenTimeMs / hackTimeMs); // Always 4.0
```

## Server Information Functions

### ns.getServer(hostname)
**RAM Cost**: 2.0 GB  
**Returns**: Server object with complete server state  
**Critical Properties**:

```typescript
const server = ns.getServer(target);
console.log({
  // Money properties
  moneyAvailable: server.moneyAvailable,    // Current money
  moneyMax: server.moneyMax,               // Maximum money
  
  // Security properties  
  hackDifficulty: server.hackDifficulty,   // Current security
  minDifficulty: server.minDifficulty,     // Minimum security
  
  // Server characteristics
  serverGrowth: server.serverGrowth,       // Growth rate (1-100)
  requiredHackingSkill: server.requiredHackingSkill,
  
  // Access properties
  hasAdminRights: server.hasAdminRights,   // Can hack/grow/weaken
  numOpenPortsRequired: server.numOpenPortsRequired,
  
  // Hardware properties
  maxRam: server.maxRam,
  ramUsed: server.ramUsed,
  cpuCores: server.cpuCores
});
```

### ns.getServerMoneyAvailable(hostname)
**RAM Cost**: 0.1 GB  
**Returns**: Current money on server (number)

### ns.getServerMaxMoney(hostname)
**RAM Cost**: 0.1 GB  
**Returns**: Maximum money on server (number)

### ns.getServerSecurityLevel(hostname)
**RAM Cost**: 0.1 GB  
**Returns**: Current security level (number)

### ns.getServerMinSecurityLevel(hostname)
**RAM Cost**: 0.1 GB  
**Returns**: Minimum security level (number)

## Formulas API (Requires Formulas.exe)

### ns.formulas.hacking.hackChance(server, player)
**RAM Cost**: 1.0 GB  
**Returns**: Success probability (0-1)  
**Source**: `calculateHackingChance()` from Hacking.ts

### ns.formulas.hacking.hackPercent(server, player)
**RAM Cost**: 1.0 GB  
**Returns**: Percentage of money hacked per thread (0-1)  
**Source**: `calculatePercentMoneyHacked()` from Hacking.ts

### ns.formulas.hacking.hackTime(server, player)
**RAM Cost**: 1.0 GB  
**Returns**: Hack time in milliseconds  
**Source**: `calculateHackingTime() * 1000`

### ns.formulas.hacking.growTime(server, player)  
**RAM Cost**: 1.0 GB  
**Returns**: Grow time in milliseconds  
**Source**: `calculateGrowTime() * 1000`

### ns.formulas.hacking.weakenTime(server, player)
**RAM Cost**: 1.0 GB  
**Returns**: Weaken time in milliseconds  
**Source**: `calculateWeakenTime() * 1000`

### ns.formulas.hacking.growPercent(server, threads, player, cores)
**RAM Cost**: 1.0 GB  
**Returns**: Growth multiplier for given threads  
**Source**: `calculateServerGrowth()`

## Script Execution Functions

### ns.exec(script, hostname, threads, ...args)
**RAM Cost**: 1.3 GB  
**Returns**: Process ID (number) or 0 if failed  
**Behavior**:
- Executes script on target server with specified threads
- Returns unique PID for process tracking
- Fails if insufficient RAM or invalid parameters

```typescript
// Execute remote script with delay argument
const pid = ns.exec('remote/simple-hack.js', 'server-1', 10, 'target-server', Date.now() + 5000);
if (pid === 0) {
  ns.print('Failed to start script');
} else {
  ns.print(`Script started with PID: ${pid}`);
}
```

### ns.spawn(script, threads, ...args)
**RAM Cost**: 2.0 GB  
**Returns**: void  
**Behavior**:
- Kills current script and starts new one
- Useful for restarting with different parameters
- Cannot be undone

### ns.kill(pid)
**RAM Cost**: 0.5 GB  
**Returns**: true if successful (boolean)  
**Purpose**: Kill specific process by PID

### ns.killall(hostname)
**RAM Cost**: 0.5 GB  
**Returns**: true if successful (boolean)  
**Purpose**: Kill all scripts on specified server

## Process Management

### ns.ps(hostname)
**RAM Cost**: 0.2 GB  
**Returns**: Array of running processes  
**Process Object Properties**:

```typescript
const processes = ns.ps('home');
processes.forEach(process => {
  console.log({
    filename: process.filename,    // Script filename
    threads: process.threads,      // Number of threads
    args: process.args,           // Script arguments
    pid: process.pid              // Process ID
  });
});
```

### ns.isRunning(script, hostname, ...args)
**RAM Cost**: 0.1 GB  
**Returns**: true if script is running (boolean)  
**Purpose**: Check if specific script instance is running

```typescript
// Check if specific hack script is running
const isHacking = ns.isRunning('remote/simple-hack.js', 'server-1', 'target-server', delayTime);
```

## File System Functions

### ns.scp(files, destination, source)
**RAM Cost**: 0.6 GB  
**Returns**: true if successful (boolean)  
**Purpose**: Copy files between servers

```typescript
// Copy all remote scripts to purchased server
const scripts = ['remote/simple-hack.js', 'remote/simple-grow.js', 'remote/simple-weaken.js'];
const success = ns.scp(scripts, 'purchased-server-1', 'home');
```

### ns.ls(hostname, grep)
**RAM Cost**: 0.2 GB  
**Returns**: Array of filenames (string[])  
**Purpose**: List files on server with optional filter

## Player Information

### ns.getPlayer()
**RAM Cost**: 0.5 GB  
**Returns**: Player object with complete player state  
**Critical Properties**:

```typescript
const player = ns.getPlayer();
console.log({
  skills: {
    hacking: player.skills.hacking,
    strength: player.skills.strength,
    defense: player.skills.defense,
    dexterity: player.skills.dexterity,
    agility: player.skills.agility,
    charisma: player.skills.charisma,
    intelligence: player.skills.intelligence
  },
  mults: player.mults,  // All multipliers
  money: player.money,
  location: player.location
});
```

## Network Functions

### ns.scan(hostname)
**RAM Cost**: 0.2 GB  
**Returns**: Array of connected server hostnames (string[])  
**Purpose**: Get directly connected servers

### ns.getPurchasedServers()
**RAM Cost**: 2.25 GB  
**Returns**: Array of purchased server hostnames (string[])

### ns.getPurchasedServerLimit()
**RAM Cost**: 0.05 GB  
**Returns**: Maximum number of purchased servers (number)

### ns.getPurchasedServerMaxRam()
**RAM Cost**: 0.05 GB  
**Returns**: Maximum RAM per purchased server (number)

## Utility Functions

### ns.sleep(ms)
**RAM Cost**: 0 GB  
**Returns**: Promise that resolves after delay  
**Purpose**: Non-blocking delay

### ns.print(message)
**RAM Cost**: 0 GB  
**Purpose**: Print to script log

### ns.tprint(message)
**RAM Cost**: 0 GB  
**Purpose**: Print to terminal

### ns.clearLog()
**RAM Cost**: 0 GB  
**Purpose**: Clear script log

## Critical Constants & Limits

### Security Change Rates
```typescript
const SECURITY_CHANGES = {
  hack: 0.002,      // per thread
  grow: 0.004,      // per thread  
  weaken: -0.05     // per thread (always negative)
};
```

### Operation Time Multipliers
```typescript
const TIME_MULTIPLIERS = {
  hack: 1.0,        // Base time
  grow: 3.2,        // 3.2x hack time
  weaken: 4.0       // 4.0x hack time
};
```

### RAM Cost Summary
```typescript
const RAM_COSTS = {
  // Core operations
  hack: 0.1,
  grow: 0.75,
  weaken: 0.15,
  
  // Analysis functions
  hackAnalyzeThreads: 1.0,
  growthAnalyze: 1.0,
  hackAnalyzeSecurity: 1.0,
  growthAnalyzeSecurity: 1.0,
  weakenAnalyze: 1.0,
  
  // Timing functions
  getHackTime: 0.05,
  getGrowTime: 0.05,
  getWeakenTime: 0.05,
  
  // Server info
  getServer: 2.0,
  getServerMoneyAvailable: 0.1,
  getServerSecurityLevel: 0.1,
  
  // Script execution
  exec: 1.3,
  spawn: 2.0,
  kill: 0.5,
  
  // File system
  scp: 0.6,
  ls: 0.2,
  
  // Network
  scan: 0.2,
  getPurchasedServers: 2.25
};
```

## Best Practices for Automation

### Memory Management
1. **Cache expensive calls**: Store `ns.getServer()` results
2. **Use lightweight alternatives**: `ns.getServerMoneyAvailable()` vs `ns.getServer().moneyAvailable`
3. **Batch operations**: Minimize function calls in tight loops

### Error Handling
1. **Check return values**: `ns.exec()` returns 0 on failure
2. **Validate parameters**: Ensure servers exist before operations
3. **Handle edge cases**: Division by zero, negative values

### Performance Optimization
1. **Pre-calculate constants**: Store timing ratios, security rates
2. **Minimize NS calls**: Use local variables for repeated access
3. **Efficient server scanning**: Cache network topology

This reference provides the exact behavior and costs needed for optimal automation script development.