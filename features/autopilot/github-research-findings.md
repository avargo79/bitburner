# Bitburner Autopilot/Startup Scripts - GitHub Research Findings

## Executive Summary

After analyzing 3 popular Bitburner repositories (703, 151, and 27 stars respectively), clear patterns emerge for autopilot/startup orchestration. The most successful approach (alainbryden's scripts with 703 stars) uses a hierarchical two-tier system: `autopilot.js` as high-level orchestrator → `daemon.js` as primary hacking manager → helper scripts for specific features.

## Repositories Analyzed

### 1. alainbryden/bitburner-scripts (703 ⭐, 299 forks)
- **URL:** https://github.com/alainbryden/bitburner-scripts
- **Last Updated:** July 14, 2025
- **Popularity:** Most popular by far
- **Language:** JavaScript (100%)

### 2. chrisrabe/bitburner-automation (151 ⭐, 40 forks)
- **URL:** https://github.com/chrisrabe/bitburner-automation
- **Last Updated:** January 30, 2024
- **Language:** JavaScript (96.5%)

### 3. HtheChemist/BitBurnerCentralManager (27 ⭐, 13 forks)
- **URL:** https://github.com/HtheChemist/BitBurnerCentralManager
- **Last Updated:** June 17, 2025
- **Language:** TypeScript (76.9%), JavaScript (23.0%)

---

## 1. Bitnode Detection & Configuration

### Pattern: Progressive Detection with Cached Results

**alainbryden's approach (BEST):**
```javascript
// Cache bitnode info at startup
resetInfo = await getNsDataThroughFile(ns, 'ns.getResetInfo()');
bitNodeMults = await tryGetBitNodeMultipliers(ns);
dictOwnedSourceFiles = await getActiveSourceFiles(ns, false);

// Use throughout scripts
if (bitNodeMults.ServerWeakenRate > 1) { /* adjust behavior */ }
if (resetInfo.currentNode == 8) { /* stock manipulation focus */ }
```

**Key Patterns:**
- ✅ **Cache at startup** - Bitnode info fetched once and cached globally
- ✅ **Fallback for missing data** - Graceful degradation if SF-5 not available
- ✅ **Bitnode-specific configs** - Different strategies per BN (e.g., BN8 = stocks, BN9 = hacknet)
- ✅ **Multiplier-based logic** - Check `bitNodeMults.ScriptHackMoney` to see if hack income is viable

**HtheChemist's approach:**
- No visible bitnode detection - assumes standard conditions
- ❌ Would fail in bitnodes with penalties

**chrisrabe's approach:**
- No evidence of bitnode-specific handling in stable scripts
- ❌ Treats all bitnodes the same

### Recommendations for Our Implementation:
1. **Cache bitnode info at startup** in `start.ts`
2. **Create bitnode-specific strategy configs** (like our `features/bn4/` structure)
3. **Use multipliers to enable/disable features** (e.g., skip hack scripts if `ScriptHackMoney == 0`)
4. **Implement fallback detection** for when SF5 (formulas) isn't available

---

## 2. Script Launch Orchestration

### Pattern: Two-Tier Hierarchy with Priority System

**alainbryden's architecture (BEST):**
```
autopilot.js (meta-orchestrator)
    ├── daemon.js (primary hacking orchestrator)
    │   ├── host-manager.js (buy servers)
    │   ├── hacknet-upgrade-manager.js
    │   ├── sleeve.js
    │   ├── gangs.js
    │   ├── work-for-factions.js
    │   ├── bladeburner.js
    │   └── ... (20+ helper scripts)
    ├── stockmaster.js (independent - can run in parallel)
    └── casino.js (one-time bootstrap)
```

**Key Orchestration Patterns:**

### A. Simultaneous Launch Pattern
```javascript
// Launch multiple scripts in PARALLEL when they don't conflict
asynchronousHelpers = [
    { name: "stats.js", shouldRun: () => reqRam(64) },
    { name: "stockmaster.js", shouldRun: () => reqRam(64) },
    { name: "sleeve.js", shouldRun: () => reqRam(64) && (10 in SF) },
];
// All launched simultaneously, each checks own prerequisites
```

### B. Sequential Launch Pattern  
```javascript
// Launch SEQUENTIALLY when order matters
if (!stanekLaunched && acceptedStanek) {
    stanekLaunched = true;
    launchScript('stanek.js', ['--on-completion-script', 'daemon.js']);
    stanekRunning = true;
}
// Daemon waits for stanek to complete before starting
```

### C. Prerequisite Checking Pattern
```javascript
// Each script has a shouldRun function
{ 
    name: "gangs.js", 
    shouldRun: () => reqRam(64) && (2 in dictSourceFiles) // SF2 = gangs
}
```

**HtheChemist's architecture:**
```
Boot.js
    ├── TargetManager.js (finds servers)
    ├── ThreadManager.js (allocates threads)
    ├── HackManager.js (schedules hacks)
    └── ServerManager.js (optional)
```
- ✅ Clean separation of concerns
- ❌ All scripts are **peers** (no hierarchy)
- ❌ No priority system between managers

**chrisrabe's approach:**
- Episode-based structure (not a complete automation system)
- Manual progression between stages

### Recommendations:
1. **Use two-tier hierarchy**: `start.ts` → `daemon.js` + feature scripts
2. **Simultaneous launch for independent features** (stocks, sleeves, gangs)
3. **Sequential launch when dependencies exist** (stanek → daemon)
4. **Each script checks its own prerequisites** via `shouldRun()` functions
5. **Retry mechanism** for scripts that fail due to temporary RAM issues

---

## 3. Early Game Progression

### Pattern: Bootstrap → Train → Scale

**alainbryden's progression (BEST):**

#### Phase 1: Bootstrap ($0 → $10B)
```javascript
// 1. Immediate: Run casino for seed money (if needed)
if (!ranCasino && playerMoney < 300000) {
    await maybeDoCasino(ns);  // Steal 10B from casino
}

// 2. Early: Focus on stock market (best ROI early game)
if (homeRam >= 32 && !stockMode) {
    launchScript('stockmaster.js', ['--reserve', 0]);
}
```

#### Phase 2: Train Stats
```javascript
// Study/Hack XP kickstart (first 10 mins after reset)
if (shouldKickstartHackXp) {
    studying = true;
    await getNsDataThroughFile(ns, 'ns.singularity.universityCourse(...)');
    await ns.sleep(studyTime * 1000);
    
    // Follow with XP farming cycles
    await farmHackXp(ns, 1, verbose);
}
```

#### Phase 3: Automate Income
```javascript
// Daemon handles hacking once stats are sufficient
await doTargetingLoop(ns);  // Main hack/grow/weaken loops
```

#### Phase 4: Scale Infrastructure
```javascript
// Buy RAM upgrades when profitable
periodicScripts.push({
    interval: 30000,
    name: "/Tasks/ram-manager.js",
    shouldRun: () => shouldImproveHacking() && getHostManagerBudget() > 0
});
```

**Key Early Game Patterns:**
- ✅ **Casino is optional** - Only run if income velocity < 5B/min
- ✅ **XP kickstart** - 10s of study + hack XP farming in first 10 minutes
- ✅ **Reserve seed money** - Don't let other scripts spend casino funds
- ✅ **Stocks before servers** - Stock market is better ROI early
- ✅ **Dynamic RAM reserve** - Increases as home RAM grows

**HtheChemist's approach:**
- No casino integration
- No training phase
- Assumes sufficient RAM exists

**chrisrabe's approach:**
- Manual progression between stages
- No early-game optimization

### Recommendations:
1. **Implement casino bootstrap** (configurable on/off)
2. **XP kickstart** - Study + XP farming first 10 minutes post-reset
3. **Dynamic reserve system** - Protect seed money for stocks/casino
4. **Prioritize stocks over servers early** - Better ROI
5. **Progressive RAM upgrades** - Only when hack income justifies it

---

## 4. Feature/API Detection

### Pattern: Try-Catch with Fallbacks

**alainbryden's approach (BEST):**

#### A. Source File Detection
```javascript
// Get all owned source files at startup
dictSourceFiles = await getActiveSourceFiles(ns, false);
unlockedSFs = await getActiveSourceFiles(ns, true);

// Use throughout code
if (4 in dictSourceFiles) {  // Singularity available?
    // Can automate faction work
}
if (dictSourceFiles[4] >= 3) {  // SF4 level 3?
    // Singularity functions cost less RAM
}
```

#### B. API Availability Detection
```javascript
// Try expensive operation, fall back if fails
let hasFormulas = true;
try {
    this.server.hackDifficulty = hackDifficulty;
    return ns.formulas.hacking.hackPercent(this.server, playerInfo);
} catch {
    hasFormulas = false;
    // Use approximation instead
    return (difficultyMult * skillMult * mults.hacking_money) / 240;
}
```

#### C. Feature Availability with Flags
```javascript
// Check TIX API availability
haveTixApi = haveTixApi || await getNsDataThroughFile(ns, `ns.stock.hasTIXAPIAccess()`);

// Check 4S API
have4sApi = have4sApi || await getNsDataThroughFile(ns, `ns.stock.has4SDataTIXAPI()`);

// Use in logic
if (stockMode && !haveTixApi) {
    log(ns, "Stock manipulation mode requested but no TIX API access");
    stockMode = false;
}
```

#### D. Graceful Degradation Example
```javascript
// Try to use Formulas API
if (hasFormulas) {
    try {
        return ns.formulas.hacking.hackPercent(this.server, player);
    } catch {
        hasFormulas = false;  // Mark as unavailable
    }
}
// Fallback: Use manual calculation
return Math.min(1, Math.max(0, percentMoneyHacked));
```

**HtheChemist's approach:**
- No visible SF detection
- Assumes all APIs available
- ❌ Would crash in early BNs

**chrisrabe's approach:**
- No visible feature detection
- Episode-based (assumes manual progression)

### Error Handling Patterns

**alainbryden's robust approach:**
```javascript
// Wrapper for entire main loop
try {
    await mainLoop(ns);
} catch (err) {
    log(ns, `WARNING: Caught error: ${getErrorInfo(err)}`, false, 'warning');
    keepRunning = shouldWeKeepRunning(ns);
}

// Startup with retries
let startupAttempts = 0;
while (startupAttempts++ <= 5) {
    try {
        await startup(ns);
        break;
    } catch (err) {
        if (startupAttempts == 5) throw err;
        log(ns, `Startup failed, retrying (${startupAttempts}/5)...`);
        await ns.sleep(5000);
    }
}
```

### Recommendations:
1. **Detect SFs at startup** - Cache in global state
2. **Try-catch expensive operations** - Fall back to approximations
3. **Cache API availability flags** - Don't repeatedly check
4. **Graceful degradation** - Disable features rather than crash
5. **Retry mechanism for transient errors** - Especially RAM-related
6. **Feature flags** - Allow users to force-enable/disable features

---

## 5. Configuration Patterns

### Pattern: CLI Args → Config File → Code Defaults

**alainbryden's approach (BEST):**

#### A. Args Schema with Defaults
```javascript
const argsSchema = [
    ['interval', 2000], // Wake up this often (ms)
    ['install-at-aug-count', 8], // Auto-install at N augs
    ['disable-casino', false], // Disable casino
    ['on-completion-script', null], // Script to run when BN complete
    ['on-completion-script-args', []],
];
```

#### B. Config File Persistence
```javascript
// Save args to config file so they persist across resets
const changedArgs = argsSchema
    .filter(a => JSON.stringify(options[a[0]]) != JSON.stringify(a[1]))
    .map(a => [a[0], options[a[0]]]);

if (changedArgs.length > 0) {
    ns.write(`${ns.getScriptName()}.config.txt`, 
             JSON.stringify(changedArgs), "w");
}
```

#### C. Config Loading
```javascript
// Load config at startup
const configPath = `${ns.getScriptName()}.config.txt`;
const savedConfig = ns.read(configPath);
if (savedConfig) {
    const savedArgs = JSON.parse(savedConfig);
    savedArgs.forEach(([key, value]) => options[key] = value);
}
```

#### D. User Customization Support
```javascript
// Users can create `daemon.js.config.txt` with:
{
    "reserved-ram": 64,
    "initial-max-targets": 8,
    "cycle-timing-delay": 2000
}
// These override defaults but are overridden by CLI args
```

**HtheChemist's approach:**
- TypeScript with hardcoded configs
- No config file support
- ❌ Requires code changes to customize

**chrisrabe's approach:**
- Episode-based with stage numbers
- No persistent config
- ❌ Manual progression

### Configuration Priority Order

**alainbryden's system:**
```
1. CLI arguments (highest priority)
   run daemon.js --reserved-ram 128
   
2. Config file (daemon.js.config.txt)
   { "reserved-ram": 64 }
   
3. Code defaults (lowest priority)
   ['reserved-ram', 32]
```

### Recommendations:
1. **Use args schema pattern** - Clear defaults + validation
2. **Persist config to file** - Survives resets/BN transitions
3. **Support 3-tier priority** - CLI → Config → Defaults
4. **JSON config format** - Easy to read/edit
5. **Type validation** - Prevent NaN/wrong types
6. **Config file naming** - `{script-name}.config.txt`

---

## Comparison Matrix

| Feature | alainbryden (703⭐) | chrisrabe (151⭐) | HtheChemist (27⭐) | Recommendation |
|---------|-------------------|------------------|-------------------|----------------|
| **Bitnode Detection** | ✅ Full | ❌ None | ❌ None | alainbryden's cached approach |
| **Bitnode-Specific Configs** | ✅ Yes (BN8, BN9, etc.) | ❌ No | ❌ No | alainbryden's multiplier checks |
| **Script Launch** | ✅ Hierarchical 2-tier | ⚠️ Manual stages | ⚠️ Flat peers | alainbryden's autopilot→daemon |
| **Priority System** | ✅ shouldRun + reqRam | ❌ None | ❌ None | alainbryden's prerequisite checks |
| **Dependency Management** | ✅ Sequential/Parallel mix | ❌ Manual | ❌ None | alainbryden's on-completion-script |
| **Early Game** | ✅ Casino + XP kickstart | ❌ Manual | ❌ Assumes RAM | alainbryden's bootstrap phases |
| **Stat Training** | ✅ Auto study + XP farm | ❌ Manual | ❌ None | alainbryden's kickstartHackXp |
| **RAM Upgrades** | ✅ Budget-based auto | ❌ Manual | ✅ Auto (simple) | alainbryden's periodic scripts |
| **SF Detection** | ✅ Cached at startup | ❌ None | ❌ None | alainbryden's dictSourceFiles |
| **API Detection** | ✅ Try-catch fallbacks | ❌ Assumes all | ❌ Assumes all | alainbryden's graceful degradation |
| **Error Handling** | ✅ Retry + fallback | ⚠️ Basic | ⚠️ Basic | alainbryden's retry loops |
| **Config System** | ✅ CLI→File→Defaults | ❌ Hardcoded | ❌ Hardcoded | alainbryden's 3-tier system |
| **User Customization** | ✅ Config files + CLI | ❌ Code changes | ❌ Code changes | alainbryden's .config.txt files |

---

## Key Architectural Insights

### What alainbryden Does WELL (and we should adopt):

1. **Two-Tier Orchestration**
   - `autopilot.js` = meta-orchestrator (handles aug installs, BN completion)
   - `daemon.js` = hacking orchestrator (manages hack cycles, launches helpers)
   - Clear separation of concerns

2. **Cached Bitnode Detection**
   ```javascript
   // Cache once at startup
   bitNodeMults = await tryGetBitNodeMultipliers(ns);
   
   // Use everywhere
   if (bitNodeMults.ScriptHackMoney == 0) {
       // This BN has no hack income, use alternative strategy
   }
   ```

3. **Prerequisite Checking Pattern**
   ```javascript
   const reqRam = (ram) => homeServer.totalRam(true) >= ram;
   
   asynchronousHelpers = [
       { name: "stats.js", shouldRun: () => reqRam(64) },
       { name: "sleeve.js", shouldRun: () => reqRam(64) && (10 in SF) },
   ];
   ```

4. **Graceful Degradation**
   - Try expensive API call
   - Catch error
   - Fall back to approximation
   - Mark API as unavailable

5. **Progressive Complexity**
   - Start simple (casino bootstrap)
   - Add features as RAM/SFs unlock
   - Scale up as resources allow

6. **Config Persistence**
   - Args → config file → survives resets
   - User can customize without editing code

### What HtheChemist Does WELL:

1. **Clean Thread Management**
   - Central ThreadManager allocates/deallocates
   - ✅ Good for resource tracking
   - ❌ But adds complexity for little gain

2. **TypeScript**
   - Better type safety
   - ✅ We're already using this

### What chrisrabe Does WELL:

1. **Episodic Documentation**
   - Each stage well-documented
   - ✅ Good for learning
   - ❌ Not good for automation

---

## Implementation Recommendations

Based on this research, here's what we should implement for `optimize-bitnode-startup`:

### 1. File Structure
```
src/
├── start.ts                    # Our "autopilot.js" - meta orchestrator
│   ├── Detects bitnode
│   ├── Checks prerequisites
│   ├── Launches daemon.ts
│   └── Monitors for aug installs / BN completion
│
├── daemon.ts                   # Our "daemon.js" - hacking orchestrator
│   ├── Manages hack cycles
│   ├── Launches helper scripts
│   └── Monitors resources
│
└── features/
    ├── casino/casino-bot.ts   # Bootstrap money
    ├── training/xp-boost.ts   # Early XP farming
    ├── ram/ram-manager.ts     # Upgrade home RAM
    └── ...
```

### 2. Bitnode Detection System
```typescript
// src/lib/bitnode-detector.ts
export class BitnodeDetector {
    private resetInfo: ResetInfo;
    private bitNodeMults: BitNodeMultipliers;
    private sourcFiles: Map<number, number>;
    
    async initialize(ns: NS) {
        this.resetInfo = ns.getResetInfo();
        this.bitNodeMults = this.tryGetBitNodeMults(ns);
        this.sourceFiles = await this.getActiveSFs(ns);
    }
    
    getCurrentBitnode(): number {
        return this.resetInfo.currentNode;
    }
    
    hasSourceFile(sfNum: number, minLevel: number = 1): boolean {
        return (this.sourceFiles.get(sfNum) ?? 0) >= minLevel;
    }
    
    isHackIncomeViable(): boolean {
        return this.bitNodeMults.ScriptHackMoney * 
               this.bitNodeMults.ScriptHackMoneyGain > 0;
    }
}
```

### 3. Script Launch Orchestrator
```typescript
// src/lib/script-orchestrator.ts
interface ScriptConfig {
    name: string;
    args?: any[];
    shouldRun: (detector: BitnodeDetector) => boolean;
    minHomeRam?: number;
    launchMode: 'parallel' | 'sequential';
    onComplete?: string; // Next script to run
}

export class ScriptOrchestrator {
    async launchScripts(configs: ScriptConfig[]) {
        const parallel = configs.filter(c => c.launchMode === 'parallel');
        const sequential = configs.filter(c => c.launchMode === 'sequential');
        
        // Launch all parallel scripts simultaneously
        await Promise.all(parallel.map(c => this.launch(c)));
        
        // Launch sequential scripts one at a time
        for (const config of sequential) {
            await this.launch(config);
            if (config.onComplete) {
                await this.waitForCompletion(config.name);
            }
        }
    }
}
```

### 4. Prerequisite System
```typescript
// src/lib/prerequisites.ts
export class Prerequisites {
    constructor(private detector: BitnodeDetector) {}
    
    checkAll(reqs: Requirement[]): boolean {
        return reqs.every(req => this.check(req));
    }
    
    check(req: Requirement): boolean {
        switch (req.type) {
            case 'source-file':
                return this.detector.hasSourceFile(req.sfNum, req.level);
            case 'home-ram':
                return this.getHomeRam() >= req.minRam;
            case 'hack-level':
                return this.getHackLevel() >= req.minLevel;
            case 'money':
                return this.getMoney() >= req.minMoney;
        }
    }
}
```

### 5. Configuration System
```typescript
// src/lib/config.ts
export class Config {
    private schema: ConfigSchema;
    private values: Map<string, any>;
    
    async load(ns: NS, scriptName: string) {
        // 1. Load defaults from schema
        this.loadDefaults();
        
        // 2. Override with config file
        const configFile = `${scriptName}.config.txt`;
        if (ns.fileExists(configFile)) {
            const saved = JSON.parse(ns.read(configFile));
            this.merge(saved);
        }
        
        // 3. Override with CLI args
        this.merge(ns.args);
    }
    
    async save(ns: NS, scriptName: string) {
        const changed = this.getChangedValues();
        const configFile = `${scriptName}.config.txt`;
        ns.write(configFile, JSON.stringify(changed), 'w');
    }
}
```

### 6. Bootstrap Phases
```typescript
// In start.ts
enum BootstrapPhase {
    DETECT = 'detect',           // Detect bitnode, SFs, resources
    BOOTSTRAP = 'bootstrap',     // Casino for seed money
    TRAIN = 'train',             // XP kickstart
    AUTOMATE = 'automate',       // Launch daemon
    SCALE = 'scale',             // RAM upgrades, etc.
}

async function executePhase(phase: BootstrapPhase) {
    switch (phase) {
        case BootstrapPhase.DETECT:
            await detector.initialize(ns);
            break;
        case BootstrapPhase.BOOTSTRAP:
            if (shouldRunCasino()) await runCasino();
            break;
        case BootstrapPhase.TRAIN:
            if (shouldKickstartXP()) await kickstartXP();
            break;
        // ...
    }
}
```

---

## Things to AVOID

Based on this research, here are patterns we should NOT adopt:

### ❌ Flat Peer Architecture (HtheChemist)
- All managers are peers
- No clear orchestrator
- Harder to reason about startup order

### ❌ Manual Stage Progression (chrisrabe)
- User must manually progress through stages
- Not truly "autopilot"

### ❌ Assumption of Resources (HtheChemist)
- Assumes sufficient RAM
- Assumes all APIs available
- Crashes in early BNs

### ❌ Hardcoded Configurations
- Both chrisrabe and HtheChemist require code edits
- alainbryden's config system is much better

### ❌ Missing Error Handling
- Both alternatives have minimal error handling
- No retry mechanisms
- No graceful degradation

---

## Conclusion

**alainbryden's architecture is far superior** for our use case:

✅ **Hierarchical orchestration** (autopilot → daemon → helpers)
✅ **Bitnode-aware** with cached detection
✅ **Prerequisite checking** for all scripts
✅ **Graceful degradation** when APIs unavailable
✅ **Config persistence** through resets
✅ **Bootstrap phases** (casino → train → automate)
✅ **Error handling** with retries
✅ **Progressive complexity** based on resources

We should adopt this architecture for `features/autopilot/` and pattern our implementation after alainbryden's approach, while:
- Converting to TypeScript for type safety
- Splitting into modular feature files (as we've started)
- Using our existing `src/lib/logger.ts` infrastructure
- Implementing our contract-based architecture from `features/simple-botnet/`

---

## Next Steps

1. **Create bitnode detector** - `src/lib/bitnode-detector.ts`
2. **Create script orchestrator** - `src/lib/script-orchestrator.ts`
3. **Update start.ts** - Make it our "autopilot.js"
4. **Extract daemon.ts** - Make it our "daemon.js" 
5. **Implement bootstrap phases** - Casino → Train → Automate
6. **Add config system** - `{script}.config.txt` support
7. **Add prerequisite checking** - Before launching each script
8. **Add retry mechanisms** - For transient RAM errors
9. **Add graceful degradation** - Fallbacks when APIs unavailable

This research provides a solid foundation for implementing our optimal startup system.
