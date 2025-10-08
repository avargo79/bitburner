# Quickstart Guide: Simple Autonomous Botnet

**Feature**: Simple Autonomous Botnet | **Date**: September 14, 2025  
**Testing Phase**: Manual validation scenarios and performance benchmarks

## Overview
This quickstart guide provides step-by-step testing scenarios to validate the simple autonomous botnet implementation. All tests are designed for manual execution within the Bitburner game environment.

## Prerequisites

### Game State Requirements
- **Bitburner Version**: Any recent version with NS API support
- **Player Requirements**: Hacking level 1+ (any level works, higher = more targets)
- **Available Programs**: At least one port-opening program recommended (BruteSSH.exe, FTPCrack.exe, etc.)
- **Home Server RAM**: Minimum 8GB free RAM for the main script
- **Network Access**: Connected to standard Bitburner network topology

### File Setup
1. Ensure `src/simple-botnet.js` is compiled and available in-game
2. Ensure remote scripts exist: `/remote/hk.js`, `/remote/wk.js`, `/remote/gr.js`, `/remote/root.js`
3. Verify home server has adequate free RAM (check with `free` command)

## Test Scenario 1: Fresh Game State (Early Game)

**Purpose**: Validate basic functionality with minimal player capabilities  
**Expected Duration**: 5-10 minutes  
**Player Level**: Hacking 1-10

### Setup
```bash
# In Bitburner terminal
home
free
# Should show 8+ GB available RAM
```

### Execution
```bash
run simple-botnet.js --debug --maxTargets 1 --cycleInterval 30
```

### Expected Results
**Phase 1 - Network Discovery (first 30 seconds)**:
- Script should discover 10-20 servers in early game network
- Should attempt to root servers based on available programs
- Log messages showing discovery progress:
  ```
  INFO: Discovered 15 servers in network
  INFO: Successfully rooted 3 servers
  INFO: 2 servers available as botnet nodes  
  ```

**Phase 2 - Target Selection (next 30 seconds)**:
- Should identify 1-3 profitable targets based on player hacking level
- Should log target evaluation:
  ```
  INFO: Evaluated 8 rooted servers for profitability
  INFO: Selected target: n00dles (score: 1250)
  ```

**Phase 3 - Batch Execution (ongoing)**:
- Should begin HWGW operations on selected target
- Should distribute operations across available botnet servers
- Should log batch execution:
  ```
  INFO: Started batch B001 on n00dles
  INFO: Hack: 2 threads on foodnstuff
  INFO: Grow: 4 threads on sigma-cosmetics
  ```

### Success Criteria
- [x] Network discovery completes within 30 seconds
- [x] At least 1 target selected for operations
- [x] Batch operations execute without errors
- [x] Player money increases over 5-minute period
- [x] No script crashes or error messages

### Performance Benchmarks
- **RAM Usage**: Should stay within 8GB on home server
- **Discovery Time**: < 30 seconds for initial network scan
- **Targeting Time**: < 10 seconds for server evaluation  
- **Batch Setup**: < 15 seconds from target selection to first operation

## Test Scenario 2: Mid-Game State (Expanded Network)

**Purpose**: Validate scalability with larger network and multiple targets  
**Expected Duration**: 15-30 minutes  
**Player Level**: Hacking 50-200

### Setup
```bash
# Ensure adequate botnet capacity exists
run simple-botnet.js --debug --maxTargets 3 --cycleInterval 60
```

### Expected Results
**Enhanced Discovery**:
- Should discover 50-100+ servers
- Should root 10-20+ servers with available programs
- Should identify multiple profitable targets

**Multi-Target Operations**:
- Should manage 2-3 simultaneous targets
- Should coordinate batch timing to prevent conflicts
- Should adapt to changing server conditions

**Resource Management**:
- Should efficiently distribute operations across botnet
- Should handle RAM constraints gracefully
- Should scale thread allocation based on available resources

### Success Criteria
- [x] Manages 3+ simultaneous targets without conflicts
- [x] Efficiently utilizes available botnet RAM
- [x] Maintains stable income generation over 15+ minutes
- [x] Adapts to changing server security/money conditions

## Test Scenario 3: Error Recovery (Robustness Testing)

**Purpose**: Validate error handling and recovery mechanisms  
**Expected Duration**: 10-15 minutes  
**Player Level**: Any

### Error Simulation Steps

**Test 3.1 - RAM Exhaustion**:
```bash
# Fill most available RAM with dummy processes first
run simple-botnet.js --maxRAMUtilization 0.95
# Should handle low-RAM conditions gracefully
```

**Test 3.2 - Server State Changes**:
```bash
# While script runs, manually hack target servers to change security
# Should detect changes and adapt operations
```

**Test 3.3 - Network Changes**:
```bash  
# Purchase new servers during execution
# Should discover and integrate new servers into botnet
```

### Recovery Validation
- Script should continue operating despite resource constraints
- Should log appropriate warnings for degraded conditions
- Should recover automatically when conditions improve
- Should not crash or enter infinite loops

### Success Criteria  
- [x] Gracefully handles insufficient RAM conditions
- [x] Adapts to changing target server states
- [x] Automatically integrates newly available servers
- [x] Maintains operation logs during error conditions

## Test Scenario 4: Performance Validation (Large Scale)

**Purpose**: Validate performance at scale with significant botnet  
**Expected Duration**: 30-60 minutes  
**Player Level**: Hacking 500+ (or purchased servers available)

### Setup Requirements
- 20+ rooted servers available as botnet nodes
- Multiple high-value targets available
- Significant RAM capacity across botnet

### Execution
```bash
run simple-botnet.js --maxTargets 5 --cycleInterval 120 --maxRAMUtilization 0.8
```

### Performance Metrics to Monitor

**Financial Performance**:
- Money growth rate ($/minute)
- Batch completion success rate
- Target selection efficiency

**System Performance**:  
- Network discovery time with 100+ servers
- Batch coordination overhead
- Resource utilization efficiency

**Stability Metrics**:
- Continuous operation duration
- Error frequency and recovery time
- Memory usage stability

### Success Criteria
- [x] Handles 100+ servers in network discovery
- [x] Manages 5+ simultaneous targets efficiently  
- [x] Maintains >95% batch success rate
- [x] Operates continuously for 30+ minutes without intervention

## Debug and Monitoring Commands

### Real-Time Status Monitoring
```bash
# View script logs
tail simple-botnet.js

# Check RAM usage
free

# Monitor active processes  
ps

# View current botnet status (if logging implemented)
cat simple-botnet-status.txt
```

### Troubleshooting Common Issues

**Issue**: Script won't start due to insufficient RAM
```bash
# Solution: Kill unnecessary processes or increase server RAM
kill [process-name]
# Or restart with lower resource requirements
run simple-botnet.js --maxRAMUtilization 0.6
```

**Issue**: No targets found despite rooted servers
```bash
# Check player hacking level vs server requirements
# Solution: Train hacking skill or adjust minProfitability threshold
run simple-botnet.js --minProfitability 500
```

**Issue**: Batches failing to execute
```bash
# Check available RAM across botnet servers
# Solution: May need to purchase more servers or reduce concurrent targets
run simple-botnet.js --maxTargets 2
```

## Validation Checklist

### Core Functionality
- [ ] Network discovery works across all game phases
- [ ] Server rooting attempts use available programs optimally
- [ ] Target selection prioritizes profitable servers correctly
- [ ] HWGW batch timing prevents security conflicts
- [ ] Multi-server operation distribution is efficient

### Performance Requirements  
- [ ] Script starts within 30 seconds (FR-002 compliance)
- [ ] Handles 10+ concurrent operations (PR-003 compliance)
- [ ] Operates within 8GB RAM budget (PR-001 compliance)
- [ ] Scales operations automatically (PR-004 compliance)

### Automation Requirements
- [ ] Operates autonomously without intervention (AR-001 compliance)
- [ ] Adapts to changing server conditions (AR-002 compliance)  
- [ ] Prioritizes targets by profitability (AR-003 compliance)
- [ ] Logs activities appropriately (AR-004 compliance)

### Game Integration
- [ ] Uses direct NS API calls only (GI-001 compliance)
- [ ] Respects RAM constraints (GI-002 compliance)
- [ ] Handles script restarts properly (GI-003 compliance)
- [ ] Single script implementation (GI-004 compliance)

---

**Testing Complete**: When all scenarios pass and validation checklist is satisfied, the simple autonomous botnet implementation meets specification requirements and is ready for production use.

**Performance Baseline**: Document actual performance metrics achieved during testing for future optimization reference.