# Implementation Plan: Simple Autonomous Botnet

**Directory**: `features/simple-botnet/` | **Date**: September 14, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `features/simple-botnet/spec.md`

## Summary
Implement a single standalone script (`src/simple-botnet.ts`) that autonomously discovers network servers, roots accessible targets, and coordinates basic HWGW operations for steady income generation. Uses direct NS API calls with in-memory data structures and linear execution flow: network discovery → server preparation → HWGW batch execution → repeat cycle.

## Technical Context
**Language/Version**: TypeScript 5.x (Bitburner Netscript environment)  
**Primary Dependencies**: Bitburner NS API, in-memory data structures  
**Storage**: No persistent storage - gather data fresh from NS API each run  
**Testing**: In-game console testing, manual validation via quickstart.md  
**Target Platform**: Bitburner game environment (browser-based)
**Project Type**: Single standalone Bitburner automation script  
**Performance Goals**: 8GB RAM budget on home server, 30s discovery/setup time  
**Constraints**: NS API limitations, stateless operation, linear execution flow  
**Scale/Scope**: 10+ concurrent HWGW operations, all accessible network servers

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
✅ Single script implementation (`src/simple-botnet.ts`)
✅ Using NS API directly (no utility files or complex abstractions)
✅ Simple in-memory data structures (arrays, objects, Map for server tracking)
✅ Avoiding over-engineering (linear execution flow, inline calculations)

**Architecture**:
✅ Follows existing script patterns (self-contained with main(ns: NS) function)
✅ Uses standard NS API conventions (ns.scan, ns.nuke, ns.exec, etc.)
✅ Handles script arguments via ns.flags() for optional configuration
✅ Implements proper logging with ns.print() for progress, ns.tprint() for major events

**Testing (NON-NEGOTIABLE)**:
✅ Manual testing scenarios defined (quickstart.md will cover fresh game state testing)
✅ In-game validation steps specified (script execution, income tracking)
✅ Performance benchmarks included (RAM usage, discovery timing)
✅ Error recovery scenarios tested (insufficient RAM, security changes)

**Bitburner Integration**:
✅ RAM costs calculated and budgeted (8GB base script, distributed execution)
✅ NS API usage patterns validated (scan, getServer, exec, getRunningScript)
✅ Stateless design confirmed (rediscover network state each execution)
✅ Multi-server execution considered (distribute HWGW scripts across botnet)

## Project Structure

### Documentation (this feature)
```
features/simple-botnet/
├── spec.md              # Feature specification (EXISTS)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── task-interface.ts
│   └── data-interfaces.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── simple-botnet.ts          # Single main script implementation
└── remote/                   # Reuse existing remote scripts
    ├── hk.ts                 # Hack operations (EXISTS)
    ├── wk.ts                 # Weaken operations (EXISTS)  
    ├── gr.ts                 # Grow operations (EXISTS)
    └── root.ts               # Server rooting (EXISTS)

# Integration approach:
# - Single script handles all coordination and decision-making
# - Reuse existing remote scripts for distributed HWGW execution
# - No additional utility files or abstractions needed
# - Linear execution flow with simple state management
```

## Phase 0: Outline & Research

### Research Tasks
1. **NS API Network Discovery Patterns**:
   - Research: Optimal ns.scan() usage patterns for complete network topology
   - Verify: ns.getServer() data completeness for target evaluation
   - Test: Performance characteristics of recursive network scanning

2. **HWGW Timing Calculation Methods**:
   - Research: Direct NS API methods for hack/grow/weaken timing (ns.getHackTime, etc.)
   - Calculate: Inline formulas for thread count calculations without external utilities
   - Verify: Security and money state synchronization patterns

3. **Remote Script Execution Patterns**:
   - Analyze: Existing remote script architecture (hk.ts, wk.ts, gr.ts patterns)
   - Verify: ns.exec() usage for distributed operation coordination
   - Test: RAM allocation and thread distribution across botnet servers

4. **Target Selection Algorithm**:
   - Research: Profitability calculation methods using direct NS API calls
   - Analyze: Server filtering criteria (security level, required hacking level, money)
   - Design: Simple ranking algorithm for target prioritization

**Output**: research.md with technical decisions and NS API usage patterns

## Phase 1: Design & Contracts

### Data Model Design (`data-model.md`)
Define in-memory data structures for:
- **ServerInfo**: Network topology and server characteristics from NS API
- **TargetServer**: Profitable servers selected for HWGW operations  
- **BotnetServer**: Rooted servers available for executing operations
- **OperationBatch**: HWGW batch coordination data (timing, threads, target)

### Service Contracts (`contracts/`)
- **NetworkScanner**: Interface for server discovery and rooting operations
- **TargetSelector**: Interface for profitability analysis and target ranking
- **BatchCoordinator**: Interface for HWGW operation timing and execution
- **SimpleBotnetScript**: Main script interface and data flow patterns

### Manual Testing (`quickstart.md`)
- Fresh game state testing scenarios
- Network discovery validation steps  
- HWGW operation verification methods
- Performance monitoring approaches
- Error recovery testing procedures

**Output**: data-model.md, /contracts/*, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Core Implementation Tasks**:
   - Network discovery implementation (recursive scanning with ns.scan)
   - Server rooting logic (port opening + ns.nuke integration)
   - Target evaluation algorithm (profitability calculations)
   - HWGW timing calculations (inline formulas using ns.getHackTime, etc.)
   - Batch coordination system (operation scheduling and execution)
   - Main execution loop (linear flow: discover → root → target → execute → repeat)

2. **Integration Tasks**:
   - Remote script integration (reuse existing hk.ts, wk.ts, gr.ts)
   - RAM management and thread allocation
   - Status logging and progress reporting
   - Error handling and recovery mechanisms

**Ordering Strategy**:
- Network operations before target analysis
- Target analysis before batch coordination  
- Individual components before main execution loop
- Integration and testing after core implementation

**Estimated Output**: 10-12 numbered, ordered implementation tasks

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (single script in src/simple-botnet.ts)  
**Phase 5**: Validation (quickstart.md testing, performance verification)

## Complexity Tracking
*No violations - Constitution Check passed cleanly*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | Clean single-script architecture | N/A |

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Bitburner integration validated
- [x] Complexity deviations documented (None required)

---
*Based on Bitburner Standalone Script Architecture - Simple autonomous automation pattern*