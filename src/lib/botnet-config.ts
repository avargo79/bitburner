// ===== BOTNET CONFIGURATION CONSTANTS =====
export const BOTNET_CONFIG = {
    // RAM and resource management
    SCRIPT_RAM_COST: 1.75,              // GB per thread for HWGW scripts
    SHRAM_SCRIPT_RAM_COST: 4.0,         // GB per thread for repboost scripts
    HOME_RAM_RESERVE: 32,               // GB to reserve on home server
    MIN_BATCH_RAM_THRESHOLD: 50,        // Minimum GB to spawn additional batches
    MIN_BATCH_THREAD_THRESHOLD: 10,     // Minimum threads for batch allocation
    
    // HWGW timing and optimization
    HWGW_TIMING_GAP: 150,               // ms between HWGW script executions
    HACK_PERCENTAGE: 0.75,              // Percentage of server money to target
    GROWTH_ANALYSIS_CAP: 50,            // Maximum growth multiplier to prevent extreme values
    
    // Target selection thresholds (legacy - now using perfect prep logic)
    MONEY_THRESHOLD: 0.95,              // Legacy: now targeting 95%+ money for perfect prep
    SECURITY_TOLERANCE: 0.1,            // Legacy: now targeting min security +0.1 for perfect prep
    PREP_MONEY_THRESHOLD: 0.95,         // Money threshold for prep batch selection
    PREP_SECURITY_THRESHOLD: 1,         // Security threshold for prep batch selection
    
    // Repboost system configuration
    SHRAM_REALLOCATION_INTERVAL: 60000, // ms between repboost reallocations
    SHRAM_THREAD_CHANGE_THRESHOLD: 50,  // Thread difference to trigger reallocation
    SHRAM_CLEANUP_ROUNDS: 3,            // Number of cleanup attempts
    SHRAM_CLEANUP_DELAY: 200,           // ms between cleanup rounds
    
    // Performance and monitoring
    STATUS_UPDATE_INTERVAL: 1000,       // ms between status updates
    SHRAM_REPORTING_INTERVAL: 30000,    // ms between repboost script reports
    TOP_TARGETS_DISPLAY: 3,             // Number of top targets to show in status
    TOP_SERVERS_DEBUG: 5,               // Number of top servers to show in debug
    TOP_SHRAM_SERVERS: 3,               // Number of top repboost servers to display
    
    // Server management
    PURCHASED_SERVER_START_RAM: 2,      // GB starting RAM for new purchased servers
    SERVER_UPGRADE_LIMIT: 1,            // Max servers to upgrade per cycle
    
    // Script file patterns
    REMOTE_SCRIPT_PATTERN: 'simple-',   // Pattern for remote scripts to manage
    REMOTE_SCRIPT_EXTENSION: '.js'      // File extension for remote scripts
} as const;

// ===== COMMAND-LINE ARGUMENT SCHEMA =====
export const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
    ['rooting', true],
    ['cleanup', false],
    ['max-servers', 25],
    ['target-ram-power', 13],
    ['repboost', false],
    ['repboost-ram-percentage', 25],
    ['repboost-min-threads', 10],
    ['repboost-max-threads', 999999],
    ['repboost-core-threshold', 4],
    ['repboost-stability-delay', 5000],
    ['repboost-intelligence-opt', true],
    ['repboost-debug', false],
];