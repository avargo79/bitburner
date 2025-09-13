import { NS } from '@ns';
import { Logger, LogLevel } from '/lib/logger';

/**
 * Botnet: Performance-Optimized Event-Driven HWGW System
 * Advanced performance tracking, smart resource allocation, and real-time dashboard
 */

// ===== INTERFACE DEFINITIONS =====

// Configuration & Options Interfaces
interface BotnetConfiguration {
  // Core timing - Professional Wave System
  mainLoopDelay: number;
  cycleTimingDelay: number; // 4000ms - interval between batch starts (Alain's approach)
  queueDelay: number; // 1000ms - delay before first script begins
  maxBatches: number; // 40 - maximum overlapping batches
  recoveryThreadPadding: number; // 1.0 - multiply grow/weaken threads for recovery
  baseTimeDelay: number; // Legacy - keeping for compatibility

  // HWGW parameters  
  hackPercentage: number;
  growthBufferMultiplier: number;
  securityOptimalThreshold: number;
  moneyOptimalRatio: number;
  weakenHackSecurityIncrease: number;
  weakenGrowSecurityIncrease: number;
  weakenSecurityDecrease: number;

  // Performance tuning
  maxEventsPerCycle: number;
  maxActiveBatches: number;
  batchSize: number;
  dynamicBatchSizeMin: number;
  dynamicBatchSizeMax: number;
  dynamicBatchSizeMultiplier: number;

  // Target management
  targetServer: string;
  minTargetMoney: number;
  targetEvaluationInterval: number;
  targetEfficiencyDropThreshold: number;
  targetMoneyDepletedThreshold: number;
  targetImprovementThreshold: number;

  // Performance thresholds
  batchTimeoutBuffer: number;
  serverReliabilitySuccessBonus: number;
  serverReliabilityFailurePenalty: number;

  // Display
  dashboardInterval: number;
  mainLoopDisplayMultiplier: number;
  displayDashboard: boolean;
  logLevel: LogLevel;
}

// Event Tracking
interface BatchTracker {
  id: string;
  target: string;
  server: string;
  startTime: number;
  expectedCompletionTime: number;
  batchSize: number;
  hackCompleted: boolean;
  growCompleted: boolean;
  weakenCompleted: boolean;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  moneyGained: number;
  securityReduced: number;
  efficiency: number;
}

interface BatchEvent {
  type: 'hack' | 'grow' | 'weaken';
  batchId: string;
  timestamp: number;
  threads: number;
  success: boolean;
  value: number; // money for hack, multiplier for grow, security for weaken
  server: string;
  target: string;
}

interface BatchStats {
  totalMoneyGained: number;
  totalSecurityReduced: number;
  batchesSent: number;
  batchesCompleted: number;
  batchesFailed: number;
  hacksCompleted: number;
  growsCompleted: number;
  weakensCompleted: number;
  lastEventTime: number;
  eventsThisCycle: number;
  recentActivity: string;
}

// Performance Analytics
interface PerformanceMetrics {
  startTime: number;
  moneyPerHour: number;
  batchesPerHour: number;
  averageBatchTime: number;
  averageBatchValue: number;
  successRate: number;
  topServer: string;
  topTarget: string;
  systemEfficiency: number;
  resourceUtilization: number;
}

interface ServerPerformance {
  hostname: string;
  batchesExecuted: number;
  batchesCompleted: number;
  totalMoneyGenerated: number;
  averageBatchTime: number;
  successRate: number;
  lastUsed: number;
  reliability: number;
  efficiencyScore: number;
}

interface TargetPerformance {
  hostname: string;
  totalBatches: number;
  totalMoneyGenerated: number;
  averageMoneyPerBatch: number;
  averageBatchTime: number;
  successRate: number;
  lastTargeted: number;
  efficiencyRating: number;
}

// Dynamic Target Analysis
interface DynamicTargetAnalysis {
  hostname: string;
  hackLevel: number;
  maxMoney: number;
  currentMoney: number;
  currentMoneyRatio: number;
  securityLevel: number;
  minSecurityLevel: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  hackChance: number;
  efficiencyScore: number;
  moneyPerSecond: number;
  isOptimal: boolean;
}

interface DynamicTarget {
  hostname: string;
  analysis: DynamicTargetAnalysis;
  lastEvaluated: number;
}

// ===== CONFIGURATION SYSTEM =====

// ===== CONFIGURATION =====

const DEFAULT_BOTNET_CONFIG: BotnetConfiguration = {
  // Core timing - Professional Wave System (Alain's approach)
  mainLoopDelay: 1000,
  cycleTimingDelay: 4000, // 4 seconds between batch starts
  queueDelay: 1000, // 1 second delay before first script
  maxBatches: 40, // Maximum overlapping batches
  recoveryThreadPadding: 1.0, // Thread multiplier for recovery
  baseTimeDelay: 250, // Fine-tuning delay for operation spacing

  // HWGW parameters
  hackPercentage: 0.05,
  growthBufferMultiplier: 1.1,
  securityOptimalThreshold: 5.0,
  moneyOptimalRatio: 0.75,
  weakenHackSecurityIncrease: 0.002,
  weakenGrowSecurityIncrease: 0.004,
  weakenSecurityDecrease: 0.05,

  // Performance tuning
  maxEventsPerCycle: 50,
  maxActiveBatches: 15,
  batchSize: 25,
  dynamicBatchSizeMin: 10,
  dynamicBatchSizeMax: 100,
  dynamicBatchSizeMultiplier: 1.2,

  // Target management
  targetServer: '',
  minTargetMoney: 1000000,
  targetEvaluationInterval: 30000,
  targetEfficiencyDropThreshold: 0.4,
  targetMoneyDepletedThreshold: 0.1,
  targetImprovementThreshold: 1.3,

  // Performance thresholds
  batchTimeoutBuffer: 10000,
  serverReliabilitySuccessBonus: 0.05,
  serverReliabilityFailurePenalty: 0.1,

  // Display
  dashboardInterval: 5000,
  mainLoopDisplayMultiplier: 3,
  displayDashboard: true,
  logLevel: LogLevel.CRITICAL
};

// ===== CORE MODULES =====

class BotnetPerformanceTracker {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;
  private performanceMetrics: PerformanceMetrics;
  private serverPerformance: Map<string, ServerPerformance>;
  private targetPerformance: Map<string, TargetPerformance>;
  private activeBatches: Map<string, BatchTracker>;
  private stats: BatchStats;
  private startTime: number;
  private lastEventTime: number;

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    performanceMetrics: PerformanceMetrics,
    serverPerformance: Map<string, ServerPerformance>,
    targetPerformance: Map<string, TargetPerformance>,
    activeBatches: Map<string, BatchTracker>,
    stats: BatchStats
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.performanceMetrics = performanceMetrics;
    this.serverPerformance = serverPerformance;
    this.targetPerformance = targetPerformance;
    this.activeBatches = activeBatches;
    this.stats = stats;
    this.startTime = Date.now();
    this.lastEventTime = Date.now();
  }

  async updatePerformanceMetrics(): Promise<void> {
    BotnetUtilities.updatePerformanceMetrics(this.performanceMetrics, this.stats, this.serverPerformance);
  }

  private formatDashboardLine(content: string): string {
    return `│ ${content}`;
  }

  async showDashboard(targetManager: BotnetTargetManager): Promise<void> {
    const now = Date.now();

    // Show dashboard every cycle when interval is reached
    const shouldShow = now % this.config.dashboardInterval < this.config.mainLoopDelay * this.config.mainLoopDisplayMultiplier;

    if (shouldShow) {
      const uptime = (now - this.performanceMetrics.startTime) / 1000 / 60; // minutes
      const batchSuccessRate = this.stats.batchesSent > 0 ?
        (this.stats.batchesCompleted / this.stats.batchesSent * 100).toFixed(1) : '0.0';

      const timeSinceLastEvent = this.stats.lastEventTime > 0 ?
        Math.floor((now - this.stats.lastEventTime) / 1000) : 0;

      this.ns.clearLog();
      // Get current target analysis for dashboard from target manager
      const currentAnalysis = targetManager.getCurrentTargetAnalysis();
      const currentTarget = targetManager.getCurrentTarget();
      const targetInfo = currentAnalysis ?
        `${currentTarget} (${(currentAnalysis.currentMoneyRatio * 100).toFixed(0)}% money, ${currentAnalysis.hackChance.toFixed(2)} chance)` :
        currentTarget;

      this.ns.print('┌─ BOTNET DYNAMIC TARGET DASHBOARD');
      this.ns.print(this.formatDashboardLine(`Runtime: ${uptime.toFixed(1)}min | Active Batches: ${this.activeBatches.size}/${this.config.maxActiveBatches} | Events/Cycle: ${this.stats.eventsThisCycle}`));
      this.ns.print(this.formatDashboardLine(`🎯 Target: ${targetInfo}`));
      this.ns.print(this.formatDashboardLine(`🎛️ Batch Size: ${targetManager.getDynamicBatchSize()}`));
      this.ns.print(this.formatDashboardLine(`⏱️ Last Activity (${timeSinceLastEvent}s ago): ${this.stats.recentActivity}`));
      this.ns.print('├─────────────────────────────────────────────────────────');
      this.ns.print(this.formatDashboardLine(`💰 Money/Hour: $${(this.performanceMetrics.moneyPerHour / 1000000).toFixed(1)}M | Total: $${(this.stats.totalMoneyGained / 1000000).toFixed(1)}M`));
      this.ns.print(this.formatDashboardLine(`📊 Batches/Hour: ${this.performanceMetrics.batchesPerHour.toFixed(1)} | Success: ${batchSuccessRate}% | Avg: $${(this.performanceMetrics.averageBatchValue / 1000).toFixed(1)}K`));
      this.ns.print(this.formatDashboardLine(`🎯 Batches: ${this.stats.batchesSent} sent, ${this.stats.batchesCompleted} completed, ${this.stats.batchesFailed} failed`));
      this.ns.print(this.formatDashboardLine(`⚡ Events: ${this.stats.hacksCompleted}H/${this.stats.growsCompleted}G/${this.stats.weakensCompleted}W`));

      if (this.performanceMetrics.topServer) {
        const topPerf = this.serverPerformance.get(this.performanceMetrics.topServer);
        if (topPerf) {
          this.ns.print(this.formatDashboardLine(`🚀 Top: ${topPerf.hostname} (${topPerf.batchesCompleted} batches, ${(topPerf.successRate * 100).toFixed(1)}% success)`));
        }
      }

      // Show active batch details for real-time monitoring
      if (this.activeBatches.size > 0) {
        this.ns.print('├─ ACTIVE BATCHES');
        let batchCount = 0;
        for (const [batchId, batch] of this.activeBatches.entries()) {
          if (batchCount >= 3) break; // Show only first 3 for space
          const elapsed = Math.floor((now - batch.startTime) / 1000);
          const completionStatus = `${batch.hackCompleted ? 'H' : '⋯'}${batch.growCompleted ? 'G' : '⋯'}${batch.weakenCompleted ? 'W' : '⋯'}`;
          this.ns.print(this.formatDashboardLine(`${batch.server}: [${completionStatus}] ${elapsed}s | $${batch.moneyGained.toLocaleString()}`));
          batchCount++;
        }
        if (this.activeBatches.size > 3) {
          this.ns.print(this.formatDashboardLine(`... and ${this.activeBatches.size - 3} more batches`));
        }
      }

      this.ns.print('└─────────────────────────────────────────────────────────');
    }
  }

  async recordServerPerformance(serverName: string, moneyGained: number): Promise<void> {
    let serverPerf = this.serverPerformance.get(serverName);
    if (!serverPerf) {
      serverPerf = {
        hostname: serverName,
        batchesExecuted: 0,
        batchesCompleted: 0,
        totalMoneyGenerated: 0,
        averageBatchTime: 0,
        successRate: 0,
        lastUsed: Date.now(),
        reliability: 1.0,
        efficiencyScore: 0
      };
      this.serverPerformance.set(serverName, serverPerf);
    }

    serverPerf.totalMoneyGenerated += moneyGained;
    serverPerf.lastUsed = Date.now();
  }

}

class BotnetUtilities {
  /**
   * Network Discovery Utilities
   */
  static getAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      try {
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      } catch (error) {
        // Skip servers we can't scan
      }
    }

    return Array.from(visited);
  }

  /**
   * Target Analysis Utilities
   */
  static analyzeTarget(ns: NS, hostname: string, config: BotnetConfiguration): DynamicTargetAnalysis | null {
    try {
      if (hostname === 'home') return null;

      const hackLevel = ns.getServerRequiredHackingLevel(hostname);
      const playerHackLevel = ns.getHackingLevel();
      const maxMoney = ns.getServerMaxMoney(hostname);
      const currentMoney = ns.getServerMoneyAvailable(hostname);

      // Skip if we can't hack it or it has no money
      if (hackLevel > playerHackLevel || maxMoney < config.minTargetMoney) {
        return null;
      }

      // Skip if we don't have root access
      if (!ns.hasRootAccess(hostname)) {
        return null;
      }

      const currentMoneyRatio = maxMoney > 0 ? currentMoney / maxMoney : 0;
      const securityLevel = ns.getServerSecurityLevel(hostname);
      const minSecurityLevel = ns.getServerMinSecurityLevel(hostname);

      const hackTime = ns.getHackTime(hostname);
      const growTime = ns.getGrowTime(hostname);
      const weakenTime = ns.getWeakenTime(hostname);
      const hackChance = ns.hackAnalyzeChance(hostname);

      // Calculate efficiency score
      const expectedMoney = Math.max(currentMoney, maxMoney * 0.5); // Conservative estimate
      const timeToHack = Math.max(hackTime, growTime, weakenTime);
      const moneyPerSecond = (expectedMoney * hackChance) / (timeToHack / 1000);
      const efficiencyScore = moneyPerSecond * hackChance * (1 / Math.max(hackLevel / playerHackLevel, 0.1));

      const isOptimal = currentMoneyRatio >= config.moneyOptimalRatio &&
        securityLevel <= minSecurityLevel + config.securityOptimalThreshold;

      return {
        hostname,
        hackLevel,
        maxMoney,
        currentMoney,
        currentMoneyRatio,
        securityLevel,
        minSecurityLevel,
        hackTime,
        growTime,
        weakenTime,
        hackChance,
        efficiencyScore,
        moneyPerSecond,
        isOptimal
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Performance Analysis Utilities
   */
  static updatePerformanceMetrics(
    performanceMetrics: PerformanceMetrics,
    stats: BatchStats,
    serverPerformance: Map<string, ServerPerformance>
  ): void {
    const now = Date.now();
    const runtime = (now - performanceMetrics.startTime) / 1000; // seconds
    const runtimeHours = runtime / 3600;

    if (runtimeHours > 0) {
      performanceMetrics.moneyPerHour = stats.totalMoneyGained / runtimeHours;
      performanceMetrics.batchesPerHour = stats.batchesCompleted / runtimeHours;
    }

    if (stats.batchesCompleted > 0) {
      performanceMetrics.averageBatchValue = stats.totalMoneyGained / stats.batchesCompleted;
      performanceMetrics.successRate = stats.batchesCompleted / stats.batchesSent;
    }

    // Find top performing server
    let topServer = '';
    let topEfficiency = 0;
    for (const [hostname, performance] of serverPerformance) {
      if (performance.efficiencyScore > topEfficiency) {
        topEfficiency = performance.efficiencyScore;
        topServer = hostname;
      }
    }
    performanceMetrics.topServer = topServer;
  }

  /**
   * Resource Calculation Utilities
   */
  static calculateHWGWThreads(ns: NS, target: string, batchSize: number, config: BotnetConfiguration): {
    hackThreads: number,
    growThreads: number,
    weakenHackThreads: number,
    weakenGrowThreads: number
  } {
    const hackThreads = Math.max(1, Math.floor(batchSize * config.hackPercentage));

    const moneyStolen = ns.hackAnalyze(target) * hackThreads;
    const growthNeeded = 1 / (1 - moneyStolen);
    const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, growthNeeded * config.growthBufferMultiplier)));

    const hackSecurityIncrease = hackThreads * config.weakenHackSecurityIncrease;
    const growSecurityIncrease = growThreads * config.weakenGrowSecurityIncrease;
    const weakenHackThreads = Math.ceil(hackSecurityIncrease / config.weakenSecurityDecrease);
    const weakenGrowThreads = Math.ceil(growSecurityIncrease / config.weakenSecurityDecrease);

    return { hackThreads, growThreads, weakenHackThreads, weakenGrowThreads };
  }

  /**
   * Server Resource Management
   */
  static getAvailableRAM(ns: NS, hostname: string): number {
    const totalRAM = ns.getServerMaxRam(hostname);
    const usedRAM = ns.getServerUsedRam(hostname);
    return Math.max(0, totalRAM - usedRAM);
  }

  static findBestExecutionServer(ns: NS): string {
    const servers = BotnetUtilities.getAllServers(ns).filter(s => ns.hasRootAccess(s));

    let bestServer = 'home';
    let bestRAM = BotnetUtilities.getAvailableRAM(ns, 'home');

    for (const server of servers) {
      const availableRAM = BotnetUtilities.getAvailableRAM(ns, server);
      if (availableRAM > bestRAM) {
        bestRAM = availableRAM;
        bestServer = server;
      }
    }

    return bestServer;
  }

  /**
   * Professional HWGW Timing Calculation (Alain's backward scheduling approach)
   * Works backwards from desired completion times to ensure perfect coordination
   */
  static calculateProfessionalTiming(ns: NS, target: string, config: BotnetConfiguration, startTime: number): {
    hackTime: number,
    growTime: number,
    weakenTime: number,
    batchDuration: number,
    hackStartDelay: number,
    growStartDelay: number,
    weakenHackStartDelay: number,
    weakenGrowStartDelay: number,
    hackEnd: number,
    growEnd: number,
    weakenHackEnd: number,
    weakenGrowEnd: number
  } {
    const hackTime = ns.getHackTime(target);
    const growTime = ns.getGrowTime(target);
    const weakenTime = ns.getWeakenTime(target);
    
    const slowestTool = Math.max(hackTime, growTime, weakenTime);
    const delayInterval = config.baseTimeDelay; // 250ms spacing between operations
    
    // BACKWARD SCHEDULING: Calculate completion times first, then work backwards to start times
    // Operations should complete in this order: Hack → WeakenHack → Grow → WeakenGrow
    const baseCompletionTime = startTime + slowestTool;
    
    const weakenGrowEnd = baseCompletionTime + delayInterval * 3; // Final operation
    const growEnd = weakenGrowEnd - delayInterval; // Grow completes before final weaken
    const weakenHackEnd = growEnd - delayInterval; // First weaken completes before grow
    const hackEnd = weakenHackEnd - delayInterval; // Hack completes first
    
    // Calculate START times by subtracting execution duration from END times
    const weakenGrowStartDelay = Math.max(0, (weakenGrowEnd - startTime) - weakenTime);
    const growStartDelay = Math.max(0, (growEnd - startTime) - growTime);
    const weakenHackStartDelay = Math.max(0, (weakenHackEnd - startTime) - weakenTime);
    const hackStartDelay = Math.max(0, (hackEnd - startTime) - hackTime);
    
    return {
      hackTime,
      growTime,
      weakenTime,
      batchDuration: weakenGrowEnd - startTime,
      hackStartDelay,
      growStartDelay,
      weakenHackStartDelay,
      weakenGrowStartDelay,
      hackEnd,
      growEnd,
      weakenHackEnd,
      weakenGrowEnd
    };
  }
}

class UtilizationTracker {
  private utilizationHistory: number[] = [];
  private lowUtilizationIterations = 0;
  private highUtilizationIterations = 0;
  private maxTargets = 2;
  private recoveryThreadPadding = 1.0;

  private readonly MAX_UTILIZATION = 0.95;
  private readonly LOW_UTILIZATION_THRESHOLD = 0.80;

  constructor(private logger: Logger) {}

  updateUtilization(currentUtilization: number): void {
    this.utilizationHistory.push(currentUtilization);
    
    // Keep only recent history
    if (this.utilizationHistory.length > 100) {
      this.utilizationHistory = this.utilizationHistory.slice(-50);
    }
    
    if (currentUtilization >= this.MAX_UTILIZATION) {
      this.highUtilizationIterations++;
      this.lowUtilizationIterations = 0;
    } else if (currentUtilization <= this.LOW_UTILIZATION_THRESHOLD) {
      this.lowUtilizationIterations++;
      this.highUtilizationIterations = 0;
    } else {
      this.lowUtilizationIterations = 0;
      this.highUtilizationIterations = 0;
    }
    
    this.adjustParameters();
  }
  
  private adjustParameters(): void {
    // Scale up when consistently underutilized (like Alain's approach)
    if (this.lowUtilizationIterations > 5) {
      if (this.maxTargets < 20) { // Reasonable upper limit
        this.maxTargets++;
        this.logger.info(`📈 Increased max targets to ${this.maxTargets} due to low utilization`);
      } else if (this.recoveryThreadPadding < 10) {
        this.recoveryThreadPadding *= 1.5;
        this.logger.info(`📈 Increased recovery thread padding to ${this.recoveryThreadPadding.toFixed(1)}`);
      }
      this.lowUtilizationIterations = 0;
    }
    
    // Scale down when consistently over-utilized
    if (this.highUtilizationIterations > 60) {
      if (this.maxTargets > 1) {
        this.maxTargets--;
        this.logger.warn(`📉 Decreased max targets to ${this.maxTargets} due to high utilization`);
      }
      this.highUtilizationIterations = 0;
    }
  }
  
  getMaxTargets(): number { return this.maxTargets; }
  getRecoveryThreadPadding(): number { return this.recoveryThreadPadding; }
  getCurrentUtilization(): number {
    return this.utilizationHistory.length > 0 ? this.utilizationHistory[this.utilizationHistory.length - 1] : 0;
  }
}

class ProfessionalWaveScheduler {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;
  private activeBatches: Map<string, BatchTracker>;
  private serverPerformance: Map<string, ServerPerformance>;
  private stats: BatchStats;
  private scheduledBatches: ScheduledBatch[];

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    activeBatches: Map<string, BatchTracker>,
    serverPerformance: Map<string, ServerPerformance>,
    stats: BatchStats
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.activeBatches = activeBatches;
    this.serverPerformance = serverPerformance;
    this.stats = stats;
    this.scheduledBatches = [];
  }

  /**
   * Schedule overlapping HWGW batches using Alain's professional approach
   * Returns number of batches successfully scheduled
   */
  async scheduleWaveSequence(target: string): Promise<number> {
    const now = Date.now();
    const maxConcurrent = Math.min(this.config.maxBatches, this.calculateMaxConcurrentBatches(target));
    
    let cyclesScheduled = 0;
    let lastBatchStart: number | null = null;
    let firstBatchEnd: number | null = null;
    
    // Clear old scheduled batches
    this.scheduledBatches = [];
    
    while (cyclesScheduled < maxConcurrent) {
      const batchStartTime: number = (cyclesScheduled === 0) ? 
        now + this.config.queueDelay : 
        lastBatchStart! + this.config.cycleTimingDelay;
      
      const timing = BotnetUtilities.calculateProfessionalTiming(this.ns, target, this.config, batchStartTime);
      
      // Prevent timing conflicts - stop if batches would interfere
      if (firstBatchEnd === null) {
        firstBatchEnd = timing.hackEnd;
      }
      
      const lastOperationStart = Math.max(
        batchStartTime + timing.hackStartDelay,
        batchStartTime + timing.growStartDelay,
        batchStartTime + timing.weakenHackStartDelay,
        batchStartTime + timing.weakenGrowStartDelay
      );
      
      if (cyclesScheduled > 0 && lastOperationStart >= firstBatchEnd) {
        this.logger.debug(`Stopped scheduling at ${cyclesScheduled} batches to prevent timing conflicts`);
        break;
      }
      
      // Create and validate batch
      const batch = await this.createWaveBatch(target, timing, cyclesScheduled, batchStartTime);
      if (!batch) {
        this.logger.debug(`Failed to create batch ${cyclesScheduled} - insufficient resources`);
        break;
      }
      
      // Launch the batch
      if (await this.launchWaveBatch(batch)) {
        this.scheduledBatches.push(batch);
        cyclesScheduled++;
        lastBatchStart = batchStartTime;
        
        this.logger.debug(`Scheduled wave batch ${cyclesScheduled}: ${target} at +${batchStartTime - now}ms`);
      } else {
        this.logger.debug(`Failed to launch batch ${cyclesScheduled}`);
        break;
      }
    }
    
    this.logger.info(`Scheduled ${cyclesScheduled} overlapping batches for ${target}`);
    return cyclesScheduled;
  }

  private calculateMaxConcurrentBatches(target: string): number {
    const hackTime = this.ns.getHackTime(target);
    const batchDuration = this.ns.getWeakenTime(target) + (this.config.baseTimeDelay * 3);
    
    // More concurrent batches for faster servers
    const maxByTiming = Math.floor(batchDuration / this.config.cycleTimingDelay);
    
    // Constrain by RAM availability (rough estimate)
    const ramPerBatch = this.estimateBatchRAMCost(target);
    const totalAvailableRAM = this.calculateAvailableRAM();
    const maxByRAM = Math.floor(totalAvailableRAM / ramPerBatch);
    
    return Math.min(maxByTiming, maxByRAM, this.config.maxBatches);
  }

  private async createWaveBatch(target: string, timing: any, batchNumber: number, startTime: number): Promise<ScheduledBatch | null> {
    const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, this.config.batchSize, this.config);
    const ramNeeded = this.estimateBatchRAMCost(target);
    
    if (!this.canAllocateRAM(ramNeeded)) {
      return null;
    }
    
    return {
      batchNumber,
      target,
      startTime,
      timing,
      threadCounts: {
        hack: threads.hackThreads,
        weakenHack: threads.weakenHackThreads,
        grow: threads.growThreads,
        weakenGrow: threads.weakenGrowThreads
      },
      ramAllocated: ramNeeded,
      expectedIncome: this.ns.getServerMaxMoney(target) * this.config.hackPercentage
    };
  }

  private async launchWaveBatch(batch: ScheduledBatch): Promise<boolean> {
    // Use original batch ID format that works with event processing: target-timestamp
    const batchId = `${batch.target}-${batch.startTime}`;
    
    // Create BatchTracker record for event processing
    const batchTracker: BatchTracker = {
      id: batchId,
      target: batch.target,
      server: BotnetUtilities.findBestExecutionServer(this.ns),
      startTime: batch.startTime,
      expectedCompletionTime: batch.startTime + batch.timing.batchDuration + 10000, // 10s buffer
      batchSize: this.config.batchSize,
      hackCompleted: false,
      growCompleted: false,
      weakenCompleted: false,
      hackTime: batch.timing.hackTime,
      growTime: batch.timing.growTime,
      weakenTime: batch.timing.weakenTime,
      moneyGained: 0,
      securityReduced: 0,
      efficiency: 0
    };
    
    try {
      // Launch scripts with precise timing - all use same batch ID
      const success = await Promise.all([
        this.launchScript('hk', batch.target, batch.startTime + batch.timing.hackStartDelay, batch.threadCounts.hack, batchId),
        this.launchScript('wk', batch.target, batch.startTime + batch.timing.weakenHackStartDelay, batch.threadCounts.weakenHack, batchId),
        this.launchScript('gr', batch.target, batch.startTime + batch.timing.growStartDelay, batch.threadCounts.grow, batchId),
        this.launchScript('wk', batch.target, batch.startTime + batch.timing.weakenGrowStartDelay, batch.threadCounts.weakenGrow, batchId)
      ]);
      
      if (success.every(s => s)) {
        // Add batch tracker only if all scripts launched successfully
        this.activeBatches.set(batchId, batchTracker);
        this.stats.batchesSent++;
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to launch wave batch: ${error}`);
      return false;
    }
  }

  private async launchScript(scriptType: string, target: string, startTime: number, threads: number, batchId: string): Promise<boolean> {
    if (threads <= 0) return true;
    
    const server = BotnetUtilities.findBestExecutionServer(this.ns);
    if (!server) return false;
    
    const scriptName = `remote/${scriptType}.js`;
    // Remote scripts expect: batchId, delayUntil, unused, unused
    const args = [batchId, startTime, 0, 0];
    
    try {
      const pid = this.ns.exec(scriptName, server, threads, ...args);
      return pid !== 0;
    } catch (error) {
      this.logger.error(`Failed to launch ${scriptType} script: ${error}`);
      return false;
    }
  }

  private estimateBatchRAMCost(target: string): number {
    // Rough estimate: each script type costs ~1.75 GB per thread
    const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, this.config.batchSize, this.config);
    return (threads.hackThreads + threads.weakenHackThreads + threads.growThreads + threads.weakenGrowThreads) * 1.75;
  }

  private calculateAvailableRAM(): number {
    const allServers = BotnetUtilities.getAllServers(this.ns);
    return allServers
      .filter(server => this.ns.hasRootAccess(server))
      .reduce((total, server) => total + (this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server)), 0);
  }

  private canAllocateRAM(ramNeeded: number): boolean {
    return this.calculateAvailableRAM() >= ramNeeded;
  }
}

interface ScheduledBatch {
  batchNumber: number;
  target: string;
  startTime: number;
  timing: any;
  threadCounts: {
    hack: number;
    weakenHack: number;
    grow: number;
    weakenGrow: number;
  };
  ramAllocated: number;
  expectedIncome: number;
}

class BotnetBatchExecutor {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;
  private activeBatches: Map<string, BatchTracker>;
  private serverPerformance: Map<string, ServerPerformance>;
  private activeProcesses: Set<number>;
  private stats: BatchStats;

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    activeBatches: Map<string, BatchTracker>,
    serverPerformance: Map<string, ServerPerformance>,
    stats: BatchStats
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.activeBatches = activeBatches;
    this.serverPerformance = serverPerformance;
    this.activeProcesses = new Set();
    this.stats = stats;
  }

  async executeBatch(target: string, batchSize: number): Promise<boolean> {
    try {
      const server = BotnetUtilities.findBestExecutionServer(this.ns);
      const availableRAM = BotnetUtilities.getAvailableRAM(this.ns, server);

      // Estimate RAM needed for batch (rough calculation)
      const estimatedRAM = batchSize * 4; // Conservative estimate for all scripts
      if (availableRAM < estimatedRAM) {
        return false;
      }

      const timing = BotnetUtilities.calculateProfessionalTiming(this.ns, target, this.config, Date.now());
      const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, batchSize, this.config);

      const batchId = `${target}-${Date.now()}`;
      const batch: BatchTracker = {
        id: batchId,
        target,
        server,
        startTime: Date.now(),
        expectedCompletionTime: Date.now() + timing.batchDuration + this.config.batchTimeoutBuffer,
        batchSize,
        hackCompleted: false,
        growCompleted: false,
        weakenCompleted: false,
        hackTime: timing.hackTime,
        growTime: timing.growTime,
        weakenTime: timing.weakenTime,
        moneyGained: 0,
        securityReduced: 0,
        efficiency: 0
      };

      // Launch all operations with proper timing
      const hackPid = this.ns.exec('/remote/hk.js', server, threads.hackThreads, batchId, timing.hackStartDelay);
      const growPid = this.ns.exec('/remote/gr.js', server, threads.growThreads, batchId, timing.growStartDelay);
      const weakenHackPid = this.ns.exec('/remote/wk.js', server, threads.weakenHackThreads, batchId + '-hack', timing.weakenHackStartDelay);
      const weakenGrowPid = this.ns.exec('/remote/wk.js', server, threads.weakenGrowThreads, batchId + '-grow', timing.weakenGrowStartDelay);

      if (hackPid && growPid && weakenHackPid && weakenGrowPid) {
        this.activeBatches.set(batchId, batch);
        this.activeProcesses.add(hackPid);
        this.activeProcesses.add(growPid);
        this.activeProcesses.add(weakenHackPid);
        this.activeProcesses.add(weakenGrowPid);

        this.stats.batchesSent++;

        // Record server performance
        let serverPerf = this.serverPerformance.get(server);
        if (!serverPerf) {
          serverPerf = {
            hostname: server,
            batchesExecuted: 0,
            batchesCompleted: 0,
            totalMoneyGenerated: 0,
            averageBatchTime: 0,
            successRate: 0,
            lastUsed: Date.now(),
            reliability: 1.0,
            efficiencyScore: 0
          };
          this.serverPerformance.set(server, serverPerf);
        }
        serverPerf.batchesExecuted++;

        const analysis = BotnetUtilities.analyzeTarget(this.ns, target, this.config);
        const efficiency = analysis ? analysis.efficiencyScore : 0;

        this.logger.info(`Launched optimized batch: ${batchId} on ${server} (efficiency: ${efficiency.toFixed(1)})`);
        return true;
      } else {
        this.logger.error(`Failed to launch batch on ${server} - insufficient resources`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Batch execution error: ${error}`);
      return false;
    }
  }

  async cleanupCompletedBatches(): Promise<void> {
    const now = Date.now();
    const completedBatches: string[] = [];
    const timedOutBatches: string[] = [];

    for (const [batchId, batch] of this.activeBatches.entries()) {
      // Check if batch has timed out
      if (now > batch.expectedCompletionTime) {
        timedOutBatches.push(batchId);
        continue;
      }

      // Check if all operations completed
      if (batch.hackCompleted && batch.growCompleted && batch.weakenCompleted) {
        completedBatches.push(batchId);
      }
    }

    // Process completed batches
    for (const batchId of completedBatches) {
      const batch = this.activeBatches.get(batchId);
      if (batch) {
        const batchTime = now - batch.startTime;
        this.stats.batchesCompleted++;
        this.stats.totalMoneyGained += batch.moneyGained;
        this.stats.totalSecurityReduced += batch.securityReduced;

        this.logger.info(`Batch completed: ${batchId} -> $${batch.moneyGained.toLocaleString()} (${(batchTime / 1000).toFixed(1)}s)`);
        this.activeBatches.delete(batchId);
      }
    }

    // Process timed out batches
    for (const batchId of timedOutBatches) {
      const batch = this.activeBatches.get(batchId);
      if (batch) {
        this.stats.batchesFailed++;
        this.logger.warn(`Batch timed out: ${batchId} after ${((now - batch.startTime) / 1000).toFixed(1)}s`);
        this.activeBatches.delete(batchId);
      }
    }
  }
}

class BotnetTargetManager {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;
  private targetPerformance: Map<string, TargetPerformance>;
  private currentTarget: DynamicTarget | null;
  private lastEvaluationTime: number;
  private dynamicBatchSize: number;

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    targetPerformance: Map<string, TargetPerformance>
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.targetPerformance = targetPerformance;
    this.currentTarget = null;
    this.lastEvaluationTime = 0;
    this.dynamicBatchSize = config.batchSize;
  }

  async evaluateAndSelectTarget(): Promise<void> {
    const now = Date.now();

    // Only evaluate periodically to avoid excessive overhead
    if (now - this.lastEvaluationTime < this.config.targetEvaluationInterval) {
      return;
    }

    this.lastEvaluationTime = now;

    const servers = BotnetUtilities.getAllServers(this.ns);
    const candidates: DynamicTarget[] = [];

    // Analyze all potential targets
    for (const hostname of servers) {
      const analysis = BotnetUtilities.analyzeTarget(this.ns, hostname, this.config);
      if (analysis) {
        candidates.push({
          hostname,
          analysis,
          lastEvaluated: now
        });
      }
    }

    // Sort by efficiency score
    candidates.sort((a, b) => b.analysis.efficiencyScore - a.analysis.efficiencyScore);

    if (candidates.length === 0) {
      this.logger.warn('No viable targets found');
      return;
    }

    const bestCandidate = candidates[0];

    // Check if we should switch targets
    if (this.shouldSwitchTarget(bestCandidate)) {
      const oldTarget = this.currentTarget?.hostname || 'none';
      this.currentTarget = bestCandidate;

      // Update dynamic batch size based on target
      this.updateDynamicBatchSize(bestCandidate.analysis);

      if (oldTarget !== bestCandidate.hostname) {
        const switchReason = this.getTargetSwitchReason(bestCandidate);
        this.logger.info(`🎯 TARGET SWITCH: ${oldTarget} → ${bestCandidate.hostname}`);
        this.logger.info(`   Reason: ${switchReason}`);
        this.logger.info(`   New target efficiency: ${bestCandidate.analysis.efficiencyScore.toFixed(1)}`);
        this.logger.info(`   Optimal batch size: ${this.dynamicBatchSize}`);
        this.logger.info(`   Money ratio: ${(bestCandidate.analysis.currentMoneyRatio * 100).toFixed(1)}% | Security: ${bestCandidate.analysis.securityLevel.toFixed(1)}/${bestCandidate.analysis.minSecurityLevel.toFixed(1)}`);
      }
    }
  }

  private shouldSwitchTarget(candidate: DynamicTarget): boolean {
    if (!this.currentTarget) return true;

    const currentEfficiency = this.currentTarget.analysis.efficiencyScore;
    const candidateEfficiency = candidate.analysis.efficiencyScore;

    // Switch if candidate is significantly better
    if (candidateEfficiency > currentEfficiency * this.config.targetImprovementThreshold) {
      return true;
    }

    // Switch if current target efficiency has dropped significantly
    const currentAnalysis = BotnetUtilities.analyzeTarget(this.ns, this.currentTarget.hostname, this.config);
    if (currentAnalysis && currentAnalysis.efficiencyScore < currentEfficiency * this.config.targetEfficiencyDropThreshold) {
      return true;
    }

    // Switch if current target is money depleted
    if (this.currentTarget.analysis.currentMoneyRatio < this.config.targetMoneyDepletedThreshold) {
      return true;
    }

    return false;
  }

  private getTargetSwitchReason(newTarget: DynamicTarget): string {
    if (!this.currentTarget) return 'initial target selection';

    const currentAnalysis = BotnetUtilities.analyzeTarget(this.ns, this.currentTarget.hostname, this.config);
    if (!currentAnalysis) return 'previous target became invalid';

    const efficiencyRatio = currentAnalysis.efficiencyScore / this.currentTarget.analysis.efficiencyScore;
    const newEfficiencyRatio = newTarget.analysis.efficiencyScore / this.currentTarget.analysis.efficiencyScore;

    if (efficiencyRatio < this.config.targetEfficiencyDropThreshold) {
      return `efficiency dropped to ${(efficiencyRatio * 100).toFixed(1)}% of best`;
    }

    if (newEfficiencyRatio > this.config.targetImprovementThreshold) {
      return `new target ${(newEfficiencyRatio * 100).toFixed(1)}% more efficient`;
    }

    if (this.currentTarget.analysis.currentMoneyRatio < this.config.targetMoneyDepletedThreshold) {
      return `money depleted (${(this.currentTarget.analysis.currentMoneyRatio * 100).toFixed(1)}%)`;
    }

    return 'optimization opportunity';
  }

  private updateDynamicBatchSize(analysis: DynamicTargetAnalysis): void {
    // Calculate dynamic batch size based on target characteristics
    let sizeFactor = 1.0;

    // Adjust for hack chance
    sizeFactor *= Math.max(0.5, analysis.hackChance);

    // Adjust for money availability
    sizeFactor *= Math.max(0.5, analysis.currentMoneyRatio);

    // Adjust for efficiency
    const avgEfficiency = 10000; // Rough baseline
    sizeFactor *= Math.max(0.5, Math.min(2.0, analysis.efficiencyScore / avgEfficiency));

    const newSize = Math.round(this.config.batchSize * sizeFactor * this.config.dynamicBatchSizeMultiplier);
    this.dynamicBatchSize = Math.max(
      this.config.dynamicBatchSizeMin,
      Math.min(this.config.dynamicBatchSizeMax, newSize)
    );
  }

  getCurrentTarget(): string {
    return this.currentTarget?.hostname || this.config.targetServer || 'phantasy';
  }

  getCurrentTargetAnalysis(): DynamicTargetAnalysis | null {
    return this.currentTarget?.analysis || null;
  }

  getDynamicBatchSize(): number {
    return this.dynamicBatchSize;
  }
}

class BotnetEventProcessor {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;
  private activeBatches: Map<string, BatchTracker>;
  private eventQueue: BatchEvent[];
  private stats: BatchStats;

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    activeBatches: Map<string, BatchTracker>,
    stats: BatchStats
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.activeBatches = activeBatches;
    this.eventQueue = [];
    this.stats = stats;
  }

  async processEvents(): Promise<void> {
    let eventsProcessed = 0;
    this.stats.eventsThisCycle = 0;

    // Read real events from port 20 (published by remote scripts)
    const port = this.ns.getPortHandle(20);
    let eventsRead = 0;
    while (!port.empty() && eventsProcessed < this.config.maxEventsPerCycle) {
      const rawEvent = port.read() as string;
      this.logger.debug(`Raw event received: ${rawEvent}`);
      const event = this.parseEvent(rawEvent);
      if (event) {
        this.eventQueue.push(event);
        eventsRead++;
        this.logger.debug(`Parsed event: ${event.type} for ${event.batchId} with value ${event.value}`);
      }
    }

    if (eventsRead > 0) {
      this.logger.info(`Read ${eventsRead} events from port 20`);
    }

    // Process a limited number of events per cycle to maintain performance
    while (this.eventQueue.length > 0 && eventsProcessed < this.config.maxEventsPerCycle) {
      const event = this.eventQueue.shift()!;
      await this.handleEvent(event);
      eventsProcessed++;
      this.stats.eventsThisCycle++;
    }

    // Update recent activity indicator
    if (eventsProcessed > 0) {
      this.stats.lastEventTime = Date.now();
      this.stats.recentActivity = `Processed ${eventsProcessed} events`;
    } else if (Date.now() - this.stats.lastEventTime > 30000) {
      this.stats.recentActivity = 'No recent activity (30s+)';
    }
  }

  private parseEvent(rawEvent: string): BatchEvent | null {
    try {
      const parts = rawEvent.split('|');
      if (parts.length !== 4) {
        this.logger.warn(`Invalid event format: ${rawEvent}`);
        return null;
      }

      const [eventType, batchId, resultStr, threadsStr] = parts;
      const result = parseFloat(resultStr);
      const threads = parseInt(threadsStr);

      // Extract target from batchId (format: target-timestamp)
      const target = batchId.split('-')[0];

      // Determine event type and success based on event type string
      let type: 'hack' | 'grow' | 'weaken';
      let success = true;

      if (eventType.endsWith('_failed')) {
        success = false;
        type = eventType.replace('_failed', '') as 'hack' | 'grow' | 'weaken';
      } else if (eventType.endsWith('_done')) {
        type = eventType.replace('_done', '') as 'hack' | 'grow' | 'weaken';
      } else {
        this.logger.warn(`Unknown event type: ${eventType}`);
        return null;
      }

      return {
        type,
        batchId,
        timestamp: Date.now(),
        threads,
        success,
        value: result,
        server: '', // Will be filled by handleEvent if needed
        target
      };
    } catch (error) {
      this.logger.warn(`Failed to parse event: ${rawEvent} - ${error}`);
      return null;
    }
  }

  private async handleEvent(event: BatchEvent): Promise<void> {
    const batch = this.activeBatches.get(event.batchId);
    if (!batch) {
      // Debug batch tracking issue - show what batches we have
      const activeBatchIds = Array.from(this.activeBatches.keys());
      this.logger.debug(`No batch found for event: ${event.batchId}`);
      this.logger.debug(`Active batches (${activeBatchIds.length}): ${activeBatchIds.slice(0, 3).join(', ')}${activeBatchIds.length > 3 ? '...' : ''}`);
      return;
    }

    switch (event.type) {
      case 'hack':
        batch.hackCompleted = true;
        batch.moneyGained += event.value;
        this.stats.hacksCompleted++;
        this.stats.totalMoneyGained += event.value;
        this.logger.info(`Hack completed: ${event.target} -> $${event.value.toFixed(3)} (${event.threads} threads)`);
        break;

      case 'grow':
        batch.growCompleted = true;
        this.stats.growsCompleted++;
        this.logger.info(`Grow completed: ${event.target} -> ${event.value.toFixed(2)}x (${event.threads} threads)`);
        break;

      case 'weaken':
        batch.weakenCompleted = true;
        batch.securityReduced += event.value;
        this.stats.weakensCompleted++;
        this.stats.totalSecurityReduced += event.value;
        this.logger.info(`Weaken completed: ${event.target} -> -${event.value.toFixed(2)} security (${event.threads} threads)`);
        break;
    }
  }
}

// ===== MAIN CONTROLLER =====
// ===== MAIN CONTROLLER =====

class BotnetController {
  private ns: NS;
  private logger: Logger;
  private config: BotnetConfiguration;

  // Core modules
  private performanceTracker: BotnetPerformanceTracker;
  private targetManager: BotnetTargetManager;
  private batchExecutor: BotnetBatchExecutor;
  private eventProcessor: BotnetEventProcessor;
  private waveScheduler: ProfessionalWaveScheduler;
  private utilizationTracker: UtilizationTracker;

  // Shared state
  private activeBatches: Map<string, BatchTracker>;
  private serverPerformance: Map<string, ServerPerformance>;
  private targetPerformance: Map<string, TargetPerformance>;
  private performanceMetrics: PerformanceMetrics;
  private stats: BatchStats;

  // Timing
  private lastBatchTime: number;
  private isShuttingDown: boolean;

  constructor(ns: NS, debugMode: boolean = false) {
    this.ns = ns;
    this.config = { ...DEFAULT_BOTNET_CONFIG };

    // Clear any existing logger instances to ensure fresh configuration
    Logger.clearInstances();

    // Set up logger with debug mode if requested
    const logLevel = debugMode ? LogLevel.DEBUG : this.config.logLevel;
    const enableConsole = debugMode; // Enable console output in debug mode
    this.logger = Logger.getInstance(this.ns, 'BOTNET', {
      level: logLevel,
      enableConsole: enableConsole,
      enableFile: true
    });

    // Initialize shared state
    this.activeBatches = new Map();
    this.serverPerformance = new Map();
    this.targetPerformance = new Map();
    this.lastBatchTime = 0;
    this.isShuttingDown = false;

    this.performanceMetrics = {
      startTime: Date.now(),
      moneyPerHour: 0,
      batchesPerHour: 0,
      averageBatchTime: 0,
      averageBatchValue: 0,
      successRate: 0,
      topServer: '',
      topTarget: '',
      systemEfficiency: 0,
      resourceUtilization: 0
    };

    this.stats = {
      totalMoneyGained: 0,
      totalSecurityReduced: 0,
      batchesSent: 0,
      batchesCompleted: 0,
      batchesFailed: 0,
      hacksCompleted: 0,
      growsCompleted: 0,
      weakensCompleted: 0,
      lastEventTime: Date.now(),
      eventsThisCycle: 0,
      recentActivity: 'Initializing...'
    };

    // Initialize core modules
    this.performanceTracker = new BotnetPerformanceTracker(
      ns, this.logger, this.config, this.performanceMetrics,
      this.serverPerformance, this.targetPerformance, this.activeBatches, this.stats
    );

    this.targetManager = new BotnetTargetManager(
      ns, this.logger, this.config, this.targetPerformance
    );

    this.batchExecutor = new BotnetBatchExecutor(
      ns, this.logger, this.config, this.activeBatches, this.serverPerformance, this.stats
    );

    this.eventProcessor = new BotnetEventProcessor(
      ns, this.logger, this.config, this.activeBatches, this.stats
    );

    this.waveScheduler = new ProfessionalWaveScheduler(
      ns, this.logger, this.config, this.activeBatches, this.serverPerformance, this.stats
    );

    this.utilizationTracker = new UtilizationTracker(this.logger);

    // Log debug mode status
    if (debugMode) {
      this.logger.debug('🔍 DEBUG MODE ENABLED - Enhanced logging active');
    }
  }

  async run(): Promise<void> {
    this.logger.info('Botnet Performance Edition initializing...');
    this.logger.info('=== BOTNET PERFORMANCE EDITION ===');

    // Initialize target if not set
    if (!this.config.targetServer) {
      await this.targetManager.evaluateAndSelectTarget();
    }

    const target = this.targetManager.getCurrentTarget();
    this.logger.info(`🚀 Professional Wave System Initialized`);
    this.logger.info(`Target: ${target}, Max Batches: ${this.config.maxBatches}, Cycle Delay: ${this.config.cycleTimingDelay}ms`);

    // Main operation loop
    while (true) {
      try {
        // Process events from completed operations
        await this.eventProcessor.processEvents();

        // Clean up completed batches
        await this.batchExecutor.cleanupCompletedBatches();

        // Evaluate and potentially switch targets
        await this.targetManager.evaluateAndSelectTarget();

        // Launch new batches using professional wave scheduling
        const now = Date.now();
        const canLaunchWave = this.activeBatches.size < this.config.maxBatches &&
          (now - this.lastBatchTime) >= this.config.cycleTimingDelay;

        if (canLaunchWave) {
          const currentTarget = this.targetManager.getCurrentTarget();
          const batchesScheduled = await this.waveScheduler.scheduleWaveSequence(currentTarget);
          
          if (batchesScheduled > 0) {
            this.lastBatchTime = now;
            this.logger.info(`🌊 Launched ${batchesScheduled} overlapping batches for ${currentTarget}`);
          }
        }

        // Update performance metrics and utilization tracking
        await this.performanceTracker.updatePerformanceMetrics();
        
        // Update utilization tracking (like Alain's approach)
        const utilization = this.calculateNetworkUtilization();
        this.utilizationTracker.updateUtilization(utilization);
        
        // Update max batches based on utilization
        const maxTargetsFromUtilization = this.utilizationTracker.getMaxTargets();
        this.config.maxBatches = Math.min(40, maxTargetsFromUtilization * 5); // Allow ~5 batches per target

        // Show dashboard
        await this.performanceTracker.showDashboard(this.targetManager);

        // Wait before next cycle
        await this.ns.sleep(this.config.mainLoopDelay);

      } catch (error) {
        this.logger.error(`Main loop error: ${error}`);
        await this.ns.sleep(this.config.mainLoopDelay * 2); // Longer delay on error
      }
    }
  }

  /**
   * Calculate current network RAM utilization (like Alain's approach)
   */
  private calculateNetworkUtilization(): number {
    const allServers = BotnetUtilities.getAllServers(this.ns);
    let totalMaxRam = 0;
    let totalUsedRam = 0;
    
    for (const server of allServers) {
      if (this.ns.hasRootAccess(server)) {
        const maxRam = this.ns.getServerMaxRam(server);
        const usedRam = this.ns.getServerUsedRam(server);
        totalMaxRam += maxRam;
        totalUsedRam += usedRam;
      }
    }
    
    return totalMaxRam > 0 ? totalUsedRam / totalMaxRam : 0;
  }
}

// ===== MAIN FUNCTION =====

export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL');

  // Check for debug flag
  const debugMode = ns.args.includes('--debug') || ns.args.includes('-d');

  // Check for cleanup flag
  if (ns.args.includes('--cleanup') || ns.args.includes('-c') || ns.args.includes('--clean')) {
    cleanupRemoteScriptsSync(ns);
    return;
  }

  const controller = new BotnetController(ns, debugMode);

  // Register cleanup function to run when script exits
  ns.atExit(() => {
    ns.tprint('🛑 Botnet script terminating - cleaning up remote scripts...');
    cleanupRemoteScriptsSync(ns);
  });

  await controller.run();
}

// Synchronous cleanup function for ns.atExit()
function cleanupRemoteScriptsSync(ns: NS): void {
  // Get all servers recursively
  const allServers = getAllServers(ns);
  const purchasedServers = ns.getPurchasedServers();
  const servers = [...new Set([...allServers, ...purchasedServers])]; // Remove duplicates

  let killedCount = 0;
  let totalScanned = 0;
  const remoteScripts = ['remote/hk.js', 'remote/gr.js', 'remote/wk.js'];

  ns.tprint(`🔍 Scanning ${servers.length} servers for remote scripts...`);

  for (const server of servers) {
    if (ns.hasRootAccess(server)) {
      totalScanned++;

      // Get all running scripts on this server for debugging
      const runningScripts = ns.ps(server);
      const botnetScripts = runningScripts.filter(script =>
        script.filename.includes('remote/hk.js') ||
        script.filename.includes('remote/gr.js') ||
        script.filename.includes('remote/wk.js')
      );

      if (botnetScripts.length > 0) {
        ns.tprint(`📋 ${server}: Found ${botnetScripts.length} botnet scripts to kill`);
        for (const script of botnetScripts) {
          // Kill by PID instead of filename to avoid argument matching issues
          const success = ns.kill(script.pid);
          if (success) {
            killedCount++;
            ns.tprint(`🔴 Killed ${script.filename} (PID: ${script.pid}) on ${server}`);
          } else {
            ns.tprint(`❌ Failed to kill ${script.filename} (PID: ${script.pid}) on ${server}`);
          }
        }
      }
    }
  }

  ns.tprint(`🧹 Exit cleanup complete: ${killedCount} remote scripts terminated from ${totalScanned} accessible servers`);
}

// Recursive function to get all servers in the network
function getAllServers(ns: NS): string[] {
  const visited = new Set<string>();
  const servers: string[] = [];

  function scanRecursive(hostname: string) {
    if (visited.has(hostname)) return;
    visited.add(hostname);
    servers.push(hostname);

    const connected = ns.scan(hostname);
    for (const server of connected) {
      scanRecursive(server);
    }
  }

  scanRecursive('home');
  return servers;
}