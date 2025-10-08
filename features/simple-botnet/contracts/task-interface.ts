/**
 * Task-Specific Interfaces: Simple Autonomous Botnet
 * 
 * Interface definitions for script arguments, configuration,
 * and task-specific data structures.
 */

// ===== SCRIPT CONFIGURATION =====

/**
 * Command-line arguments for the simple botnet script
 */
export interface SimpleBotnetArgs {
  /** Enable debug logging (default: false) */
  debug: boolean;
  
  /** Cycle interval in seconds (default: 60) */
  cycleInterval: number;
  
  /** Maximum number of concurrent targets (default: 3) */
  maxTargets: number;
  
  /** Minimum target profitability score (default: 1000) */
  minProfitability: number;
  
  /** RAM utilization percentage limit (default: 0.8) */
  maxRAMUtilization: number;
  
  /** Enable preparation operations (default: true) */
  enablePrep: boolean;
  
  /** Batch timeout in minutes (default: 10) */
  batchTimeout: number;
}

/**
 * Script execution configuration derived from args
 */
export interface SimpleBotnetConfig {
  debug: boolean;
  cycleIntervalMs: number;
  maxTargets: number;
  minProfitability: number;
  maxRAMUtilization: number;
  enablePrep: boolean;
  batchTimeoutMs: number;
  
  // Derived timing constants
  discoveryIntervalMs: number;
  statusUpdateIntervalMs: number;
  batchCheckIntervalMs: number;
  
  // RAM allocation constants
  reservedRAMPerServer: number;
  scriptRAMCosts: {
    hack: number;
    grow: number; 
    weaken: number;
  };
}

// ===== EXECUTION STATE =====

/**
 * Overall system state during script execution
 */
export interface SimpleBotnetState {
  /** Current execution phase */
  phase: 'initializing' | 'discovering' | 'targeting' | 'executing' | 'monitoring' | 'error';
  
  /** Script start time */
  startTime: number;
  
  /** Last successful cycle completion */
  lastCycleTime: number;
  
  /** Number of completed cycles */
  cycleCount: number;
  
  /** Current network state */
  networkState: {
    totalServers: number;
    rootedServers: number;
    botnetServers: number;
    lastDiscoveryTime: number;
  };
  
  /** Current targeting state */
  targetingState: {
    evaluatedServers: number;
    selectedTargets: number;
    activeTargets: string[];
    lastTargetingTime: number;
  };
  
  /** Current execution state */
  executionState: {
    activeBatches: number;
    completedBatches: number;
    failedBatches: number;
    totalMoneyEarned: number;
    averageIncomeRate: number;
  };
  
  /** Error tracking */
  errorState: {
    lastError: string | null;
    errorCount: number;
    consecutiveFailures: number;
  };
}

// ===== PERFORMANCE METRICS =====

/**
 * Performance tracking for optimization and monitoring
 */
export interface SimpleBotnetMetrics {
  /** Timing measurements */
  timing: {
    discoveryTimeMs: number;
    targetingTimeMs: number;
    batchPlanningTimeMs: number;
    batchExecutionTimeMs: number;
    totalCycleTimeMs: number;
  };
  
  /** Resource utilization */
  resources: {
    totalBotnetRAM: number;
    usedBotnetRAM: number;
    ramUtilizationPercent: number;
    averageThreadsPerServer: number;
  };
  
  /** Financial performance */
  financial: {
    moneyAtStart: number;
    currentMoney: number;
    totalEarned: number;
    earningsPerMinute: number;
    earningsPerCycle: number;
  };
  
  /** Operational statistics */
  operational: {
    serversDiscovered: number;
    serversRooted: number;
    targetsEvaluated: number;
    batchesPlanned: number;
    batchesExecuted: number;
    batchSuccessRate: number;
  };
}

// ===== ERROR HANDLING =====

/**
 * Error types and recovery strategies
 */
export interface SimpleBotnetError {
  /** Error category */
  type: 'network' | 'targeting' | 'execution' | 'resource' | 'timeout' | 'critical';
  
  /** Error message */
  message: string;
  
  /** Error context */
  context: {
    phase: string;
    targetServer?: string;
    batchId?: string;
    serverHostname?: string;
    operationType?: string;
  };
  
  /** Timestamp */
  timestamp: number;
  
  /** Suggested recovery action */
  recovery: 'retry' | 'skip' | 'restart' | 'abort';
  
  /** Whether error is recoverable */
  recoverable: boolean;
}

/**
 * Recovery state tracking
 */
export interface SimpleBotnetRecovery {
  /** Current recovery mode */
  mode: 'normal' | 'degraded' | 'emergency' | 'shutdown';
  
  /** Recovery attempt count */
  attempts: number;
  
  /** Last recovery action taken */
  lastAction: string;
  
  /** Recovery start time */
  recoveryStartTime: number;
  
  /** Whether system should continue operating */
  shouldContinue: boolean;
}

// ===== TASK EXECUTION INTERFACES =====

/**
 * Individual task definition for the main execution loop
 */
export interface SimpleBotnetTask {
  /** Task identifier */
  id: string;
  
  /** Task description */
  description: string;
  
  /** Task priority (higher = more important) */
  priority: number;
  
  /** Task execution function */
  execute: () => Promise<boolean>;
  
  /** Task timeout in milliseconds */
  timeoutMs: number;
  
  /** Whether task can be retried on failure */
  retryable: boolean;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Dependencies (task IDs that must complete first) */
  dependencies: string[];
}

/**
 * Task execution result
 */
export interface SimpleBotnetTaskResult {
  /** Task ID */
  taskId: string;
  
  /** Execution success */
  success: boolean;
  
  /** Execution time in milliseconds */
  executionTimeMs: number;
  
  /** Result data (task-specific) */
  data?: any;
  
  /** Error information if failed */
  error?: SimpleBotnetError;
  
  /** Whether task should be retried */
  shouldRetry: boolean;
}

// ===== INTEGRATION POINTS =====

/**
 * External script integration interface
 */
export interface ExternalScriptInterface {
  /** Script filename */
  filename: string;
  
  /** Required RAM per thread */
  ramCost: number;
  
  /** Expected argument format */
  argFormat: string[];
  
  /** Expected execution time range */
  expectedDurationMs: {
    min: number;
    max: number;
  };
  
  /** Success detection method */
  successIndicator: 'completion' | 'return-value' | 'side-effect';
}

/**
 * Remote script execution tracking
 */
export interface RemoteScriptExecution {
  /** Script being executed */
  script: ExternalScriptInterface;
  
  /** Server executing the script */
  hostname: string;
  
  /** Thread count */
  threads: number;
  
  /** Script arguments */
  args: (string | number)[];
  
  /** Start time */
  startTime: number;
  
  /** Expected completion time */
  expectedEndTime: number;
  
  /** Current status */
  status: 'starting' | 'running' | 'completed' | 'failed' | 'timeout';
  
  /** Process ID (if available) */
  pid?: number;
}