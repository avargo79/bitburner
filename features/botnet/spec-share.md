# Feature Specification: Botnet Share Enhancement

**Feature Directory**: `features/botnet-share/`  
**Created**: Wed Sep 10 2025  
**Status**: Implementation-Ready  
**Input**: Intelligent RAM sharing functionality for botnet to maximize faction reputation during faction work

## Execution Flow (main)
```
1. User wants to maximize faction reputation gain while maintaining money farming
2. System detects when player is actively doing faction work
3. System allocates portion of botnet RAM to share function during faction work
4. System distributes share threads optimally across servers with CPU core priority
5. System automatically switches back to full money farming when faction work ends
6. System provides clear statistics on reputation bonus and resource allocation
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT faction work enhancement users need
- ❌ Avoid HOW thread allocation algorithms are implemented
- 🎮 Written for Bitburner automation stakeholders seeking reputation optimization

---

## User Scenarios & Testing

### Primary User Story
As a Bitburner player working for faction reputation, I want my botnet system to automatically dedicate a portion of its resources to the share function when I'm doing faction work, providing significant reputation bonuses while maintaining income generation. The system should automatically detect faction work status, optimize share thread distribution for maximum effectiveness, and seamlessly return to full money farming when faction work ends.

### Acceptance Scenarios
1. **Given** player starts faction work, **When** botnet detects "Working for" status, **Then** system automatically allocates configured percentage of RAM to share function
2. **Given** share threads are allocated, **When** system distributes threads, **Then** system prioritizes servers with more CPU cores for better effectiveness
3. **Given** faction work is active, **When** reputation is gained, **Then** system provides significant reputation bonus (25-45% depending on thread count)
4. **Given** player stops faction work, **When** faction status changes, **Then** system immediately reallocates all RAM back to money farming

### Edge Cases
- What happens when faction work is interrupted or paused?
- How does system handle when RAM availability changes during faction work?
- What occurs when no servers have sufficient RAM for share threads?
- How does automation adapt when CPU core counts vary across servers?

## Requirements

### Game Integration Requirements
- **GI-001**: System MUST integrate with existing botnet system without breaking HWGW functionality
- **GI-002**: System MUST detect faction work status using zero-cost DOM text scanning
- **GI-003**: System MUST gather server data dynamically including CPU core counts via NS API
- **GI-004**: System MUST operate as enhancement to existing botnet script with command-line options

### Performance Requirements
- **PR-001**: System MUST execute share allocation within 5 seconds of faction work detection
- **PR-002**: System MUST provide 25-45% faction reputation bonus with optimal thread allocation
- **PR-003**: System MUST handle thread allocation across 50+ servers without performance degradation
- **PR-004**: System MUST maintain existing botnet money farming performance when faction work is inactive

### Data Requirements
- **DR-001**: System MUST gather faction work status dynamically via DOM text scanning each evaluation cycle
- **DR-002**: System MUST track server CPU core counts and RAM availability for optimization calculations
- **DR-003**: System MUST maintain share thread allocation state during faction work sessions
- **DR-004**: System MUST expose share statistics through botnet status reporting

### Automation Requirements
- **AR-001**: System MUST automatically detect faction work start/stop without user intervention
- **AR-002**: System MUST adapt share allocation based on available RAM and server capabilities
- **AR-003**: System MUST prioritize share threads on servers with higher CPU core counts
- **AR-004**: System MUST log share allocation decisions and reputation bonus estimates

### Functional Requirements
- **FR-001**: System MUST detect "Working for [Faction]" text in game interface using zero-cost DOM access
- **FR-002**: System MUST allocate configurable percentage (10-25%) of total botnet RAM to share function
- **FR-003**: System MUST distribute share threads across servers prioritizing those with 4+ CPU cores
- **FR-004**: System MUST calculate and report estimated faction reputation bonus from share threads
- **FR-005**: System MUST automatically terminate share threads when faction work ends
- **FR-006**: System MUST provide command-line configuration for share percentage and enable/disable
- **FR-007**: System MUST maintain compatibility with existing botnet HWGW batching algorithms
- **FR-008**: System MUST copy share scripts to target servers and manage execution lifecycle
- **FR-009**: System MUST handle share thread failures and retry allocation on alternative servers
- **FR-010**: System MUST report share allocation statistics alongside existing botnet performance metrics

### Key Entities
- **Share Thread Allocation**: RAM budget, thread count, server distribution, CPU core optimization
- **Faction Work Status**: Detection state, active faction, work type, duration tracking
- **Server Resource Profile**: Hostname, available RAM, CPU cores, share thread capacity, effectiveness rating
- **Share Performance Metrics**: Active threads, reputation bonus estimate, resource utilization, allocation efficiency

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (TypeScript classes, NS API methods, thread allocation algorithms)
- [x] Focused on automation value and faction progression benefits
- [x] Written for Bitburner automation stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded to botnet enhancement feature
- [x] Dependencies and assumptions identified
- [x] RAM and performance constraints specified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---