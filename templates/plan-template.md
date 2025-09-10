# Implementation Plan: [FEATURE]

**Directory**: `features/[feature-name]/` | **Date**: [DATE] | **Spec**: [link to spec.md]
**Input**: Feature specification from `features/[feature-name]/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: Bitburner automation (ScriptTask-based)
   → Set Structure Decision: Single project with task architecture
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: TypeScript 5.x (Bitburner Netscript environment)  
**Primary Dependencies**: Bitburner NS API, in-memory data structures  
**Storage**: No persistent storage - gather data fresh from NS API each run  
**Testing**: In-game console testing, manual validation via quickstart.md  
**Target Platform**: Bitburner game environment (browser-based)
**Project Type**: Standalone Bitburner automation script(s)  
**Performance Goals**: [RAM budget per server, execution timing constraints]  
**Constraints**: [NS API limitations, RAM costs, stateless operation]  
**Scale/Scope**: [server count, operation frequency, data volume]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Single script or minimal script collection?
- Using NS API directly? (no unnecessary abstractions)
- Simple in-memory data structures? (arrays, objects)
- Avoiding over-engineering? (no complex patterns without proven need)

**Architecture**:
- Follows existing script patterns? (self-contained with main function)
- Uses standard NS API conventions? (ns.getServer, ns.exec, etc.)
- Handles script arguments via ns.flags() or direct args?
- Implements proper logging with ns.print()/ns.tprint()?

**Testing (NON-NEGOTIABLE)**:
- Manual testing scenarios defined? (quickstart.md)
- In-game validation steps specified?
- Performance benchmarks included?
- Error recovery scenarios tested?

**Bitburner Integration**:
- RAM costs calculated and budgeted?
- NS API usage patterns validated?
- Stateless design confirmed (no persistence requirements)?
- Multi-server execution considered?

## Project Structure

### Documentation (this feature)
```
features/[feature-name]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── task-interface.ts
│   ├── service-contracts.ts
│   └── data-interfaces.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── [feature-name].ts          # Main script implementation
├── [feature-name]-types.ts    # TypeScript interfaces (if complex)
├── remote/
│   └── [feature-remote].ts    # Distributed execution scripts (if needed)
└── lib/
    └── [feature-utils].ts     # Shared utilities (if reusable)

# Integration considerations:
# - Scripts are standalone and self-contained
# - No central orchestration required
# - Each script handles its own persistence via localStorage
# - Remote scripts for distributed execution across servers
```

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each NS API dependency → capability verification
   - For each performance constraint → benchmarking task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for Bitburner automation context"
   For each NS API method:
     Task: "Verify NS API capabilities for {functionality}"
   For each RAM constraint:
     Task: "Calculate RAM costs for {operations}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen for Bitburner context]
   - Alternatives considered: [what else evaluated]
   - RAM impact: [memory cost analysis]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - IndexedDB store requirements
   - Data migration considerations

2. **Generate service contracts** from functional requirements:
   - ScriptTask interface extensions
   - Service method signatures
   - Database interaction patterns
   - Output TypeScript interfaces to `/contracts/`

3. **Generate manual test scenarios** from user stories:
   - Each story → quickstart validation steps
   - Performance benchmarks
   - Error condition testing

4. **Design ScriptTask integration**:
   - Task priority and scheduling
   - Dependency relationships
   - Resource allocation

**Output**: data-model.md, /contracts/*, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Each contract → interface creation task [P]
- Each entity → model creation task [P] 
- Each service → implementation task
- ScriptTask → main task implementation
- Integration → daemon registration

**Ordering Strategy**:
- Models before services before task implementation
- Contracts before implementation
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following Bitburner patterns)  
**Phase 5**: Validation (run quickstart.md, performance testing, in-game verification)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., Additional abstraction layer] | [specific Bitburner constraint] | [why direct approach insufficient] |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Bitburner integration validated
- [ ] Complexity deviations documented

---
*Based on Bitburner ScriptTask Architecture - See `src/models/ScriptTask.ts`*