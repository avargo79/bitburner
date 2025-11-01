# Spec: AI Agent Capability

## Overview
An autonomous Bitburner script that uses local Large Language Models (via Ollama) to make gameplay decisions through observation, reasoning, and action execution.

---

## ADDED Requirements

### REQ-AI-001: Ollama Service Integration
The system MUST integrate with a local Ollama service to enable LLM-powered decision making.

**Acceptance Criteria:**
- HTTP client connects to configurable Ollama endpoint (default: http://localhost:11434)
- System sends POST requests to `/api/generate` endpoint with properly formatted prompts
- System receives and parses JSON responses containing AI decisions
- Connection failures are handled gracefully with retry logic (up to 3 retries with exponential backoff)
- Timeout mechanism prevents hanging requests (default 30s timeout)

#### Scenario: Successful Ollama Connection
**Given** Ollama service is running on localhost:11434  
**And** ai.ts script is started with default configuration  
**When** the script initializes  
**Then** connection test succeeds  
**And** script displays "Connected to Ollama service" message  
**And** main decision loop begins

#### Scenario: Ollama Connection Failure
**Given** Ollama service is not running  
**And** ai.ts script is started  
**When** the script attempts to connect  
**Then** connection test fails after 3 retry attempts  
**And** script logs clear error message with troubleshooting guidance  
**And** script terminates gracefully

---

### REQ-AI-002: Game State Observation
The system MUST collect and structure relevant game state data from the Bitburner NS API for AI decision-making context.

**Acceptance Criteria:**
- Player state includes: hacking level, available money, current server, hacking experience
- Server discovery scans network recursively to find all accessible servers
- Server data includes: hostname, admin rights status, money (current/max), security (current/min), required hacking level
- System filters and ranks servers by value (prioritizes high money, low security)
- Top 10 most relevant servers are included in context
- Recent action history (last 5-10 actions with outcomes) is maintained
- Server discovery results are cached for 60 seconds to minimize NS API overhead

#### Scenario: First-Time Game State Observation
**Given** player is on home server with $1000 and hacking level 1  
**And** network contains 15 discoverable servers  
**When** observeGameState() is called  
**Then** player stats are accurately captured  
**And** all 15 servers are scanned  
**And** top 10 servers by value are selected  
**And** servers include money, security, and access information  
**And** GameState object is returned with complete data

#### Scenario: Incremental State Updates
**Given** game state was observed 30 seconds ago  
**And** server cache is still valid  
**When** observeGameState() is called again  
**Then** player stats are re-fetched (dynamic data)  
**And** server data is retrieved from cache (static data)  
**And** NS API calls are minimized  
**And** GameState reflects current player state with cached server context

---

### REQ-AI-003: AI Decision Generation
The system MUST generate intelligent gameplay decisions by sending game context to Ollama and receiving structured action recommendations.

**Acceptance Criteria:**
- Prompt template converts GameState into LLM-friendly natural language context
- Prompt includes: current player stats, available servers with details, recent action history, last action outcome
- Prompt specifies available actions: hack, grow, weaken, scan, upgrade, wait
- Prompt requests JSON-formatted response with: action, target (if applicable), reasoning
- System enforces JSON response format via Ollama API `format: "json"` parameter
- Invalid JSON responses trigger retry with clarification prompt (max 2 retries)
- AI reasoning is captured and logged for transparency

#### Scenario: AI Recommends Hack Action
**Given** player has $5000 and hacking level 10  
**And** "foodnstuff" server has $50000 available, security 5, requires level 1  
**And** game state prompt is built and sent to Ollama  
**When** AI generates response  
**Then** response contains valid JSON: `{"action": "hack", "target": "foodnstuff", "reasoning": "High money target with low security"}`  
**And** action is parsed successfully  
**And** reasoning is logged to console

#### Scenario: AI Response Parsing Failure
**Given** Ollama returns malformed JSON: `{action: hack, target: foodnstuff}`  
**When** system attempts to parse response  
**Then** JSON parsing fails  
**And** system logs parsing error  
**And** system sends clarification prompt: "Please respond with valid JSON only"  
**And** system retries (up to 2 additional attempts)  
**And** if all retries fail, system defaults to "wait" action

---

### REQ-AI-004: Action Validation and Execution
The system MUST validate AI-generated actions and execute them safely via NS API calls.

**Acceptance Criteria:**
- Action validator checks: action is in allowed list, target server exists, player has admin rights, level requirements met, resources available
- Validation failures log clear error messages with reason
- Invalid actions are rejected without execution
- Valid actions are executed via appropriate NS API calls
- Action executors handle: hack (ns.hack), grow (ns.grow), weaken (ns.weaken), scan (server rediscovery), upgrade (skill purchases), wait (sleep)
- Execution results are captured: money gained, experience earned, time taken, success/failure status
- ActionOutcome object is created with: action, target, success status, result value, timestamp

#### Scenario: Execute Valid Hack Action
**Given** AI recommends: `{"action": "hack", "target": "foodnstuff", "reasoning": "..."}`  
**And** player has admin rights on "foodnstuff"  
**And** player meets hacking level requirement  
**When** executeAction() is called  
**Then** validation passes  
**And** ns.hack("foodnstuff") is executed  
**And** money gained is captured  
**And** ActionOutcome records: action="hack", target="foodnstuff", success=true, result=5000, timestamp=<now>  
**And** outcome is added to action history

#### Scenario: Reject Invalid Action
**Given** AI recommends: `{"action": "hack", "target": "unknown-server", "reasoning": "..."}`  
**And** "unknown-server" does not exist in network  
**When** validateAction() is called  
**Then** validation fails with error: "Target server 'unknown-server' not found"  
**And** action is NOT executed  
**And** ActionOutcome records: success=false, result="validation_failed"  
**And** error is logged with full context

---

### REQ-AI-005: Continuous Learning Loop
The system MUST operate in a continuous loop that observes, decides, acts, learns, and repeats to enable ongoing gameplay.

**Acceptance Criteria:**
- Main loop executes steps sequentially: observe state → build prompt → query AI → validate action → execute action → log outcome → sleep → repeat
- Loop runs indefinitely until script is terminated
- Action history maintains last 5-10 outcomes in circular buffer
- Recent outcomes are included in subsequent prompts as feedback
- Loop interval is configurable (default 10 seconds between cycles)
- Loop counter tracks total decisions made
- Periodic status reports logged every 10 cycles (money change, total actions, success rate)

#### Scenario: Complete Decision Cycle
**Given** script is running in main loop  
**And** last action was "hack foodnstuff" with $5000 gained  
**When** new cycle begins  
**Then** game state is observed (includes updated money)  
**And** prompt is built with recent action history showing last hack success  
**And** AI receives feedback about previous action outcome  
**And** AI makes new decision informed by past results  
**And** action is validated and executed  
**And** outcome is logged and added to history  
**And** script sleeps for configured interval  
**And** cycle repeats

#### Scenario: Learning from Failed Actions
**Given** AI previously attempted "hack high-sec-server" and failed (insufficient level)  
**And** failure is recorded in action history  
**When** next prompt is built  
**Then** recent actions include: "hack high-sec-server: FAILED (level too low)"  
**And** AI receives this feedback in context  
**And** AI should avoid recommending the same target again  
**And** AI should prioritize servers matching current capability level

---

### REQ-AI-006: Configuration and Customization
The system MUST support flexible configuration to adapt to different environments, models, and gameplay styles.

**Acceptance Criteria:**
- Script accepts command-line arguments: --endpoint, --model, --interval, --temperature
- Endpoint parameter sets Ollama API URL (default: http://localhost:11434)
- Model parameter selects Ollama model (default: llama3.2)
- Interval parameter sets decision loop delay in milliseconds (default: 10000)
- Temperature parameter controls LLM creativity (default: 0.7, range: 0.0-1.0)
- Logging uses ns.print() for --tail compatibility (always detailed, no verbose flag)
- Invalid configuration values are rejected with helpful error messages
- Configuration summary is displayed on startup

#### Scenario: Custom Configuration
**Given** user wants to use mistral model with faster decision cycles  
**When** user runs: `run ai.ts --model mistral --interval 5000 --temperature 0.5 --tail`  
**Then** script parses arguments successfully  
**And** Ollama client uses mistral model  
**And** decision loop interval is 5 seconds  
**And** LLM temperature is 0.5 (more deterministic)  
**And** configuration summary displays all active settings  
**And** logs are visible via --tail  
**And** script operates with custom configuration

#### Scenario: Invalid Configuration Handling
**Given** user provides invalid endpoint: `run ai.ts --endpoint not-a-url`  
**When** script initializes  
**Then** endpoint validation fails  
**And** clear error message displays: "Invalid endpoint URL format"  
**And** script suggests correct format: "Use http://localhost:11434"  
**And** script terminates without starting main loop

---

### REQ-AI-007: Error Handling and Recovery
The system MUST handle errors gracefully and implement recovery mechanisms to maintain stable operation.

**Acceptance Criteria:**
- Network errors (connection failures, timeouts) trigger retry logic with exponential backoff
- After 3 consecutive Ollama failures, system enters "safe mode" with simple fallback actions
- Safe mode executes basic actions: weaken low-security servers, grow high-money servers
- NS API errors (invalid function calls, permission denied) are caught and logged
- Circuit breaker stops script after 10 consecutive failures to prevent runaway issues
- All errors include contextual information: timestamp, game state, attempted action
- Critical errors display via ns.tprint() for user visibility

#### Scenario: Temporary Network Interruption
**Given** script is running normally  
**And** Ollama service is stopped mid-execution  
**When** next AI query is attempted  
**Then** connection fails  
**And** system logs: "Ollama connection failed, retrying in 2s..."  
**And** retry #1 occurs after 2 seconds (fails)  
**And** retry #2 occurs after 4 seconds (fails)  
**And** retry #3 occurs after 8 seconds (fails)  
**And** system enters safe mode  
**And** fallback action (weaken low-security server) is executed  
**And** script continues running in degraded state

#### Scenario: Recovery from Safe Mode
**Given** script is in safe mode due to Ollama failures  
**And** Ollama service is restarted  
**When** next decision cycle begins  
**Then** system attempts Ollama connection again  
**And** connection succeeds  
**And** system logs: "Ollama connection restored, exiting safe mode"  
**And** normal AI-driven operation resumes  
**And** safe mode counter resets

---

### REQ-AI-008: Logging and Observability
The system MUST provide comprehensive logging to enable monitoring, debugging, and understanding of AI decision-making.

**Acceptance Criteria:**
- Each decision cycle logs: current state summary, AI decision, action taken, outcome
- AI reasoning is logged for every decision to explain choices
- All logs use ns.print() for --tail compatibility (always detailed)
- Errors log full context: error type, stack trace, game state at failure
- Periodic summaries (every 10 cycles) report: total money change, actions taken, success rate
- Critical events use ns.tprint() for terminal visibility (startup/shutdown only)
- Regular logs use ns.print() for script log window with --tail

#### Scenario: Detailed Logging with --tail
**Given** script runs with `run ai.ts --tail`  
**When** decision cycle executes  
**Then** logs include:  
- "=== Cycle 5 ===" (cycle header)  
- "Player: Level 10, Money: $50,000" (state summary)  
- "Top Servers: foodnstuff ($50k), sigma-cosmetics ($30k), ..." (targets)  
- "AI Decision: hack foodnstuff - 'High value target with low security'" (decision + reasoning)  
- "Executing: hack foodnstuff" (action start)  
- "Result: +$5,000 in 12.5s" (outcome)  
- "Action history updated" (state change)  
**And** logs are visible in real-time via --tail window

#### Scenario: Periodic Status Report
**Given** script has completed 10 decision cycles  
**And** total money changed from $50k to $85k  
**And** 7 actions succeeded, 3 failed  
**When** cycle 10 completes  
**Then** status report logs:  
- "=== STATUS REPORT (Cycle 10) ==="  
- "Money Change: +$35,000 (+70%)"  
- "Actions: 10 total, 7 successful (70% success rate)"  
- "Most Common: hack (6), grow (3), weaken (1)"  
- "Runtime: 120 seconds"

---

### REQ-AI-009: Resource Efficiency
The system MUST operate efficiently within Bitburner's RAM constraints and API limitations.

**Acceptance Criteria:**
- Total script RAM usage does not exceed 10GB
- Browser fetch API is used for HTTP requests (0GB RAM cost)
- NS API calls are minimized through caching and batching
- Server discovery results cached for 60 seconds
- Prompt generation uses template strings (0GB RAM cost)
- JSON parsing uses native JSON object (0GB RAM cost)
- No expensive window/document API usage (25GB penalty avoided)
- Script runs continuously without memory leaks

#### Scenario: RAM Usage Verification
**Given** script is deployed and running  
**When** RAM usage is measured via game UI  
**Then** total RAM is less than 10GB  
**And** usage remains stable over 30+ minutes (no memory leaks)  
**And** script executes efficiently without performance degradation

#### Scenario: API Call Optimization
**Given** decision cycle runs every 10 seconds  
**And** server discovery is expensive (multiple ns.scan() calls)  
**When** observeGameState() is called repeatedly  
**Then** server data is fetched once per 60 seconds (cached)  
**And** player data is fetched every cycle (must be current)  
**And** total NS API calls are minimized  
**And** decision latency remains under 2 seconds per cycle

---

## Success Metrics

**Functional Metrics:**
- 100% successful Ollama connection when service is available
- 90%+ valid JSON responses from AI (with retry mechanism)
- 95%+ action validation success rate (AI follows rules)
- 0 crashes during 30-minute continuous operation

**Performance Metrics:**
- RAM usage: < 10GB
- Decision latency: < 5s per cycle (including AI response time)
- NS API call frequency: < 20 calls per minute (with caching)

**AI Quality Metrics:**
- Observable improvement in decisions over time (targets appropriate servers)
- Reasoning quality: explanations are coherent and relevant
- Adaptability: AI adjusts strategy based on recent outcomes

---

## Dependencies
- Local Ollama installation (user-provided, external)
- Ollama model available (llama3.2, mistral, codellama, etc.)
- Browser fetch API (Bitburner built-in, 0GB RAM)
- TypeScript compilation and game sync (existing project infrastructure)

---

## Out of Scope
- Multi-agent coordination (multiple AI scripts working together)
- Persistent learning across game resets or script restarts
- Advanced game mechanics (corporations, gangs, faction management)
- Model fine-tuning or training on gameplay data
- Integration with existing automation scripts (botnet, contracts, etc.)
- Performance optimization beyond basic caching
- Web UI or dashboard for monitoring AI decisions
