# Tasks: Ollama AI Agent Implementation

## Overview
Implementation tasks for the Ollama AI agent proof-of-concept. Tasks are ordered for logical dependency flow and incremental testing.

---

## Phase 1: Foundation & Ollama Integration

### Task 1.1: Create ai.ts Skeleton
- [x] Create `src/ai.ts` with basic structure
- [x] Implement `main(ns: NS)` function entry point
- [x] Add command-line argument parsing (`--endpoint`, `--model`, `--interval`, `--temperature`)
- [x] Set default model to "llama3.2" (3B variant recommended for speed/quality balance)
- [x] Set up script header documentation
- [x] Add TypeScript interfaces for configuration
- [x] Configure ns.print() for --tail compatibility (no verbose flag needed)

**Validation:** ✅ File compiles without errors, runs in-game with `run ai.ts --tail`

### Task 1.2: Implement Ollama HTTP Client
- [x] Create `OllamaClient` class with fetch-based HTTP calls
- [x] Implement `generate(prompt: string)` method using POST /api/generate
- [x] Add connection testing method `testConnection()`
- [x] Implement timeout handling (default 30s)
- [x] Add retry logic with exponential backoff (3 retries max)
- [x] Create error handling for network failures

**Validation:** ✅ Successfully send test prompt to local Ollama via CORS proxy, receive response, handle connection errors gracefully

### Task 1.3: Create TypeScript Interfaces
- [x] Define `OllamaConfig` interface
- [x] Define `GameState` interface (player, servers, recentActions, lastOutcome)
- [x] Define `AIAction` interface (action, target, reasoning)
- [x] Define `ActionOutcome` interface
- [x] Define `ServerInfo` interface (simplified NS server data)

**Validation:** ✅ All interfaces compile, no type errors

---

## Phase 2: Game State Observation

### Task 2.1: Implement Player State Observer
- [x] Create `observePlayerState(ns: NS)` function
- [x] Collect player hacking level, money, current server, experience
- [x] Return structured player data object
- [x] Add error handling for NS API failures

**Validation:** ✅ Function returns accurate player data matching in-game stats

### Task 2.2: Implement Server Discovery
- [x] Create `discoverServers(ns: NS)` function with recursive scan
- [x] Filter servers by accessibility (hasAdminRights)
- [x] Collect server stats (money, security, required level)
- [x] Rank servers by value (money available / security)
- [x] Return top 10 servers
- [x] Add caching with 60s TTL to reduce NS API calls

**Validation:** ✅ Function returns relevant servers, excludes unreachable/low-value targets

### Task 2.3: Build Complete Game State
- [x] Create `buildGameState(ns: NS, actionHistory: ActionOutcome[])` function
- [x] Combine player state and server discovery
- [x] Format recent actions (last 5) for context
- [x] Format last outcome with success/failure indicator
- [x] Return complete `GameState` object

**Validation:** ✅ GameState object contains all required data, properly formatted

---

## Phase 3: Prompt Engineering & AI Communication

### Task 3.1: Create Prompt Template
- [x] Create `buildPrompt(state: GameState)` function
- [x] Implement template with system instructions
- [x] Format player stats section
- [x] Format server list with relevant details
- [x] Format recent actions history
- [x] Format last outcome feedback
- [x] Include available actions list with descriptions
- [x] Add JSON response format instructions

**Validation:** ✅ Generated prompt is clear, concise, includes all context, fits within typical token limits (~2000 tokens)

### Task 3.2: Implement AI Query Loop
- [x] Create `queryAI(client: OllamaClient, prompt: string)` function
- [x] Send prompt to Ollama API
- [x] Parse JSON response to `AIAction` object
- [x] Handle malformed JSON with retry (clarification prompt)
- [x] Log AI reasoning to console
- [x] Return parsed action or null on failure

**Validation:** ✅ Successfully send prompts and receive valid JSON actions, retry works on malformed responses

---

## Phase 4: Action Execution

### Task 4.1: Implement Action Validator
- [x] Create `validateAction(ns: NS, action: AIAction)` function
- [x] Check action is in allowed list
- [x] Verify target server exists (if applicable)
- [x] Check player has admin rights on target
- [x] Verify player meets level requirements
- [x] Check resource constraints (money for upgrades)
- [x] Return validation result with error message if invalid

**Validation:** ✅ Validator correctly rejects invalid actions, accepts valid ones

### Task 4.2: Implement Action Executors
- [x] Create `executeAction(ns: NS, action: AIAction)` function
- [x] Implement `hack` action executor → `ns.hack(target)`
- [x] Implement `grow` action executor → `ns.grow(target)`
- [x] Implement `weaken` action executor → `ns.weaken(target)`
- [x] Implement `scan` action executor → trigger server rediscovery
- [x] Implement `upgrade` action executor → check and buy available upgrades
- [x] Implement `wait` action executor → `ns.sleep(5000)`
- [x] Capture execution result (money gained, time taken, etc.)
- [x] Return `ActionOutcome` object

**Validation:** ✅ Each action type executes correctly, outcomes captured accurately

### Task 4.3: Add Action History Tracking
- [x] Create in-memory array for action history (max 10 items)
- [x] Push new outcomes to history after each execution
- [x] Implement circular buffer (remove oldest when full)
- [x] Add timestamp to each outcome
- [x] Format outcomes for prompt inclusion

**Validation:** ✅ History maintains last 5-10 actions, properly formatted in prompts

---

## Phase 5: Main Loop & Error Handling

### Task 5.1: Implement Main Decision Loop
- [x] Create main `while(true)` loop in `main()` function
- [x] Step 1: Observe game state
- [x] Step 2: Build prompt from state
- [x] Step 3: Query AI for action
- [x] Step 4: Validate AI response
- [x] Step 5: Execute action
- [x] Step 6: Record outcome in history
- [x] Step 7: Log cycle summary
- [x] Step 8: Sleep for configured interval
- [x] Add loop counter and periodic status reporting (every 10 cycles)

**Validation:** ✅ Loop runs continuously, executes all steps in order, maintains stable performance

### Task 5.2: Add Comprehensive Error Handling
- [x] Wrap NS API calls in try-catch blocks
- [x] Add error handling for Ollama connection failures
- [x] Implement graceful degradation (safe mode on repeated failures)
- [x] Add error logging with context
- [x] Create "safe mode" fallback actions (simple weaken/grow)
- [x] Add circuit breaker pattern (stop after 10 consecutive failures)

**Validation:** ✅ Script recovers from network interruptions, invalid AI responses, NS API errors; enters safe mode appropriately

### Task 5.3: Implement Logging System
- [x] All logs use `ns.print()` for --tail compatibility
- [x] Log each decision cycle (state → AI decision → outcome)
- [x] Log AI reasoning for each action
- [x] Log errors with full context
- [x] Add periodic summary logs (every 10 cycles: total money change, actions taken)
- [x] Use `ns.tprint()` only for critical startup/shutdown messages
- [x] Format logs clearly with cycle numbers and timestamps

**Validation:** ✅ Logs are clear and informative when viewed with `run ai.ts --tail`

---

## Phase 6: Configuration & Polish

### Task 6.1: Add Configuration Validation
- [x] Validate Ollama endpoint URL format
- [x] Test connection to Ollama on startup
- [x] Verify model exists (optional: list available models)
- [x] Validate numeric parameters (interval, temperature)
- [x] Show configuration summary on startup
- [x] Add helpful error messages for configuration issues

**Validation:** ✅ Invalid configs rejected with clear error messages, valid configs accepted

### Task 6.2: Add Startup Checks
- [x] Create `initialize(ns: NS, config: OllamaConfig)` function
- [x] Test Ollama connection before main loop
- [x] Display welcome message with script purpose
- [x] Show active configuration
- [x] Verify player has necessary game access (basic NS API)
- [x] Return ready status or error

**Validation:** ✅ Script provides clear feedback on startup, fails fast with helpful messages

### Task 6.3: Documentation & Comments
- [x] Add JSDoc comments to all functions
- [x] Document interfaces with property descriptions
- [x] Add inline comments for complex logic
- [x] Create usage examples in script header
- [x] Document configuration options
- [x] Add troubleshooting section to header comments

**Validation:** ✅ Code is well-documented, easy to understand for future modifications

---

## Phase 7: Testing & Refinement

### Task 7.1: Manual Integration Testing
- [x] Test with Ollama offline (verify error handling)
- [x] Test with invalid model name
- [x] Test with different temperature settings (0.0, 0.7, 1.0)
- [x] Test with different intervals (5s, 10s, 30s)
- [ ] Run for 30+ minutes to verify stability
- [x] Monitor RAM usage during execution
- [ ] Verify money/exp increases over time

**Validation:** ⏳ Most test scenarios pass, extended stability testing in progress

### Task 7.2: AI Decision Quality Testing
- [x] Observe AI decision patterns (does it prioritize logical targets?)
- [x] Check reasoning quality (are explanations coherent?)
- [x] Test with llama3.2 model (default, 3B variant)
- [ ] Test with alternative models (mistral, codellama) for comparison
- [x] Verify AI adapts to changing game state
- [x] Confirm AI learns from recent outcomes (doesn't repeat failed actions)

**Validation:** ⏳ AI makes sensible decisions, reasoning is clear, learning from validation errors improved with prompt refinements

### Task 7.3: Performance Optimization
- [x] Profile NS API call frequency (minimize unnecessary calls)
- [x] Optimize server discovery (cache results)
- [x] Reduce prompt size if exceeding token limits
- [x] Add rate limiting to prevent API spam
- [x] Verify RAM usage stays under 10GB

**Validation:** ✅ Script runs efficiently, minimal NS API overhead, acceptable RAM usage

### Task 7.4: Final Polish
- [x] Review all log messages for clarity
- [x] Remove debug logging
- [x] Add version number to script header
- [ ] Create example run command in AGENTS.md
- [ ] Add script to main README if appropriate
- [x] Final TypeScript compilation check

**Validation:** ⏳ Script is near production-ready, documentation updates pending

---

## Success Criteria Checklist
- [x] Script connects to local Ollama service successfully (via CORS proxy)
- [x] AI receives game state and returns valid actions
- [x] All action types execute correctly
- [ ] Script runs continuously for 30+ minutes without crashing (in progress)
- [x] Logs show clear AI reasoning for each decision
- [x] Error handling works (network failures, invalid responses)
- [x] Configuration is flexible and well-documented
- [x] Code is clean, typed, and follows project conventions
- [x] Proof-of-concept demonstrates AI-driven gameplay is feasible

---

## Notes
- Test frequently during implementation (after each task phase) ✅
- Use `run ai.ts --tail` to monitor AI decisions in real-time ✅
- Monitor the game's own console for errors ✅
- Keep Ollama running during development: `ollama serve` ✅
- Default model is llama3.2 (3B variant - good balance of speed and quality) ✅
- Model already pulled and ready: `ollama pull llama3.2` ✅
- Expect initial AI decisions to be suboptimal - focus on framework stability ✅

## Implementation Notes

### CORS Proxy Solution
- Browser localhost restrictions prevented direct access to Ollama on port 11434
- Created `ollama-proxy.js` - simple Node.js CORS proxy on port 8080
- Proxy forwards requests to localhost:11434 with proper CORS headers
- Updated default endpoint to `http://localhost:8080` in ai.ts
- Proxy must be running: `node ollama-proxy.js`

### Prompt Engineering Improvements
- Initial prompts caused AI to include target in action field (e.g., "grow megacorp")
- Refined prompt with concrete JSON examples showing proper format
- Added filtering to only show servers player can hack (eliminates level mismatch errors)
- Added explicit instructions about required target field for hack/grow/weaken
- Improved validation error formatting with ✗/✓ symbols for better AI learning

### Current Status
- Core implementation: ✅ Complete (Phases 1-6)
- Basic testing: ✅ Complete
- Extended stability testing: ⏳ In progress
- AI decision quality: ⏳ Improving with prompt refinements
- Documentation: ⏳ In-code docs complete, external docs pending
