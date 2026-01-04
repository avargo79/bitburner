# Implementation Tasks

## 1. Foundation & Bitnode Detection
- [ ] 1.1 Create `src/lib/bitnode-config.ts` with bitnode detection logic (`ns.getPlayer().bitNodeN`)
- [ ] 1.2 Define bitnode configuration interface (stat targets, script priorities, training methods)
- [ ] 1.3 Implement bitnode-specific configurations for BN1-BN4 (common cases)
- [ ] 1.4 Add default/fallback configuration for unknown bitnodes
- [ ] 1.5 Export helper functions: `getBitnodeConfig()`, `getCurrentBitnode()`, `getSourceFileLevels()`

## 2. Prerequisite Validation System
- [ ] 2.1 Create prerequisite check interfaces (RAM, API availability, faction status, money)
- [ ] 2.2 Implement prerequisite validators for each script:
  - [ ] 2.2.1 `contracts.ts` - Check scan/ls/contract APIs available (always true but document)
  - [ ] 2.2.2 `sleeve.ts` - Check SF10 or BN10, minimum sleeves available
  - [ ] 2.2.3 `gangs.ts` - Check SF2 or BN2, karma requirements, faction status
  - [ ] 2.2.4 `bladeburner.ts` - Check SF7 or BN7, stat requirements (100+)
  - [ ] 2.2.5 `botnet.ts` - Check minimum total network RAM (>100GB), home RAM (>64GB)
  - [ ] 2.2.6 `hacknet.ts` - Check SF9 or standard hacknet, minimum money ($10k)
  - [ ] 2.2.7 `server-manager.ts` - Always runnable (no prereqs)
- [ ] 2.3 Add `checkPrerequisites()` export to each script returning `{ready: boolean, reason?: string}`

## 3. Priority-Based Script Launcher
- [ ] 3.1 Create script launch configuration with priorities (1=highest, 10=lowest)
- [ ] 3.2 Implement script readiness checker that polls prerequisites
- [ ] 3.3 Build priority queue system for script launching
- [ ] 3.4 Add timeout handling for prerequisite waits (don't wait forever)
- [ ] 3.5 Implement status logging for each script launch attempt (success, waiting, skipped, failed)

## 4. Start Script Refactor
- [ ] 4.1 Replace hardcoded stat targets with bitnode-specific config values
- [ ] 4.2 Add dynamic progression checks (skip training if stats already sufficient)
- [ ] 4.3 Implement bitnode-specific early game strategies:
  - [ ] 4.3.1 BN1: Standard progression (current logic)
  - [ ] 4.3.2 BN2: Prioritize gang creation, minimal training
  - [ ] 4.3.3 BN3: Fast money generation for corp seed funding
  - [ ] 4.3.4 BN4: Casino focus, augmentation priority (current logic)
  - [ ] 4.3.5 Other: Fallback to conservative strategy
- [ ] 4.4 Replace simultaneous script launch with priority-based sequential launch
- [ ] 4.5 Add error handling and retry logic for failed launches
- [ ] 4.6 Implement status dashboard showing running scripts and pending launches

## 5. Script Hardening
- [ ] 5.1 Add graceful degradation to `contracts.ts` (already mostly autonomous)
- [ ] 5.2 Add early exit to `sleeve.ts` if SF10 not available (avoid errors)
- [ ] 5.3 Add early exit to `gangs.ts` if gang cannot be created
- [ ] 5.4 Add early exit to `bladeburner.ts` if cannot join division
- [ ] 5.5 Add RAM warning to `botnet.ts` if insufficient network resources
- [ ] 5.6 Add skip logic to `hacknet.ts` if feature not unlocked or economically unviable

## 6. Documentation & Testing
- [ ] 6.1 Update `AGENTS.md` with bitnode optimization details
- [ ] 6.2 Create `docs/guides/bitnode-startup-optimization.md` with usage instructions
- [ ] 6.3 Document bitnode-specific strategies and configurations
- [ ] 6.4 Add inline code comments explaining prerequisite logic
- [ ] 6.5 Test in BN1, BN2, BN4 (or simulate with different SF combinations)
- [ ] 6.6 Validate that scripts degrade gracefully when prerequisites not met

## 7. Configuration & Customization
- [ ] 7.1 Add script arguments to `start.ts` for manual overrides (e.g., `--skip-training`, `--force-casino`)
- [ ] 7.2 Support custom bitnode config overrides via arguments or config file
- [ ] 7.3 Add dry-run mode that shows what would be launched without executing
- [ ] 7.4 Implement verbose logging mode for debugging startup issues

## Dependencies
- Tasks 1.x must complete before 3.x (need config system before launcher)
- Tasks 2.x can run parallel to 1.x (independent validation logic)
- Task 4.x requires 1.x, 2.x, 3.x complete (refactor uses all foundations)
- Tasks 5.x can run parallel to 4.x (independent script improvements)
- Tasks 6.x and 7.x are final polish after core implementation

## Validation Criteria
- [ ] `start.ts` successfully launches in BN1, BN2, BN4 without errors
- [ ] Scripts with unmet prerequisites are skipped with clear log messages
- [ ] Priority ordering is respected (high-priority scripts launch first)
- [ ] Existing functionality preserved for BN4 use case
- [ ] No runtime errors from missing APIs or insufficient RAM
- [ ] Status dashboard provides clear visibility into startup progress
