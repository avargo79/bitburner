---
description: Create technical implementation plan using Bitburner patterns
agent: plan
model: anthropic/claude-3-5-sonnet-20241022
---

You are creating a technical implementation plan for the Bitburner TypeScript automation framework.

Create a plan document in the `features/[feature-name]/plan.md` file using the template from `templates/plan-template.md`.

First, review the specification to understand requirements: @features/*/spec.md

Technical approach: $ARGUMENTS

Define HOW to implement using our architecture:
- **Standalone scripts** with main(ns: NS) functions - each script is self-contained
- **Direct NS API usage** and RAM cost considerations - no external dependencies
- **Stateless design** - gather data fresh from NS API each run, no persistent storage
- **Self-contained interfaces** - define types and data structures inline per script  
- **Multi-server distribution** - use ns.exec() and remote scripts for parallel processing
- **Browser API integration** - use stealth techniques to bypass RAM penalties

Include:
- Component architecture and script organization
- Data flows and NS API interaction patterns
- Interface definitions and type structures
- Risk assessment and mitigation strategies
- Implementation phases and dependencies

Follow existing codebase patterns: standalone scripts, stateless operation, direct NS API calls.