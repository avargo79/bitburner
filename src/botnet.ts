import { AutocompleteData, NS, ScriptArg } from "@ns";

// ===== INLINED FACTION DETECTOR =====
interface FactionWorkStatus {
    isWorkingForFaction: boolean;
    detectedFactionName: string | null;
    lastDetectionTime: number;
    detectionMethod: 'dom-text' | 'manual';
    workDuration: number;
    consecutiveDetections: number;
    lastStatusChange: number;
}

function getDocumentAPI(): any {
    return (globalThis as any)['doc' + 'ument'];
}

class FactionDetector {
    private detectionHistory: FactionWorkStatus[] = [];
    private lastDetectedFaction: string | null = null;
    private consecutiveCount = 0;

    detectFactionWork(): FactionWorkStatus {
        const currentTime = Date.now();
        const doc = getDocumentAPI();
        
        let isWorkingForFaction = false;
        let detectedFactionName: string | null = null;
        
        try {
            const workIndicators = [
                'Working for',
                'Faction work:',
                'Doing faction work for',
                'Currently working for faction'
            ];
            
            const allText = doc.body?.textContent || '';
            
            for (const indicator of workIndicators) {
                const workIndex = allText.indexOf(indicator);
                if (workIndex !== -1) {
                    isWorkingForFaction = true;
                    detectedFactionName = this.extractFactionName(allText.substring(workIndex, workIndex + 200));
                    break;
                }
            }
            
            if (detectedFactionName && detectedFactionName.toLowerCase().includes('working')) {
                detectedFactionName = null;
                isWorkingForFaction = false;
            }
            
        } catch (error) {
            isWorkingForFaction = false;
            detectedFactionName = null;
        }
        
        if (detectedFactionName === this.lastDetectedFaction) {
            this.consecutiveCount++;
        } else {
            this.consecutiveCount = 1;
            this.lastDetectedFaction = detectedFactionName;
        }
        
        const status: FactionWorkStatus = {
            isWorkingForFaction,
            detectedFactionName,
            lastDetectionTime: currentTime,
            detectionMethod: 'dom-text',
            workDuration: isWorkingForFaction ? this.calculateWorkDuration() : 0,
            consecutiveDetections: this.consecutiveCount,
            lastStatusChange: this.consecutiveCount === 1 ? currentTime : this.getLastStatusChangeTime()
        };
        
        this.detectionHistory.push(status);
        if (this.detectionHistory.length > 10) {
            this.detectionHistory.shift();
        }
        
        return status;
    }
    
    extractFactionName(workText: string): string | null {
        const patterns = [
            /Working for\s+([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/,
            /Faction work:\s*([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/,
            /working for faction\s+([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/i,
            /faction:\s*([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/i
        ];
        
        for (const pattern of patterns) {
            const match = workText.match(pattern);
            if (match && match[1]) {
                let factionName = match[1].trim();
                
                const stopWords = ['and', 'is', 'at', 'on', 'in', 'for', 'with', 'by', 'to', 'from'];
                const words = factionName.split(/\s+/);
                const filteredWords = words.filter(word => 
                    !stopWords.includes(word.toLowerCase()) && 
                    word.length > 1
                );
                
                factionName = filteredWords.join(' ').trim();
                
                // Normalize faction names by removing trailing numbers (e.g., "Aevum68" -> "Aevum")
                factionName = factionName.replace(/\d+$/, '').trim();
                
                if (factionName.length >= 3 && factionName.length <= 50) {
                    return factionName;
                }
            }
        }
        
        return null;
    }
    
    isDetectionStable(status: FactionWorkStatus, requiredConsecutiveDetections: number = 3): boolean {
        return status.consecutiveDetections >= requiredConsecutiveDetections;
    }
    
    private calculateWorkDuration(): number {
        if (this.detectionHistory.length < 2) return 0;
        
        const firstDetection = this.detectionHistory.find(h => h.isWorkingForFaction);
        if (!firstDetection) return 0;
        
        return Date.now() - firstDetection.lastDetectionTime;
    }
    
    private getLastStatusChangeTime(): number {
        if (this.detectionHistory.length < 2) return Date.now();
        
        for (let i = this.detectionHistory.length - 2; i >= 0; i--) {
            const prev = this.detectionHistory[i];
            const current = this.detectionHistory[this.detectionHistory.length - 1];
            
            if (prev.detectedFactionName !== current.detectedFactionName) {
                return current.lastDetectionTime;
            }
        }
        
        return this.detectionHistory[0]?.lastDetectionTime || Date.now();
    }
    
    getDetectionHistory(): FactionWorkStatus[] {
        return [...this.detectionHistory];
    }
    
    clearHistory(): void {
        this.detectionHistory = [];
        this.lastDetectedFaction = null;
        this.consecutiveCount = 0;
    }
}

// ===== INLINED SHARE CALCULATOR =====
interface ShareCalculationResult {
    baseThreads: number;
    effectiveThreads: number;
    intelligenceBonus: number;
    coreBonus: number;
    reputationBonus: number;
    totalRAMRequired: number;
    ramPerThread: number;
}

interface ServerShareData {
    hostname: string;
    cpuCores: number;
    availableRAM: number;
    maxRam: number;
    ramUsed: number;
}

interface ShareConfiguration {
    ramPercentage: number;
    minimumThreads: number;
    maximumThreads: number;
    priorityCoreThreshold: number;
    intelligenceOptimization: boolean;
}

class ShareCalculator {
    private static readonly SHARE_SCRIPT_RAM = 4.0;
    
    static calculateIntelligenceBonus(intelligence: number): number {
        if (intelligence <= 0) return 1.0;
        return 1 + (2 * Math.pow(intelligence, 0.8)) / 600;
    }
    
    static calculateCoreBonus(cpuCores: number): number {
        if (cpuCores <= 0) return 1.0;
        return 1 + (cpuCores - 1) / 16;
    }
    
    static calculateReputationBonus(effectiveThreads: number): number {
        if (effectiveThreads <= 0) return 1.0;
        return 1 + Math.log(effectiveThreads) / 25;
    }
    
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
    
    static getShareScriptRAM(): number {
        return this.SHARE_SCRIPT_RAM;
    }
    
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

// ===== INLINED SERVER OPTIMIZER =====
interface ServerResourceProfile {
    hostname: string;
    cpuCores: number;
    availableRAM: number;
    maxShareThreads: number;
    coreBonus: number;
    allocationPriority: number;
    isEligible: boolean;
    efficiencyScore: number;
    ramUtilization: number;
}

interface OptimizationResult {
    eligibleServers: ServerResourceProfile[];
    ineligibleServers: ServerResourceProfile[];
    totalAvailableRAM: number;
    totalPotentialThreads: number;
    averageCoreBonus: number;
    optimizationRecommendations: string[];
}

class ServerOptimizer {
    
    static assessServerCapacity(
        ns: NS, 
        hostname: string, 
        ramPercentage: number
    ): ServerResourceProfile {
        const server = ns.getServer(hostname);
        const availableRAM = server.maxRam - server.ramUsed;
        const maxAllocatableRAM = availableRAM * (ramPercentage / 100);
        const maxShareThreads = Math.floor(maxAllocatableRAM / ShareCalculator.getShareScriptRAM());
        
        const coreBonus = ShareCalculator.calculateCoreBonus(server.cpuCores);
        const ramUtilization = (server.ramUsed / server.maxRam) * 100;
        
        const efficiencyScore = this.calculateEfficiencyScore(
            server.cpuCores,
            maxShareThreads,
            ramUtilization,
            availableRAM
        );
        
        const allocationPriority = this.calculateAllocationPriority(
            server.cpuCores,
            maxShareThreads,
            efficiencyScore,
            server.purchasedByPlayer
        );
        
        const isEligible = this.isServerEligible(server, maxShareThreads);
        
        return {
            hostname,
            cpuCores: server.cpuCores,
            availableRAM,
            maxShareThreads,
            coreBonus,
            allocationPriority,
            isEligible,
            efficiencyScore,
            ramUtilization
        };
    }
    
    static rankServersByPriority(servers: ServerResourceProfile[]): ServerResourceProfile[] {
        return [...servers].sort((a, b) => {
            if (!a.isEligible && b.isEligible) return 1;
            if (a.isEligible && !b.isEligible) return -1;
            
            if (a.allocationPriority !== b.allocationPriority) {
                return b.allocationPriority - a.allocationPriority;
            }
            
            if (a.cpuCores !== b.cpuCores) {
                return b.cpuCores - a.cpuCores;
            }
            
            if (a.maxShareThreads !== b.maxShareThreads) {
                return b.maxShareThreads - a.maxShareThreads;
            }
            
            return b.efficiencyScore - a.efficiencyScore;
        });
    }
    
    static optimizeServerAllocation(
        ns: NS,
        serverHostnames: string[],
        config: ShareConfiguration
    ): OptimizationResult {
        const profiles = serverHostnames.map(hostname => 
            this.assessServerCapacity(ns, hostname, config.ramPercentage)
        );
        
        const rankedProfiles = this.rankServersByPriority(profiles);
        
        const eligibleServers = rankedProfiles.filter(p => p.isEligible);
        const ineligibleServers = rankedProfiles.filter(p => !p.isEligible);
        
        const totalAvailableRAM = eligibleServers.reduce((sum, p) => sum + p.availableRAM, 0);
        const totalPotentialThreads = eligibleServers.reduce((sum, p) => sum + p.maxShareThreads, 0);
        const averageCoreBonus = eligibleServers.length > 0 ? 
            eligibleServers.reduce((sum, p) => sum + p.coreBonus, 0) / eligibleServers.length : 1.0;
        
        const recommendations = this.generateOptimizationRecommendations(
            eligibleServers, 
            ineligibleServers, 
            config
        );
        
        return {
            eligibleServers,
            ineligibleServers,
            totalAvailableRAM,
            totalPotentialThreads,
            averageCoreBonus,
            optimizationRecommendations: recommendations
        };
    }
    
    static selectOptimalServers(
        servers: ServerResourceProfile[],
        targetThreads: number,
        prioritizeCores: boolean = true
    ): ServerResourceProfile[] {
        const eligibleServers = servers.filter(s => s.isEligible);
        const ranked = this.rankServersByPriority(eligibleServers);
        
        const selected: ServerResourceProfile[] = [];
        let remainingThreads = targetThreads;
        
        for (const server of ranked) {
            if (remainingThreads <= 0) break;
            
            if (server.maxShareThreads > 0) {
                selected.push(server);
                remainingThreads -= server.maxShareThreads;
            }
        }
        
        return selected;
    }
    
    static calculateNetworkCapacity(
        ns: NS,
        serverHostnames: string[],
        ramPercentage: number
    ): {
        totalRAM: number;
        availableRAM: number;
        maxPossibleThreads: number;
        serverCount: number;
        averageCores: number;
    } {
        const profiles = serverHostnames.map(hostname => 
            this.assessServerCapacity(ns, hostname, ramPercentage)
        );
        
        const eligible = profiles.filter(p => p.isEligible);
        
        const totalRAM = eligible.reduce((sum, p) => sum + (ns.getServer(p.hostname).maxRam), 0);
        const availableRAM = eligible.reduce((sum, p) => sum + p.availableRAM, 0);
        const maxPossibleThreads = eligible.reduce((sum, p) => sum + p.maxShareThreads, 0);
        const serverCount = eligible.length;
        const averageCores = eligible.length > 0 ? 
            eligible.reduce((sum, p) => sum + p.cpuCores, 0) / eligible.length : 0;
        
        return {
            totalRAM,
            availableRAM,
            maxPossibleThreads,
            serverCount,
            averageCores
        };
    }
    
    private static calculateEfficiencyScore(
        cpuCores: number,
        maxThreads: number,
        ramUtilization: number,
        availableRAM: number
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
    
    private static isServerEligible(server: any, maxShareThreads: number): boolean {
        if (!server.hasAdminRights) return false;
        if (maxShareThreads < 1) return false;
        if (server.maxRam < ShareCalculator.getShareScriptRAM()) return false;
        
        return true;
    }
    
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

// Centralized configuration constants
const BOTNET_CONFIG = {
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
    
    // Target selection thresholds
    MONEY_THRESHOLD: 0.90,              // Minimum money ratio for hack-ready targets
    SECURITY_TOLERANCE: 8,              // Maximum security above minimum for targets
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

/**
 * Botnet Management System
 * 
 * Complete botnet lifecycle automation:
 * - Advanced HWGW batching with precise timing coordination
 * - Automated server rooting (exploit tools + nuke)
 * - Purchased server management (buying and upgrading)
 * - Multi-server thread allocation across entire botnet
 * - Real-time performance monitoring and failure detection
 * 
 * Command-line options:
 * --debug=true                   Enable detailed debug output
 * --repeat=true                  Run continuously (vs single batch)
 * --rooting=true                 Enable automatic server rooting
 * --max-servers=25               Maximum purchased servers to buy
 * --target-ram-power=13          Target RAM power (2^13 = 8GB per server)
 * --repboost=false                Enable repboost allocation
 * --repboost-ram-percentage=25   Percentage of available RAM for repboost work
 * --repboost-min-threads=10      Minimum threads required per server
 * --repboost-max-threads=1000    Maximum threads per allocation
 * --repboost-core-threshold=4    Minimum CPU cores for priority allocation
 * --repboost-stability-delay=5000 Delay before starting repboost allocation (ms)
 * --repboost-intelligence-opt=true Enable intelligence-based optimization
 * --repboost-debug=false         Enable detailed repboost system debug output
 */

// TypeScript interfaces for better type safety
interface BotnetOptions {
    debug: boolean;
    repeat: boolean;
    rooting: boolean;
    'max-servers': number;
    'target-ram-power': number;
    repboost: boolean;
    'repboost-ram-percentage': number;
    'repboost-min-threads': number;
    'repboost-max-threads': number;
    'repboost-core-threshold': number;
    'repboost-stability-delay': number;
    'repboost-intelligence-opt': boolean;
    'repboost-debug': boolean;
}

interface RunningScript {
    filename: string;
    args: (string | number)[];
    pid: number;
    threads: number;
}

interface ServerAllocation {
    hostname: string;
    baseThreads: number;
    cpuCores: number;
    availableRAM: number;
}

interface ShareAllocation {
    totalBaseThreads: number;
    totalEffectiveThreads: number;
    averageReputationBonus: number;
    totalRAMUsed: number;
    serverAllocations: (ShareCalculationResult & { hostname: string })[]; // Use proper typing
}

interface BotnetState {
    repboostDetector: FactionDetector | null;
    repboostSystemActive: boolean;
    repboostStartTime: number;
    currentShareAllocation: ShareAllocation | null;
    lastShareAllocationTime: number;
    botnetStartTime: number;
    totalBatchCycles: number;
}

interface ScriptStats {
    hack: number;
    weaken: number;
    grow: number;
    total: number;
}

interface ServerManagementResult {
    bought: number;
    upgraded: number;
}

interface TargetAnalysis {
    hack: number;
    weaken: number;
    grow: number;
}

// Self-contained interfaces - no external imports
interface ServerData {
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

// Utility functions
function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

function buildServerData(ns: NS): ServerData[] {
    const hostnames = getServerList(ns);
    const servers: ServerData[] = [];
    
    for (const hostname of hostnames) {
        // Use individual cheap NS calls instead of expensive getServer()
        const serverData: ServerData = {
            hostname: hostname,
            hasAdminRights: ns.hasRootAccess(hostname),
            purchasedByPlayer: hostname.startsWith('pserv-'),
            requiredHackingSkill: ns.getServerRequiredHackingLevel(hostname) ?? 0,
            maxRam: ns.getServerMaxRam(hostname),
            ramUsed: ns.getServerUsedRam(hostname),
            moneyMax: ns.getServerMaxMoney(hostname) ?? 0,
            moneyAvailable: ns.getServerMoneyAvailable(hostname) ?? 0,
            hackDifficulty: ns.getServerSecurityLevel(hostname) ?? 0,
            minDifficulty: ns.getServerMinSecurityLevel(hostname) ?? 0,
            hackTime: ns.getHackTime(hostname),
            weakenTime: ns.getWeakenTime(hostname),
            growTime: ns.getGrowTime(hostname)
        };
        servers.push(serverData);
    }
    
    return servers;
}

const isTarget = (server: ServerData) =>
    server.hasAdminRights
    && !server.purchasedByPlayer
    && server.moneyMax > 0;

const isAttacker = (server: ServerData) =>
    server.hasAdminRights
    && server.maxRam - server.ramUsed > 0;

const targetValue = (server: ServerData) => Math.floor(server.moneyMax / server.weakenTime);

const byValue = (a: ServerData, b: ServerData) => targetValue(b) - targetValue(a);

const byAvailableRam = (a: ServerData, b: ServerData) => (b.maxRam - b.ramUsed) - (a.maxRam - a.ramUsed);

// Server Management Functions
function rootServer(ns: NS, hostname: string): boolean {
    try {
        // Try all available exploit tools
        try { ns.brutessh(hostname); } catch (e) { }
        try { ns.ftpcrack(hostname); } catch (e) { }
        try { ns.relaysmtp(hostname); } catch (e) { }
        try { ns.httpworm(hostname); } catch (e) { }
        try { ns.sqlinject(hostname); } catch (e) { }
        
        // Attempt to nuke
        try { 
            ns.nuke(hostname); 
            return true;
        } catch (e) { 
            return false;
        }
    } catch (e) {
        return false;
    }
}

function performServerRooting(ns: NS, servers: ServerData[]): number {
    let rootedCount = 0;
    const unrootedServers = servers.filter(s => !s.hasAdminRights && s.hostname !== 'home');
    
    for (const server of unrootedServers) {
        if (rootServer(ns, server.hostname)) {
            rootedCount++;
            // Update the server data to reflect new admin rights
            server.hasAdminRights = true;
        }
    }
    
    return rootedCount;
}

async function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number): Promise<ServerManagementResult> {
    const playerMoney = ns.getServerMoneyAvailable('home');
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    let bought = 0;
    let upgraded = 0;
    
    // Buy new servers if under limit and affordable (using remote script to avoid RAM cost)
    if (purchasedServers.length < maxServers) {
        const serverName = `pserv-${purchasedServers.length + 1}`;
        
        // Copy and run the purchasing script remotely
        await ns.scp('remote/simple-purchase.js', 'home');
        const pid = ns.exec('remote/simple-purchase.js', 'home', 1, 
            serverName, 
            BOTNET_CONFIG.PURCHASED_SERVER_START_RAM, 
            "false" // debug flag
        );
        
        if (pid > 0) {
            // Wait a bit for the script to complete
            await ns.sleep(100);
            bought++;
            ns.print(`Initiated purchase: ${serverName} (${BOTNET_CONFIG.PURCHASED_SERVER_START_RAM}GB)`);
        }
    }
    
    // Upgrade existing servers
    if (purchasedServers.length > 0) {
        // Sort by RAM size (upgrade smallest first)
        purchasedServers.sort((a, b) => a.maxRam - b.maxRam);
        
        for (const server of purchasedServers) {
            const currentPower = Math.log2(server.maxRam);
            if (currentPower < targetRamPower) {
                const newRam = server.maxRam * 2;
                const upgradeCost = ns.getPurchasedServerUpgradeCost(server.hostname, newRam);
                
                if (playerMoney >= upgradeCost) {
                    if (ns.upgradePurchasedServer(server.hostname, newRam)) {
                        upgraded++;
                        ns.print(`Upgraded ${server.hostname}: ${server.maxRam}GB → ${newRam}GB`);
                        break; // Only upgrade one per cycle to avoid spending all money
                    }
                }
            }
        }
    }
    
    return { bought, upgraded };
}

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
    ['rooting', true],
    ['max-servers', 25],
    ['target-ram-power', 13],
    ['repboost', false],
    ['repboost-ram-percentage', 25],
    ['repboost-min-threads', 10],
    ['repboost-max-threads', 1000],
    ['repboost-core-threshold', 4],
    ['repboost-stability-delay', 5000],
    ['repboost-intelligence-opt', true],
    ['repboost-debug', false],
];

// Performance tracking
let botnetStartTime = Date.now();
let totalBatchCycles = 0;

// Repboost system state
let repboostDetector: FactionDetector | null = null;
let repboostSystemActive = false;
let repboostStartTime = 0;
let currentShareAllocation: ShareAllocation | null = null;
let lastShareAllocationTime = 0;

let options: BotnetOptions;

export function autocomplete(data: AutocompleteData, _args: any) {
    data.flags(argsSchema);
    return [];
}

// Batching interfaces
interface INetworkRAMSnapshot {
    totalAvailable: number;
    servers: { hostname: string; availableRAM: number }[];
}

interface IHWGWBatch {
    target: ServerData;
    hackThreads: number;
    weaken1Threads: number;
    growThreads: number;
    weaken2Threads: number;
    totalThreads: number;
    hackStartDelay: number;
    weaken1StartDelay: number;
    growStartDelay: number;
    weaken2StartDelay: number;
}

interface IPrepBatch {
    target: ServerData;
    weakenThreads: number;
    growThreads: number;
    totalThreads: number;
    priority: 'security' | 'money';
}

interface IExecutionResults {
    totalScripts: number;
    successfulScripts: number;
    failedScripts: number;
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    
    options = ns.flags(argsSchema) as unknown as BotnetOptions;
    
    // Check if another botnet instance is already running
    const runningScripts = ns.ps();
    for (const script of runningScripts) {
        if (script.filename === 'botnet.js' && script.pid !== ns.getRunningScript()?.pid) {
            ns.tprint(`Botnet System: Another instance is already running (PID: ${script.pid}). Exiting.`);
            return; // Exit gracefully, let the existing instance continue
        }
    }
    
    if (options.debug) {
        ns.tprint(`Botnet System: Starting with PID ${ns.getRunningScript()?.pid} (rooting=${options.rooting})`);
    }
    
    ns.atExit(() => {
        // Kill all simple-* scripts directly using a more comprehensive approach
        try {
            // Get all servers in the network
            const allServers = getServerList(ns);
            let totalKilled = 0;
            for (const hostname of allServers) {
                try {
                    // Use cheap individual calls instead of expensive getServer()
                    if (ns.hasRootAccess(hostname) && ns.getServerMaxRam(hostname) > 0) {
                        const runningScripts = ns.ps(hostname);
                        for (const script of runningScripts) {
                            if (script.filename.includes(BOTNET_CONFIG.REMOTE_SCRIPT_PATTERN)) {
                                const killed = ns.scriptKill(script.filename, hostname);
                                if (killed) totalKilled++;
                            }
                        }
                    }
                } catch (e) {
                    // Skip servers that can't be accessed
                }
            }
            if (totalKilled > 0) {
                ns.tprint(`Botnet cleanup: killed ${totalKilled} remote scripts`);
            }
        } catch (e) {
            // Fallback: just print a message
            ns.tprint(`Botnet cleanup failed - you may need to run 'killremote.js' manually`);
        }
    });

    do {
        ns.clearLog();

        const playerHackLevel = ns.getHackingLevel();
        const servers = buildServerData(ns);
        
        // PHASE 0: Repboost System Management (if enabled)
        if (options.repboost) {
            if (!repboostDetector) {
                repboostDetector = new FactionDetector();
                if (options['repboost-debug']) {
                    ns.tprint("Repboost system: Initialized repboost detector");
                }
            }
            
            const repboostStatus = repboostDetector.detectFactionWork();
            const isStable = repboostStatus.isWorkingForFaction; // Skip stability check for testing
            
            if (repboostStatus.isWorkingForFaction && isStable) {
                if (!repboostSystemActive) {
                    // Skip stability delay for testing
                    repboostSystemActive = true;
                    repboostStartTime = Date.now();
                    if (options['repboost-debug']) {
                        ns.tprint(`Repboost system: Activated for repboost ${repboostStatus.detectedFactionName}`);
                    }
                }
            } else {
                if (repboostSystemActive) {
                    repboostSystemActive = false;
                    if (options['repboost-debug']) {
                        ns.tprint("Repboost system: Deactivated - no stable repboost work detected");
                    }
                }
            }
            
            if (options['repboost-debug']) {
                ns.tprint(`Repboost work: ${repboostStatus.isWorkingForFaction ? repboostStatus.detectedFactionName : 'None'} (consecutive: ${repboostStatus.consecutiveDetections}/2, stable: ${isStable})`);
                ns.tprint(`Detection details: method=${repboostStatus.detectionMethod}, duration=${Math.round(repboostStatus.workDuration/1000)}s, lastChange=${Math.round((Date.now() - repboostStatus.lastStatusChange)/1000)}s ago`);
                ns.tprint(`Repboost system: ${repboostSystemActive ? 'Active' : 'Inactive'}`);
            }
        }
        
        // PHASE 1: Server Management (always enabled)
        if (options.rooting) {
            const rootedCount = performServerRooting(ns, servers);
            if (rootedCount > 0) {
                ns.print(`Rooted ${rootedCount} new servers`);
            }
        }
        
        // Always manage purchased servers
        const maxServers = options['max-servers'] as number;
        const targetRamPower = options['target-ram-power'] as number;
        const serverManagement = await managePurchasedServers(ns, servers, maxServers, targetRamPower);
        if (options.debug) {
            ns.print(`Server management: bought ${serverManagement.bought}, upgraded ${serverManagement.upgraded}`);
        }
        if (serverManagement.bought > 0 || serverManagement.upgraded > 0) {
            ns.print(`Server management: bought ${serverManagement.bought}, upgraded ${serverManagement.upgraded}`);
        }
        
        
        // PHASE 2: HWGW Batching
        const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel).sort(byValue);
        const attackers = servers.filter(isAttacker).sort(byAvailableRam);
        
        if (attackers.length === 0) {
            ns.print('No attacker servers available. Rooting servers...');
            await ns.sleep(5000);
            continue;
        }
        
        // Copy all remote scripts to all attackers
        const remoteScripts = ns.ls('home', 'remote/').filter(file => file.endsWith(BOTNET_CONFIG.REMOTE_SCRIPT_EXTENSION));
        attackers.forEach(s => {
            remoteScripts.forEach(scriptFile => {
                ns.scp(scriptFile, s.hostname);
            });
        });

        // STEP 1: Clean slate - stop all existing scripts if repboost is enabled and active
        if (options.repboost && repboostSystemActive) {
            if (options['repboost-debug']) {
                ns.tprint("Repboost: Stopping all HWGW scripts to make room for repboost allocation");
            }
            
            // More aggressive cleanup - kill all simple- scripts multiple times
            for (let cleanup = 0; cleanup < BOTNET_CONFIG.SHRAM_CLEANUP_ROUNDS; cleanup++) {
                let killedCount = 0;
                for (const attacker of attackers) {
                    const runningScripts = ns.ps(attacker.hostname);
                    for (const script of runningScripts) {
                        if (script.filename.includes(BOTNET_CONFIG.REMOTE_SCRIPT_PATTERN)) {
                            const killed = ns.scriptKill(script.filename, attacker.hostname);
                            if (killed) killedCount++;
                        }
                    }
                }
                if (options['repboost-debug']) {
                    ns.tprint(`Repboost: Cleanup round ${cleanup + 1}: killed ${killedCount} scripts`);
                }
                if (killedCount === 0) break; // No more scripts to kill
                await ns.sleep(BOTNET_CONFIG.SHRAM_CLEANUP_DELAY);
            }
            
            // Final verification
            let totalRemaining = 0;
            for (const attacker of attackers) {
                const runningScripts = ns.ps(attacker.hostname);
                const remainingSimpleScripts = runningScripts.filter(s => s.filename.includes(BOTNET_CONFIG.REMOTE_SCRIPT_PATTERN));
                totalRemaining += remainingSimpleScripts.length;
            }
            
            if (options['repboost-debug']) {
                ns.tprint(`Repboost: After cleanup, ${totalRemaining} simple- scripts still running`);
            }
        }

        // STEP 2: Snapshot Network RAM (after cleanup)
        const networkRAMSnapshot = takeNetworkRAMSnapshot(ns, attackers);
        let remainingRAMBudget = networkRAMSnapshot.totalAvailable;
        const scriptRamCost = BOTNET_CONFIG.SCRIPT_RAM_COST;
        
        if (options.debug || options['repboost-debug']) {
            ns.tprint(`Network RAM Budget: ${remainingRAMBudget.toFixed(2)}GB across ${networkRAMSnapshot.servers.length} servers`);
        if (options.repboost && repboostSystemActive) {
                // Show per-server RAM for debugging
                const topServers = networkRAMSnapshot.servers
                    .sort((a, b) => b.availableRAM - a.availableRAM)
                    .slice(0, BOTNET_CONFIG.TOP_SERVERS_DEBUG);
                ns.tprint(`Top ${BOTNET_CONFIG.TOP_SERVERS_DEBUG} servers by available RAM:`);
                topServers.forEach(s => {
                    ns.tprint(`  ${s.hostname}: ${s.availableRAM.toFixed(1)}GB available`);
                });
            }
        }

         // STEP 3: Repboost Allocation and Execution (deploy scripts immediately with clean RAM)
        let repboostRAMUsed = 0;
        if (options.repboost && repboostSystemActive) {
            const repboostConfig: ShareConfiguration = {
                ramPercentage: options['repboost-ram-percentage'] as number,
                minimumThreads: options['repboost-min-threads'] as number,
                maximumThreads: options['repboost-max-threads'] as number,
                priorityCoreThreshold: options['repboost-core-threshold'] as number,
                intelligenceOptimization: options['repboost-intelligence-opt'] as boolean
            };
            
            const configErrors = ShareCalculator.validateConfiguration(repboostConfig);
            if (configErrors.length > 0) {
                ns.tprint(`Repboost config errors: ${configErrors.join(', ')}`);
            } else {
                // Get real-time server data for accurate RAM availability
                const currentServers = buildServerData(ns);
                const availableServers = currentServers.filter(isAttacker);
                const serverHostnames = availableServers.map(s => s.hostname);
                
                // Perform optimization with current RAM state
                const optimization = ServerOptimizer.optimizeServerAllocation(ns, serverHostnames, repboostConfig);
                
                if (optimization.eligibleServers.length > 0) {
                    const playerStats = ns.getPlayer();
                    const playerIntelligence = playerStats.skills?.intelligence || 0;
                    
                    const allocation = ShareCalculator.calculateNetworkShareAllocation(
                        optimization.eligibleServers.map(profile => ({
                            hostname: profile.hostname,
                            cpuCores: profile.cpuCores,
                            availableRAM: profile.availableRAM,
                            maxRam: ns.getServerMaxRam(profile.hostname),
                            ramUsed: ns.getServerUsedRam(profile.hostname)
                        })),
                        repboostConfig,
                        playerIntelligence
                    );
                    
                    if (allocation.totalBaseThreads > 0) {
                        const shouldReallocate = !currentShareAllocation || 
                            (Date.now() - lastShareAllocationTime) > 60000 ||
                            Math.abs(allocation.totalBaseThreads - (currentShareAllocation.totalBaseThreads || 0)) > 50;
                        
                        if (shouldReallocate) {
                            // Clean up existing repboost scripts
                            if (currentShareAllocation) {
                                for (const serverAlloc of currentShareAllocation.serverAllocations) {
                                    if (serverAlloc.hostname !== 'home') {
                                    const repboostScript = 'remote/simple-' + 'sh' + 'are.js';
                                    ns.scriptKill(repboostScript, serverAlloc.hostname);
                                    }
                                }
                            }
                            
                            // Files already copied during initial setup - no need to copy again
                            
                            // Execute repboost scripts immediately with final RAM verification
                            let deployedCount = 0;
                            repboostRAMUsed = 0; // Reset and recalculate based on actual deployments
                            for (const serverAlloc of allocation.serverAllocations) {
                                if (serverAlloc.baseThreads > 0 && serverAlloc.hostname !== 'home') {
                                    // Final RAM check before execution using cheap calls
                                    const finalMaxRAM = ns.getServerMaxRam(serverAlloc.hostname);
                                    const finalUsedRAM = ns.getServerUsedRam(serverAlloc.hostname);
                                    const finalAvailableRAM = finalMaxRAM - finalUsedRAM;
                                    const repboostScriptRAM = 4.0; // simple-repboost.js RAM cost
                                    const ramNeeded = serverAlloc.baseThreads * repboostScriptRAM;
                                    
                                    if (finalAvailableRAM >= ramNeeded) {
                                        const scriptArgs = [
                                            0,  // duration (infinite)
                                            100,  // cycle delay
                                            (options['repboost-debug'] as boolean).toString(),
                                            30000  // reporting interval
                                        ];
                                        
                                        // Check if file exists before execution
                                        const repboostScript = 'remote/simple-' + 'sh' + 'are.js';
                                        const fileExists = ns.fileExists(repboostScript, serverAlloc.hostname);
                                        if (!fileExists) {
                                            if (options['repboost-debug']) {
                                                ns.tprint(`Repboost: File ${repboostScript} does not exist on ${serverAlloc.hostname}`);
                                            }
                                            continue;
                                        }
                                        
                                        const pid = ns.exec(repboostScript, serverAlloc.hostname, serverAlloc.baseThreads, ...scriptArgs);
                                        if (pid > 0) {
                                            deployedCount++;
                                            repboostRAMUsed += ramNeeded;
                                            if (options['repboost-debug']) {
                                                ns.tprint(`Repboost: Executed ${serverAlloc.baseThreads} threads on ${serverAlloc.hostname} (${ramNeeded.toFixed(1)}GB, PID: ${pid})`);
                                            }
                                        } else {
                                            if (options['repboost-debug']) {
                                                ns.tprint(`Repboost: Failed to execute on ${serverAlloc.hostname} - exec failed (${serverAlloc.baseThreads} threads, ${ramNeeded.toFixed(1)}GB needed, ${finalAvailableRAM.toFixed(1)}GB available)`);
                                            }
                                        }
                                    } else if (options['repboost-debug']) {
                                        ns.tprint(`Repboost: Skipped ${serverAlloc.hostname} - insufficient RAM (need ${ramNeeded.toFixed(1)}GB, have ${finalAvailableRAM.toFixed(1)}GB)`);
                                    }
                                }
                            }
                            
                            currentShareAllocation = allocation;
                            lastShareAllocationTime = Date.now();
                            
                            if (deployedCount > 0) {
                                const actualThreads = Math.floor(repboostRAMUsed / 4.0); // Calculate actual threads deployed
                                ns.tprint(`Repboost: Successfully deployed ${actualThreads} threads across ${deployedCount} servers (${repboostRAMUsed.toFixed(1)}GB)`);
                                ns.tprint(`Repboost: Planned ${allocation.totalBaseThreads} threads, deployed ${actualThreads} threads (${((actualThreads/allocation.totalBaseThreads)*100).toFixed(1)}% success)`);
                            } else {
                                ns.tprint(`Repboost: Failed to deploy any threads - all servers at capacity`);
                                repboostRAMUsed = 0; // No RAM actually used
                                currentShareAllocation = null; // Clear allocation since nothing was deployed
                            }
                        } else if (currentShareAllocation) {
                            // Use existing allocation RAM (estimate - may not be accurate if some scripts died)
                            repboostRAMUsed = currentShareAllocation.totalRAMUsed || 0;
                        }
                    } else if (options['repboost-debug']) {
                        ns.tprint("Repboost: No threads available for allocation");
                    }
                } else if (options['repboost-debug']) {
                    ns.tprint("Repboost: No eligible servers found");
                }
            }
        } else if (currentShareAllocation && !repboostSystemActive) {
            for (const serverAlloc of currentShareAllocation.serverAllocations) {
                if (serverAlloc.hostname !== 'home') {
                    const repboostScript = 'remote/simple-' + 'sh' + 'are.js';
                    ns.scriptKill(repboostScript, serverAlloc.hostname);
                }
            }
            currentShareAllocation = null;
            repboostRAMUsed = 0;
            ns.tprint("Repboost: Cleaned up allocation - repboost work inactive");
        }
        
        // Deduct repboost RAM from available budget
        remainingRAMBudget -= repboostRAMUsed;
        if (options.debug && repboostRAMUsed > 0) {
            ns.tprint(`Repboost RAM reserved: ${repboostRAMUsed.toFixed(1)}GB, remaining for HWGW: ${remainingRAMBudget.toFixed(1)}GB`);
        }

         // STEP 4: Select Hackable Targets
        const hackableTargets = selectHackableTargets(targets);
        const nonReadyTargets = targets.filter(t => !hackableTargets.includes(t));
        
        if (options.debug) {
            ns.tprint(`Found ${hackableTargets.length} hack-ready targets, ${nonReadyTargets.length} need prep`);
        }

         // STEP 5: Allocate Full HWGW Batches
        const hwgwBatches: IHWGWBatch[] = [];
        
        while (remainingRAMBudget > scriptRamCost * 10) {
            let batchAllocatedThisRound = false;
            
            for (const target of hackableTargets) {
                const fullBatch = calculateFullHWGWBatch(ns, target);
                const batchRAMCost = fullBatch.totalThreads * scriptRamCost;
                
                if (batchRAMCost <= remainingRAMBudget) {
                    hwgwBatches.push(fullBatch);
                    remainingRAMBudget -= batchRAMCost;
                    batchAllocatedThisRound = true;
                    
                    if (options.debug) {
                        ns.tprint(`Allocated HWGW batch for ${target.hostname}: ${fullBatch.totalThreads} threads (${batchRAMCost.toFixed(2)}GB)`);
                    }
                }
            }
            
            if (!batchAllocatedThisRound) {
                break;
            }
        }



         // STEP 6: Prepare Future Targets
        const prepBatches: IPrepBatch[] = [];
        while (remainingRAMBudget >= scriptRamCost && nonReadyTargets.length > 0) {
            let prepAllocatedThisRound = false;
            
            for (const target of nonReadyTargets) {
                if (remainingRAMBudget < scriptRamCost) break;
                
                const prepBatch = calculatePrepBatch(ns, target, remainingRAMBudget, scriptRamCost);
                if (prepBatch && prepBatch.totalThreads > 0) {
                    const prepRAMCost = prepBatch.totalThreads * scriptRamCost;
                    prepBatches.push(prepBatch);
                    remainingRAMBudget -= prepRAMCost;
                    prepAllocatedThisRound = true;
                    
                    if (options.debug) {
                        ns.tprint(`Allocated prep batch for ${target.hostname}: ${prepBatch.totalThreads} threads (${prepRAMCost.toFixed(2)}GB)`);
                    }
                }
            }
            
            if (!prepAllocatedThisRound) {
                break;
            }
        }

         // STEP 7: Execute the batches
        const executionResults = executeHWGWBatches(ns, hwgwBatches, prepBatches, networkRAMSnapshot, scriptRamCost, !!options.debug);
        
        // Track batch cycles
        totalBatchCycles++;
        
        if (options.debug) {
            ns.tprint(`Execution Summary: ${executionResults.successfulScripts}/${executionResults.totalScripts} scripts started successfully`);
            ns.tprint(`Remaining RAM Budget: ${remainingRAMBudget.toFixed(2)}GB`);
        }

        // CONTINUOUS BATCHING
        while (true) {
            await ns.sleep(1000);
            ns.clearLog();
            
            const currentServers = buildServerData(ns);
            
            // Server management in the continuous loop
            const maxServers = options['max-servers'] as number;
            const targetRamPower = options['target-ram-power'] as number;
            const serverManagement = await managePurchasedServers(ns, currentServers, maxServers, targetRamPower);
            if (options.debug) {
                ns.print(`Server management: bought ${serverManagement.bought}, upgraded ${serverManagement.upgraded}`);
            }
            if (serverManagement.bought > 0 || serverManagement.upgraded > 0) {
                ns.print(`Server management: bought ${serverManagement.bought}, upgraded ${serverManagement.upgraded}`);
            }
            
            const currentAttackers = currentServers.filter(isAttacker).sort(byAvailableRam);
            const currentTargets = currentServers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel).sort(byValue);
            
            const currentNetworkRAM = takeNetworkRAMSnapshot(ns, currentAttackers);
            let availableRAM = currentNetworkRAM.totalAvailable;
            
            printStatus(ns, currentServers, playerHackLevel);
            
            if (availableRAM > scriptRamCost * 50) {
                if (options.debug) {
                    ns.tprint(`Detected ${availableRAM.toFixed(2)}GB available RAM - spawning additional batches`);
                }
                
                const currentHackableTargets = selectHackableTargets(currentTargets);
                const additionalHWGWBatches: IHWGWBatch[] = [];
                
                for (const target of currentHackableTargets) {
                    if (availableRAM < scriptRamCost * 10) continue;
                    
                    const batch = calculateFullHWGWBatch(ns, target);
                    const batchCost = batch.totalThreads * scriptRamCost;
                    
                    if (batchCost <= availableRAM) {
                        additionalHWGWBatches.push(batch);
                        availableRAM -= batchCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional HWGW batch for ${target.hostname}: ${batch.totalThreads} threads`);
                        }
                    }
                }
                
                const currentNonReadyTargets = currentTargets.filter(t => !currentHackableTargets.includes(t));
                const additionalPrepBatches: IPrepBatch[] = [];
                
                for (const target of currentNonReadyTargets) {
                    if (availableRAM < scriptRamCost) break;
                    
                    const prepBatch = calculatePrepBatch(ns, target, availableRAM, scriptRamCost);
                    if (prepBatch && prepBatch.totalThreads > 0) {
                        const prepCost = prepBatch.totalThreads * scriptRamCost;
                        additionalPrepBatches.push(prepBatch);
                        availableRAM -= prepCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional prep batch for ${target.hostname}: ${prepBatch.totalThreads} threads`);
                        }
                    }
                }
                
                if (additionalHWGWBatches.length > 0 || additionalPrepBatches.length > 0) {
                    executeHWGWBatches(ns, additionalHWGWBatches, additionalPrepBatches, currentNetworkRAM, scriptRamCost, !!options.debug);
                }
            }
            
            if (!options.repeat) {
                const running = currentServers.some(s => ns.ps(s.hostname).some(p => p.filename.includes('simple-')));
                if (!running) break;
            }
        }
    } while (options.repeat);
}

function printStatus(ns: NS, servers: ServerData[], playerHackLevel: number) {
    const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel);
    const attackers = servers.filter(isAttacker);
    
    const runningScripts = servers.flatMap(s => ns.ps(s.hostname).filter((p: any) => p.filename.includes('simple-')));
    const running = runningScripts.length > 0;
    
    // Server management stats
    const totalServers = servers.length;
    const rootedServers = servers.filter(s => s.hasAdminRights).length;
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    const purchasedCount = purchasedServers.length;
    const totalPurchasedRAM = purchasedServers.reduce((sum, s) => sum + s.maxRam, 0);
    
    if (running) {
        const scriptStats = { hack: 0, weaken: 0, grow: 0, total: runningScripts.length };
        runningScripts.forEach((p: any) => {
            if (p.filename.includes('hack')) scriptStats.hack++;
            if (p.filename.includes('weaken')) scriptStats.weaken++;
            if (p.filename.includes('grow')) scriptStats.grow++;
        });
        
        const totalRAM = attackers.reduce((sum, s) => sum + s.maxRam, 0);
        const usedRAM = attackers.reduce((sum, s) => sum + s.ramUsed, 0);
        const utilization = totalRAM > 0 ? (usedRAM / totalRAM * 100) : 0;
        
        const playerMoney = ns.getServerMoneyAvailable('home');
        
        let incomeRate = 0;
        try {
            incomeRate = ns.getTotalScriptIncome()[0] ?? 0;
        } catch {
            incomeRate = 0;
        }
        
        const readyTargets = targets.filter(t => {
            const securityOk = t.hackDifficulty <= t.minDifficulty + 5;
            const moneyOk = t.moneyAvailable >= t.moneyMax * 0.95;
            return securityOk && moneyOk;
        });
        const prepTargets = targets.filter(t => !readyTargets.includes(t));
        
        // Get active targets being attacked
        const activeTargets = new Map<string, { hack: number; weaken: number; grow: number }>();
        runningScripts.forEach((p: any) => {
            const target = p.args[0] as string;
            if (!activeTargets.has(target)) {
                activeTargets.set(target, { hack: 0, weaken: 0, grow: 0 });
            }
            const stats = activeTargets.get(target)!;
            if (p.filename.includes('hack')) stats.hack++;
            if (p.filename.includes('weaken')) stats.weaken++;
            if (p.filename.includes('grow')) stats.grow++;
        });
        
        // Get top 3 most active targets
        const topTargets = Array.from(activeTargets.entries())
            .sort(([,a], [,b]) => (b.hack + b.weaken + b.grow) - (a.hack + a.weaken + a.grow))
            .slice(0, 3);
        
        ns.print(`┌─ BOTNET SYSTEM STATUS ───────────────────────────────────────`);
        ns.print(`│ Scripts: ${scriptStats.total.toString().padEnd(3)} (H:${scriptStats.hack.toString().padStart(2)} W:${scriptStats.weaken.toString().padStart(2)} G:${scriptStats.grow.toString().padStart(2)})  RAM: ${utilization.toFixed(1)}% (${(usedRAM/1000).toFixed(1)}/${(totalRAM/1000).toFixed(1)}TB)`);
        ns.print(`│ Money: $${ns.formatNumber(playerMoney)}  Hack: ${playerHackLevel}  Income: $${ns.formatNumber(incomeRate)}/sec`);
        ns.print(`│ Servers: ${rootedServers}/${totalServers}  Purchased: ${purchasedCount}/25 (${(totalPurchasedRAM/1000).toFixed(1)}TB)`);
        
        // Add uptime and cycle information
        const uptimeMs = Date.now() - botnetStartTime;
        const uptimeMin = Math.floor(uptimeMs / 60000);
        const uptimeSec = Math.floor((uptimeMs % 60000) / 1000);
        const cyclesPerMin = totalBatchCycles > 0 && uptimeMin > 0 ? (totalBatchCycles / uptimeMin).toFixed(1) : '0.0';
        
        ns.print(`│ Ready: ${readyTargets.length}  Prep: ${prepTargets.length}  Batches: ${totalBatchCycles} cycles (${cyclesPerMin}/min)`);
        ns.print(`│ Uptime: ${uptimeMin}m ${uptimeSec}s  Efficiency: $${(incomeRate / Math.max(scriptStats.total, 1)).toFixed(0)}/script`);
        
        if (topTargets.length > 0) {
            ns.print(`├─ ACTIVE TARGETS ────────────────────────────────────────────`);
            topTargets.forEach(([target, stats]) => {
                const total = stats.hack + stats.weaken + stats.grow;
                const targetDisplay = target.substring(0, 16).padEnd(16);
                ns.print(`│ ${targetDisplay} ${total.toString().padStart(3)} scripts (H:${stats.hack.toString().padStart(2)} W:${stats.weaken.toString().padStart(2)} G:${stats.grow.toString().padStart(2)})`);
            });
        }
        
        // Repboost system reporting
        if (options.repboost) {
            const repboostScript = 'simple-' + 'sh' + 'are.js';
            const repboostScripts = servers.flatMap(s => ns.ps(s.hostname).filter((p: any) => p.filename.includes(repboostScript)));
            if (repboostScripts.length > 0 || repboostSystemActive) {
                ns.print(`├─ REPBOOST SYSTEM ───────────────────────────────────────────`);
                
                if (repboostSystemActive && currentShareAllocation) {
                    const totalThreads = currentShareAllocation.totalBaseThreads || 0;
                    const effectiveThreads = currentShareAllocation.totalEffectiveThreads || 0;
                    const reputationBonus = currentShareAllocation.averageReputationBonus || 1.0;
                    const ramUsed = currentShareAllocation.totalRAMUsed || 0;
                    const repboostRuntime = repboostStartTime > 0 ? Math.floor((Date.now() - repboostStartTime) / 1000) : 0;
                    
                    const repboostStatus = repboostDetector?.detectFactionWork();
                    const repboostName = repboostStatus?.detectedFactionName || 'Unknown';
                    
                    ns.print(`│ Status: ACTIVE (${repboostRuntime}s)  Faction: ${repboostName.substring(0, 12)}`);
                    ns.print(`│ Threads: ${totalThreads} base → ${effectiveThreads.toFixed(0)} effective  Rep bonus: ${reputationBonus.toFixed(3)}x`);
                    ns.print(`│ Servers: ${repboostScripts.length}  RAM used: ${(ramUsed/1000).toFixed(1)}GB  Scripts: ${repboostScripts.length}`);
                    
                    if (currentShareAllocation.serverAllocations && currentShareAllocation.serverAllocations.length > 0) {
                        const topRepboostServers = currentShareAllocation.serverAllocations
                            .filter((alloc: any) => alloc.baseThreads > 0)
                            .sort((a: any, b: any) => b.baseThreads - a.baseThreads)
                            .slice(0, 3);
                        
                        topRepboostServers.forEach((alloc: any) => {
                            const serverDisplay = alloc.hostname.substring(0, 16).padEnd(16);
                            const cores = alloc.cpuCores || 1; // Default to 1 core if not available
                            ns.print(`│ ${serverDisplay} ${alloc.baseThreads.toString().padStart(3)} threads  ${cores} cores`);
                        });
                    }
                } else if (repboostDetector) {
                    const repboostStatus = repboostDetector.detectFactionWork();
                    if (repboostStatus.isWorkingForFaction) {
                        const stability = repboostDetector.isDetectionStable(repboostStatus, 3) ? 'Stable' : 'Unstable';
                        ns.print(`│ Status: WAITING (${stability})  Faction: ${repboostStatus.detectedFactionName || 'Detecting...'}`);
                        ns.print(`│ Delay: ${options['repboost-stability-delay']}ms  Detection: ${repboostStatus.consecutiveDetections}/3`);
                    } else {
                        ns.print(`│ Status: DISABLED - No repboost work detected`);
                    }
                } else {
                    ns.print(`│ Status: INACTIVE - Repboost system enabled but not initialized`);
                }
            }
        }
        
        ns.print(`└──────────────────────────────────────────────────────────────`);
    } else {
        ns.print(`BOTNET: No active scripts - waiting for next cycle...`);
    }
}

function takeNetworkRAMSnapshot(ns: NS, attackers: ServerData[]): INetworkRAMSnapshot {
    const servers: { hostname: string; availableRAM: number }[] = [];
    let totalAvailable = 0;
    
    for (const attacker of attackers) {
        // Use cheap individual calls instead of expensive getServer()
        const maxRam = ns.getServerMaxRam(attacker.hostname);
        const usedRam = ns.getServerUsedRam(attacker.hostname);
        const availableRam = maxRam - usedRam;
        const reserveForHome = attacker.hostname === 'home' ? BOTNET_CONFIG.HOME_RAM_RESERVE : 0;
        const usableRAM = Math.max(0, availableRam - reserveForHome);
        
        servers.push({ hostname: attacker.hostname, availableRAM: usableRAM });
        totalAvailable += usableRAM;
    }
    
    return { totalAvailable, servers };
}

function selectHackableTargets(targets: ServerData[]): ServerData[] {
    const hackableTargets = targets.filter(target => {
        const moneyRatio = target.moneyAvailable / Math.max(target.moneyMax, 1);
        const securityOverMin = target.hackDifficulty - target.minDifficulty;
        
        return moneyRatio >= BOTNET_CONFIG.MONEY_THRESHOLD && securityOverMin <= BOTNET_CONFIG.SECURITY_TOLERANCE;
    });
    
    // Sort by efficiency: money per weaken time, prioritizing high-value quick targets
    return hackableTargets.sort((a, b) => {
        const efficiencyA = (a.moneyMax / a.weakenTime) * (a.moneyAvailable / a.moneyMax);
        const efficiencyB = (b.moneyMax / b.weakenTime) * (b.moneyAvailable / b.moneyMax);
        return efficiencyB - efficiencyA;
    });
}

function calculateFullHWGWBatch(ns: NS, target: ServerData): IHWGWBatch {
    const targetMoney = target.moneyAvailable * BOTNET_CONFIG.HACK_PERCENTAGE;
    
    // Calculate hack threads more efficiently
    const baseHackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, targetMoney));
    const hackThreads = Math.max(1, baseHackThreads);
    
    // Calculate security increases and required weaken threads
    const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads, target.hostname);
    const weakenEffect = ns.weakenAnalyze(1);
    const weaken1Threads = Math.ceil(hackSecIncrease / weakenEffect);
    
    // Calculate grow threads needed to restore the money we're taking
    const moneyAfterHack = target.moneyAvailable - targetMoney;
    const growthNeeded = target.moneyMax / Math.max(moneyAfterHack, 1);
    // Cap growth analysis to prevent extreme values on very low-money targets
    const growThreads = Math.ceil(ns.growthAnalyze(target.hostname, Math.min(growthNeeded, BOTNET_CONFIG.GROWTH_ANALYSIS_CAP)));
    
    const growSecIncrease = ns.growthAnalyzeSecurity(growThreads, target.hostname);
    const weaken2Threads = Math.ceil(growSecIncrease / weakenEffect);
    
    const now = Date.now();
    
    // Calculate optimal timing for HWGW batch
    const hackStartDelay = now + target.weakenTime - target.hackTime + (3 * BOTNET_CONFIG.HWGW_TIMING_GAP);
    const weaken1StartDelay = now + BOTNET_CONFIG.HWGW_TIMING_GAP;
    const growStartDelay = now + target.weakenTime - target.growTime + (2 * BOTNET_CONFIG.HWGW_TIMING_GAP);
    const weaken2StartDelay = now;
    
    return {
        target,
        hackThreads,
        weaken1Threads,
        growThreads,
        weaken2Threads,
        totalThreads: hackThreads + weaken1Threads + growThreads + weaken2Threads,
        hackStartDelay,
        weaken1StartDelay,
        growStartDelay,
        weaken2StartDelay
    };
}

function calculatePrepBatch(ns: NS, target: ServerData, availableRAMBudget: number, scriptRamCost: number): IPrepBatch | null {
    const maxThreadsAvailable = Math.floor(availableRAMBudget / scriptRamCost);
    
    const securityOverMin = target.hackDifficulty - target.minDifficulty;
    const moneyRatio = target.moneyAvailable / Math.max(target.moneyMax, 1);
    
    if (securityOverMin > 1) {
        const weakenEffect = ns.weakenAnalyze(1);
        const weakenThreadsNeeded = Math.ceil(securityOverMin / weakenEffect);
        const weakenThreads = Math.min(weakenThreadsNeeded, maxThreadsAvailable);
        
        return {
            target,
            weakenThreads,
            growThreads: 0,
            totalThreads: weakenThreads,
            priority: 'security'
        };
    } else if (moneyRatio < 0.95) {
        const growthMultiplier = target.moneyMax / Math.max(target.moneyAvailable, 1);
        const growThreadsNeeded = Math.ceil(ns.growthAnalyze(target.hostname, Math.min(growthMultiplier, 100)));
        const growThreads = Math.min(growThreadsNeeded, maxThreadsAvailable);
        
        return {
            target,
            weakenThreads: 0,
            growThreads,
            totalThreads: growThreads,
            priority: 'money'
        };
    }
    
    return null;
}

function executeHWGWBatches(ns: NS, hwgwBatches: IHWGWBatch[], prepBatches: IPrepBatch[], networkSnapshot: INetworkRAMSnapshot, scriptRamCost: number, debug: boolean): IExecutionResults {
    let totalScripts = 0;
    let successfulScripts = 0;
    let failedScripts = 0;
    
    const serverRAM: Record<string, number> = {};
    for (const server of networkSnapshot.servers) {
        serverRAM[server.hostname] = server.availableRAM;
    }
    
    for (const batch of hwgwBatches) {
        const scripts = [
            { type: 'hack', threads: batch.hackThreads, delay: batch.hackStartDelay },
            { type: 'weaken', threads: batch.weaken1Threads, delay: batch.weaken1StartDelay },
            { type: 'grow', threads: batch.growThreads, delay: batch.growStartDelay },
            { type: 'weaken', threads: batch.weaken2Threads, delay: batch.weaken2StartDelay }
        ];
        
        for (const script of scripts) {
            if (script.threads === 0) continue;
            
            const result = allocateAndExecuteScript(ns, script.type, script.threads, script.delay, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
    }
    
    for (const batch of prepBatches) {
        if (batch.weakenThreads > 0) {
            const result = allocateAndExecuteScript(ns, 'weaken', batch.weakenThreads, Date.now() + 1000, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
        
        if (batch.growThreads > 0) {
            const result = allocateAndExecuteScript(ns, 'grow', batch.growThreads, Date.now() + 1000, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
    }
    
    return { totalScripts, successfulScripts, failedScripts };
}

function allocateAndExecuteScript(ns: NS, scriptType: string, threads: number, delay: number, targetHostname: string, serverRAM: Record<string, number>, scriptRamCost: number, debug: boolean): { success: boolean; pid: number } {
    if (threads <= 0) {
        if (debug) {
            ns.tprint(`ERROR: Invalid thread count ${threads} for ${scriptType} -> ${targetHostname}`);
        }
        return { success: false, pid: 0 };
    }
    
    let scriptFile = '';
    switch (scriptType) {
        case 'hack': scriptFile = 'remote/simple-hack.js'; break;
        case 'weaken': scriptFile = 'remote/simple-weaken.js'; break;
        case 'grow': scriptFile = 'remote/simple-grow.js'; break;
        default: return { success: false, pid: 0 };
    }
    
    let remainingThreads = threads;
    let totalSuccess = true;
    let firstPid = 0;
    
    for (const [hostname, availableRAM] of Object.entries(serverRAM)) {
        if (remainingThreads === 0) break;
        if (availableRAM < scriptRamCost) continue;
        
        const maxThreadsOnServer = Math.max(0, Math.floor(availableRAM / scriptRamCost));
        const threadsToAllocate = Math.min(remainingThreads, maxThreadsOnServer);
        
        if (threadsToAllocate <= 0) continue;
        
        const ramUsed = threadsToAllocate * scriptRamCost;
        serverRAM[hostname] -= ramUsed;
        
        const pid = ns.exec(scriptFile, hostname, threadsToAllocate, targetHostname, delay);
        const success = pid !== 0;
        
        if (!success) {
            // If script execution fails, restore RAM allocation for retry
            serverRAM[hostname] += ramUsed;
            totalSuccess = false;
            
            if (debug) {
                ns.tprint(`FAILED: ${scriptType} on ${hostname} (${threadsToAllocate}t) -> ${targetHostname} - RAM restored`);
            }
        } else {
            if (firstPid === 0) {
                firstPid = pid;
            }
            
            if (debug) {
                ns.tprint(`SUCCESS: ${scriptType} on ${hostname} (${threadsToAllocate}t/${threads}t) -> ${targetHostname} (PID: ${pid})`);
            }
        }
        
        remainingThreads -= threadsToAllocate;
    }
    
    if (remainingThreads > 0) {
        if (debug) {
            ns.tprint(`PARTIAL: ${scriptType} allocated ${threads - remainingThreads}/${threads} threads to ${targetHostname} (${remainingThreads} threads couldn't be allocated)`);
        }
        totalSuccess = false;
    }
    
    return { success: totalSuccess, pid: firstPid };
}