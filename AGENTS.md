# AGENTS.md – Agent Quickstart (Bitburner TypeScript Automation)

**Build/Lint/Typecheck:**
- `npm run watch` – Full build, transpile, sync (user only, not agents)
- `npx tsc --noEmit` – TypeScript typecheck (safe for agents)
- `npx eslint src/` – Lint all source files
- **Testing:** No automated test runner; test scripts in-game via Bitburner terminal.

**Code Style Guidelines:**
- **Imports:** Use absolute imports from `/src` root (e.g., `import { X } from "/lib/x"`).
- **Types:** Strict TypeScript, avoid `any`, use descriptive interfaces/types.
- **Naming:** kebab-case for files, PascalCase for types/classes, camelCase for variables/functions.
- **Exports:** Default export for main scripts, named exports for utilities.
- **Formatting:** Follow ESLint/Prettier defaults; 2 spaces, semicolons, trailing commas.
- **Error Handling:** Use async/await, minimal try/catch, log errors with `ns.print`/`ns.tprint`.
- **No hardcoded values:** Use script args or NS API.
- **Stateless:** Scripts should gather data fresh each run; avoid persistent state.
- **Memory:** Write RAM-efficient code; avoid literal `window`/`document` (see below).
- **Never auto-commit:** Only commit when user explicitly requests.

> For full guidelines, see below. For browser API RAM tips, see "Browser API RAM Cost Research" in this file.


<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md - Bitburner TypeScript Automation Framework

[...rest of file unchanged...]
