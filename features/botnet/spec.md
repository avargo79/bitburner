# Feature Specification: Botnet Management System

**Feature Directory**: `features/botnet/`  
**Created**: 2025-09-10  
**Status**: Implemented (Existing Feature)  
**Input**: Complete botnet lifecycle automation with advanced HWGW batching

## Execution Flow (main)
```
1. User wants to automate entire botnet lifecycle for maximum income
2. System automatically discovers and roots all accessible servers
3. System purchases and manages additional servers up to configured limits
4. System coordinates precise HWGW batching across entire botnet
5. System monitors performance and adapts to changing conditions
6. System provides real-time statistics and failure detection
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT botnet automation capabilities users need
- ❌ Avoid HOW HWGW timing calculations are implemented
- 🎮 Written for Bitburner automation stakeholders seeking income optimization

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a Bitburner player wanting to maximize income through automation, I want a comprehensive botnet system that automatically discovers servers, gains root access, purchases additional servers, and coordinates sophisticated HWGW attacks across the entire network. The system should handle all complexity of timing, thread allocation, and performance monitoring while providing clear statistics on income generation.

### Acceptance Scenarios
1. **Given** player has basic hacking skills, **When** botnet script runs, **Then** system automatically discovers and roots all accessible servers within skill range
2. **Given** player has sufficient funds, **When** system needs more RAM, **Then** system automatically purchases servers up to configured maximum
3. **Given** servers are available for targeting, **When** system runs HWGW batching, **Then** system coordinates precise timing across multiple servers for maximum income
4. **Given** servers fail or become unavailable, **When** errors occur, **Then** system automatically recovers and reallocates threads to working servers

### Edge Cases
- What happens when player lacks funds for server purchases?
- How does system handle when target servers become impossible to hack?
- What occurs when purchased servers reach RAM limits?
- How does automation adapt when player gains new hacking skills?

## Requirements *(mandatory)*

### Game Integration Requirements
- **GI-001**: System MUST integrate with Bitburner NS API through standalone script execution
- **GI-002**: System MUST respect server RAM constraints and optimize thread allocation
- **GI-003**: System MUST gather network and server data dynamically via NS API calls
- **GI-004**: System MUST operate as autonomous script that can run continuously

### Performance Requirements
- **PR-001**: System MUST coordinate HWGW batches across entire botnet within available RAM
- **PR-002**: System MUST complete rooting operations within 30 seconds per server
- **PR-003**: System MUST handle server purchases and upgrades within 10 seconds each
- **PR-004**: System MUST scale HWGW operations to 25+ servers without timing degradation

### Data Requirements
- **DR-001**: System MUST discover and analyze all accessible servers dynamically via network scanning
- **DR-002**: System MUST track server capabilities, security levels, and money available
- **DR-003**: System MUST monitor HWGW batch timing and success rates in real-time
- **DR-004**: System MUST maintain statistics on income generation and system performance

### Automation Requirements
- **AR-001**: System MUST operate continuously without manual intervention once started
- **AR-002**: System MUST adapt to changing player skills and server availability
- **AR-003**: System MUST prioritize targets based on income potential and hack feasibility
- **AR-004**: System MUST provide clear logging of operations, income, and system status

### Functional Requirements
- **FR-001**: System MUST automatically discover all servers in the network through recursive scanning
- **FR-002**: System MUST gain root access to servers using available exploit tools and nuke program
- **FR-003**: System MUST purchase additional servers when beneficial for income generation
- **FR-004**: System MUST upgrade server RAM to optimal levels within budget constraints
- **FR-005**: System MUST coordinate HWGW attacks with precise timing across multiple servers
- **FR-006**: System MUST allocate threads optimally across available RAM on all servers
- **FR-007**: System MUST select target servers based on income potential and success probability
- **FR-008**: System MUST monitor and report real-time statistics on money generation
- **FR-009**: System MUST detect and recover from failed operations automatically
- **FR-010**: System MUST adapt strategy based on changing game conditions

### Key Entities *(include if feature involves data)*
- **ServerData**: Represents discovered servers with security, capacity, and financial information
- **BotnetMember**: Individual server in botnet with capabilities and current usage
- **HWGWBatch**: Coordinated attack sequence with precise timing and thread allocation
- **TargetServer**: Servers selected for income generation with profitability analysis
- **PurchasedServer**: Player-owned servers with upgrade and management capabilities
- **BotnetStats**: Performance metrics including income, success rates, and efficiency
- **NetworkTopology**: Complete network map with server relationships and accessibility

---

## Review & Acceptance Checklist
*GATE: Manual review for existing feature documentation*

### Content Quality
- [x] No implementation details (HWGW formulas, NS API methods, thread calculations)
- [x] Focused on automation value and income optimization benefits
- [x] Written for Bitburner automation stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable (income generation, server count, success rates)
- [x] Scope covers complete botnet lifecycle automation
- [x] Dependencies and assumptions identified
- [x] RAM and performance constraints specified

---

## Execution Status
*Updated for existing feature documentation*

- [x] User description parsed (existing botnet functionality)
- [x] Key concepts extracted (network discovery, HWGW batching, server management)
- [x] Ambiguities marked (none - existing implementation provides clarity)
- [x] User scenarios defined (comprehensive income automation)
- [x] Requirements generated (based on current implementation capabilities)
- [x] Entities identified (servers, batches, statistics, network topology)
- [x] Review checklist passed (documentation complete)

---