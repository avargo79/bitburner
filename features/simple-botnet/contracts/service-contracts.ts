/**
 * Service Contracts: Simple Autonomous Botnet
 * 
 * TypeScript interface definitions for the main components of the simple
 * autonomous botnet system. These interfaces define the contract between
 * different parts of the single script implementation.
 */

import { NS } from '@ns';

// ===== CORE DATA INTERFACES =====
// Re-export from data-model.md for type consistency

export interface ServerInfo {
  hostname: string;
  hasAdminRights: boolean;
  requiredHackingSkill: number;
  minDifficulty: number;
  difficulty: number;
  moneyMax: number;
  moneyAvailable: number;
  maxRam: number;
  usedRam: number;
  purchasedByPlayer: boolean;
  backdoorInstalled: boolean;
  requiredPortCount: number;
  openPortCount: number;
}

export interface TargetServer {
  hostname: string;
  profitabilityScore: number;
  maxMoneyPerSecond: number;
  currentPreparation: {
    securityDelta: number;
    moneyRatio: number;
    needsPreparation: boolean;
  };
  hackingMetrics: {
    hackTime: number;
    growTime: number;
    weakenTime: number;
    hackThreadsFor50Percent: number;
    growThreadsToDouble: number;
    weakenThreadsForHack: number;
    weakenThreadsForGrow: number;
  };
}

export interface BotnetServer {
  hostname: string;
  availableRam: number;
  maxThreads: {
    hack: number;
    grow: number;
    weaken: number;
  };
  currentUtilization: number;
  isReliable: boolean;
  priority: number;
}

export interface OperationBatch {
  batchId: string;
  targetHostname: string;
  startTime: number;
  operations: {
    hack: {
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number;
    };
    grow: {
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number;
    };
    weakenHack: {
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number;
    };
    weakenGrow: {
      threads: number;
      servers: string[];
      startDelay: number;
      expectedDuration: number;
    };
  };
  expectedCompletion: number;
  status: 'planned' | 'executing' | 'completed' | 'failed';
}

// ===== SERVICE CONTRACTS =====

/**
 * NetworkScanner Service Contract
 * Handles server discovery and rooting operations
 */
export interface NetworkScanner {
  /**
   * Discovers all servers accessible from current network position
   * @param ns - Netscript API interface
   * @returns Map of hostname to ServerInfo for all discovered servers
   */
  discoverNetwork(ns: NS): Map<string, ServerInfo>;

  /**
   * Attempts to root a server using available tools
   * @param ns - Netscript API interface  
   * @param hostname - Target server to root
   * @returns true if server was successfully rooted
   */
  rootServer(ns: NS, hostname: string): boolean;

  /**
   * Gets current player capabilities (hacking level, available tools)
   * @param ns - Netscript API interface
   * @returns Object with player stats relevant to server access
   */
  getPlayerCapabilities(ns: NS): {
    hackingLevel: number;
    availablePrograms: string[];
    canOpenPorts: number;
  };
}

/**
 * TargetSelector Service Contract  
 * Handles server evaluation and target prioritization
 */
export interface TargetSelector {
  /**
   * Evaluates servers for profitability and selects optimal targets
   * @param ns - Netscript API interface
   * @param servers - Available rooted servers to evaluate
   * @param playerLevel - Current player hacking level
   * @returns Array of TargetServer objects sorted by profitability
   */
  selectTargets(ns: NS, servers: Map<string, ServerInfo>, playerLevel: number): TargetServer[];

  /**
   * Calculates profitability score for a single server
   * @param ns - Netscript API interface
   * @param hostname - Server to evaluate
   * @returns Numeric score (higher = more profitable)
   */
  calculateProfitabilityScore(ns: NS, hostname: string): number;

  /**
   * Determines if a target server needs preparation (security/money optimization)
   * @param ns - Netscript API interface
   * @param target - Target server to check
   * @returns true if prep operations are needed before HWGW
   */
  needsPreparation(ns: NS, target: TargetServer): boolean;
}

/**
 * BatchCoordinator Service Contract
 * Handles HWGW operation timing and execution across botnet
 */
export interface BatchCoordinator {
  /**
   * Plans and creates an HWGW batch for a target server
   * @param ns - Netscript API interface
   * @param target - Target server for operations
   * @param botnetServers - Available servers for execution
   * @returns Planned OperationBatch ready for execution
   */
  planBatch(ns: NS, target: TargetServer, botnetServers: BotnetServer[]): OperationBatch;

  /**
   * Executes a planned batch by distributing operations across botnet
   * @param ns - Netscript API interface
   * @param batch - Planned batch to execute
   * @returns true if batch was successfully started
   */
  executeBatch(ns: NS, batch: OperationBatch): boolean;

  /**
   * Monitors active batches and updates their status
   * @param ns - Netscript API interface
   * @param activeBatches - Map of active batch IDs to OperationBatch
   * @returns Updated batch statuses
   */
  monitorBatches(ns: NS, activeBatches: Map<string, OperationBatch>): void;

  /**
   * Calculates optimal HWGW timing delays for a target
   * @param ns - Netscript API interface
   * @param target - Target server
   * @returns Object with calculated delays and thread counts
   */
  calculateBatchTiming(ns: NS, target: TargetServer): {
    hackDelay: number;
    growDelay: number;
    weakenHackDelay: number;
    weakenGrowDelay: number;
    totalBatchTime: number;
  };
}

/**
 * SimpleBotnetScript Main Interface
 * Primary script execution contract for the autonomous botnet
 */
export interface SimpleBotnetScript {
  /**
   * Main execution function - entry point for the botnet script
   * @param ns - Netscript API interface
   * @returns Promise that resolves when script completes or fails
   */
  main(ns: NS): Promise<void>;

  /**
   * Executes one complete cycle of botnet operations
   * @param ns - Netscript API interface
   * @returns true if cycle completed successfully
   */
  executeCycle(ns: NS): Promise<boolean>;

  /**
   * Initializes botnet state and performs initial network discovery
   * @param ns - Netscript API interface  
   * @returns Initial botnet state
   */
  initialize(ns: NS): Promise<{
    networkState: Map<string, ServerInfo>;
    targets: TargetServer[];
    botnetServers: BotnetServer[];
  }>;

  /**
   * Handles script shutdown and cleanup
   * @param ns - Netscript API interface
   * @returns void
   */
  shutdown(ns: NS): Promise<void>;
}

// ===== UTILITY CONTRACTS =====

/**
 * Logging and Status Reporting
 */
export interface BotnetLogger {
  /**
   * Logs progress information (ns.print for ongoing status)
   * @param ns - Netscript API interface
   * @param message - Status message
   */
  logProgress(ns: NS, message: string): void;

  /**
   * Logs important events (ns.tprint for major milestones)
   * @param ns - Netscript API interface
   * @param event - Event description
   */
  logEvent(ns: NS, event: string): void;

  /**
   * Logs error conditions with context
   * @param ns - Netscript API interface
   * @param error - Error message or object
   * @param context - Additional context information
   */
  logError(ns: NS, error: string | Error, context?: any): void;
}

/**
 * Resource Management
 */
export interface ResourceManager {
  /**
   * Calculates available RAM across botnet servers
   * @param ns - Netscript API interface
   * @param servers - Server hostnames to check
   * @returns Total available RAM in GB
   */
  calculateTotalAvailableRAM(ns: NS, servers: string[]): number;

  /**
   * Allocates threads across servers for a specific operation
   * @param ns - Netscript API interface
   * @param servers - Available servers
   * @param requiredThreads - Total threads needed
   * @param scriptRAM - RAM cost per thread
   * @returns Allocation plan mapping servers to thread counts
   */
  allocateThreads(ns: NS, servers: BotnetServer[], requiredThreads: number, scriptRAM: number): Map<string, number>;

  /**
   * Validates that a resource allocation plan is feasible
   * @param ns - Netscript API interface
   * @param allocation - Planned allocation
   * @returns true if allocation can be executed
   */
  validateAllocation(ns: NS, allocation: Map<string, number>): boolean;
}