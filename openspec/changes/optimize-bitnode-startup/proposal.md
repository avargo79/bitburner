# Optimize Bitnode Startup Scripts

## Why

The current `start.ts` script and its downstream automation (contracts, sleeve, gangs, bladeburner, server-manager, botnet, hacknet) are designed for BN4 and lack adaptability for completing other bitnodes efficiently. The startup logic is hardcoded to a single progression path (train stats → mug → casino → launch all scripts), which doesn't account for:

1. **Bitnode-specific priorities** - Different bitnodes require different initial focuses (e.g., BN2 prioritizes gangs, BN7 prioritizes Bladeburner, BN3 prioritizes corp)
2. **Dynamic script launching** - All scripts launch simultaneously regardless of readiness or relevance
3. **Missing prerequisite checks** - Scripts may start without necessary RAM, augmentations, or unlocks
4. **No bitnode detection** - No awareness of current bitnode to adjust strategy
5. **Inefficient early game** - Fixed training thresholds don't account for bitnode multipliers or source file bonuses

This creates suboptimal progression, wasted cycles on irrelevant activities, and slower bitnode completion times.

## What Changes

- Refactor `start.ts` to detect current bitnode and apply bitnode-specific startup strategies
- Add prerequisite validation before launching automation scripts (RAM checks, API availability, faction/gang status)
- Implement priority-based script launching that adapts to bitnode requirements
- Create a configuration system for bitnode-specific stat targets, training methods, and script priorities
- Add dynamic progression checks to skip completed phases (e.g., skip training if stats already high from augs)
- Improve error handling and status reporting for startup failures
- Document bitnode-specific strategies for users
- **BREAKING**: Change script launch order from simultaneous to priority-based sequential with readiness checks

## Impact

- **Affected specs**: New capability `startup-orchestration` (no existing spec to modify)
- **Affected code**: 
  - `src/start.ts` (major refactor)
  - `src/contracts.ts` (add prerequisite checks)
  - `src/sleeve.ts` (add readiness checks)
  - `src/gangs.ts` (add prerequisite checks)
  - `src/bladeburner.ts` (add prerequisite checks)
  - `src/server-manager.ts` (minor - always safe to run)
  - `src/botnet.ts` (add RAM checks)
  - `src/hacknet.ts` (add readiness checks)
  - New file: `src/lib/bitnode-config.ts` (bitnode detection and configurations)

- **User impact**: 
  - Faster bitnode completion times through optimized progression
  - Reduced wasted resources on irrelevant activities
  - Better visibility into startup process and failures
  - Easier customization for different playstyles

## Non-Goals

- This change does NOT optimize individual script internals (botnet HWGW logic, gang management, etc.)
- This change does NOT add new gameplay automation (e.g., stock market, corp automation)
- This change does NOT implement multi-bitnode progression planning (that's a separate concern)
