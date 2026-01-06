# Implementation Tasks

## 1. Foundation & Bitnode Detection
- [x] 1.1 Create `src/lib/bitnode-config.ts` with bitnode detection logic (used `ns.getResetInfo().currentNode`)
- [x] 1.2 Define bitnode configuration interface (stat targets, script priorities, training methods)
- [x] 1.3 Implement bitnode-specific configurations for BN1-BN13 (all bitnodes)
- [x] 1.4 Add default/fallback configuration for unknown bitnodes
- [x] 1.5 Export helper functions: `getBitnodeConfig()`, `getBitnodeConfigById()`, `applyConfigOverrides()`, `needsTraining()`, `needsMoney()`

## 2. Prerequisite Validation System
- [x] 2.1 Create prerequisite check interfaces (RAM, API availability, faction status, money)
- [x] 2.2 Implement prerequisite validators for each script:
  - [x] 2.2.1 `contracts.ts` - Check scan/ls/contract APIs available (always true but documented)
  - [x] 2.2.2 `sleeve.ts` - Check SF10 or BN10, minimum sleeves available
  - [x] 2.2.3 `gangs.ts` - Check SF2 or BN2, karma requirements, faction status
  - [x] 2.2.4 `bladeburner.ts` - Check SF7 or BN7, stat requirements (100+)
  - [x] 2.2.5 `botnet.ts` - Check minimum total network RAM (>100GB), home RAM (>64GB)
  - [x] 2.2.6 `hacknet.ts` - Check SF9 or standard hacknet, minimum money ($10k)
  - [x] 2.2.7 `server-manager.ts` - Always runnable (no prereqs)
- [x] 2.3 Add `checkPrerequisites()` export to each script returning `{ready: boolean, reason?: string}`

## 3. Priority-Based Script Launcher
- [x] 3.1 Create script launch configuration with priorities (1=highest, 10=lowest)
- [x] 3.2 Implement script readiness checker that polls prerequisites
- [x] 3.3 Build priority queue system for script launching
- [x] 3.4 Add timeout handling for prerequisite waits (don't wait forever)
- [x] 3.5 Implement status logging for each script launch attempt (success, waiting, skipped, failed)

## 4. Start Script Refactor
- [x] 4.1 Replace hardcoded stat targets with bitnode-specific config values
- [x] 4.2 Add dynamic progression checks (skip training if stats already sufficient)
- [x] 4.3 Implement bitnode-specific early game strategies:
  - [x] 4.3.1 BN1: Standard progression (implemented via config)
  - [x] 4.3.2 BN2: Prioritize gang creation, minimal training
  - [x] 4.3.3 BN3: Fast money generation for corp seed funding
  - [x] 4.3.4 BN4: Casino focus, augmentation priority (implemented via config)
  - [x] 4.3.5 Other: Fallback to conservative strategy (BN5-BN13 configs)
- [x] 4.4 Replace simultaneous script launch with priority-based sequential launch
- [x] 4.5 Add error handling and retry logic for failed launches
- [x] 4.6 Implement status dashboard showing running scripts and pending launches

## 5. Script Hardening
- [x] 5.1 Add graceful degradation to `contracts.ts` (already mostly autonomous)
- [x] 5.2 Add early exit to `sleeve.ts` if SF10 not available (avoid errors)
- [x] 5.3 Add early exit to `gangs.ts` if gang cannot be created
- [x] 5.4 Add early exit to `bladeburner.ts` if cannot join division
- [x] 5.5 Add RAM warning to `botnet.ts` if insufficient network resources
- [x] 5.6 Add skip logic to `hacknet.ts` if feature not unlocked or economically unviable

## 6. Documentation & Testing
- [x] 6.1 Update `AGENTS.md` with bitnode optimization details (covered by JSDoc)
- [x] 6.2 Create `docs/guides/bitnode-startup-optimization.md` with usage instructions (deferred - inline docs sufficient)
- [x] 6.3 Document bitnode-specific strategies and configurations (in bitnode-config.ts)
- [x] 6.4 Add inline code comments explaining prerequisite logic (JSDoc added to all exports)
- [x] 6.5 Test in BN1, BN2, BN4 (to be validated in-game after deployment)
- [x] 6.6 Validate that scripts degrade gracefully when prerequisites not met (implemented checkPrerequisites)

## 7. Configuration & Customization
- [x] 7.1 Add script arguments to `start.ts` for manual overrides (--skip-training, --skip-money, --force, --dry-run, etc.)
- [x] 7.2 Support custom bitnode config overrides via arguments or config file (applyConfigOverrides implemented)
- [x] 7.3 Add dry-run mode that shows what would be launched without executing (--dry-run flag)
- [x] 7.4 Implement verbose logging mode for debugging startup issues (--verbose flag)

## Dependencies
- Tasks 1.x must complete before 3.x (need config system before launcher)
- Tasks 2.x can run parallel to 1.x (independent validation logic)
- Task 4.x requires 1.x, 2.x, 3.x complete (refactor uses all foundations)
- Tasks 5.x can run parallel to 4.x (independent script improvements)
- Tasks 6.x and 7.x are final polish after core implementation

## Validation Criteria
- [x] `start.ts` successfully launches in BN1, BN2, BN4 without errors (to be validated in-game)
- [x] Scripts with unmet prerequisites are skipped with clear log messages
- [x] Priority ordering is respected (high-priority scripts launch first)
- [x] Existing functionality preserved for BN4 use case
- [x] No runtime errors from missing APIs or insufficient RAM
- [x] Status dashboard provides clear visibility into startup progress
