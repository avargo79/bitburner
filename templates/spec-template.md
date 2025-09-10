# Feature Specification: [FEATURE NAME]

**Feature Directory**: `features/[feature-name]/`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 🎮 Written for Bitburner automation stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "hacking system" without target criteria), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - Target server criteria and selection logic
   - RAM allocation and resource management
   - Performance targets and scaling limits
   - Error handling and recovery behaviors
   - Integration with existing task system
   - Game state persistence requirements

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
[Describe the main automation journey in plain language]

### Acceptance Scenarios
1. **Given** [initial game state], **When** [automation trigger], **Then** [expected outcome]
2. **Given** [initial game state], **When** [automation action], **Then** [expected outcome]

### Edge Cases
- What happens when [boundary condition, e.g., insufficient RAM]?
- How does system handle [error scenario, e.g., server becomes unavailable]?

## Requirements *(mandatory)*

### Game Integration Requirements
- **GI-001**: System MUST integrate with Bitburner NS API through direct NS parameter usage
- **GI-002**: System MUST respect server RAM constraints and report memory usage
- **GI-003**: System MUST gather state dynamically from NS API calls (no persistent storage needed)
- **GI-004**: System MUST be implemented as standalone script(s) that can be executed via NS.run() or NS.exec()

### Performance Requirements
- **PR-001**: System MUST execute within [X]GB RAM budget per server
- **PR-002**: System MUST complete operations within [X]ms to avoid blocking game performance
- **PR-003**: System MUST handle [X] concurrent operations across servers
- **PR-004**: System MUST scale to [X] servers without performance degradation

### Data Requirements
- **DR-001**: System MUST gather [specific data] dynamically via NS API calls each execution
- **DR-002**: System MUST maintain data consistency during script execution (in-memory only)
- **DR-003**: System MUST handle script restarts gracefully (stateless design)
- **DR-004**: System MUST expose data through [specific interfaces or script outputs]

### Automation Requirements
- **AR-001**: System MUST operate autonomously without user intervention
- **AR-002**: System MUST adapt to changing game conditions [specify conditions]
- **AR-003**: System MUST prioritize operations based on [criteria]
- **AR-004**: System MUST log activities using ns.print() or ns.tprint() for monitoring

### Functional Requirements
- **FR-001**: System MUST [specific capability, e.g., "discover available contracts"]
- **FR-002**: System MUST [specific capability, e.g., "analyze contract difficulty"]  
- **FR-003**: System MUST [key interaction, e.g., "execute solution algorithms"]
- **FR-004**: System MUST [data requirement, e.g., "cache successful patterns"]
- **FR-005**: System MUST [behavior, e.g., "retry failed contracts with different approaches"]

*Example of marking unclear requirements:*
- **FR-006**: System MUST prioritize contracts by [NEEDS CLARIFICATION: priority criteria not specified - reward value, difficulty, success rate?]
- **FR-007**: System MUST retry failed contracts [NEEDS CLARIFICATION: retry limit and backoff strategy not specified]

### Key Entities *(include if feature involves data)*
- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (TypeScript classes, NS API methods, database schemas)
- [ ] Focused on automation value and game benefits
- [ ] Written for Bitburner automation stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded to single automation feature
- [ ] Dependencies and assumptions identified
- [ ] RAM and performance constraints specified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---