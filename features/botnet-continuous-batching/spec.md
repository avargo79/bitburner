# Feature Specification: Continuous HWGW Batch Scheduling

**Feature Directory**: `features/botnet-continuous-batching/`  
**Created**: 2025-09-12  
**Status**: Draft  
**Input**: Create continuous batch scheduling system that launches multiple HWGW batches with precise timing so they complete in sequence for maximum throughput, eliminating the current 10-second artificial delays

## Execution Flow (main)
```
1. User wants to maximize botnet income by eliminating batch spacing inefficiencies
2. System calculates optimal batch timing windows based on HWGW operation durations
3. System schedules multiple batches to complete sequentially with minimal gaps
4. System launches batches every 20-200ms instead of 10-second intervals
5. System monitors batch completion timing and adjusts scheduling dynamically
6. System achieves 10-500x throughput improvement over single-batch mode
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT continuous batching capabilities users need for maximum income
- ❌ Avoid HOW batch queue implementation details are structured
- 🎮 Written for Bitburner automation stakeholders seeking optimal resource utilization

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a Bitburner player wanting to maximize income from my botnet, I want a continuous batch scheduling system that eliminates wasted time between HWGW batches. Instead of launching one batch every 10 seconds and leaving servers idle, I want the system to launch batches every 20-200ms with precise timing so each batch completes exactly when the next begins, achieving maximum throughput and dramatically higher money generation rates.

### Acceptance Scenarios
1. **Given** servers have sufficient RAM for multiple batches, **When** continuous scheduling activates, **Then** system launches batches every 20-200ms instead of 10-second intervals
2. **Given** HWGW batches are running continuously, **When** batches complete, **Then** each batch finishes exactly when the next batch's operations begin
3. **Given** RAM becomes limited, **When** system detects insufficient resources, **Then** system dynamically adjusts batch count to stay within RAM constraints
4. **Given** batch timing conflicts occur, **When** system detects overlap, **Then** system automatically adjusts scheduling intervals to prevent conflicts

### Edge Cases
- What happens when available RAM drops below multi-batch threshold?
- How does system handle when batch operations take longer than expected?
- What occurs when network topology changes during continuous operation?
- How does automation adapt when new servers become available mid-operation?

## Requirements *(mandatory)*

### Game Integration Requirements
- **GI-001**: System MUST integrate with existing botnet-v3 architecture through modular enhancement
- **GI-002**: System MUST respect server RAM constraints and prevent over-allocation across all servers
- **GI-003**: System MUST gather server state and timing data dynamically via NS API calls
- **GI-004**: System MUST operate as enhancement to existing botnet scripts without breaking current functionality

### Performance Requirements
- **PR-001**: System MUST achieve 10-50x throughput improvement over current single-batch scheduling
- **PR-002**: System MUST maintain HWGW batch timing precision within 20ms accuracy
- **PR-003**: System MUST handle 50-500 concurrent batches across entire botnet without timing degradation
- **PR-004**: System MUST scale batch scheduling to all available servers up to RAM capacity limits

### Data Requirements
- **DR-001**: System MUST gather real-time HWGW operation durations (hack time, grow time, weaken time) via NS API
- **DR-002**: System MUST track batch completion timing and success rates for scheduling optimization
- **DR-003**: System MUST maintain batch queue state in memory during script execution
- **DR-004**: System MUST provide real-time statistics on batch throughput and timing efficiency

### Automation Requirements
- **AR-001**: System MUST operate continuously without manual intervention once activated
- **AR-002**: System MUST adapt batch scheduling to changing server availability and RAM constraints
- **AR-003**: System MUST prioritize batch scheduling based on optimal timing windows and resource availability
- **AR-004**: System MUST log batch scheduling activities and performance metrics for monitoring

### Functional Requirements
- **FR-001**: System MUST calculate optimal batch timing windows based on target server HWGW operation durations
- **FR-002**: System MUST schedule multiple batches with precise start times to eliminate idle time between completions
- **FR-003**: System MUST launch batches at 20-200ms intervals instead of current 10-second delays
- **FR-004**: System MUST monitor batch completion timing and detect scheduling conflicts or delays
- **FR-005**: System MUST dynamically adjust batch count based on available RAM across all servers
- **FR-006**: System MUST maintain HWGW batch coordination (hack→weaken1→grow→weaken2 timing) while running continuously
- **FR-007**: System MUST provide fallback to single-batch mode when continuous scheduling becomes impossible
- **FR-008**: System MUST integrate with existing target selection and server management systems
- **FR-009**: System MUST preserve all current safety mechanisms (batch tracking, timeout detection, cleanup)
- **FR-010**: System MUST achieve measurable throughput improvement (batches per minute) over current implementation

### Key Entities *(include if feature involves data)*
- **BatchSchedule**: Represents timing plan for multiple batches with start times and completion windows
- **TimingWindow**: Duration and spacing calculations for optimal batch sequencing
- **BatchQueue**: Collection of scheduled batches with precise execution timing
- **ThroughputMetrics**: Performance measurements comparing continuous vs single-batch operation
- **ResourceCapacity**: Available RAM and thread allocation across botnet for maximum batch count
- **SchedulingConflict**: Detection and resolution of batch timing overlaps or resource contention

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (batch queue data structures, timing algorithms, class hierarchies)
- [x] Focused on automation value and income maximization benefits
- [x] Written for Bitburner automation stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable (throughput improvement, timing precision)
- [x] Scope is clearly bounded to continuous batch scheduling enhancement
- [x] Dependencies and assumptions identified (botnet-v3 architecture)
- [x] RAM and performance constraints specified

---

## Execution Status
*Updated during processing*

- [x] User description parsed (continuous batch scheduling for maximum throughput)
- [x] Key concepts extracted (timing windows, batch queuing, resource optimization)
- [x] Ambiguities marked (none - clear performance optimization goal)
- [x] User scenarios defined (eliminate 10-second delays, achieve 10-500x improvement)
- [x] Requirements generated (timing precision, throughput targets, integration)
- [x] Entities identified (schedules, queues, metrics, capacity management)
- [x] Review checklist passed (specification complete)

---