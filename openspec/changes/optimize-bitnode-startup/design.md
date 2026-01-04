# Technical Design: Bitnode Startup Optimization

## Context

Bitburner's progression system varies significantly across bitnodes, with different multipliers, unlocked features, and optimal strategies. The current `start.ts` script uses a fixed progression path designed for BN4 (casino grinding), which is suboptimal for other bitnodes that benefit from different priorities (e.g., gangs in BN2, Bladeburner in BN7).

Additionally, scripts launch without checking prerequisites, leading to runtime errors when APIs are unavailable (e.g., gang API without SF2, sleeve API without SF10) or resources are insufficient (e.g., botnet without adequate RAM).

## Goals / Non-Goals

**Goals:**
- Detect current bitnode and apply appropriate startup strategy
- Validate prerequisites before launching automation scripts
- Provide clear visibility into startup progress and failures
- Maintain backward compatibility with existing BN4 workflow
- Enable easy customization for different bitnodes

**Non-Goals:**
- Optimizing internal script logic (botnet HWGW, gang management, etc.) - those are separate concerns
- Adding new gameplay automation (corp, stock market) - focus is on orchestration, not new features
- Multi-bitnode planning (deciding which bitnode to complete next) - that's strategic layer above this

## Decisions

### 1. Bitnode Configuration System

**Decision:** Create centralized bitnode configuration module (`src/lib/bitnode-config.ts`) with typed configurations per bitnode.

**Rationale:**
- Single source of truth for bitnode-specific behavior
- Easy to extend for new bitnodes or adjust existing strategies
- Type-safe access to configuration values
- Separates configuration from orchestration logic

**Structure:**
```typescript
interface BitnodeConfig {
  id: number;
  name: string;
  statTargets: { str: number; def: number; dex: number; agi: number; hack: number };
  trainingStrategy: 'gym-only' | 'crime-training' | 'skip-if-high' | 'minimal';
  moneyTarget: number; // Money needed before launching main loop
  moneyStrategy: 'casino' | 'crime' | 'hacking' | 'minimal';
  scriptPriorities: { [scriptName: string]: number }; // 1=highest, 10=lowest
  specialInstructions?: string;
}
```

**Alternatives Considered:**
- Inline config in `start.ts`: Would make script harder to maintain and test
- JSON configuration file: Less type-safe, requires file I/O, harder to version control logic
- No configuration (hardcode per bitnode): Would lead to massive if/else chains

### 2. Prerequisite Validation Pattern

**Decision:** Add `checkPrerequisites()` export to each automation script that returns readiness status.

**Rationale:**
- Decentralized validation (each script knows its own requirements)
- Non-invasive to existing scripts (additive change)
- Allows scripts to evolve their prerequisites independently
- Testable in isolation

**Pattern:**
```typescript
export function checkPrerequisites(ns: NS): { ready: boolean; reason?: string } {
  if (!ns.gang) return { ready: false, reason: "Gang API unavailable (need SF2)" };
  if (ns.getPlayer().karma > -54000) return { ready: false, reason: "Insufficient karma for gang" };
  return { ready: true };
}
```

**Alternatives Considered:**
- Centralized prerequisite checker: Would require maintaining prerequisites externally (brittle)
- Runtime errors: Current behavior; poor UX and wastes cycles
- Try-catch around script execution: Harder to provide meaningful error messages

### 3. Priority-Based Sequential Launching

**Decision:** Launch scripts sequentially in priority order, checking prerequisites before each launch.

**Rationale:**
- Ensures high-priority automation starts first (e.g., botnet before hacknet)
- Provides clear status updates for each script
- Prevents resource contention from simultaneous launches
- Allows dependent scripts to wait for prerequisites (e.g., wait for money before hacknet)

**Algorithm:**
```
1. Load bitnode config
2. Sort scripts by priority (1=highest)
3. For each script in order:
   a. Check prerequisites
   b. If ready: launch and log success
   c. If not ready but might become ready: add to wait queue
   d. If will never be ready: skip and log reason
4. Continue checking wait queue until empty or timeout
```

**Alternatives Considered:**
- Simultaneous launch (current): Simple but wastes resources and causes errors
- Event-driven system: Over-engineered for this use case; adds complexity
- Dependency graph: Would require explicit dependencies; sequential priority simpler

### 4. Dynamic Progression Checks

**Decision:** Check current player state before each training/grinding phase and skip if already complete.

**Rationale:**
- Accounts for augmentation bonuses from previous runs
- Reduces unnecessary grinding on subsequent bitnode attempts
- Makes restarts faster (e.g., after crash or manual stop)
- Respects user's manual progress

**Implementation:**
```typescript
// Before training strength
const player = ns.getPlayer();
if (player.skills.strength >= config.statTargets.str) {
  ns.tprint(`Strength already ${player.skills.strength}, skipping training`);
  // Skip to next phase
}
```

**Alternatives Considered:**
- Always train to targets: Wastes time on repeated runs
- Manual override required: Poor UX, requires user intervention
- Checkpoint system: More complex state management

### 5. Graceful Degradation for Missing APIs

**Decision:** Scripts check for API availability and exit gracefully with informative message rather than crashing.

**Rationale:**
- Better UX than cryptic runtime errors
- Makes scripts safe to launch in any bitnode
- Easier to debug when things don't work
- Maintains script simplicity (no complex fallback logic)

**Pattern:**
```typescript
export async function main(ns: NS): Promise<void> {
  if (!ns.gang) {
    ns.tprint("WARN: Gang API unavailable. Need SF2 or BN2.");
    return; // Graceful exit
  }
  // Proceed with gang logic
}
```

**Alternatives Considered:**
- Try-catch around API calls: Messy, harder to provide good error messages
- Feature detection with fallbacks: Over-engineered, adds complexity
- Ignore errors: Current behavior, poor UX

## Risks / Trade-offs

**Risk:** Increased startup time from sequential launching
- **Mitigation:** Scripts typically launch in <1 second; priority ensures critical scripts start first
- **Impact:** Low - the bottleneck is prerequisite readiness, not launch time

**Risk:** Configuration complexity grows with more bitnodes
- **Mitigation:** Start with 4 common bitnodes, add more as needed; fallback config for unknowns
- **Impact:** Medium - manageable with good type system and documentation

**Risk:** Prerequisite checks add overhead to scripts
- **Mitigation:** Checks are cheap (NS API calls), only run at startup
- **Impact:** Negligible - worth it for robustness

**Trade-off:** Breaking change to launch order
- **Impact:** Users expecting simultaneous launch see different behavior
- **Mitigation:** Document change; new behavior is strictly better (no downsides)

**Trade-off:** More code complexity in `start.ts`
- **Benefit:** Much better UX, faster bitnode completion, easier debugging
- **Acceptable:** Core orchestrator is expected to be complex; configuration system helps manage it

## Migration Plan

1. **Add new code without removing old:**
   - Create `bitnode-config.ts` module
   - Add `checkPrerequisites()` to scripts (non-breaking)
   - Build priority launcher alongside current logic

2. **Switch start.ts to new system:**
   - Update `start.ts` to use bitnode config
   - Replace hardcoded launch with priority launcher
   - Keep BN4 path as default (backward compatible)

3. **Test in multiple bitnodes:**
   - Validate BN4 behavior unchanged (backward compatibility)
   - Test BN1, BN2, BN7 with new optimizations
   - Verify graceful degradation with missing APIs

4. **Rollback plan:**
   - Git revert if major issues found
   - Prerequisite checks can be disabled with `--force` flag
   - Config system is additive, can fall back to hardcoded values

## Open Questions

1. **Should scripts auto-restart on prerequisite changes?**
   - Example: Hacknet becomes viable after botnet earns money
   - **Decision:** No for MVP - user can manually restart or wait for next cycle
   - **Future:** Could add watch system that polls prerequisites

2. **How verbose should status logging be?**
   - Too much: Spam user with every check
   - Too little: User doesn't know what's happening
   - **Decision:** Log state transitions only (starting, waiting, skipped, failed)

3. **Should bitnode config be user-modifiable?**
   - Pro: Users can customize strategies
   - Con: Adds complexity, risk of invalid configs
   - **Decision:** Yes, via script arguments for overrides (e.g., `--stat-target 200`)
   - **Future:** Could add config file support if demand exists

4. **How to handle scripts that become ready mid-startup?**
   - Example: Botnet earns money, hacknet becomes viable
   - **Decision:** Wait queue with timeout (check every 10s for 5 minutes)
   - **Alternative:** Continuous polling loop (more complex)
