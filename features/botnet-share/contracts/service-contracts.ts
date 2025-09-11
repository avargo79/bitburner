/**
 * Core Service Contracts for Botnet Share Enhancement
 * 
 * Defines the service layer interfaces for faction detection,
 * share allocation, and performance tracking components.
 */

/**
 * Faction Detection Contract
 * 
 * Zero-cost detection of faction work status using DOM text scanning.
 * Provides reliable "Working for [FactionName]" detection with stability validation.
 */
export interface FactionDetectionContract {
    /**
     * Detect current faction work status
     * @returns Faction work detection result
     */
    detectFactionWork(): {
        isActive: boolean;
        factionName: string | null;
        detectionTimestamp: number;
        isStable: boolean;
    };
    
    /**
     * Initialize faction detection with stability requirements
     * @param stabilityDelay Minimum time before acting on detection changes
     * @param requiredConsecutiveDetections Number of consecutive detections needed
     */
    configure(stabilityDelay: number, requiredConsecutiveDetections: number): void;
}

/**
 * Share Allocation Contract
 * 
 * Manages optimal distribution of share threads across botnet servers.
 * Prioritizes high CPU core servers and balances RAM allocation.
 */
export interface ShareAllocationContract {
    /**
     * Calculate optimal share thread allocation
     * @param availableServers Servers eligible for share allocation
     * @param ramBudget Total RAM available for sharing (GB)
     * @param playerIntelligence Current player intelligence stat
     * @returns Allocation plan with per-server thread distribution
     */
    calculateOptimalAllocation(
        availableServers: { hostname: string; cpuCores: number; availableRAM: number }[],
        ramBudget: number,
        playerIntelligence: number
    ): {
        totalThreads: number;
        effectiveThreads: number;
        estimatedBonus: number;
        serverAllocations: { hostname: string; threads: number; ramUsed: number }[];
    };
    
    /**
     * Deploy share allocation to network
     * @param allocation Allocation plan to execute
     * @returns Deployment results with success/failure status
     */
    deploy(allocation: any): {
        successfulDeployments: number;
        failedDeployments: number;
        deployedServers: string[];
        deploymentErrors: { hostname: string; error: string }[];
    };
    
    /**
     * Terminate all active share allocations
     * @returns Termination results
     */
    terminate(): {
        terminatedScripts: number;
        ramFreed: number;
        terminationErrors: string[];
    };
}

/**
 * Resource Management Contract
 * 
 * Handles server capacity assessment and priority ranking for
 * efficient share thread allocation across the botnet.
 */
export interface ResourceManagementContract {
    /**
     * Assess server suitability for share allocation
     * @param hostname Server to assess
     * @returns Server resource assessment
     */
    assessServer(hostname: string): {
        cpuCores: number;
        availableRAM: number;
        maxPossibleThreads: number;
        coreEffectivenessBonus: number;
        allocationPriority: number;
        isEligible: boolean;
    };
    
    /**
     * Rank servers by allocation priority
     * @param servers Server assessments to rank
     * @returns Servers ordered by allocation priority (best first)
     */
    rankByPriority(servers: any[]): any[];
    
    /**
     * Calculate effective thread count with bonuses
     * @param baseThreads Raw thread count
     * @param cpuCores Server CPU cores
     * @param intelligence Player intelligence
     * @returns Effective thread count for bonus calculations
     */
    calculateEffectiveThreads(baseThreads: number, cpuCores: number, intelligence: number): number;
}

/**
 * Performance Tracking Contract
 * 
 * Monitors share allocation performance and provides metrics
 * for optimization and debugging purposes.
 */
export interface PerformanceTrackingContract {
    /**
     * Calculate current reputation bonus from active allocation
     * @param effectiveThreads Total effective threads across network
     * @returns Current reputation bonus multiplier
     */
    calculateReputationBonus(effectiveThreads: number): number;
    
    /**
     * Generate performance metrics report
     * @param allocation Current allocation state
     * @returns Comprehensive performance analysis
     */
    generateMetrics(allocation: any): {
        totalServersUsed: number;
        averageThreadsPerServer: number;
        totalEffectiveThreads: number;
        actualReputationBonus: number;
        allocationEfficiency: number;
        ramUtilizationRate: number;
        deploymentSuccessRate: number;
    };
    
    /**
     * Log allocation status for monitoring
     * @param allocation Current allocation
     * @param metrics Performance metrics
     * @param debugMode Whether to show detailed output
     */
    logStatus(allocation: any, metrics: any, debugMode: boolean): void;
}

/**
 * Botnet Integration Contract
 * 
 * Coordinates share functionality with existing botnet HWGW operations.
 * Ensures seamless integration without disrupting money farming performance.
 */
export interface BotnetIntegrationContract {
    /**
     * Initialize share system within botnet
     * @param configuration Share system configuration
     * @returns Initialization success status
     */
    initialize(configuration: {
        enabled: boolean;
        ramPercentage: number;
        minimumThreads: number;
        maximumThreads: number;
        debugLogging: boolean;
    }): boolean;
    
    /**
     * Process share allocation during botnet cycle
     * @param serverData Current botnet server information
     * @param availableRAMBudget RAM remaining after HWGW allocation
     * @returns Updated RAM budget after share allocation
     */
    processShareCycle(
        serverData: any[],
        availableRAMBudget: number
    ): {
        remainingRAMBudget: number;
        shareRAMUsed: number;
        allocationActive: boolean;
    };
    
    /**
     * Clean up share resources during botnet shutdown
     * @returns Cleanup operation results
     */
    cleanup(): {
        scriptsTerminated: number;
        ramFreed: number;
        cleanupSuccess: boolean;
    };
}

// Configuration and data type contracts

export interface ShareSystemConfiguration {
    enabled: boolean;
    ramPercentage: number;          // 10-25%
    minimumThreads: number;         // Minimum threads to activate
    maximumThreads: number;         // Maximum threads to prevent over-allocation
    priorityCoreThreshold: number;  // Minimum cores for high-priority (default: 4)
    detectionStabilityDelay: number; // MS to wait before acting (default: 5000)
    intelligenceOptimization: boolean; // Adjust allocation based on intelligence
    debugLogging: boolean;          // Enable detailed logging
}

export interface FactionWorkDetectionResult {
    isWorkingForFaction: boolean;
    detectedFactionName: string | null;
    lastDetectionTime: number;
    consecutiveDetections: number;
    detectionStable: boolean;
    workDuration: number;
}

export interface ShareAllocationPlan {
    isActive: boolean;
    totalThreads: number;
    totalRAMUsed: number;
    effectiveThreads: number;
    estimatedReputationBonus: number;
    allocationTimestamp: number;
    serverAllocations: ServerAllocationPlan[];
}

export interface ServerAllocationPlan {
    hostname: string;
    cpuCores: number;
    allocatedThreads: number;
    allocatedRAM: number;
    effectiveThreads: number;
    allocationPriority: number;
    deploymentStatus: 'pending' | 'active' | 'failed';
}

export interface SharePerformanceReport {
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