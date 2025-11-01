# Design: Ollama AI Agent

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         ai.ts (Main Script)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Main Loop                             │ │
│  │  1. Observe game state                                  │ │
│  │  2. Build context prompt                                │ │
│  │  3. Query Ollama API                                    │ │
│  │  4. Parse AI response                                   │ │
│  │  5. Execute actions                                     │ │
│  │  6. Log outcomes                                        │ │
│  │  7. Sleep (configurable interval)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ State        │  │ Ollama       │  │ Action       │      │
│  │ Observer     │  │ Client       │  │ Executor     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
            ▲                    │                    │
            │                    │                    │
            │                    ▼                    ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  Bitburner   │    │   Ollama     │    │  Bitburner   │
    │   NS API     │    │   Service    │    │   NS API     │
    │  (Read)      │    │ (localhost)  │    │  (Write)     │
    └──────────────┘    └──────────────┘    └──────────────┘
```

## Component Design

### 1. State Observer
**Purpose:** Collect relevant game state data from NS API

**Data Collection:**
```typescript
interface GameState {
    player: {
        hacking: number;
        money: number;
        currentServer: string;
        hackingExp: number;
    };
    servers: {
        hostname: string;
        hasAdminRights: boolean;
        moneyAvailable: number;
        maxMoney: number;
        securityLevel: number;
        minSecurityLevel: number;
        requiredHackingLevel: number;
    }[];
    recentActions: string[];  // Last 5 actions taken
    lastOutcome: string;      // Result of last action
}
```

**Implementation:**
- Query NS API for player stats: `ns.getPlayer()`
- Scan network for servers: `ns.scan()` recursively
- Filter to top 10 most valuable targets
- Track action history in memory (array)

### 2. Ollama Client
**Purpose:** HTTP communication with local Ollama API

**Configuration:**
```typescript
interface OllamaConfig {
    endpoint: string;      // Default: "http://localhost:11434"
    model: string;         // Default: "llama3.2" (3B variant recommended)
    timeout: number;       // Default: 30000ms
    temperature: number;   // Default: 0.7
}
```

**API Integration:**
```typescript
POST {endpoint}/api/generate
Body: {
    model: string,
    prompt: string,
    stream: false,
    format: "json"
}

Response: {
    response: string  // JSON string with AI decision
}
```

**Error Handling:**
- Connection failures → Log and retry with exponential backoff
- Timeout → Fallback to idle/safe action
- Invalid JSON response → Request retry with clarification prompt

### 3. Prompt Engineering
**Purpose:** Convert game state into LLM-friendly context

**Prompt Template:**
```
You are an AI playing Bitburner, a hacking simulation game. Your goal is to 
maximize money generation and hacking experience.

CURRENT GAME STATE:
- Money: ${player.money}
- Hacking Level: ${player.hacking}
- Current Server: ${player.currentServer}
- Hacking Experience: ${player.hackingExp}

AVAILABLE SERVERS (Top 10):
${servers.map(s => `
  - ${s.hostname}
    - Has Admin: ${s.hasAdminRights}
    - Money: ${s.moneyAvailable}/${s.maxMoney}
    - Security: ${s.securityLevel}/${s.minSecurityLevel}
    - Required Level: ${s.requiredHackingLevel}
`).join('\n')}

RECENT ACTIONS:
${recentActions.join('\n')}

LAST OUTCOME:
${lastOutcome}

AVAILABLE ACTIONS:
1. hack <hostname> - Steal money from a server
2. grow <hostname> - Increase money on a server
3. weaken <hostname> - Reduce security on a server
4. scan - Discover new servers
5. upgrade - Buy hacking skill upgrades
6. wait - Do nothing this turn

Choose ONE action and respond ONLY with valid JSON:
{
    "action": "<action_name>",
    "target": "<hostname_if_applicable>",
    "reasoning": "<brief explanation>"
}
```

**Dynamic Context:**
- Include only servers player can access
- Highlight high-value targets
- Summarize recent performance trends
- Adjust available actions based on player capabilities

### 4. Action Executor
**Purpose:** Parse AI response and execute NS API calls

**Action Mapping:**
```typescript
interface AIAction {
    action: "hack" | "grow" | "weaken" | "scan" | "upgrade" | "wait";
    target?: string;
    reasoning: string;
}

// Action → NS API mapping
const actionExecutors = {
    hack: (ns, target) => ns.hack(target),
    grow: (ns, target) => ns.grow(target),
    weaken: (ns, target) => ns.weaken(target),
    scan: (ns) => /* discover new servers */,
    upgrade: (ns) => /* check and buy available upgrades */,
    wait: (ns) => ns.sleep(5000)
}
```

**Validation:**
- Check if action is in allowed set
- Verify target exists and is accessible
- Ensure player has sufficient privileges
- Validate resource requirements (money for upgrades)

**Outcome Tracking:**
```typescript
interface ActionOutcome {
    action: string;
    target?: string;
    success: boolean;
    result: number | string;
    timestamp: number;
}
```

### 5. Learning Loop
**Purpose:** Feed outcomes back to AI for improvement

**Feedback Mechanism:**
- Track last 5 actions with outcomes
- Include in next prompt as "RECENT ACTIONS"
- Show money/exp changes
- Highlight successes and failures

**Out of Scope for POC:**
- Persistent conversation history across script runs (per user preference)
- RAG for retrieving similar past situations
- Reward scoring system
- Model fine-tuning

## Data Flow

```
1. START
   ↓
2. Read game state (NS API)
   → player stats, server info, network topology
   ↓
3. Build prompt
   → template + game state → formatted string
   ↓
4. Send to Ollama (fetch API)
   → POST /api/generate with prompt
   ↓
5. Parse response
   → JSON string → AIAction object
   ↓
6. Validate action
   → check allowlist, verify target, validate resources
   ↓
7. Execute action (NS API)
   → call appropriate ns.* function
   ↓
8. Log outcome
   → record success/failure, result value
   ↓
9. Sleep
   → wait configurable interval (default 10s)
   ↓
10. LOOP back to step 2
```

## Error Recovery

### Network Errors
- **Symptom:** Fetch fails, timeout, or connection refused
- **Recovery:** Log error, wait 30s, retry up to 3 times, then enter safe mode
- **Safe Mode:** Execute simple grow/weaken on known safe servers

### Invalid AI Responses
- **Symptom:** Unparseable JSON or invalid action
- **Recovery:** Log error, send follow-up prompt asking for correction, fallback to "wait" if retry fails

### NS API Errors
- **Symptom:** Action execution throws exception
- **Recovery:** Log error with details, update lastOutcome with failure, continue loop

### Resource Exhaustion
- **Symptom:** Not enough money for upgrades, insufficient RAM
- **Recovery:** Include resource constraints in next prompt, let AI choose alternative action

## Configuration

Script accepts command-line arguments:
```
run ai.ts --endpoint http://localhost:11434 --model llama3.2 --interval 10000
```

**Parameters:**
- `--endpoint` - Ollama API URL (default: http://localhost:11434)
- `--model` - Ollama model name (default: llama3.2)
- `--interval` - Decision loop interval in ms (default: 10000)
- `--temperature` - LLM temperature 0.0-1.0 (default: 0.7)

**Note:** Verbose logging always enabled using ns.print() for --tail compatibility. No --verbose flag needed.

## RAM Optimization

**Zero-Cost Operations:**
- `fetch()` - Network requests (0GB)
- `JSON.parse/stringify()` - Data serialization (0GB)
- `localStorage` - State persistence (0GB)
- Template strings and string manipulation (0GB)

**NS API Costs:**
- Keep NS API calls minimal during observation phase
- Batch queries where possible
- Use efficient server scanning (depth-first, prune low-value)
- Estimated total RAM: ~5-10GB depending on action complexity

## Security Considerations

**Local-Only Communication:**
- Ollama endpoint should be localhost
- No external API calls
- No sensitive data sent outside local network

**Input Validation:**
- Sanitize all AI responses before execution
- Whitelist allowed actions
- Verify server hostnames exist
- Prevent code injection via hostname manipulation

## Testing Strategy

**Manual Testing (In-Game):**
1. Verify Ollama connection and response
2. Test each action type individually
3. Confirm error handling (stop Ollama mid-run)
4. Validate logging output
5. Monitor RAM usage

**Success Indicators:**
1. Script runs for 10+ minutes without crashing
2. AI makes sensible decisions (targets weak servers first)
3. Money/exp increases over time
4. Logs show clear reasoning for each action
5. Error recovery works (network interruption)

## Future Enhancements (Post-POC)

1. **Multi-Action Plans:** Allow AI to return sequence of actions
2. **Advanced Context:** Include faction, augmentation, and corporation data
3. **Persistent Memory:** Save conversation history across restarts
4. **Model Fine-Tuning:** Train on successful gameplay sessions
5. **Multi-Agent System:** Coordinate multiple AI scripts
6. **Integration:** Work alongside existing automation scripts
7. **Performance Optimization:** Parallel execution, caching, incremental updates
