# Tasks: Botnet Share Enhancement

**Input**: Design documents from `features/botnet-share/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Loaded: Botnet enhancement with ~30 lines integration to existing botnet.ts
   → Extract: Zero-cost faction detection, CPU core optimization, percentage allocation
2. Load optional design documents:
   → data-model.md: 5 entities → in-memory data structures (stateless)
   → contracts/: 2 interface files → implementation guidance
   → research.md: Mathematical formulas and intelligence optimization
3. Generate tasks by category:
   → Setup: Command-line integration, zero-cost DOM utilities
   → Remote: Enhanced share script for distributed execution
   → Detection: Faction work monitoring with DOM text scanning
   → Allocation: Thread distribution with CPU core prioritization
   → Integration: Botnet.ts enhancement with share lifecycle
   → Testing: Manual validation via quickstart.md scenarios
4. Apply task rules:
   → Utility functions = [P] for parallel
   → Botnet.ts modifications = sequential
   → Testing scenarios = [P] for parallel
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph: Utilities → Remote Script → Botnet Integration → Testing
7. Validate task completeness: All requirements covered, stateless design maintained
8. Return: SUCCESS (8 implementation tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths relative to src/

## Bitburner Script Patterns
- **Main Scripts**: Enhancement to existing botnet.ts with main(ns: NS) function
- **Remote Scripts**: Enhanced share script in `src/remote/` for distributed execution
- **Utilities**: Zero-cost DOM functions, mathematical calculations
- **Integration**: Extend existing command-line arguments and execution loop

## Phase 3.1: Setup & Utilities
- [ ] T001 [P] Create zero-cost faction detection utilities in src/lib/faction-detector.ts
- [ ] T002 [P] Create share allocation mathematical utilities in src/lib/share-calculator.ts  
- [ ] T003 [P] Create server prioritization utilities in src/lib/server-optimizer.ts

## Phase 3.2: Remote Script Enhancement
- [ ] T004 Enhance existing remote share script in src/remote/share.ts for continuous operation

## Phase 3.3: Botnet Integration
- [ ] T005 Add command-line arguments for share configuration to src/botnet.ts
- [ ] T006 Integrate faction detection into botnet execution loop in src/botnet.ts
- [ ] T007 Implement share allocation logic in botnet execution cycle in src/botnet.ts
- [ ] T008 Add share performance reporting to botnet status output in src/botnet.ts

## Phase 3.4: Validation
- [ ] T009 [P] Execute Test Scenario 1: Basic faction detection (quickstart.md)
- [ ] T010 [P] Execute Test Scenario 2: Share allocation and thread distribution (quickstart.md)
- [ ] T011 [P] Execute Test Scenario 3: Performance impact assessment (quickstart.md)
- [ ] T012 [P] Execute Test Scenario 4: Edge cases and error handling (quickstart.md)
- [ ] T013 [P] Execute Test Scenario 5: Intelligence optimization validation (quickstart.md)

## Dependencies
- Setup utilities (T001-T003) before remote script (T004)
- Remote script (T004) before botnet integration (T005-T008)
- Botnet integration (T005-T008) before validation (T009-T013)

## Parallel Example
```
# Launch T001-T003 together:
Task: "Create zero-cost faction detection utilities in src/lib/faction-detector.ts"
Task: "Create share allocation mathematical utilities in src/lib/share-calculator.ts"
Task: "Create server prioritization utilities in src/lib/server-optimizer.ts"

# Launch T009-T013 together:
Task: "Execute Test Scenario 1: Basic faction detection (quickstart.md)"
Task: "Execute Test Scenario 2: Share allocation and thread distribution (quickstart.md)"
Task: "Execute Test Scenario 3: Performance impact assessment (quickstart.md)"
```

---

## Task Details

### T001 [P] Create zero-cost faction detection utilities in src/lib/faction-detector.ts

**Objective**: Implement zero-cost DOM text scanning for faction work detection
**File**: `src/lib/faction-detector.ts`

**Requirements**:
- Function to detect "Working for [Faction]" text using stealth DOM access
- Function to extract faction name from detected text
- Function to track detection stability (consecutive detections)
- Zero RAM cost using `globalThis['doc' + 'ument']` technique

**Acceptance Criteria**:
- ✅ `detectFactionWork()` returns boolean and faction name
- ✅ `isDetectionStable()` validates consecutive detections
- ✅ Zero RAM penalty confirmed (no literal 'document' strings)
- ✅ Works across all faction work types (hacking, field, security)

**Implementation Notes**:
```typescript
export function detectFactionWork(): { isActive: boolean; factionName: string | null } {
    const doc = globalThis['doc' + 'ument'];
    const bodyText = doc.body.textContent;
    const isActive = bodyText.includes('Working for ');
    // Extract faction name from "Working for [FactionName]" pattern
}
```

---

### T002 [P] Create share allocation mathematical utilities in src/lib/share-calculator.ts

**Objective**: Implement mathematical calculations for share thread effectiveness and bonuses
**File**: `src/lib/share-calculator.ts`

**Requirements**:
- Calculate intelligence bonus: `1 + (2 * Math.pow(intelligence, 0.8)) / 600`
- Calculate core bonus: `1 + (cores - 1) / 16`
- Calculate effective threads: `threads × intelligenceBonus × coreBonus`
- Calculate reputation bonus: `1 + Math.log(effectiveThreads) / 25`
- Intelligence-aware allocation percentage recommendations

**Acceptance Criteria**:
- ✅ All formulas match Bitburner source code exactly
- ✅ `calculateReputationBonus()` returns accurate multiplier
- ✅ `recommendAllocationPercentage()` suggests optimal percentage based on intelligence
- ✅ Input validation for edge cases (zero threads, invalid intelligence)

**Implementation Notes**:
```typescript
export function calculateEffectiveThreads(baseThreads: number, cpuCores: number, intelligence: number): number {
    const intelligenceBonus = 1 + (2 * Math.pow(intelligence, 0.8)) / 600;
    const coreBonus = 1 + (cpuCores - 1) / 16;
    return baseThreads * intelligenceBonus * coreBonus;
}
```

---

### T003 [P] Create server prioritization utilities in src/lib/server-optimizer.ts

**Objective**: Implement server ranking and thread allocation optimization algorithms
**File**: `src/lib/server-optimizer.ts`

**Requirements**:
- Function to assess server share allocation capacity
- Function to rank servers by CPU cores and available RAM priority
- Function to distribute threads optimally across high-core servers
- Function to calculate allocation efficiency metrics

**Acceptance Criteria**:
- ✅ `rankServersByPriority()` prioritizes 4+ core servers
- ✅ `allocateThreadsOptimally()` maximizes effective thread count
- ✅ `assessServerCapacity()` calculates max possible share threads
- ✅ Allocation respects RAM constraints (2.4GB per thread)

**Implementation Notes**:
```typescript
export function rankServersByPriority(servers: ServerData[]): ServerData[] {
    return servers
        .filter(s => s.hasAdminRights && s.maxRam - s.ramUsed >= 2.4)
        .sort((a, b) => {
            const aCoreBonus = 1 + (ns.getServer(a.hostname).cpuCores - 1) / 16;
            const bCoreBonus = 1 + (ns.getServer(b.hostname).cpuCores - 1) / 16;
            return bCoreBonus - aCoreBonus; // Higher core bonus first
        });
}
```

---

### T004 Enhance existing remote share script in src/remote/share.ts

**Objective**: Enhance existing share script for continuous operation and lifecycle management
**File**: `src/remote/share.ts`

**Requirements**:
- Continuous sharing loop (replace single `await ns.share()`)
- Optional startup delay parameter for coordination
- Proper termination handling on script kill
- Minimal RAM footprint (only share function cost)

**Acceptance Criteria**:
- ✅ Script runs continuously until killed
- ✅ Accepts delay parameter for staggered startup
- ✅ RAM cost remains 2.4GB (only share function overhead)
- ✅ Graceful termination when script killed externally

**Current Implementation**:
```typescript
// Current: src/remote/share.ts
export async function main(ns: NS): Promise<void> {
    await ns.share();
}
```

**Enhanced Implementation**:
```typescript
export async function main(ns: NS): Promise<void> {
    const delay = ns.args[0] || 0;
    if (delay > 0) {
        await ns.sleep(delay);
    }
    
    while (true) {
        await ns.share(); // 10 second cycles automatically
    }
}
```

---

### T005 Add command-line arguments for share configuration to src/botnet.ts

**Objective**: Extend existing botnet command-line arguments with share configuration options
**File**: `src/botnet.ts`

**Requirements**:
- Add share configuration to existing `argsSchema` array
- Integrate with existing `ns.flags()` parsing system
- Provide sensible defaults aligned with research recommendations
- Maintain backward compatibility with existing botnet usage

**Acceptance Criteria**:
- ✅ `--share-enabled=true/false` to enable/disable sharing
- ✅ `--share-percentage=15` for RAM allocation percentage (10-25%)
- ✅ `--share-min-threads=50` minimum threads to activate sharing
- ✅ `--share-intelligence-optimization=true` for dynamic allocation
- ✅ Existing botnet arguments remain unchanged

**Implementation Location**:
```typescript
// Add to existing argsSchema in botnet.ts around line 170
const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
    ['rooting', true],
    ['max-servers', 25],
    ['target-ram-power', 13],
    // NEW SHARE ARGUMENTS:
    ['share-enabled', false],
    ['share-percentage', 15],
    ['share-min-threads', 50],
    ['share-intelligence-optimization', true],
];
```

---

### T006 Integrate faction detection into botnet execution loop in src/botnet.ts

**Objective**: Add faction work detection to existing botnet execution cycle
**File**: `src/botnet.ts`

**Requirements**:
- Import faction detection utilities from T001
- Add faction detection to main execution loop (around line 282-350)
- Track faction work status changes with stability validation
- Log faction detection events with appropriate detail level

**Acceptance Criteria**:
- ✅ Faction work detected within 5 seconds of starting
- ✅ Detection stability prevents rapid on/off switching
- ✅ Faction name extracted and logged
- ✅ Integration doesn't impact existing HWGW performance

**Implementation Location**:
```typescript
// Add after line 286 (after buildServerData) in main execution loop
import { detectFactionWork, isDetectionStable } from '/lib/faction-detector';

// In main loop:
const factionStatus = detectFactionWork();
if (options.debug && factionStatus.isActive) {
    ns.print(`Faction work detected: ${factionStatus.factionName}`);
}
```

---

### T007 Implement share allocation logic in botnet execution cycle in src/botnet.ts

**Objective**: Add share thread allocation and deployment to botnet execution cycle
**File**: `src/botnet.ts`

**Requirements**:
- Import share calculation and optimization utilities from T002-T003
- Add share allocation after HWGW RAM calculation (around line 324-365)
- Deploy enhanced share scripts to selected servers
- Track and manage share script PIDs for cleanup

**Acceptance Criteria**:
- ✅ Share allocation respects configured RAM percentage
- ✅ High CPU core servers prioritized for allocation
- ✅ Share scripts deployed and executed successfully
- ✅ Share RAM deducted from available HWGW budget
- ✅ Share scripts terminated when faction work ends

**Implementation Location**:
```typescript
// Add after line 331 (after networkRAMSnapshot) in main execution loop
import { calculateOptimalAllocation } from '/lib/share-calculator';
import { rankServersByPriority } from '/lib/server-optimizer';

// In main loop after RAM snapshot:
if (options['share-enabled'] && factionStatus.isActive) {
    const shareRAMBudget = networkRAMSnapshot.totalAvailable * (options['share-percentage'] / 100);
    const shareAllocation = calculateOptimalAllocation(attackers, shareRAMBudget);
    // Deploy share scripts and deduct from remainingRAMBudget
}
```

---

### T008 Add share performance reporting to botnet status output in src/botnet.ts

**Objective**: Integrate share performance metrics into existing botnet status reporting
**File**: `src/botnet.ts`

**Requirements**:
- Add share status to existing botnet performance output
- Report active share threads, RAM usage, and reputation bonus
- Include intelligence optimization recommendations
- Maintain existing botnet output format and readability

**Acceptance Criteria**:
- ✅ Share allocation status displayed in botnet output
- ✅ Reputation bonus estimate shown when sharing active
- ✅ Intelligence optimization suggestions provided
- ✅ Output format consistent with existing botnet style

**Implementation Location**:
```typescript
// Add after line 400+ (existing status reporting) in main execution loop
if (options['share-enabled']) {
    ns.print(`Share Status: ${shareAllocation ? shareAllocation.totalThreads : 0} threads, ` +
              `${shareAllocation ? shareAllocation.estimatedReputationBonus.toFixed(1) : 1.0}x reputation bonus`);
    
    if (options.debug && shareAllocation) {
        ns.print(`Share Details: ${shareAllocation.totalRAMUsed.toFixed(1)}GB RAM, ` +
                  `${shareAllocation.serverAllocations.length} servers, ` +
                  `${shareAllocation.effectiveThreads.toFixed(0)} effective threads`);
    }
}
```

---

### T009 [P] Execute Test Scenario 1: Basic faction detection (quickstart.md)

**Objective**: Validate faction work detection accuracy and timing
**Reference**: `features/botnet-share/quickstart.md` - Test Scenario 1

**Test Steps**:
1. Run botnet with share enabled: `run botnet.js --share-enabled=true --debug=true`
2. Start faction work (any type) and verify detection within 5 seconds
3. Stop faction work and verify detection of status change
4. Test with different faction work types (hacking, field, security)

**Acceptance Criteria**:
- ✅ Faction work detected within 5 seconds consistently
- ✅ Correct faction name extracted from DOM text
- ✅ Share allocation activates only during faction work
- ✅ No false positives during other activities

---

### T010 [P] Execute Test Scenario 2: Share allocation and thread distribution (quickstart.md)

**Objective**: Validate share thread allocation and CPU core optimization
**Reference**: `features/botnet-share/quickstart.md` - Test Scenario 2

**Test Steps**:
1. Run botnet with 20% share allocation during faction work
2. Verify high CPU core servers receive allocation priority
3. Validate thread count calculations (RAM / 2.4GB)
4. Check reputation bonus calculation accuracy

**Acceptance Criteria**:
- ✅ 20% of available RAM allocated to share threads
- ✅ 4+ core servers prioritized in allocation
- ✅ Thread count calculations accurate
- ✅ Reputation bonus matches mathematical formula

---

### T011 [P] Execute Test Scenario 3: Performance impact assessment (quickstart.md)

**Objective**: Measure share allocation impact on money farming performance
**Reference**: `features/botnet-share/quickstart.md` - Test Scenario 3

**Test Steps**:
1. Measure baseline money farming without sharing
2. Measure money farming impact with 15% share allocation
3. Verify reputation gain improvement during faction work
4. Validate HWGW performance scales with remaining RAM

**Acceptance Criteria**:
- ✅ Money farming reduced proportionally to RAM allocation
- ✅ Reputation gain increased by 25-45% depending on thread count
- ✅ HWGW batching maintains performance with remaining RAM
- ✅ No resource conflicts or over-allocation

---

### T012 [P] Execute Test Scenario 4: Edge cases and error handling (quickstart.md)

**Objective**: Validate system behavior under edge conditions
**Reference**: `features/botnet-share/quickstart.md` - Test Scenario 4

**Test Steps**:
1. Test insufficient RAM scenarios (minimal available RAM)
2. Test rapid faction work on/off switching
3. Test share script deployment failures
4. Test network changes during active sharing

**Acceptance Criteria**:
- ✅ Graceful handling of insufficient RAM
- ✅ Stable detection prevents allocation thrashing
- ✅ Error recovery from failed script deployments
- ✅ System adapts to network topology changes

---

### T013 [P] Execute Test Scenario 5: Intelligence optimization validation (quickstart.md)

**Objective**: Validate intelligence-aware allocation and bonus calculations
**Reference**: `features/botnet-share/quickstart.md` - Test Scenario 5

**Test Steps**:
1. Test allocation recommendations at different intelligence levels
2. Verify intelligence bonus calculations match source code
3. Validate dynamic allocation percentage suggestions
4. Measure actual vs predicted reputation improvements

**Acceptance Criteria**:
- ✅ Intelligence bonus calculated correctly per formula
- ✅ Higher intelligence enables more effective allocation
- ✅ Optimization recommends appropriate percentages
- ✅ Actual reputation gains match predictions

---

## Bitburner-Specific Validation
- [ ] RAM costs calculated: 2.4GB per share thread + negligible detection overhead
- [ ] NS API methods verified: ns.share(), ns.exec(), ns.scp(), ns.kill()
- [ ] Script operates statelessly (gathers faction status fresh each cycle)
- [ ] Script executable via existing botnet.js command line
- [ ] Performance meets 5-second detection requirement
- [ ] Multi-server execution respects RAM constraints

## Notes
- [P] tasks = different files, no dependencies
- Enhancement maintains existing botnet.ts patterns and conventions
- Share allocation integrates seamlessly with existing HWGW batching
- All mathematical formulas validated against Bitburner source code
- Zero-cost faction detection confirmed through DOM stealth techniques
- Intelligence optimization provides significant effectiveness improvements

## Task Generation Rules Applied

1. **From Interfaces**: Created utility modules for faction detection, share calculation, and server optimization
2. **From Requirements**: Integrated share functionality into existing botnet execution cycle
3. **From Architecture**: Enhanced remote share script, extended botnet with minimal code changes
4. **Ordering**: Utilities → Remote Script → Botnet Integration → Validation

## Validation Checklist ✅

- [x] All interface utilities have corresponding implementations (T001-T003)
- [x] Main script enhancement follows Bitburner patterns (botnet.ts integration)
- [x] Parallel tasks truly independent (utilities and testing scenarios)
- [x] Each task specifies exact file path relative to src/
- [x] No task modifies same file as another [P] task
- [x] Bitburner patterns followed (stateless design, NS API usage, DOM stealth techniques)