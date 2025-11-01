# Proposal: Add Ollama AI Agent

## Why
Current Bitburner automation scripts use hardcoded logic and predetermined strategies that cannot adapt to new situations or learn from experience. This proposal creates a proof-of-concept AI agent that uses local LLMs (via Ollama) to demonstrate whether machine learning models can observe game state, make intelligent decisions, and adapt strategies based on outcomes, potentially enabling more flexible and autonomous gameplay automation.

## What Changes
- Add new script `src/ai.ts` implementing AI-powered game automation
- Implement Ollama HTTP client using browser fetch API (0GB RAM)
- Create game state observation system gathering player and server data
- Build prompt engineering system for LLM context
- Implement action validation and execution framework
- Add continuous learning loop with outcome feedback
- Support configurable endpoints, models, and decision intervals

## Impact
**Affected Specs:**
- New capability: `ai-agent` (no existing spec to modify)

**Affected Code:**
- New file: `src/ai.ts` (standalone script, no modifications to existing code)
- No impact on existing automation scripts (botnet, contracts, casino-bot, etc.)
- No shared libraries or utilities affected

## Proposed Solution

### Core Capabilities
1. **Ollama Integration** - HTTP client for communicating with local Ollama API endpoint
2. **Game State Observation** - Collect relevant game state data (player stats, servers, money, skills)
3. **AI Decision Engine** - Send context to Ollama and receive action recommendations
4. **Action Execution** - Parse AI responses and execute corresponding NS API calls
5. **Learning Loop** - Track outcomes and feed results back to the AI for continuous improvement

### Technical Approach
- Single standalone script: `src/ai.ts`
- Use browser `fetch` API (0GB RAM cost) to communicate with Ollama
- Configurable Ollama endpoint (default: `http://localhost:11434`)
- Prompt engineering to provide game context and available actions
- JSON-based action responses for reliable parsing
- Logging system to track AI decisions and outcomes

### Scope
**In Scope:**
- Basic game state observation (player, money, hacking level, basic server info)
- Simple action set (hack, grow, weaken, buy server, upgrade skills)
- Ollama API integration with error handling
- Prompt template system for game context
- Action parsing and execution
- Basic logging and monitoring

**Out of Scope (Future Work):**
- Advanced game mechanics (corporations, gangs, factions)
- Multi-server coordination and distributed computing
- Persistent learning across game sessions
- Model fine-tuning or training
- Performance optimization and scaling
- Integration with existing automation scripts

## Success Criteria
1. Script successfully connects to local Ollama service
2. AI receives game state and returns valid action recommendations
3. Actions are executed correctly via NS API
4. Script runs continuously without crashing
5. Observable AI decision-making in game logs
6. Proof-of-concept demonstrates feasibility for future development

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama API latency | Slow decision-making | Add timeout handling, implement async operations |
| LLM hallucination | Invalid actions | Strict JSON parsing, action validation before execution |
| RAM constraints | Script won't run | Use 0GB browser APIs, minimize NS API calls |
| Context size limits | Incomplete game state | Prioritize critical data, implement context summarization |
| API unavailability | Script crashes | Retry logic, fallback to idle mode, clear error messages |

## Dependencies
- Local Ollama installation (user-provided)
- Ollama model (e.g., llama3.2, mistral, codellama)
- Browser `fetch` API (already available in Bitburner)
- TypeScript compilation and game sync (existing infrastructure)

## Timeline
- Phase 1: Ollama integration and basic communication (1 implementation session)
- Phase 2: Game state observation and context building (1 implementation session)
- Phase 3: Action execution and loop implementation (1 implementation session)
- Phase 4: Testing and refinement (1 implementation session)

## Open Questions
1. Which Ollama model should be the default/recommended? (user can configure)
- **llama3.2** - Better JSON reliability and reasoning (pulled and ready)
2. What's the optimal polling interval for AI decisions? (start with 10s, make configurable)
- **Agreed** - 10s default, configurable
3. Should we persist conversation history across script runs? (out of scope for POC)
- **Out of scope** - In-memory only for POC
4. How verbose should logging be? (detailed for POC, configurable for production)
- **Use ns.print()** for --tail compatibility

## Related Changes
None - this is a new isolated feature.

## Approval Checklist
- [ ] Proposal reviewed by user
- [ ] Technical approach validated
- [ ] Success criteria agreed upon
- [ ] Ready to proceed with implementation
