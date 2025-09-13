import { NS } from "@ns";

/**
 * Faction Detection Service Interface
 * 
 * Provides zero-cost faction work detection using DOM text scanning.
 * Detects "Working for [FactionName]" text in game interface.
 */
export interface IFactionDetector {
    /**
     * Check if player is currently performing faction work
     * @returns Current faction work status
     */
    detectFactionWork(): FactionWorkStatus;
    
    /**
     * Extract faction name from detected work status text
     * @param workText The "Working for [FactionName]" text
     * @returns Faction name or null if not found
     */
    extractFactionName(workText: string): string | null;
    
    /**
     * Validate detection stability over multiple cycles
     * @param status Current detection status
     * @param requiredConsecutiveDetections Minimum consecutive detections needed
     * @returns Whether detection is stable enough to act upon
     */
    isDetectionStable(status: FactionWorkStatus, requiredConsecutiveDetections: number): boolean;
}

/**
 * Share Allocation Service Interface
 * 
 * Manages distribution of share threads across botnet servers with
 * CPU core optimization and RAM percentage allocation.
 */
export interface IShareAllocator {
    /**
     * Calculate optimal share thread allocation across available servers
     * @param ns Netscript API reference
     * @param servers Available servers for allocation
     * @param config Share allocation configuration
     * @returns Complete allocation plan
     */
    calculateAllocation(ns: NS, servers: ServerData[], config: ShareConfiguration): ShareAllocation;
    
    /**
     * Deploy share scripts to allocated servers
     * @param ns Netscript API reference
     * @param allocation Share allocation plan to execute
     * @returns Deployment results and server allocation details
     */
    deployShareScripts(ns: NS, allocation: ShareAllocation): ServerShareAllocation[];
    
    /**
     * Terminate all active share scripts across the network
     * @param ns Netscript API reference
     * @param serverAllocations Current server allocations to terminate
     * @returns Count of successfully terminated scripts
     */
    terminateShareScripts(ns: NS, serverAllocations: ServerShareAllocation[]): number;
    
    /**
     * Recalculate allocation when server resources change
     * @param ns Netscript API reference
     * @param currentAllocation Current allocation state
     * @param updatedServers Updated server data
     * @returns New allocation or null if no changes needed
     */
    reallocateResources(ns: NS, currentAllocation: ShareAllocation, updatedServers: ServerData[]): ShareAllocation | null;
}

/**
 * Server Resource Management Interface
 * 
 * Handles server capacity assessment and priority ranking for
 * share thread allocation optimization.
 */
export interface IServerResourceManager {
    /**
     * Assess share allocation capacity for a server
     * @param ns Netscript API reference  
     * @param hostname Server to assess
     * @param ramPercentage Percentage of available RAM to consider
     * @returns Server resource profile for allocation planning
     */
    assessServerCapacity(ns: NS, hostname: string, ramPercentage: number): ServerResourceProfile;
    
    /**
     * Rank servers by allocation priority based on CPU cores and available RAM
     * @param servers Server resource profiles to rank
     * @returns Servers sorted by allocation priority (highest first)
     */
    rankServersByPriority(servers: ServerResourceProfile[]): ServerResourceProfile[];
    
    /**
     * Calculate effective thread count including intelligence and core bonuses
     * @param baseThreads Raw thread count
     * @param cpuCores Server CPU core count
     * @param playerIntelligence Current player intelligence stat
     * @returns Effective thread count for bonus calculations
     */
    calculateEffectiveThreads(baseThreads: number, cpuCores: number, playerIntelligence: number): number;
    
    /**
     * Get current network-wide RAM snapshot for allocation planning
     * @param ns Netscript API reference
     * @param servers Servers to include in snapshot
     * @returns Network RAM availability summary
     */
    getNetworkRAMSnapshot(ns: NS, servers: ServerData[]): NetworkRAMSnapshot;
}

/**
 * Share Performance Tracking Interface
 * 
 * Monitors share allocation performance and provides real-time
 * metrics for optimization and debugging.
 */
export interface IShareMetricsTracker {
    /**
     * Calculate current reputation bonus from active share threads
     * @param allocation Current share allocation state
     * @returns Real-time reputation bonus multiplier
     */
    calculateReputationBonus(allocation: ShareAllocation): number;
    
    /**
     * Track share allocation performance metrics
     * @param allocation Current allocation state
     * @param serverAllocations Per-server allocation details
     * @param startTime Allocation start timestamp
     * @returns Comprehensive performance metrics
     */
    trackPerformanceMetrics(
        allocation: ShareAllocation, 
        serverAllocations: ServerShareAllocation[], 
        startTime: number
    ): SharePerformanceMetrics;
    
    /**
     * Generate allocation efficiency report
     * @param metrics Current performance metrics
     * @param config Share configuration
     * @returns Efficiency analysis and optimization recommendations
     */
    generateEfficiencyReport(metrics: SharePerformanceMetrics, config: ShareConfiguration): AllocationEfficiencyReport;
    
    /**
     * Log share allocation status for debugging and monitoring
     * @param ns Netscript API reference
     * @param allocation Current allocation state
     * @param metrics Performance metrics
     * @param debugEnabled Whether to show detailed debug output
     */
    logAllocationStatus(ns: NS, allocation: ShareAllocation, metrics: SharePerformanceMetrics, debugEnabled: boolean): void;
}

/**
 * Botnet Integration Interface
 * 
 * Coordinates share functionality with existing botnet HWGW operations.
 * Ensures seamless integration without disrupting money farming.
 */
export interface IBotnetShareIntegration {
    /**
     * Initialize share functionality within botnet execution loop
     * @param ns Netscript API reference
     * @param config Share configuration from command-line arguments
     * @returns Share system initialization status
     */
    initializeShareSystem(ns: NS, config: ShareConfiguration): boolean;
    
    /**
     * Process share allocation during botnet execution cycle
     * @param ns Netscript API reference
     * @param servers Current server data from botnet
     * @param availableRAM Remaining RAM after HWGW allocation
     * @returns Updated RAM budget after share allocation
     */
    processShareAllocation(ns: NS, servers: ServerData[], availableRAM: number): number;
    
    /**
     * Integrate share allocation with existing HWGW batching
     * @param ns Netscript API reference
     * @param hwgwRAMRequirement RAM needed for HWGW operations
     * @param shareRAMRequirement RAM needed for share operations
     * @returns Balanced RAM allocation between HWGW and sharing
     */
    balanceRAMAllocation(ns: NS, hwgwRAMRequirement: number, shareRAMRequirement: number): RAMAllocationBalance;
    
    /**
     * Clean up share resources when botnet shuts down
     * @param ns Netscript API reference
     * @returns Cleanup operation results
     */
    shutdownShareSystem(ns: NS): ShareCleanupResults;
}

// Supporting type definitions for interfaces

export interface FactionWorkStatus {
    isWorkingForFaction: boolean;
    detectedFactionName: string | null;
    lastDetectionTime: number;
    detectionMethod: 'dom-text' | 'manual';
    workDuration: number;
    consecutiveDetections: number;
    lastStatusChange: number;
}

export interface ShareAllocation {
    isActive: boolean;
    totalThreads: number;
    totalRAMUsed: number;
    ramPercentage: number;
    estimatedReputationBonus: number;
    effectiveThreads: number;
    allocationTimestamp: number;
    serverAllocations: ServerShareAllocation[];
}

export interface ServerShareAllocation {
    hostname: string;
    cpuCores: number;
    coreBonus: number;
    allocatedThreads: number;
    allocatedRAM: number;
    effectiveThreads: number;
    scriptPID: number | null;
    allocationPriority: number;
    deploymentStatus: 'pending' | 'active' | 'failed';
    lastAllocationTime: number;
}

export interface SharePerformanceMetrics {
    totalServersUsed: number;
    averageThreadsPerServer: number;
    totalEffectiveThreads: number;
    networkCoreBonus: number;
    intelligenceBonus: number;
    actualReputationBonus: number;
    allocationEfficiency: number;
    ramUtilizationRate: number;
    deploymentSuccessRate: number;
    averageAllocationTime: number;
}

export interface ShareConfiguration {
    enabled: boolean;
    ramPercentage: number;
    minimumThreads: number;
    maximumThreads: number;
    priorityCoreThreshold: number;
    detectionStabilityDelay: number;
    intelligenceOptimization: boolean;
    debugLogging: boolean;
}

export interface ServerData {
    hostname: string;
    hasAdminRights: boolean;
    purchasedByPlayer: boolean;
    requiredHackingSkill: number;
    maxRam: number;
    ramUsed: number;
    moneyMax: number;
    moneyAvailable: number;
    hackDifficulty: number;
    minDifficulty: number;
    hackTime: number;
    weakenTime: number;
    growTime: number;
}

export interface ServerResourceProfile {
    hostname: string;
    cpuCores: number;
    availableRAM: number;
    maxShareThreads: number;
    coreBonus: number;
    allocationPriority: number;
    isEligible: boolean;
}

export interface NetworkRAMSnapshot {
    totalAvailable: number;
    shareAllocationBudget: number;
    servers: { hostname: string; availableRAM: number; cpuCores: number }[];
}

export interface AllocationEfficiencyReport {
    currentEfficiency: number;
    optimalThreadDistribution: { hostname: string; optimalThreads: number }[];
    bottlenecks: string[];
    recommendations: string[];
    potentialImprovements: { action: string; expectedGain: number }[];
}

export interface RAMAllocationBalance {
    hwgwRAMAllocated: number;
    shareRAMAllocated: number;
    remainingRAM: number;
    allocationRatio: number;
    balanceStrategy: 'hwgw-priority' | 'share-priority' | 'balanced';
}

export interface ShareCleanupResults {
    scriptsTerminated: number;
    serversCleanedUp: number;
    ramFreed: number;
    cleanupErrors: string[];
    totalCleanupTime: number;
}