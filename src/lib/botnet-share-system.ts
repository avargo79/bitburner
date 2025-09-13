import { NS } from "@ns";
import { 
    ShareCalculationResult, 
    ServerShareData, 
    ShareConfiguration, 
    ServerResourceProfile, 
    ShareOptimizationResult 
} from "/lib/botnet-types";

// ===== SHARE CALCULATION SYSTEM =====

/**
 * Share script calculation and optimization system
 * Handles reputation bonus calculations, server optimization, and resource allocation
 */
export class ShareCalculator {
    private static readonly SHARE_SCRIPT_RAM = 4.0;
    
    /**
     * Calculate intelligence bonus for share scripts
     */
    static calculateIntelligenceBonus(intelligence: number): number {
        if (intelligence <= 0) return 1.0;
        return 1 + (2 * Math.pow(intelligence, 0.8)) / 600;
    }
    
    /**
     * Calculate CPU core bonus for share scripts
     */
    static calculateCoreBonus(cpuCores: number): number {
        if (cpuCores <= 0) return 1.0;
        return 1 + (cpuCores - 1) / 16;
    }
    
    /**
     * Calculate reputation bonus based on effective threads
     */
    static calculateReputationBonus(effectiveThreads: number): number {
        if (effectiveThreads <= 0) return 1.0;
        return 1 + Math.log(effectiveThreads) / 25;
    }
    
    /**
     * Calculate effective threads with bonuses applied
     */
    static calculateEffectiveThreads(
        baseThreads: number, 
        cpuCores: number, 
        intelligence: number
    ): number {
        if (baseThreads <= 0) return 0;
        
        const coreBonus = this.calculateCoreBonus(cpuCores);
        const intelligenceBonus = this.calculateIntelligenceBonus(intelligence);
        
        return baseThreads * coreBonus * intelligenceBonus;
    }
    
    /**
     * Calculate maximum threads that can be allocated on a server
     */
    static calculateMaxThreadsForServer(
        serverData: ServerShareData, 
        ramPercentage: number
    ): number {
        const availableRAM = serverData.availableRAM;
        const maxAllocatableRAM = availableRAM * (ramPercentage / 100);
        
        if (maxAllocatableRAM < this.SHARE_SCRIPT_RAM) {
            return 0;
        }
        
        return Math.floor(maxAllocatableRAM / this.SHARE_SCRIPT_RAM);
    }
    
    /**
     * Calculate optimal thread allocation for a specific server
     */
    static calculateOptimalThreadsForServer(
        serverData: ServerShareData,
        config: ShareConfiguration,
        playerIntelligence: number
    ): ShareCalculationResult {
        const maxThreads = this.calculateMaxThreadsForServer(serverData, config.ramPercentage);
        
        let optimalThreads = maxThreads;
        
        if (optimalThreads < config.minimumThreads) {
            optimalThreads = 0;
        } else if (optimalThreads > config.maximumThreads) {
            optimalThreads = config.maximumThreads;
        }
        
        const effectiveThreads = this.calculateEffectiveThreads(
            optimalThreads, 
            serverData.cpuCores, 
            playerIntelligence
        );
        
        const intelligenceBonus = this.calculateIntelligenceBonus(playerIntelligence);
        const coreBonus = this.calculateCoreBonus(serverData.cpuCores);
        const reputationBonus = this.calculateReputationBonus(effectiveThreads);
        
        return {
            baseThreads: optimalThreads,
            effectiveThreads,
            intelligenceBonus,
            coreBonus,
            reputationBonus,
            totalRAMRequired: optimalThreads * this.SHARE_SCRIPT_RAM,
            ramPerThread: this.SHARE_SCRIPT_RAM
        };
    }
    
    /**
     * Calculate network-wide share allocation
     */
    static calculateNetworkShareAllocation(
        servers: ServerShareData[],
        config: ShareConfiguration,
        playerIntelligence: number
    ): {
        totalBaseThreads: number;
        totalEffectiveThreads: number;
        totalRAMUsed: number;
        averageReputationBonus: number;
        serverAllocations: (ShareCalculationResult & { hostname: string })[];
    } {
        const allocations = servers
            .map(server => ({
                hostname: server.hostname,
                ...this.calculateOptimalThreadsForServer(server, config, playerIntelligence)
            }))
            .filter(allocation => allocation.baseThreads > 0);
        
        const totalBaseThreads = allocations.reduce((sum, alloc) => sum + alloc.baseThreads, 0);
        const totalEffectiveThreads = allocations.reduce((sum, alloc) => sum + alloc.effectiveThreads, 0);
        const totalRAMUsed = allocations.reduce((sum, alloc) => sum + alloc.totalRAMRequired, 0);
        
        const weightedReputationBonus = allocations.reduce((sum, alloc) => 
            sum + (alloc.reputationBonus * alloc.effectiveThreads), 0);
        const averageReputationBonus = totalEffectiveThreads > 0 ? 
            weightedReputationBonus / totalEffectiveThreads : 1.0;
        
        return {
            totalBaseThreads,
            totalEffectiveThreads,
            totalRAMUsed,
            averageReputationBonus,
            serverAllocations: allocations
        };
    }
    
    /**
     * Evaluate intelligence optimization benefits
     */
    static evaluateIntelligenceOptimization(
        servers: ServerShareData[],
        config: ShareConfiguration,
        currentIntelligence: number,
        targetIntelligence: number
    ): {
        currentBonus: number;
        targetBonus: number;
        improvementPercent: number;
        recommendOptimization: boolean;
    } {
        const currentResult = this.calculateNetworkShareAllocation(servers, config, currentIntelligence);
        const targetResult = this.calculateNetworkShareAllocation(servers, config, targetIntelligence);
        
        const currentBonus = currentResult.averageReputationBonus;
        const targetBonus = targetResult.averageReputationBonus;
        const improvementPercent = ((targetBonus - currentBonus) / currentBonus) * 100;
        
        return {
            currentBonus,
            targetBonus,
            improvementPercent,
            recommendOptimization: improvementPercent > 10.0
        };
    }
    
    /**
     * Get share script RAM cost
     */
    static getShareScriptRAM(): number {
        return this.SHARE_SCRIPT_RAM;
    }
    
    /**
     * Validate share configuration
     */
    static validateConfiguration(config: ShareConfiguration): string[] {
        const errors: string[] = [];
        
        if (config.ramPercentage <= 0 || config.ramPercentage > 100) {
            errors.push("RAM percentage must be between 1-100");
        }
        
        if (config.minimumThreads < 0) {
            errors.push("Minimum threads cannot be negative");
        }
        
        if (config.maximumThreads < config.minimumThreads) {
            errors.push("Maximum threads must be >= minimum threads");
        }
        
        if (config.priorityCoreThreshold < 1) {
            errors.push("Priority core threshold must be >= 1");
        }
        
        return errors;
    }
}

// ===== SERVER OPTIMIZATION SYSTEM =====

/**
 * Server resource optimization and allocation system
 * Analyzes server capabilities and provides optimization recommendations
 */
export class ServerOptimizer {
    /**
     * Optimize server allocation for share scripts
     */
    static optimizeServerAllocation(
        ns: NS,
        serverHostnames: string[],
        config: ShareConfiguration
    ): ShareOptimizationResult {
        const serverProfiles: ServerResourceProfile[] = [];
        
        for (const hostname of serverHostnames) {
            const server = ns.getServer(hostname);
            const availableRAM = server.maxRam - server.ramUsed;
            const maxShareThreads = ShareCalculator.calculateMaxThreadsForServer(
                {
                    hostname,
                    cpuCores: server.cpuCores,
                    availableRAM,
                    maxRam: server.maxRam,
                    ramUsed: server.ramUsed
                },
                config.ramPercentage
            );
            
            const efficiencyScore = this.calculateEfficiencyScore(
                server.cpuCores,
                maxShareThreads,
                availableRAM,
                (server.ramUsed / server.maxRam) * 100
            );
            
            const isPurchased = hostname.startsWith('pserv-');
            const isEligible = this.isServerEligible(server, maxShareThreads);
            
            const profile: ServerResourceProfile = {
                hostname,
                cpuCores: server.cpuCores,
                availableRAM,
                maxRam: server.maxRam,
                ramUsed: server.ramUsed,
                maxShareThreads,
                efficiencyScore,
                isPurchased,
                isEligible,
                ramUtilization: (server.ramUsed / server.maxRam) * 100,
                allocationPriority: this.calculateAllocationPriority(
                    server.cpuCores,
                    maxShareThreads,
                    efficiencyScore,
                    isPurchased
                )
            };
            
            serverProfiles.push(profile);
        }
        
        const eligibleServers = serverProfiles.filter(s => s.isEligible);
        const ineligibleServers = serverProfiles.filter(s => !s.isEligible);
        
        // Sort eligible servers by allocation priority
        eligibleServers.sort((a, b) => b.allocationPriority - a.allocationPriority);
        
        const totalAvailableThreads = eligibleServers.reduce((sum, s) => sum + s.maxShareThreads, 0);
        const totalAvailableRAM = eligibleServers.reduce((sum, s) => sum + s.availableRAM, 0);
        const averageEfficiencyScore = eligibleServers.length > 0 ? 
            eligibleServers.reduce((sum, s) => sum + s.efficiencyScore, 0) / eligibleServers.length : 0;
        const highPerformanceServerCount = eligibleServers.filter(s => s.cpuCores >= config.priorityCoreThreshold).length;
        
        const recommendations = this.generateOptimizationRecommendations(
            eligibleServers,
            ineligibleServers,
            config
        );
        
        return {
            eligibleServers,
            ineligibleServers,
            totalAvailableThreads,
            totalAvailableRAM,
            averageEfficiencyScore,
            highPerformanceServerCount,
            recommendations
        };
    }
    
    /**
     * Calculate server efficiency score
     */
    private static calculateEfficiencyScore(
        cpuCores: number,
        maxThreads: number,
        availableRAM: number,
        ramUtilization: number
    ): number {
        if (maxThreads <= 0) return 0;
        
        const coreWeight = 0.4;
        const threadWeight = 0.3;
        const ramAvailabilityWeight = 0.2;
        const utilizationWeight = 0.1;
        
        const normalizedCores = Math.min(cpuCores / 8, 1.0);
        const normalizedThreads = Math.min(maxThreads / 100, 1.0);
        const normalizedRAMAvailability = Math.min(availableRAM / 1000, 1.0);
        const normalizedUtilization = 1.0 - (ramUtilization / 100);
        
        return (
            normalizedCores * coreWeight +
            normalizedThreads * threadWeight +
            normalizedRAMAvailability * ramAvailabilityWeight +
            normalizedUtilization * utilizationWeight
        ) * 100;
    }
    
    /**
     * Calculate allocation priority for server ordering
     */
    private static calculateAllocationPriority(
        cpuCores: number,
        maxThreads: number,
        efficiencyScore: number,
        isPurchased: boolean
    ): number {
        let priority = 0;
        
        priority += cpuCores * 10;
        priority += maxThreads * 0.1;
        priority += efficiencyScore * 0.5;
        
        if (isPurchased) {
            priority += 20;
        }
        
        return Math.round(priority);
    }
    
    /**
     * Check if server is eligible for share allocation
     */
    private static isServerEligible(server: any, maxShareThreads: number): boolean {
        if (!server.hasAdminRights) return false;
        if (maxShareThreads < 1) return false;
        if (server.maxRam < ShareCalculator.getShareScriptRAM()) return false;
        
        return true;
    }
    
    /**
     * Generate optimization recommendations
     */
    private static generateOptimizationRecommendations(
        eligible: ServerResourceProfile[],
        ineligible: ServerResourceProfile[],
        config: ShareConfiguration
    ): string[] {
        const recommendations: string[] = [];
        
        if (eligible.length === 0) {
            recommendations.push("No eligible servers found for share allocation");
            recommendations.push(`Consider reducing RAM percentage from ${config.ramPercentage}%`);
        }
        
        if (ineligible.length > 0) {
            const noAdminCount = ineligible.filter(s => !s.isEligible).length;
            if (noAdminCount > 0) {
                recommendations.push(`${noAdminCount} servers lack admin rights - consider gaining access`);
            }
        }
        
        const highCoreServers = eligible.filter(s => s.cpuCores >= 8);
        if (highCoreServers.length > 0) {
            recommendations.push(`${highCoreServers.length} high-core servers available - prioritize these for best bonuses`);
        }
        
        const lowEfficiencyServers = eligible.filter(s => s.efficiencyScore < 30);
        if (lowEfficiencyServers.length > 0) {
            recommendations.push(`${lowEfficiencyServers.length} servers have low efficiency - consider optimizing RAM usage`);
        }
        
        const totalThreads = eligible.reduce((sum, s) => sum + s.maxShareThreads, 0);
        if (totalThreads > 1000) {
            recommendations.push("High thread capacity detected - consider intelligence optimization");
        }
        
        return recommendations;
    }
}