# Tasks: [FEATURE NAME]

**Input**: Design documents from `features/[feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: Bitburner context, ScriptTask architecture, database requirements
2. Load optional design documents:
   → data-model.md: Extract entities → IndexedDB store tasks
   → contracts/: Each interface → implementation task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: TypeScript interfaces, database schema
   → Models: Entity definitions, IndexedDB stores
   → Services: Business logic, NS API wrappers
   → Tasks: ScriptTask implementation, daemon integration
   → Testing: Manual validation, performance benchmarks
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Models before services before tasks
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have implementations?
   → All entities have IndexedDB stores?
   → ScriptTask properly integrated?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths relative to src/

## Bitburner Script Patterns
- **Main Scripts**: Standalone TypeScript files in `src/` with main(ns: NS) function
- **Remote Scripts**: Lightweight scripts in `src/remote/` for distributed execution
- **Utilities**: Shared code in `src/lib/` (imported by main scripts)
- **Interfaces**: TypeScript types in separate files (if complex enough to warrant it)

## Phase 3.1: Setup & Interfaces
- [ ] T001 [P] Create TypeScript interfaces in src/[feature]-types.ts (if needed)
- [ ] T002 [P] Create utility functions in src/lib/[feature]-utils.ts (if reusable)
- [ ] T003 Set up script argument parsing with ns.flags() or direct args handling

## Phase 3.2: Core Implementation
- [ ] T004 Implement main script logic in src/[feature].ts
- [ ] T005 Add NS API integration (server scanning, data collection, etc.)
- [ ] T006 Implement core automation logic
- [ ] T007 Add error handling and logging (ns.print, ns.tprint)

## Phase 3.3: Data & State Management
- [ ] T008 [P] Implement in-memory data structures (arrays, objects, Maps)
- [ ] T009 [P] Add NS API data gathering functions (ns.getServer, ns.scan, etc.)
- [ ] T010 [P] Create data validation and error handling

## Phase 3.4: Distribution (if multi-server)
- [ ] T011 Create remote script in src/remote/[feature]-remote.ts
- [ ] T012 Implement script distribution via ns.scp()
- [ ] T013 Add remote execution via ns.exec()
- [ ] T014 Handle remote script coordination and results

## Phase 3.5: Validation
- [ ] T015 [P] Execute quickstart.md manual testing scenarios
- [ ] T016 [P] Performance testing (RAM usage, execution time)
- [ ] T017 [P] Error condition testing (server unavailable, insufficient RAM)
- [ ] T018 [P] Script restart and stateless operation validation
- [ ] T019 Multi-server scaling validation (if applicable)

## Dependencies
- Setup (T001-T003) before data layer (T004-T006)
- Data layer before service layer (T007-T009)
- Service layer before task implementation (T010-T013)
- Task implementation before integration (T014-T017)
- Integration before validation (T018-T022)

## Parallel Example
```
# Launch T001-T003 together:
Task: "Create TypeScript interfaces in src/models/[feature]-types.ts"
Task: "Create service contracts in src/lib/[feature]-service.ts" 
Task: "Create database schema interfaces in src/models/[feature]-data.ts"
```

## Bitburner-Specific Validation
- [ ] RAM costs calculated and within budget
- [ ] NS API methods verified and accessible
- [ ] Script operates statelessly (gathers data fresh each run)
- [ ] Script can be executed via ns.run() or ns.exec()
- [ ] Performance meets game timing requirements
- [ ] Multi-server execution respects constraints (if applicable)

## Notes
- [P] tasks = different files, no dependencies
- Follow existing import patterns (relative imports, @ns alias)
- Scripts gather data fresh from NS API each execution (stateless design)
- Implement proper argument handling via ns.flags() or args array
- Add comprehensive logging with ns.print() and ns.tprint()

## Task Generation Rules
*Applied during main() execution*

1. **From Interfaces**:
   - Each data structure → interface definition task [P]
   - Each utility function → implementation task [P]
   
2. **From Requirements**:
   - Each automation requirement → main script functionality
   - Each distributed operation → remote script task
   
3. **From Architecture**:
   - Main script → core implementation task
   - Remote scripts → distribution tasks
   - Data gathering → NS API integration tasks

4. **Ordering**:
   - Interfaces → Utilities → Main Script → Remote Scripts → Validation
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All interfaces have corresponding implementations
- [ ] Main script follows Bitburner patterns (main function, NS parameter)
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Bitburner patterns followed (stateless design, NS API usage, etc.)