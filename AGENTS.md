# AGENTS.md – Agent Coding Quickstart (Bitburner TypeScript)

## Build / Lint / Typecheck
- Build: `npm run watch` (manual only – run this yourself, agents MUST NOT run this command)
- Typecheck: `npx tsc --noEmit` (safe for agents)
- Lint: `npx eslint src/`
- **Testing:** No automated runner—test scripts in-game via Bitburner terminal, not via `npm test`.

## Code Style Guidelines
- **Imports:** Absolute from `/src` (e.g. `import { X } from "/lib/x"`)
- **Types:** Use strict TypeScript; avoid `any`; prefer interfaces/types
- **Naming:** kebab-case for files, PascalCase for types/classes, camelCase for vars/functions
- **Exports:** Default for main scripts, named for utilities
- **Formatting:** Follow ESLint/Prettier (2 spaces, semicolons, trailing commas)
- **Error Handling:** Favor async/await, minimal try/catch, log errors with `ns.print`/`ns.tprint`
- **Stateless:** Scripts gather data fresh on each run; avoid persistent state
- **No hardcoded values:** Use script arguments or NS API only
- **RAM-efficient:** Avoid use of `window`/`document` (Bitburner RAM impact)
- **Never auto-commit:** Only commit if user requests

See `.eslintrc.json` and `tsconfig.json` for full rules. No .cursor or Copilot rules apply.
