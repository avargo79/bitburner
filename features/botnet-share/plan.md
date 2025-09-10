# Implementation Plan: Botnet Share Enhancement

**Directory**: `features/botnet-share/` | **Date**: Wed Sep 10 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `features/botnet-share/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded botnet share enhancement specification successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: Bitburner automation (existing botnet extension)
   → Set Structure Decision: Enhancement to existing botnet.ts with minimal integration
3. Evaluate Constitution Check section below
   → Violations: None detected - simple enhancement with proven patterns
   → Update Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md
   → No NEEDS CLARIFICATION markers in spec - research focuses on optimization decisions
5. Execute Phase 1 → contracts, data-model.md, quickstart.md
6. Re-evaluate Constitution Check section
   → No violations expected - maintains simplicity with minimal code additions
   → Update Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

## Summary
Extend existing botnet system with intelligent RAM sharing capability that automatically detects faction work and allocates configurable percentage of botnet resources to share function for reputation bonuses. Uses zero-cost DOM scanning for faction detection and optimizes thread distribution based on server CPU cores.

## Technical Context
**Language/Version**: TypeScript 5.x (Bitburner Netscript environment)  
**Primary Dependencies**: Existing botnet.ts, Bitburner NS API, zero-cost DOM access for faction detection  
**Storage**: No persistent storage - gather data fresh from NS API each run  
**Testing**: In-game console testing, manual validation via quickstart.md  
**Target Platform**: Bitburner game environment (browser-based)
**Project Type**: Enhancement to existing standalone Bitburner automation script  
**Performance Goals**: <2.4GB RAM per share thread, <5s faction detection response time, 25-45% reputation bonus  
**Constraints**: Existing botnet compatibility, zero-cost faction detection, server RAM availability  
**Scale/Scope**: Enhancement to existing botnet covering 50+ servers, 500-2000 share threads

## Constitution Check

**Simplicity**:
- [x] Minimal extension to existing botnet.ts script (~30 lines of additional code)
- [x] Using existing NS API patterns with zero-cost DOM access for faction detection
- [x] Simple RAM allocation logic with percentage-based distribution
- [x] Avoiding over-engineering by leveraging existing server management infrastructure

**Architecture**:
- [x] Follows existing botnet script patterns (extends main execution loop)
- [x] Uses standard NS API conventions (ns.share, ns.scp, ns.exec)
- [x] Handles script arguments via existing ns.flags() configuration system
- [x] Implements proper logging with existing ns.print() patterns

**Testing (NON-NEGOTIABLE)**:
- [x] Manual testing scenarios defined for faction detection and share allocation
- [x] In-game validation steps for reputation bonus measurement
- [x] Performance benchmarks for RAM utilization and thread distribution
- [x] Error recovery scenarios for share thread failures and resource constraints

**Bitburner Integration**:
- [x] RAM costs calculated: 2.4GB per share thread + negligible faction detection overhead
- [x] NS API usage patterns validated against existing botnet implementation
- [x] Zero-cost design confirmed for faction detection (DOM text scanning)
- [x] Multi-server execution leverages existing botnet server management

## Project Structure

### Documentation (this feature)
```
features/botnet-share/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── share-allocation-interface.ts
│   ├── faction-detection-interface.ts
│   └── server-resource-interface.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── botnet.ts                    # Enhanced with share functionality (existing file)
├── remote/
│   └── simple-share.js          # New lightweight share script for remote execution

# Integration considerations:
# - Enhancement integrates directly into existing botnet.ts main execution loop
# - New remote share script enables distributed share execution across servers
# - Zero-cost faction detection uses existing browser API stealth techniques
# - Command-line arguments extend existing botnet configuration system
# - No central orchestration changes - botnet manages share lifecycle
```

## Phase 0: Outline & Research
1. **Extract technical decisions from feature requirements**:
   - Zero-cost faction detection using DOM text scanning
   - Share thread allocation algorithms based on server CPU cores
   - RAM percentage allocation strategies for balanced resource usage
   - Integration points with existing botnet execution cycle

2. **Research focus areas**:
   ```
   Task: "Research faction detection reliability using DOM text scanning techniques"
   Task: "Analyze share function mechanics and thread effectiveness calculations"
   Task: "Investigate optimal RAM allocation percentages for faction/money balance"
   Task: "Research CPU core impact on share thread effectiveness"
   Task: "Validate zero-cost DOM access patterns for faction status detection"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Zero-cost faction detection with logarithmic share effectiveness
   - Rationale: Enables automatic switching without RAM penalties, maximizes reputation bonus
   - Alternatives considered: Singularity API (limited), manual triggers (defeats automation)
   - RAM impact: 2.4GB per share thread, 0GB for faction detection

**Output**: research.md with share mechanics and faction detection approach documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - ShareAllocation: thread count, RAM budget, server distribution, effectiveness estimate
   - FactionStatus: detection state, active faction, work type, status timestamps
   - ServerResource: hostname, available RAM, CPU cores, share capacity, allocation priority
   - ShareMetrics: active threads, reputation bonus, resource utilization, performance stats

2. **Generate service contracts** from functional requirements:
   - FactionDetector interface for zero-cost status monitoring
   - ShareAllocator interface for thread distribution and optimization
   - ServerResourceManager interface for capacity assessment and priority ranking
   - ShareMetricsTracker interface for performance monitoring and reporting
   - Output TypeScript interfaces to `/contracts/`

3. **Generate manual test scenarios** from user stories:
   - Faction work detection accuracy (start/stop faction work scenarios)
   - Share thread allocation optimization (various server configurations)
   - Reputation bonus measurement (before/after faction work performance)
   - Resource allocation balance (money farming impact assessment)

4. **Design botnet integration**:
   - Extension points in existing botnet execution loop
   - Command-line argument integration with existing configuration
   - Share lifecycle management within existing server management
   - Performance reporting integration with existing statistics

**Output**: data-model.md, /contracts/*, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base structure
- Generate implementation tasks from Phase 1 design documents
- Each interface contract → TypeScript definition creation task [P]
- Each enhancement component → integration implementation task
- Share script creation → remote script development task
- Main botnet enhancement → integration and testing task
- Validation scenarios → quickstart execution and performance measurement task

**Ordering Strategy**:
- TypeScript interfaces and contracts first (parallel execution possible)
- Remote share script implementation second
- Faction detection enhancement third  
- Share allocation logic implementation fourth
- Botnet integration and lifecycle management fifth
- Testing and validation scenarios last

**Estimated Output**: 8-10 numbered, ordered tasks in tasks.md covering interface definition, remote script creation, botnet integration, and validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following botnet enhancement patterns)  
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
*Based on Bitburner Enhancement Architecture - See existing botnet.ts extension patterns*