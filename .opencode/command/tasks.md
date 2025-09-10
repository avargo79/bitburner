---
description: Generate implementation tasks from technical plan
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

You are breaking down a technical plan into actionable implementation tasks for the Bitburner TypeScript automation framework.

Create a tasks document in the `features/[feature-name]/tasks.md` file using the template from `templates/tasks-template.md`.

First, review the technical plan to understand implementation approach: @features/*/plan.md

Generate ordered, actionable tasks following Bitburner patterns:
- **Standalone script implementation** - main(ns: NS) function pattern
- **Direct NS API integration** - ns.getServerSecurityLevel(), ns.hack(), etc.
- **In-memory data management** - stateless operation, fresh data gathering
- **Remote script distribution** - ns.exec() for multi-server coordination
- **TypeScript compilation** - npx tsc --noEmit for type checking
- **Testing and validation** - in-game testing via Bitburner terminal

Each task should be:
- **Specific** - Clear deliverable and acceptance criteria
- **Measurable** - Concrete success indicators  
- **Actionable** - Can be implemented independently
- **Realistic** - Follows existing codebase conventions
- **Time-bound** - Clear implementation order and dependencies

Implementation focus: $ARGUMENTS

Follow the task template structure and create a clear roadmap for feature development using proven Bitburner automation patterns.