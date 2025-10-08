# Feature Specification: Simple Autonomous Botnet

**Feature Directory**: `features/simple-botnet/`  
**Created**: September 14, 2025  
**Status**: Draft  
**Input**: User description: "Create a simple autonomous botnet script for Bitburner that automatically discovers and roots servers, then coordinates basic HWGW (Hack-Weaken-Grow-Weaken) operations across the network for steady income generation. The script should be self-contained in a single file, use minimal configuration, and focus on core automation without advanced optimization features. Target users want reliable income automation with simple setup and minimal maintenance."

---

## User Scenarios & Testing

### Primary User Story
A Bitburner player wants steady income generation without manual server management or complex configuration. They run a single script that automatically finds and compromises servers across the network, then coordinates hacking operations to generate consistent money over time with minimal player intervention.

### Acceptance Scenarios
1. **Given** a fresh game state with only basic servers available, **When** the botnet script is executed, **Then** it discovers and roots all accessible servers within the network
2. **Given** a network of rooted servers, **When** the script runs HWGW operations, **Then** it generates steady income from multiple targets simultaneously
3. **Given** the script is running, **When** new servers become available (through hacking level increases), **Then** it automatically discovers and integrates them into operations
4. **Given** insufficient RAM for complex operations, **When** the script encounters resource constraints, **Then** it scales operations appropriately and continues basic income generation

### Edge Cases
- What happens when player's hacking level is too low to root any profitable servers?
- How does system handle server security changes or money depletion during operations?
- What occurs when the script runs out of available RAM across all servers?

## Requirements

### Game Integration Requirements
- **GI-001**: System MUST integrate with Bitburner NS API through direct NS parameter usage
- **GI-002**: System MUST respect server RAM constraints and operate within available memory limits
- **GI-003**: System MUST gather network state dynamically from NS API calls (no persistent storage needed)
- **GI-004**: System MUST be implemented as a single standalone script that can be executed via NS.run()

### Performance Requirements
- **PR-001**: System MUST execute within 8GB RAM budget on home server for core coordination
- **PR-002**: System MUST complete discovery and setup operations within 30 seconds to avoid blocking gameplay
- **PR-003**: System MUST handle at least 10 concurrent HWGW operations across multiple servers
- **PR-004**: System MUST scale operations based on available network resources without manual tuning

### Data Requirements
- **DR-001**: System MUST gather server network topology, security levels, and money data via NS API calls each execution
- **DR-002**: System MUST maintain operation state in memory during script execution only
- **DR-003**: System MUST handle script restarts by rediscovering network state (fully stateless design)
- **DR-004**: System MUST output progress and status information via ns.print() for player monitoring

### Automation Requirements
- **AR-001**: System MUST operate autonomously without user intervention after initial script execution
- **AR-002**: System MUST adapt to changing server conditions (security levels, money availability, new servers)
- **AR-003**: System MUST prioritize target servers based on profitability and hack success probability
- **AR-004**: System MUST log all major activities (discoveries, roots, operation starts) using ns.tprint() for visibility

### Functional Requirements
- **FR-001**: System MUST discover all servers accessible from current network position through recursive scanning
- **FR-002**: System MUST attempt to root discovered servers using available port opening programs and SSH access
- **FR-003**: System MUST identify profitable target servers based on money available and player's hacking capability
- **FR-004**: System MUST coordinate basic HWGW cycles (Hack-Weaken-Grow-Weaken) on target servers
- **FR-005**: System MUST distribute operations across available botnet servers to maximize parallel execution
- **FR-006**: System MUST handle operation timing to prevent security level from becoming unmanageable
- **FR-007**: System MUST restart operations automatically when targets are depleted or security becomes too high
- **FR-008**: System MUST require minimal configuration (target all profitable servers, use all available RAM)

### Key Entities

- **Server**: Represents discovered network nodes with properties like hostname, security level, max money, required hacking level, and root access status
- **Target**: Profitable servers selected for HWGW operations based on money potential and accessibility
- **Operation**: Individual HWGW cycles with timing coordination and resource allocation across botnet servers
- **Botnet**: Collection of rooted servers available for executing operations, excluding targets being hacked

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (TypeScript classes, NS API methods, database schemas)
- [x] Focused on automation value and game benefits
- [x] Written for Bitburner automation stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded to single automation feature
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