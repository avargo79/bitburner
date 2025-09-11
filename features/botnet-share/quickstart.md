# Quickstart Guide: Botnet Share Enhancement

**Feature**: Botnet Share Enhancement  
**Date**: Wed Sep 10 2025  
**Purpose**: Manual testing scenarios and validation steps for share allocation system

## Prerequisites

### Required Setup
- **Bitburner Save**: Active game with faction access and basic botnet setup
- **Script Environment**: Botnet.js script available and functional
- **Server Network**: At least 5-10 servers available for share allocation
- **Player Stats**: Some intelligence (50+) and faction access for work
- **Game State**: Not currently in faction work when starting tests

### Recommended Test Environment
- **Total RAM**: 100GB+ across network for meaningful share allocation
- **CPU Cores**: Mix of 1-core and 4+ core servers for priority testing  
- **Faction Status**: Member of at least one faction with work options
- **Money**: Sufficient funds for server purchases during scaling tests
- **Scripts**: All remote scripts (simple-hack.js, simple-grow.js, etc.) available

---

## Test Scenario 1: Basic Faction Detection

### Objective
Verify accurate detection of faction work start/stop with zero-cost DOM scanning

### Setup Steps
1. Run botnet with share enabled: `run botnet.js --share-enabled=true --share-percentage=15 --debug=true`
2. Verify botnet starts normally with share system initialized
3. Confirm no share allocation when not doing faction work

### Test Steps
1. **Start Faction Work**
   - Navigate to any faction page
   - Click "Hacking Contracts" or "Field Work" or "Security Work"
   - Wait 5-10 seconds for detection

2. **Verify Detection**
   - Check botnet log output for faction detection messages
   - Confirm faction name extracted correctly from "Working for [FactionName]"
   - Verify share allocation begins automatically

3. **Stop Faction Work**
   - Cancel faction work (click "Do something else")
   - Wait 5-10 seconds for detection
   - Verify share allocation terminates automatically

### Expected Results
- ✅ Faction work detected within 5 seconds of starting
- ✅ Correct faction name extracted (e.g., "CyberSec", "NiteSec")  
- ✅ Share allocation activated only during faction work
- ✅ Share allocation terminated when faction work stops
- ✅ No false positives when doing other activities

### Validation Commands
```javascript
// Check for "Working for" text in console
document.body.textContent.includes('Working for ')

// Monitor botnet log for detection messages
// Look for: "Faction work detected: [FactionName]"
// Look for: "Share allocation activated: X threads"
```

---

## Test Scenario 2: Share Allocation and Thread Distribution

### Objective
Validate correct share thread allocation across servers with CPU core optimization

### Setup Steps
1. Run botnet with moderate share allocation: `run botnet.js --share-enabled=true --share-percentage=20 --debug=true`
2. Note current network RAM and server core counts before starting
3. Start faction work to trigger share allocation

### Test Steps
1. **Monitor Initial Allocation**
   - Record total available RAM across network
   - Check calculated 20% RAM allocation for sharing
   - Verify thread count calculation (RAM / 2.4GB per thread)

2. **Verify Server Prioritization**
   - Identify servers with highest CPU core counts
   - Confirm high-core servers receive allocation priority
   - Check that 4+ core servers are prioritized over 1-core servers

3. **Thread Effectiveness Calculation**
   - Record intelligence stat: `ns.getPlayer().skills.intelligence`
   - Calculate expected core bonus for allocated servers
   - Verify effective thread count matches mathematical formula

4. **Reputation Bonus Verification**
   - Note estimated reputation bonus from botnet log
   - Calculate expected bonus: `1 + Math.log(effectiveThreads) / 25`
   - Compare actual vs expected bonus calculation

### Expected Results
- ✅ 20% of available RAM allocated to share threads
- ✅ Thread count = (allocated RAM / 2.4GB) rounded down
- ✅ High CPU core servers receive allocation first
- ✅ Effective threads include intelligence and core bonuses
- ✅ Reputation bonus calculation matches formula
- ✅ All share scripts successfully deployed

### Validation Commands
```javascript
// Check network RAM allocation
ns.getServerMaxRam('home') - ns.getServerUsedRam('home')

// Verify thread calculations manually
Math.floor(allocatedRAM / 2.4)

// Check server CPU cores
ns.getServer('servername').cpuCores

// Calculate expected reputation bonus
1 + Math.log(effectiveThreads) / 25
```

---

## Test Scenario 3: Performance Impact Assessment

### Objective
Measure share allocation impact on existing botnet money farming performance

### Setup Steps
1. **Baseline Measurement** (No sharing)
   - Run botnet without sharing: `run botnet.js --share-enabled=false`
   - Monitor money generation rate for 5 minutes
   - Record baseline performance metrics

2. **Share Impact Measurement** (With sharing)
   - Start faction work to enable sharing
   - Run with sharing enabled for 5 minutes
   - Monitor money generation rate during faction work

### Test Steps
1. **HWGW Performance Comparison**
   - Compare HWGW batch allocation with/without sharing
   - Verify HWGW gets remaining RAM after share allocation
   - Monitor hack/grow/weaken thread counts

2. **Money Generation Rate**
   - Record money gain per minute baseline vs sharing
   - Calculate percentage impact of 15-20% RAM allocation
   - Verify impact is proportional to RAM allocation

3. **Server Resource Utilization**
   - Monitor RAM usage across all servers
   - Verify no server over-allocated beyond capacity
   - Check that share scripts don't interfere with HWGW timing

4. **Reputation Gain Measurement**
   - Complete identical faction work with/without sharing
   - Record reputation gained in each scenario
   - Calculate actual reputation bonus percentage

### Expected Results
- ✅ Money farming reduced by ~15-20% (proportional to RAM allocation)
- ✅ HWGW performance scales correctly with remaining RAM
- ✅ No server over-allocation or resource conflicts
- ✅ Reputation gain increased by 25-45% depending on threads
- ✅ Share system doesn't interfere with HWGW timing

### Validation Commands
```javascript
// Monitor money over time
let startMoney = ns.getServerMoneyAvailable('home');
// ... wait 5 minutes ...
let endMoney = ns.getServerMoneyAvailable('home');
let moneyPerMinute = (endMoney - startMoney) / 5;

// Check faction reputation
ns.singularity.getFactionRep('FactionName')
```

---

## Test Scenario 4: Edge Cases and Error Handling

### Objective
Validate system behavior under edge conditions and error scenarios

### Setup Steps
1. Run botnet with sharing enabled
2. Prepare various edge case scenarios

### Test Cases

#### 4A: Insufficient RAM for Sharing
1. **Setup**: Fill most server RAM with other scripts
2. **Action**: Start faction work with minimal available RAM
3. **Expected**: Share allocation either skips or uses minimal threads
4. **Validation**: No allocation errors, graceful degradation

#### 4B: Share Script Deployment Failures
1. **Setup**: Manually kill share scripts after deployment
2. **Action**: Monitor botnet response to failed scripts
3. **Expected**: Error detection and retry or alternative allocation
4. **Validation**: System remains stable, logs failures appropriately

#### 4C: Rapid Faction Work On/Off Switching
1. **Setup**: Rapidly start/stop faction work multiple times
2. **Action**: Switch faction work on/off every 5-10 seconds
3. **Expected**: Stable detection with no allocation thrashing
4. **Validation**: System waits for detection stability before acting

#### 4D: Network Changes During Allocation
1. **Setup**: Active share allocation running
2. **Action**: Purchase new servers or change server RAM during allocation
3. **Expected**: System adapts to network changes gracefully
4. **Validation**: Allocation updates without disrupting existing shares

### Expected Results
- ✅ Graceful handling of insufficient RAM scenarios
- ✅ Error recovery from failed script deployments
- ✅ Stable detection prevents rapid allocation changes
- ✅ Dynamic adaptation to network topology changes
- ✅ Comprehensive error logging for troubleshooting

---

## Test Scenario 5: Intelligence Optimization

### Objective
Validate intelligence-aware allocation and bonus calculations

### Setup Steps
1. Note current intelligence stat
2. Run botnet with intelligence optimization enabled
3. Test with different intelligence levels if possible

### Test Steps
1. **Intelligence Bonus Calculation**
   - Record current intelligence: `ns.getPlayer().skills.intelligence`
   - Calculate expected intelligence bonus: `1 + (2 * intelligence^0.8) / 600`
   - Verify effective threads include intelligence bonus

2. **Intelligence-Aware Allocation**
   - Compare allocation recommendations at different intelligence levels
   - Verify higher intelligence suggests higher allocation percentages
   - Test if optimization adjusts allocation percentage automatically

3. **Bonus Accuracy Validation**
   - Perform identical faction work at different intelligence levels
   - Measure actual reputation gains vs predicted bonuses
   - Validate mathematical formula accuracy in practice

### Expected Results
- ✅ Intelligence bonus calculated correctly per formula
- ✅ Higher intelligence enables more effective share allocation
- ✅ Optimization recommends appropriate allocation percentages
- ✅ Actual reputation gains match predicted bonuses
- ✅ System adapts recommendations to player intelligence level

---

## Performance Benchmarks

### RAM Allocation Efficiency
- **Target**: >95% of allocated RAM successfully utilized
- **Measurement**: Compare theoretical vs actual thread deployment
- **Tolerance**: Within 5% due to RAM granularity constraints

### Detection Responsiveness  
- **Target**: <5 second faction work detection time
- **Measurement**: Time from faction work start to share allocation
- **Tolerance**: Consistent detection within target timeframe

### Deployment Success Rate
- **Target**: >90% share script deployment success
- **Measurement**: Successful deployments / attempted deployments
- **Tolerance**: Occasional failures acceptable due to server constraints

### Resource Balance
- **Target**: Money farming impact proportional to RAM allocation
- **Measurement**: % money reduction vs % RAM allocated to sharing
- **Tolerance**: Within 10% variance due to other factors

### Reputation Bonus Accuracy
- **Target**: Measured bonus within 5% of calculated bonus
- **Measurement**: Actual reputation gain vs predicted gain
- **Tolerance**: Small variance due to game mechanics timing

---

## Troubleshooting Guide

### Common Issues

#### Share Allocation Not Starting
- **Check**: Faction work detection in logs
- **Fix**: Ensure faction work actually started, check DOM text scanning
- **Command**: Verify `document.body.textContent.includes('Working for ')`

#### Low Reputation Bonus
- **Check**: Thread count and effective thread calculation
- **Fix**: Verify CPU core prioritization and intelligence bonus
- **Command**: Calculate expected bonus manually with formula

#### Script Deployment Failures
- **Check**: Server RAM availability and admin rights
- **Fix**: Ensure sufficient RAM and rooted servers
- **Command**: `ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)`

#### Money Farming Impact Too High
- **Check**: Share allocation percentage configuration
- **Fix**: Reduce --share-percentage parameter
- **Command**: Monitor RAM allocation vs configuration

### Debug Information
Enable detailed logging with `--debug=true` to see:
- Faction detection status and timing
- Share allocation calculations and decisions  
- Per-server thread distribution and deployment
- Performance metrics and efficiency analysis
- Error conditions and recovery attempts

---

*Quickstart guide provides comprehensive validation of share allocation functionality and performance characteristics*