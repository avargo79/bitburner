# Implementation Plan: Autopilot System

**Directory**: `features/autopilot/` | **Date**: Wed Sep 10 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `features/autopilot/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded autopilot system specification successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: Bitburner automation (standalone script architecture)
   → Set Structure Decision: Single project with browser automation and decision engine
3. Evaluate Constitution Check section below
   → Violations: None detected - simple browser automation approach
   → Update Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md
   → No NEEDS CLARIFICATION markers in spec - research focuses on technical decisions
5. Execute Phase 1 → contracts, data-model.md, quickstart.md
6. Re-evaluate Constitution Check section
   → No violations expected - maintains simplicity with existing patterns
   → Update Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

## Summary
Implement an autonomous early game progression system that combines browser automation (via existing navigator system) with intelligent decision-making (via existing guide system) to automatically join factions, work for reputation, and purchase augmentations without user intervention. Uses zero-cost DOM access and stateless script design for RAM efficiency.

## Technical Context
**Language/Version**: TypeScript 5.x (Bitburner Netscript environment)  
**Primary Dependencies**: Bitburner NS API, existing navigator.ts, existing guide.ts, browser DOM APIs  
**Storage**: No persistent storage - gather data fresh from NS API each run  
**Testing**: In-game console testing, manual validation via quickstart.md  
**Target Platform**: Bitburner game environment (browser-based)
**Project Type**: Standalone Bitburner automation script with browser integration  
**Performance Goals**: <8GB RAM per server, <30s per automation action, 4+ hour continuous operation  
**Constraints**: NS API limitations, stateless operation, browser automation reliability, existing system compatibility  
**Scale/Scope**: Single server execution, 30-second evaluation cycles, early game progression (pre-Singularity)

## Constitution Check

**Simplicity**:
- [x] Single script with modular functions for different automation aspects
- [x] Using NS API directly for game state, DOM scraping for unavailable data
- [x] Simple in-memory data structures (objects for game state, arrays for action queues)
- [x] Avoiding over-engineering by building on proven navigator and guide systems

**Architecture**:
- [x] Follows existing script patterns (self-contained main function with ns parameter)
- [x] Uses standard NS API conventions (ns.getPlayer, ns.getServer, etc.)
- [x] Handles script arguments via ns.flags() for configuration options
- [x] Implements proper logging with ns.print() for status and ns.tprint() for important events

**Testing (NON-NEGOTIABLE)**:
- [x] Manual testing scenarios defined for each automation capability
- [x] In-game validation steps for faction joining, reputation building, augmentation purchasing
- [x] Performance benchmarks for RAM usage and execution timing
- [x] Error recovery scenarios for browser automation failures and state changes

**Bitburner Integration**:
- [x] RAM costs calculated: ~6-8GB total (NS API + minimal browser automation overhead)
- [x] NS API usage patterns validated against existing navigator and guide implementations
- [x] Stateless design confirmed (re-evaluate game state each cycle)
- [x] Single-server execution (no multi-server coordination needed for early game)

## Project Structure

### Documentation (this feature)
```
features/autopilot/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── game-state-interface.ts
│   ├── decision-engine-interface.ts
│   ├── automation-action-interface.ts
│   └── configuration-interface.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── autopilot.ts              # Main script implementation with automation loop
├── autopilot-types.ts        # TypeScript interfaces for game state and actions
└── autopilot-actions.ts      # Action implementations (faction join, work, purchase)

# Integration considerations:
# - Script is standalone and self-contained with main(ns: NS) function
# - Integrates with existing navigator.ts and guide.ts via direct imports
# - No central orchestration required - script manages its own execution cycle
# - Uses localStorage for configuration persistence across restarts
# - No remote scripts needed - early game automation runs on home server
```

## Phase 0: Outline & Research
1. **Extract technical decisions from feature requirements**:
   - Browser automation approach using existing navigator system
   - Game state reading combining NS API with DOM scraping
   - Decision engine integration with existing guide system
   - Configuration management and user control interfaces

2. **Research focus areas**:
   ```
   Task: "Research DOM scraping patterns for faction and augmentation discovery"
   Task: "Verify NS API capabilities for player stats and faction data"
   Task: "Analyze existing navigator system for automation action patterns"
   Task: "Calculate RAM costs for browser automation and state monitoring"
   Task: "Research guide system integration for ROI-based decision making"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Browser automation using zero-cost DOM access techniques
   - Rationale: Works before Singularity APIs, leverages proven navigator system
   - Alternatives considered: Pure NS API (limited data), complex UI frameworks (overhead)
   - RAM impact: 6-8GB total using stealth DOM access methods

**Output**: research.md with technical approach decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - GameState: player stats, factions, augmentations, money, current activity
   - AutomationConfig: user preferences, spending limits, automation boundaries
   - AutomationAction: planned actions with priority, timing, and success criteria
   - ProgressionTarget: faction goals, augmentation targets, stat requirements

2. **Generate service contracts** from functional requirements:
   - GameStateReader interface for combining NS API and DOM data
   - DecisionEngine interface for action planning and prioritization
   - AutomationExecutor interface for browser action execution
   - ConfigurationManager interface for user settings and persistence
   - Output TypeScript interfaces to `/contracts/`

3. **Generate manual test scenarios** from user stories:
   - Complete early game progression (CyberSec → NiteSec → augmentation purchase)
   - Configuration testing (conservative, balanced, aggressive modes)
   - Error recovery testing (faction conflicts, insufficient funds, UI changes)
   - Performance validation (RAM usage, execution timing, multi-hour operation)

4. **Design script integration**:
   - Standalone script execution with command-line configuration
   - Integration points with existing navigator and guide systems
   - Status reporting and user feedback mechanisms

**Output**: data-model.md, /contracts/*, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base structure
- Generate implementation tasks from Phase 1 design documents
- Each interface contract → TypeScript definition creation task [P]
- Each entity model → data structure implementation task [P]
- Each automation component → service implementation task
- Main autopilot script → integration and execution loop task
- Testing and validation → quickstart scenario execution task

**Ordering Strategy**:
- TypeScript interfaces and type definitions first (parallel execution possible)
- Core data models and game state management second
- Individual automation action implementations third
- Decision engine and configuration management fourth
- Main autopilot script integration fifth
- Testing and validation scenarios last

**Estimated Output**: 12-15 numbered, ordered tasks in tasks.md covering interface definition, component implementation, integration, and validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following standalone script patterns)  
**Phase 5**: Validation (run quickstart.md, performance testing, in-game verification)

## Complexity Tracking
*No violations requiring justification - design maintains simplicity*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Progress Tracking

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Bitburner integration validated
- [x] Complexity deviations documented (none required)

---
*Based on Bitburner Standalone Script Architecture - See existing navigator.ts and guide.ts patterns*