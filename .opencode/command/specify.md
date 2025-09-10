---
description: Create feature specification using Bitburner template
agent: plan
model: anthropic/claude-3-5-sonnet-20241022
---

You are creating a feature specification for the Bitburner TypeScript automation framework.

Create a specification document in the `features/[feature-name]/spec.md` file using the template from `templates/spec-template.md`.

Feature to specify: $ARGUMENTS

Focus on WHAT the feature does and WHY it's needed, not HOW to implement it. Include:
- Business requirements and user value
- Game Integration Requirements (GI-xxx) - NS API integration, stateless script execution
- Performance Requirements (PR-xxx) - RAM constraints, execution timing  
- Data Requirements (DR-xxx) - Dynamic data gathering via NS API, in-memory state
- Automation Requirements (AR-xxx) - Autonomous operation, logging
- Success criteria and acceptance tests

Use Bitburner-specific patterns: NS API integration, stateless operation, RAM constraints, autonomous operation.

Follow the spec-template.md structure and create organized documentation that serves as the foundation for technical planning.