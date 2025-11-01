/**
 * AI-Powered Bitburner Agent
 * 
 * Uses local Ollama service to make intelligent gameplay decisions through:
 * - Game state observation (player stats, servers, money)
 * - AI reasoning via Large Language Models
 * - Action execution (hack, grow, weaken, etc.)
 * - Continuous learning from outcomes
 * 
 * @usage run ai.ts --tail
 * @usage run ai.ts --model mistral --interval 5000 --tail
 * 
 * @param {string} --endpoint - Ollama API URL (default: http://localhost:8080)
 * @param {string} --model - Ollama model name (default: llama3.2)
 * @param {number} --interval - Decision loop interval in ms (default: 10000)
 * @param {number} --temperature - LLM temperature 0.0-1.0 (default: 0.7)
 * 
 * @example
 * // Default settings
 * run ai.ts --tail
 * 
 * // Custom model with faster decisions
 * run ai.ts --model mistral --interval 5000 --tail
 * 
 * // More deterministic AI
 * run ai.ts --temperature 0.3 --tail
 */

import { NS } from '@ns';

// ============================================================================
// Configuration Interfaces
// ============================================================================

interface OllamaConfig {
    endpoint: string;
    model: string;
    timeout: number;
    temperature: number;
}

interface ScriptArgs {
    endpoint: string;
    model: string;
    interval: number;
    temperature: number;
}

// ============================================================================
// Game State Interfaces
// ============================================================================

interface PlayerState {
    hacking: number;
    money: number;
    currentServer: string;
    hackingExp: number;
}

interface ServerInfo {
    hostname: string;
    hasAdminRights: boolean;
    moneyAvailable: number;
    maxMoney: number;
    securityLevel: number;
    minSecurityLevel: number;
    requiredHackingLevel: number;
}

interface GameState {
    player: PlayerState;
    servers: ServerInfo[];
    recentActions: string[];
    lastOutcome: string;
}

// ============================================================================
// AI Action Interfaces
// ============================================================================

interface AIAction {
    action: 'hack' | 'grow' | 'weaken' | 'scan' | 'upgrade' | 'wait';
    target?: string;
    reasoning: string;
}

interface ActionOutcome {
    action: string;
    target?: string;
    success: boolean;
    result: number | string;
    timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: OllamaConfig = {
    endpoint: 'http://localhost:8080',
    model: 'llama3.2',
    timeout: 30000,
    temperature: 0.7
};

const DEFAULT_INTERVAL = 10000; // 10 seconds between decisions
const MAX_RETRIES = 3;
const MAX_CONSECUTIVE_FAILURES = 10;

// ============================================================================
// Ollama Client
// ============================================================================

/**
 * HTTP client for communicating with local Ollama service
 */
class OllamaClient {
    private config: OllamaConfig;
    private consecutiveFailures: number = 0;

    constructor(config: OllamaConfig) {
        this.config = config;
    }

    /**
     * Test connection to Ollama service
     */
    async testConnection(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.config.endpoint}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate AI response from prompt
     */
    async generate(prompt: string): Promise<string | null> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const response = await fetch(`${this.config.endpoint}/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.config.model,
                        prompt: prompt,
                        stream: false,
                        format: 'json',
                        options: {
                            temperature: this.config.temperature
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.consecutiveFailures = 0; // Reset on success
                return data.response;
            } catch (error) {
                lastError = error as Error;

                if (attempt < MAX_RETRIES) {
                    // Exponential backoff: 2s, 4s, 8s
                    const backoffMs = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
            }
        }

        // All retries failed
        this.consecutiveFailures++;
        throw new Error(`Ollama request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
    }

    /**
     * Check if client is in safe mode (too many failures)
     */
    isInSafeMode(): boolean {
        return this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;
    }

    /**
     * Reset failure counter (e.g., after successful request)
     */
    resetFailures(): void {
        this.consecutiveFailures = 0;
    }

    /**
     * Get current failure count
     */
    getFailureCount(): number {
        return this.consecutiveFailures;
    }
}

// ============================================================================
// Game State Observation
// ============================================================================

// Server cache to minimize NS API calls
let serverCache: ServerInfo[] = [];
let serverCacheTime: number = 0;
const SERVER_CACHE_TTL = 60000; // 60 seconds

/**
 * Observe current player state
 */
function observePlayerState(ns: NS): PlayerState {
    const player = ns.getPlayer();

    return {
        hacking: player.skills.hacking,
        money: ns.getServerMoneyAvailable('home'),
        currentServer: ns.getHostname(),
        hackingExp: player.exp.hacking
    };
}

/**
 * Discover and rank servers by value
 */
function discoverServers(ns: NS): ServerInfo[] {
    const now = Date.now();

    // Return cached results if still valid
    if (serverCache.length > 0 && (now - serverCacheTime) < SERVER_CACHE_TTL) {
        return serverCache;
    }

    // Recursive scan to find all servers
    const allServers = new Set<string>();
    const queue: string[] = ['home'];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (allServers.has(current)) continue;

        allServers.add(current);
        const neighbors = ns.scan(current);
        queue.push(...neighbors);
    }

    // Collect server information
    const servers: ServerInfo[] = [];
    for (const hostname of allServers) {
        if (hostname === 'home') continue; // Skip home server

        try {
            const server = ns.getServer(hostname);
            servers.push({
                hostname,
                hasAdminRights: server.hasAdminRights,
                moneyAvailable: server.moneyAvailable || 0,
                maxMoney: server.moneyMax || 0,
                securityLevel: server.hackDifficulty || 0,
                minSecurityLevel: server.minDifficulty || 0,
                requiredHackingLevel: server.requiredHackingSkill || 0
            });
        } catch (error) {
            // Skip servers we can't access
            continue;
        }
    }

    // Filter: only servers with admin rights and money potential
    const accessibleServers = servers.filter(s =>
        s.hasAdminRights && s.maxMoney > 0
    );

    // Rank by value (money / security ratio)
    accessibleServers.sort((a, b) => {
        const valueA = a.maxMoney / Math.max(a.securityLevel, 1);
        const valueB = b.maxMoney / Math.max(b.securityLevel, 1);
        return valueB - valueA;
    });

    // Cache top 10 servers
    serverCache = accessibleServers.slice(0, 10);
    serverCacheTime = now;

    return serverCache;
}

/**
 * Build complete game state for AI context
 */
function buildGameState(ns: NS, actionHistory: ActionOutcome[]): GameState {
    const player = observePlayerState(ns);
    const servers = discoverServers(ns);

    // Format recent actions (last 5)
    const recentActions = actionHistory
        .slice(-5)
        .map(outcome => {
            const result = outcome.success
                ? `✓ SUCCESS (${typeof outcome.result === 'number' ? ns.formatNumber(outcome.result) : outcome.result})`
                : `✗ VALIDATION ERROR: ${outcome.result}`;
            return `  ${outcome.action} ${outcome.target || ''}: ${result}`;
        });

    // Format last outcome
    const lastOutcome = actionHistory.length > 0
        ? recentActions[recentActions.length - 1]
        : 'No actions yet';

    return {
        player,
        servers,
        recentActions,
        lastOutcome
    };
}

// ============================================================================
// Prompt Engineering & AI Communication
// ============================================================================

/**
 * Build AI prompt from game state
 */
function buildPrompt(ns: NS, state: GameState): string {
    // Filter servers to only show those the player can actually hack
    const hackableServers = state.servers.filter(s =>
        s.requiredHackingLevel <= state.player.hacking
    );

    const serverList = hackableServers.length > 0
        ? hackableServers
            .map(s => `  - ${s.hostname}
    - Money: $${ns.formatNumber(s.moneyAvailable)}/$${ns.formatNumber(s.maxMoney)}
    - Security: ${s.securityLevel.toFixed(1)}/${s.minSecurityLevel.toFixed(1)}
    - Required Level: ${s.requiredHackingLevel}`)
            .join('\n')
        : '  (No servers available at your current hacking level)';

    const recentActionsList = state.recentActions.length > 0
        ? state.recentActions.join('\n')
        : 'None yet';

    return `You are an AI playing Bitburner, a hacking simulation game. Your goal is to maximize money generation and hacking experience.

CURRENT GAME STATE:
- Money: $${ns.formatNumber(state.player.money)}
- Hacking Level: ${state.player.hacking}
- Current Server: ${state.player.currentServer}
- Hacking Experience: ${ns.formatNumber(state.player.hackingExp)}

SERVERS YOU CAN HACK (Your level: ${state.player.hacking}):
${serverList}

RECENT ACTIONS (Learn from these!):
${recentActionsList}

LAST OUTCOME:
${state.lastOutcome}

IMPORTANT RULES:
- Only target servers where your hacking level (${state.player.hacking}) meets the Required Level
- If previous actions failed validation, DO NOT repeat the same mistake
- Read the validation errors above and adjust your strategy accordingly

AVAILABLE ACTIONS:
1. hack - Steal money from a server (gains money) - REQUIRES target hostname
2. grow - Increase money on a server (prepares for future hacks) - REQUIRES target hostname
3. weaken - Reduce security on a server (makes hacking easier) - REQUIRES target hostname
4. scan - Force rediscovery of servers (use if network might have changed) - no target needed
5. wait - Do nothing this turn (use when no good options available) - no target needed

STRATEGY TIPS:
- Always pick a specific server from the list above when using hack/grow/weaken
- Weaken high-security servers before hacking them
- Grow servers with low money before hacking them
- Prioritize servers with high money potential
- Learn from recent outcomes to improve decisions

RESPONSE FORMAT - You MUST respond with valid JSON:

Example 1 - Action WITH target (hack/grow/weaken):
{
    "action": "grow",
    "target": "n00dles",
    "reasoning": "Growing n00dles because it has low money and I can hack it"
}

Example 2 - Action WITHOUT target (scan/wait):
{
    "action": "wait",
    "reasoning": "No good targets available right now"
}

CRITICAL: If you choose hack, grow, or weaken, you MUST include the "target" field with a hostname from the server list above!`;
}

/**
 * Query AI for next action
 */
async function queryAI(client: OllamaClient, prompt: string, ns: NS): Promise<AIAction | null> {
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await client.generate(prompt);

            if (!response) {
                ns.print('ERROR: Empty response from Ollama');
                continue;
            }

            // Parse JSON response
            const action = JSON.parse(response) as AIAction;

            // Validate required fields
            if (!action.action || !action.reasoning) {
                throw new Error('Missing required fields in AI response');
            }

            return action;
        } catch (error) {
            ns.print(`WARN: Failed to parse AI response (attempt ${attempt + 1}/${maxRetries + 1}): ${error}`);

            if (attempt < maxRetries) {
                // Send clarification prompt
                prompt = prompt + '\n\nIMPORTANT: Your previous response was not valid JSON. Please respond with ONLY a JSON object, no markdown formatting or code blocks.';
            }
        }
    }

    // All retries failed
    ns.print('ERROR: Failed to get valid JSON response from AI after retries');
    return null;
}

// ============================================================================
// Action Validation and Execution
// ============================================================================

/**
 * Validate AI action before execution
 */
function validateAction(ns: NS, action: AIAction, state: GameState): { valid: boolean; error?: string } {
    // Check action is allowed
    const allowedActions: AIAction['action'][] = ['hack', 'grow', 'weaken', 'scan', 'wait'];
    if (!allowedActions.includes(action.action)) {
        return { valid: false, error: `Invalid action: ${action.action}` };
    }

    // Actions that require a target
    if (['hack', 'grow', 'weaken'].includes(action.action)) {
        if (!action.target) {
            return { valid: false, error: `Action ${action.action} requires a target` };
        }

        // Check if target exists in our server list
        const server = state.servers.find(s => s.hostname === action.target);
        if (!server) {
            return { valid: false, error: `Target server '${action.target}' not found or not accessible` };
        }

        // Check if we have admin rights
        if (!server.hasAdminRights) {
            return { valid: false, error: `No admin rights on ${action.target}` };
        }

        // Check if we meet level requirement
        if (state.player.hacking < server.requiredHackingLevel) {
            return { valid: false, error: `Hacking level ${state.player.hacking} too low for ${action.target} (requires ${server.requiredHackingLevel})` };
        }
    }

    return { valid: true };
}

/**
 * Execute validated action
 */
async function executeAction(ns: NS, action: AIAction): Promise<ActionOutcome> {
    const startTime = Date.now();

    try {
        switch (action.action) {
            case 'hack': {
                const moneyGained = await ns.hack(action.target!);
                const duration = Date.now() - startTime;
                return {
                    action: 'hack',
                    target: action.target,
                    success: moneyGained > 0,
                    result: moneyGained,
                    timestamp: Date.now()
                };
            }

            case 'grow': {
                const growthMultiplier = await ns.grow(action.target!);
                return {
                    action: 'grow',
                    target: action.target,
                    success: growthMultiplier > 1,
                    result: growthMultiplier,
                    timestamp: Date.now()
                };
            }

            case 'weaken': {
                const securityReduction = await ns.weaken(action.target!);
                return {
                    action: 'weaken',
                    target: action.target,
                    success: securityReduction > 0,
                    result: securityReduction,
                    timestamp: Date.now()
                };
            }

            case 'scan': {
                // Force cache refresh
                serverCache = [];
                serverCacheTime = 0;
                return {
                    action: 'scan',
                    success: true,
                    result: 'Server cache refreshed',
                    timestamp: Date.now()
                };
            }

            case 'wait': {
                await ns.sleep(5000);
                return {
                    action: 'wait',
                    success: true,
                    result: 'Waited 5 seconds',
                    timestamp: Date.now()
                };
            }

            default:
                return {
                    action: action.action,
                    success: false,
                    result: 'Unknown action',
                    timestamp: Date.now()
                };
        }
    } catch (error) {
        return {
            action: action.action,
            target: action.target,
            success: false,
            result: `Error: ${error}`,
            timestamp: Date.now()
        };
    }
}

/**
 * Add outcome to action history (circular buffer)
 */
function addToHistory(history: ActionOutcome[], outcome: ActionOutcome, maxSize: number = 10): void {
    history.push(outcome);
    if (history.length > maxSize) {
        history.shift(); // Remove oldest
    }
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function main(ns: NS): Promise<void> {
    // Clear tail window for clean output
    ns.clearLog();

    // Disable default logs to keep output clean
    ns.disableLog('ALL');

    // Parse command-line arguments
    const args = parseArguments(ns);

    // Build configuration
    const config: OllamaConfig = {
        endpoint: args.endpoint,
        model: args.model,
        timeout: DEFAULT_CONFIG.timeout,
        temperature: args.temperature
    };

    // Display startup banner
    ns.tprint('╔════════════════════════════════════════╗');
    ns.tprint('║   AI-Powered Bitburner Agent v1.0     ║');
    ns.tprint('╚════════════════════════════════════════╝');
    ns.tprint('');
    ns.tprint('Configuration:');
    ns.tprint(`  Endpoint:    ${config.endpoint}`);
    ns.tprint(`  Model:       ${config.model}`);
    ns.tprint(`  Interval:    ${args.interval}ms`);
    ns.tprint(`  Temperature: ${config.temperature}`);
    ns.tprint('');

    // Initialize Ollama client
    const client = new OllamaClient(config);

    // Test connection
    ns.tprint('Testing Ollama connection...');
    const connected = await client.testConnection();

    if (!connected) {
        ns.tprint('ERROR: Failed to connect to Ollama service');
        ns.tprint(`Make sure Ollama is running: ollama serve`);
        ns.tprint(`And the model is available: ollama pull ${config.model}`);
        return;
    }

    ns.tprint('✓ Connected to Ollama service');
    ns.tprint('');
    ns.tprint('Starting AI agent... Use --tail to monitor decisions.');
    ns.tprint('Press Ctrl+C to stop the script.');
    ns.tprint('');

    // Initialize action history
    const actionHistory: ActionOutcome[] = [];
    let cycleCount = 0;
    let totalMoneyGained = 0;
    const startingMoney = ns.getServerMoneyAvailable('home');

    // Main decision loop
    while (true) {
        cycleCount++;

        try {
            ns.print('═'.repeat(60));
            ns.print(`CYCLE ${cycleCount}`);
            ns.print('═'.repeat(60));

            // Check if in safe mode
            if (client.isInSafeMode()) {
                ns.print('⚠ SAFE MODE: Too many Ollama failures, using fallback actions');

                // Simple fallback: weaken lowest security server
                const state = buildGameState(ns, actionHistory);
                if (state.servers.length > 0) {
                    const target = state.servers[0];
                    ns.print(`Fallback action: weaken ${target.hostname}`);

                    const outcome = await executeAction(ns, {
                        action: 'weaken',
                        target: target.hostname,
                        reasoning: 'Safe mode fallback'
                    });

                    addToHistory(actionHistory, outcome);
                    logOutcome(ns, outcome);
                }

                await ns.sleep(args.interval);
                continue;
            }

            // Step 1: Observe game state
            ns.print('Step 1: Observing game state...');
            const state = buildGameState(ns, actionHistory);
            ns.print(`  Player: Level ${state.player.hacking}, Money: $${ns.formatNumber(state.player.money)}`);
            ns.print(`  Servers: ${state.servers.length} accessible targets`);

            // Step 2: Build prompt
            ns.print('Step 2: Building AI prompt...');
            const prompt = buildPrompt(ns, state);

            // Step 3: Query AI
            ns.print('Step 3: Querying AI for decision...');
            const action = await queryAI(client, prompt, ns);

            if (!action) {
                ns.print('ERROR: Failed to get valid action from AI, waiting...');
                await ns.sleep(args.interval);
                continue;
            }

            ns.print(`AI Decision: ${action.action} ${action.target || ''}`);
            ns.print(`Reasoning: ${action.reasoning}`);

            // Step 4: Validate action
            ns.print('Step 4: Validating action...');
            const validation = validateAction(ns, action, state);

            if (!validation.valid) {
                ns.print(`ERROR: Action validation failed: ${validation.error}`);

                const outcome: ActionOutcome = {
                    action: action.action,
                    target: action.target,
                    success: false,
                    result: validation.error || 'Validation failed',
                    timestamp: Date.now()
                };

                addToHistory(actionHistory, outcome);
                await ns.sleep(args.interval);
                continue;
            }

            ns.print('✓ Action validated');

            // Step 5: Execute action
            ns.print('Step 5: Executing action...');
            const outcome = await executeAction(ns, action);

            // Step 6: Log outcome
            logOutcome(ns, outcome);

            // Track money gained
            if (outcome.action === 'hack' && outcome.success && typeof outcome.result === 'number') {
                totalMoneyGained += outcome.result;
            }

            // Step 7: Update history
            addToHistory(actionHistory, outcome);

            // Periodic status report (every 10 cycles)
            if (cycleCount % 10 === 0) {
                logStatusReport(ns, cycleCount, startingMoney, totalMoneyGained, actionHistory);
            }

        } catch (error) {
            ns.print(`ERROR in decision loop: ${error}`);

            // Add error to history
            const errorOutcome: ActionOutcome = {
                action: 'error',
                success: false,
                result: String(error),
                timestamp: Date.now()
            };
            addToHistory(actionHistory, errorOutcome);
        }

        // Step 8: Sleep
        ns.print(`Sleeping ${args.interval}ms until next cycle...`);
        await ns.sleep(args.interval);
    }
}

// ============================================================================
// Logging Helpers
// ============================================================================

/**
 * Log action outcome
 */
function logOutcome(ns: NS, outcome: ActionOutcome): void {
    if (outcome.success) {
        let resultStr = typeof outcome.result === 'number'
            ? ns.formatNumber(outcome.result)
            : outcome.result;

        if (outcome.action === 'hack') {
            resultStr = `+$${resultStr}`;
        } else if (outcome.action === 'grow') {
            resultStr = `x${resultStr}`;
        } else if (outcome.action === 'weaken') {
            resultStr = `-${resultStr} security`;
        }

        ns.print(`✓ SUCCESS: ${outcome.action} ${outcome.target || ''} → ${resultStr}`);
    } else {
        ns.print(`✗ FAILED: ${outcome.action} ${outcome.target || ''} → ${outcome.result}`);
    }
}

/**
 * Log periodic status report
 */
function logStatusReport(
    ns: NS,
    cycleCount: number,
    startingMoney: number,
    totalMoneyGained: number,
    history: ActionOutcome[]
): void {
    const currentMoney = ns.getServerMoneyAvailable('home');
    const netChange = currentMoney - startingMoney;
    const successCount = history.filter(h => h.success).length;
    const totalActions = history.length;
    const successRate = totalActions > 0 ? (successCount / totalActions * 100).toFixed(1) : '0';

    // Count action types
    const actionCounts: Record<string, number> = {};
    for (const outcome of history) {
        actionCounts[outcome.action] = (actionCounts[outcome.action] || 0) + 1;
    }

    ns.print('');
    ns.print('═'.repeat(60));
    ns.print(`STATUS REPORT (Cycle ${cycleCount})`);
    ns.print('═'.repeat(60));
    ns.print(`Money Change: $${ns.formatNumber(netChange)} (${netChange >= 0 ? '+' : ''}${((netChange / startingMoney) * 100).toFixed(1)}%)`);
    ns.print(`Money from Hacks: $${ns.formatNumber(totalMoneyGained)}`);
    ns.print(`Actions: ${totalActions} total, ${successCount} successful (${successRate}% success rate)`);

    const actionSummary = Object.entries(actionCounts)
        .map(([action, count]) => `${action} (${count})`)
        .join(', ');
    ns.print(`Action Distribution: ${actionSummary}`);
    ns.print('═'.repeat(60));
    ns.print('');
}

// ============================================================================
// Main Entry Point
// ============================================================================

// ============================================================================
// Argument Parsing
// ============================================================================

/**
 * Parse command-line arguments with defaults
 */
function parseArguments(ns: NS): ScriptArgs {
    const flags = ns.flags([
        ['endpoint', DEFAULT_CONFIG.endpoint],
        ['model', DEFAULT_CONFIG.model],
        ['interval', DEFAULT_INTERVAL],
        ['temperature', DEFAULT_CONFIG.temperature]
    ]);

    return {
        endpoint: String(flags.endpoint),
        model: String(flags.model),
        interval: Number(flags.interval),
        temperature: Number(flags.temperature)
    };
}
