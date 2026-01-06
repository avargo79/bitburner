import { NS } from '@ns';
import { Logger, LogLevel } from '/lib/logger';

/**
 * Check if botnet script prerequisites are met
 * @param {NS} ns - Netscript API
 * @returns {{ready: boolean, reason?: string}} Prerequisite check result
 */
export function checkPrerequisites(ns: NS): { ready: boolean; reason?: string } {
    // Check home RAM (need at least 64GB)
    const homeServer = ns.getServer('home');
    const homeRAM = homeServer.maxRam;
    
    if (homeRAM < 64) {
        return { ready: false, reason: `Insufficient home RAM (need 64GB, have ${homeRAM}GB)` };
    }
    
    // Check total network RAM
    const servers = getAllServersForPrereq(ns);
    let totalRAM = 0;
    
    for (const hostname of servers) {
        const server = ns.getServer(hostname);
        if (server.hasAdminRights && server.maxRam > 0) {
            totalRAM += server.maxRam;
        }
    }
    
    if (totalRAM < 100) {
        return { ready: false, reason: `Insufficient total network RAM (need 100GB, have ${totalRAM.toFixed(0)}GB)` };
    }
    
    return { ready: true };
}

/**
 * Get all servers in the network (for prerequisite check)
 */
function getAllServersForPrereq(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        const neighbors = ns.scan(current);
        queue.push(...neighbors.filter(n => !visited.has(n)));
    }
    
    return Array.from(visited);
}

/**
 * Botnet: Performance-Optimized Event-Driven HWGW System
 * Advanced performance tracking, smart resource allocation, and real-time dashboard
 */

// ===== HARDCODED CONSTANTS =====
// Mathematical values that shouldn't be configurable (previously over-parameterized)

// HWGW Mathematical Constants
const HACK_PERCENTAGE = 0.05;                    // Hack 5% of server money per batch
const GROWTH_BUFFER_MULTIPLIER = 1.1;           // 10% buffer for grow calculations
const SECURITY_OPTIMAL_THRESHOLD = 5.0;         // Max security above minimum before prep
const MONEY_OPTIMAL_RATIO = 0.75;               // Minimum money ratio for optimal hacking
const WEAKEN_HACK_SECURITY_INCREASE = 0.002;    // Security increase per hack thread
const WEAKEN_GROW_SECURITY_INCREASE = 0.004;    // Security increase per grow thread  
const WEAKEN_SECURITY_DECREASE = 0.05;          // Security decrease per weaken thread

// Timing Constants
const QUEUE_DELAY = 200;                         // Delay before first script begins (ms)
const BASE_TIME_DELAY = 250;                     // Fine-tuning delay for operation spacing (ms)
const BATCH_TIMEOUT_BUFFER = 10000;              // Extra time before considering batch failed (ms)

// Batch Sizing Constants  
const BASE_BATCH_SIZE = 50;                      // Base batch size for calculations
const DYNAMIC_BATCH_SIZE_MIN = 25;               // Minimum batch size
const DYNAMIC_BATCH_SIZE_MAX = 500;              // Maximum batch size for massive RAM
const DYNAMIC_BATCH_SIZE_MULTIPLIER = 1.5;      // Multiplier for dynamic sizing

// Target Management Constants
const TARGET_MONEY_DEPLETED_THRESHOLD = 0.1;    // Switch when target money < 10%
const TARGET_IMPROVEMENT_THRESHOLD = 1.3;       // Switch when new target 30% better

// Recovery Constants
const RECOVERY_THREAD_PADDING = 1.0;            // Thread multiplier for recovery operations

// ===== INTERFACE DEFINITIONS =====

// Simplified Configuration Interface (12 essential parameters instead of 44)
interface BotnetConfiguration {
  // Core Performance (4 parameters)
  maxBatches: number;              // Maximum overlapping batches (was 400)
  maxRAMUtilization: number;       // RAM usage limit (was 0.8)
  cycleTimingDelay: number;        // Interval between batch starts (was 1000ms)
  maxEventsPerCycle: number;       // Events processed per cycle (was 100)

  // Target Management (4 parameters)  
  targetServer: string;            // Target server hostname
  minTargetMoney: number;          // Minimum money required for targets
  targetEvaluationInterval: number; // How often to re-evaluate targets
  targetEfficiencyDropThreshold: number; // When to switch targets

  // System Behavior (4 parameters)
  mainLoopDelay: number;           // Main loop sleep time (was 100ms)
  dashboardInterval: number;       // Dashboard update frequency (was 5000ms)
  displayDashboard: boolean;       // Show performance dashboard
  logLevel: LogLevel;              // Logging verbosity
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
  type: 'hack' | 'grow' | 'weaken' | 'share';
  batchId: string;
  timestamp: number;
  threads: number;
  success: boolean;
  value: number; // money for hack, multiplier for grow, security for weaken, threads for share
  server: string;
  target: string;
  shareEvent?: 'share_started' | 'share_completed' | 'share_update'; // Optional field for share event type
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

// Simplified Configuration (12 essential parameters instead of 44)
const DEFAULT_BOTNET_CONFIG: BotnetConfiguration = {
  // Core Performance (4 parameters)
  maxBatches: 400,                  // Maximum overlapping batches
  maxRAMUtilization: 0.8,           // Use 80% of available RAM
  cycleTimingDelay: 1000,           // 1s interval between batch starts
  maxEventsPerCycle: 500,           // Events processed per cycle (increased from 100 to prevent backlog)

  // Target Management (4 parameters)
  targetServer: '',                 // Target server hostname (empty = auto-select)
  minTargetMoney: 1000000,          // Minimum money required for targets
  targetEvaluationInterval: 30000,  // Re-evaluate targets every 30s
  targetEfficiencyDropThreshold: 0.4, // Switch targets when efficiency drops 60%

  // System Behavior (4 parameters)
  mainLoopDelay: 100,               // Main loop sleep time (100ms for fast execution)
  dashboardInterval: 5000,          // Dashboard update every 5s
  displayDashboard: true,           // Show performance dashboard
  logLevel: LogLevel.CRITICAL       // Only show critical messages
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

  async showDashboard(targetManager: BotnetTargetManager, dynamicMaxBatches?: number, eventQueueSize?: number): Promise<void> {
    const now = Date.now();

    // Show dashboard every cycle when interval is reached
    const shouldShow = now % this.config.dashboardInterval < this.config.mainLoopDelay * 3;

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

      // Calculate network resource metrics
      const networkStats = this.calculateNetworkStats();
      const threadDistribution = this.calculateThreadDistribution();

      // Use dynamic batch count if provided, otherwise fall back to config
      const maxBatches = dynamicMaxBatches || this.config.maxBatches;
      const isScalingDynamic = dynamicMaxBatches && dynamicMaxBatches !== this.config.maxBatches;
      const batchCapacityText = isScalingDynamic ?
        `${this.activeBatches.size}/${maxBatches} (base: ${this.config.maxBatches})` :
        `${this.activeBatches.size}/${maxBatches}`;

      this.ns.print('┌─ BOTNET PERFORMANCE DASHBOARD');
      this.ns.print(this.formatDashboardLine(`Runtime: ${uptime.toFixed(1)}min | Active Batches: ${batchCapacityText} | Events/Cycle: ${this.stats.eventsThisCycle}`));

      // CRITICAL FIX: Show event queue size with warning if high
      if (eventQueueSize !== undefined) {
        const queueWarning = eventQueueSize > 5000 ? ' ⚠️ HIGH' : eventQueueSize > 8000 ? ' 🚨 CRITICAL' : '';
        this.ns.print(this.formatDashboardLine(`📥 Event Queue: ${eventQueueSize}${queueWarning}`));
      }

      if (isScalingDynamic) {
        this.ns.print(this.formatDashboardLine(`🔢 Dynamic Scaling: ${maxBatches} batches (${((maxBatches / this.config.maxBatches - 1) * 100).toFixed(0)}% vs base)`));
      }
      this.ns.print(this.formatDashboardLine(`🎯 Target: ${targetInfo}`));
      this.ns.print(this.formatDashboardLine(`🎛️ Batch Size: ${targetManager.getDynamicBatchSize()} | Next eval: ${this.getTimeToNextEvaluation(targetManager)}s`));

      // Network & Resource Utilization
      this.ns.print('├─ NETWORK & RESOURCES');
      this.ns.print(this.formatDashboardLine(`🖥️ Network: ${networkStats.totalServers} servers | ${networkStats.rootedServers} rooted | RAM: ${this.ns.formatNumber(networkStats.ramUsed)}/${this.ns.formatNumber(networkStats.ramTotal)}GB (${networkStats.ramUtilization.toFixed(1)}%)`));
      this.ns.print(this.formatDashboardLine(`⚡ Threads: ${threadDistribution.hack}H/${threadDistribution.grow}G/${threadDistribution.weaken}W | Active: ${threadDistribution.total} | Est: 0.6GB/batch`));

      // Performance & Trends
      this.ns.print('├─ PERFORMANCE & TRENDS');
      this.ns.print(this.formatDashboardLine(`💰 Money/Hour: $${this.ns.formatNumber(this.performanceMetrics.moneyPerHour)} | Total: $${this.ns.formatNumber(this.stats.totalMoneyGained)} | Efficiency: ${this.calculateSystemEfficiency().toFixed(1)}%`));
      this.ns.print(this.formatDashboardLine(`📊 Batches/Hour: ${this.performanceMetrics.batchesPerHour.toFixed(1)} | Success: ${batchSuccessRate}% | Avg: $${this.ns.formatNumber(this.performanceMetrics.averageBatchValue)}`));
      this.ns.print(this.formatDashboardLine(`🎯 Status: ${this.stats.batchesSent} sent, ${this.stats.batchesCompleted} completed, ${this.stats.batchesFailed} failed | Last: ${timeSinceLastEvent}s ago`));

      // System Health & Distribution
      this.ns.print('├─ SYSTEM HEALTH');
      const healthStatus = this.calculateSystemHealth();
      this.ns.print(this.formatDashboardLine(`🚦 Status: ${healthStatus.overall} | Batches: ${healthStatus.batchStatus} | Network: ${healthStatus.networkStatus} | Alerts: ${healthStatus.alerts}`));

      if (this.performanceMetrics.topServer) {
        const topPerf = this.serverPerformance.get(this.performanceMetrics.topServer);
        const topServers = this.getTopPerformingServers(3);
        if (topPerf && topServers.length > 0) {
          this.ns.print(this.formatDashboardLine(`🚀 Top Servers: ${topServers.map(s => `${s.name}(${s.utilization}%)`).join(', ')}`));
        }
      }

      // Show active batch details for real-time monitoring
      if (this.activeBatches.size > 0) {
        this.ns.print('├─ ACTIVE BATCHES');
        let batchCount = 0;
        const oldestBatches = Array.from(this.activeBatches.entries())
          .sort(([, a], [, b]) => a.startTime - b.startTime)
          .slice(0, 3);

        for (const [batchId, batch] of oldestBatches) {
          const elapsed = Math.floor((now - batch.startTime) / 1000);
          const completionStatus = `${batch.hackCompleted ? 'H' : '⋯'}${batch.growCompleted ? 'G' : '⋯'}${batch.weakenCompleted ? 'W' : '⋯'}`;
          const expectedTime = Math.floor(batch.expectedCompletionTime / 1000);
          const progress = expectedTime > 0 ? Math.min(100, (elapsed / expectedTime) * 100) : 0;
          const progressBar = progress > 0 ? `${progress.toFixed(0)}%` : 'N/A';

          this.ns.print(this.formatDashboardLine(`${batch.server}: [${completionStatus}] ${elapsed}s/${expectedTime}s (${progressBar}) | $${this.ns.formatNumber(batch.moneyGained)}`));
          batchCount++;
        }
        if (this.activeBatches.size > 3) {
          const remaining = this.activeBatches.size - 3;
          this.ns.print(this.formatDashboardLine(`... and ${remaining} more batches running`));
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

  private calculateNetworkStats(): { totalServers: number, rootedServers: number, ramTotal: number, ramUsed: number, ramUtilization: number } {
    const allServers = BotnetUtilities.getAllServers(this.ns);
    let totalServers = allServers.length;
    let rootedServers = 0;
    let ramTotal = 0;
    let ramUsed = 0;

    for (const server of allServers) {
      if (this.ns.hasRootAccess(server)) {
        rootedServers++;
        const maxRam = this.ns.getServerMaxRam(server);
        const usedRam = this.ns.getServerUsedRam(server);
        ramTotal += maxRam;
        ramUsed += usedRam;
      }
    }

    // Add purchased servers
    const purchasedServers = this.ns.getPurchasedServers();
    for (const server of purchasedServers) {
      if (!allServers.includes(server)) {
        totalServers++;
        rootedServers++;
        ramTotal += this.ns.getServerMaxRam(server);
        ramUsed += this.ns.getServerUsedRam(server);
      }
    }

    return {
      totalServers,
      rootedServers,
      ramTotal,
      ramUsed,
      ramUtilization: ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0
    };
  }

  private calculateThreadDistribution(): { hack: number, grow: number, weaken: number, total: number } {
    let hackThreads = 0;
    let growThreads = 0;
    let weakenThreads = 0;

    // Estimate threads from active batches
    for (const batch of this.activeBatches.values()) {
      // Rough estimate based on batch size - actual thread counts would need to be tracked
      const batchSize = batch.batchSize || 50;
      hackThreads += Math.ceil(batchSize * 0.3);  // ~30% hack threads
      growThreads += Math.ceil(batchSize * 0.4);  // ~40% grow threads
      weakenThreads += Math.ceil(batchSize * 0.3); // ~30% weaken threads
    }

    return {
      hack: hackThreads,
      grow: growThreads,
      weaken: weakenThreads,
      total: hackThreads + growThreads + weakenThreads
    };
  }

  private calculateSystemEfficiency(): number {
    if (this.stats.batchesSent === 0) return 0;

    // Efficiency based on success rate, resource utilization, and money per hour vs potential
    const successRate = this.stats.batchesCompleted / this.stats.batchesSent;
    const networkStats = this.calculateNetworkStats();
    const resourceEfficiency = networkStats.ramUtilization / 100;

    // Rough efficiency calculation - could be enhanced with more sophisticated metrics
    return Math.min(100, (successRate * 0.6 + resourceEfficiency * 0.4) * 100);
  }

  private calculateSystemHealth(): { overall: string, batchStatus: string, networkStatus: string, alerts: string } {
    const now = Date.now();
    const timeSinceLastEvent = this.stats.lastEventTime > 0 ? (now - this.stats.lastEventTime) / 1000 : 999;
    const successRate = this.stats.batchesSent > 0 ? this.stats.batchesCompleted / this.stats.batchesSent : 0;
    const networkStats = this.calculateNetworkStats();

    // Batch health
    let batchStatus = '🟢 Healthy';
    if (successRate < 0.8) batchStatus = '🟡 Degraded';
    if (successRate < 0.5) batchStatus = '🔴 Poor';

    // Network health
    let networkStatus = '🟢 Stable';
    if (networkStats.ramUtilization > 95) networkStatus = '🟡 High Load';
    if (timeSinceLastEvent > 60) networkStatus = '🔴 Stalled';

    // Overall health
    let overall = '🟢 Healthy';
    if (batchStatus.includes('🟡') || networkStatus.includes('🟡')) overall = '🟡 Warning';
    if (batchStatus.includes('🔴') || networkStatus.includes('🔴')) overall = '🔴 Critical';

    // Count alerts
    let alertCount = 0;
    if (successRate < 0.8) alertCount++;
    if (networkStats.ramUtilization > 95) alertCount++;
    if (timeSinceLastEvent > 60) alertCount++;
    if (this.stats.batchesFailed > this.stats.batchesCompleted * 0.1) alertCount++;

    return {
      overall,
      batchStatus,
      networkStatus,
      alerts: alertCount > 0 ? `${alertCount} issues` : 'None'
    };
  }

  private getTopPerformingServers(count: number): Array<{ name: string, utilization: string }> {
    const allServers = BotnetUtilities.getAllServers(this.ns);
    const serverStats: Array<{ name: string, utilization: number }> = [];

    for (const server of allServers) {
      if (this.ns.hasRootAccess(server)) {
        const maxRam = this.ns.getServerMaxRam(server);
        const usedRam = this.ns.getServerUsedRam(server);
        if (maxRam > 0 && usedRam > 0) {
          serverStats.push({
            name: server,
            utilization: (usedRam / maxRam) * 100
          });
        }
      }
    }

    return serverStats
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, count)
      .map(s => ({ name: s.name, utilization: s.utilization.toFixed(0) }));
  }

  private getTimeToNextEvaluation(targetManager: BotnetTargetManager): number {
    const now = Date.now();
    const lastEval = (targetManager as any).lastEvaluationTime || 0;
    const interval = (targetManager as any).config?.targetEvaluationInterval || 30000;

    // Calculate utilization-based interval like the target manager does
    const utilizationRatio = targetManager.calculateCurrentUtilizationRatio();
    const dynamicInterval = utilizationRatio < 0.6 ? interval * 0.5 : interval;

    const timeSinceLastEval = now - lastEval;
    const timeToNext = Math.max(0, dynamicInterval - timeSinceLastEval);

    return Math.floor(timeToNext / 1000); // Convert to seconds
  }

}

class BotnetUtilities {
  /**
   * Network Discovery Utilities
   */
  static getAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];

    // Discover network-connected servers
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

    // Add purchased servers (not connected to network topology)
    try {
      const purchasedServers = ns.getPurchasedServers();
      for (const server of purchasedServers) {
        visited.add(server);
      }
    } catch (error) {
      // Continue if we can't get purchased servers
    }

    return Array.from(visited);
  }

  /**
   * Target Analysis Utilities
   */
  static analyzeTarget(ns: NS, hostname: string, config: BotnetConfiguration, debugMode: boolean = false): DynamicTargetAnalysis | null {
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

      // Don't skip servers with low current money - they may have high growth potential!
      // Only skip if they have no money AND low max money (not worth growing)
      if (maxMoney < config.minTargetMoney * 10 && currentMoneyRatio < 0.01) {
        return null;
      }

      // Use formulas to calculate precise money per second for fully prepped servers
      let moneyPerSecond = 0;
      let hackTime = 0;
      let growTime = 0;
      let weakenTime = 0;
      let hackChance = 0;
      let hackPercentPerThread = 0;

      try {
        // Get server and player info for formulas
        const server = ns.getServer(hostname);
        const player = ns.getPlayer();

        // Simulate fully prepped server (min security, max money)
        const preppedServer = {
          ...server,
          hackDifficulty: server.minDifficulty,
          moneyAvailable: server.moneyMax
        };

        // Calculate times and hack stats for prepped server
        hackTime = ns.formulas.hacking.hackTime(preppedServer, player);
        growTime = ns.formulas.hacking.growTime(preppedServer, player);
        weakenTime = ns.formulas.hacking.weakenTime(preppedServer, player);
        hackChance = ns.formulas.hacking.hackChance(preppedServer, player);
        hackPercentPerThread = ns.formulas.hacking.hackPercent(preppedServer, player);

        // Filter out targets with unreasonably long operation times (> 15 minutes)
        const MAX_OPERATION_TIME = 15 * 60 * 1000; // 15 minutes in ms
        const maxTime = Math.max(hackTime, growTime, weakenTime);
        if (maxTime > MAX_OPERATION_TIME) {
          ns.print(`⏰ Skipping ${hostname}: operation time ${Math.round(maxTime / 1000 / 60)}min too long`);
          return null;
        }

        // Calculate money per second for optimal batching
        // Use 5% hack ratio (conservative for batching stability)
        const optimalHackPercent = Math.min(0.05, hackPercentPerThread * 100);
        const hackThreadsNeeded = Math.ceil(optimalHackPercent / hackPercentPerThread);
        const moneyPerBatch = maxMoney * optimalHackPercent * hackChance;

        // Batch duration is the longest operation time + safety buffer
        const batchDuration = Math.max(hackTime, growTime, weakenTime) + 1000; // 1s buffer
        moneyPerSecond = moneyPerBatch / (batchDuration / 1000);

        if (debugMode) {
          ns.tprint(`💰 ${hostname}: $${ns.formatNumber(moneyPerSecond)}/s (${Math.round(batchDuration / 1000)}s batches, ${(hackChance * 100).toFixed(1)}% chance)`);
        }

      } catch (error) {
        // Fallback to basic calculations if formulas fail
        hackTime = ns.getHackTime(hostname);
        growTime = ns.getGrowTime(hostname);
        weakenTime = ns.getWeakenTime(hostname);
        hackChance = ns.hackAnalyzeChance(hostname);

        // Filter out targets with unreasonably long operation times (> 15 minutes)
        const MAX_OPERATION_TIME = 15 * 60 * 1000; // 15 minutes in ms
        const maxTime = Math.max(hackTime, growTime, weakenTime);
        if (maxTime > MAX_OPERATION_TIME) {
          ns.print(`⏰ Skipping ${hostname}: operation time ${Math.round(maxTime / 1000 / 60)}min too long`);
          return null;
        }

        // Basic calculation fallback
        hackPercentPerThread = ns.hackAnalyze(hostname);
        const optimalHackPercent = Math.min(0.05, hackPercentPerThread * 100);
        const moneyPerBatch = maxMoney * optimalHackPercent * hackChance;
        const batchDuration = Math.max(hackTime, growTime, weakenTime) + 1000;
        moneyPerSecond = moneyPerBatch / (batchDuration / 1000);

        if (debugMode) {
          ns.tprint(`💰 ${hostname}: $${ns.formatNumber(moneyPerSecond)}/s (fallback calc)`);
        }
      }

      const securityLevel = ns.getServerSecurityLevel(hostname);
      const minSecurityLevel = ns.getServerMinSecurityLevel(hostname);

      // Calculate optimal hack percentage (typically 5% of max money for batching)
      const optimalHackPercent = Math.min(0.05, hackPercentPerThread * 100); // 5% or max possible
      const hackThreadsNeeded = Math.ceil(optimalHackPercent / hackPercentPerThread);

      // Estimate RAM costs for a complete HWGW batch
      const moneyStolen = optimalHackPercent;
      const growthMultiplier = 1 / (1 - moneyStolen);

      // Use proper growth analysis for thread calculation
      let growThreadsNeeded;
      try {
        growThreadsNeeded = Math.ceil(Math.log(growthMultiplier) / Math.log(ns.getServerGrowth(hostname) / 100));
      } catch {
        growThreadsNeeded = hackThreadsNeeded * 5; // Fallback estimate
      }

      // Weaken threads needed (security increase / 0.05 per weaken)
      const hackSecurityIncrease = hackThreadsNeeded * 0.002;
      const growSecurityIncrease = growThreadsNeeded * 0.004;
      const weakenHackThreads = Math.ceil(hackSecurityIncrease / 0.05);
      const weakenGrowThreads = Math.ceil(growSecurityIncrease / 0.05);

      // Total RAM cost (all scripts cost ~1.75GB per thread)
      const totalThreads = hackThreadsNeeded + growThreadsNeeded + weakenHackThreads + weakenGrowThreads;
      const totalRAMCost = totalThreads * 1.75;

      // HWGW operations run in parallel, so use the slowest operation time
      const batchCompletionTime = Math.max(hackTime, growTime, weakenTime);

      // Use money per second as the primary efficiency metric (money per second per GB RAM)
      const efficiencyScore = moneyPerSecond / totalRAMCost;

      const isOptimal = currentMoneyRatio >= MONEY_OPTIMAL_RATIO &&
        securityLevel <= minSecurityLevel + SECURITY_OPTIMAL_THRESHOLD;

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
    // Safety check: limit batchSize to prevent unrealistic calculations
    const safeBatchSize = Math.min(batchSize, 1000);

    // Dynamic hack percentage based on target's current money ratio to prevent over-draining
    const currentMoney = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const moneyRatio = maxMoney > 0 ? currentMoney / maxMoney : 0;

    // Scale hack percentage based on money ratio:
    // - High money (>75%): Use full 5% hack percentage
    // - Medium money (25-75%): Scale down to 2-5%
    // - Low money (<25%): Use minimal 1% to avoid complete draining
    let dynamicHackPercentage = HACK_PERCENTAGE; // Start with default 5%
    if (moneyRatio < 0.25) {
      dynamicHackPercentage = 0.01; // 1% when money is low
    } else if (moneyRatio < 0.75) {
      // Interpolate between 1% and 5% based on money ratio
      dynamicHackPercentage = 0.01 + (moneyRatio - 0.25) * (HACK_PERCENTAGE - 0.01) / 0.5;
    }

    const baseHackThreads = Math.max(1, Math.floor(safeBatchSize * dynamicHackPercentage));

    // Additional safety: ensure we don't steal more money than actually available
    const moneyPerThread = ns.hackAnalyze(target);
    const maxSafeThreads = moneyPerThread > 0 ? Math.floor((currentMoney * 0.95) / (maxMoney * moneyPerThread)) : baseHackThreads;
    const hackThreads = Math.min(baseHackThreads, Math.max(1, maxSafeThreads));

    const moneyStolen = ns.hackAnalyze(target) * hackThreads;
    // Clamp moneyStolen to prevent growthAnalyze() from getting negative multiplier
    // Never steal more than 95% to ensure growth calculation remains valid
    const safemoneyStolen = Math.min(moneyStolen, 0.95);
    const growthNeeded = 1 / (1 - safemoneyStolen);

    // Add safety check for grow threads calculation
    let growThreads;
    try {
      const rawGrowThreads = ns.growthAnalyze(target, growthNeeded * GROWTH_BUFFER_MULTIPLIER);
      // Cap grow threads to prevent unrealistic values
      growThreads = Math.max(1, Math.min(Math.ceil(rawGrowThreads), 6000));
    } catch (error) {
      // Fallback if growthAnalyze fails
      growThreads = hackThreads * 10; // Conservative fallback
    }

    const hackSecurityIncrease = hackThreads * WEAKEN_HACK_SECURITY_INCREASE;
    const growSecurityIncrease = growThreads * WEAKEN_GROW_SECURITY_INCREASE;
    const weakenHackThreads = Math.ceil(hackSecurityIncrease / WEAKEN_SECURITY_DECREASE);
    const weakenGrowThreads = Math.ceil(growSecurityIncrease / WEAKEN_SECURITY_DECREASE);

    return { hackThreads, growThreads, weakenHackThreads, weakenGrowThreads };
  }

  /**
   * Calculate optimal batch size based on available RAM across network
   */
  static calculateOptimalBatchSize(ns: NS, target: string, config: BotnetConfiguration): number {
    const totalAvailableRAM = BotnetUtilities.getTotalNetworkRAM(ns);
    const targetUtilization = config.maxRAMUtilization || 0.8; // Use 80% of available RAM
    const availableForBatch = totalAvailableRAM * targetUtilization;

    // Get script RAM costs (approximate values based on testing)
    const scriptCosts = {
      hack: 1.70,    // hk.js
      grow: 1.75,    // gr.js
      weaken: 1.75   // wk.js (both hack and grow weaken)
    };

    // Start with bounds based on available RAM - scale aggressively for massive systems
    let minSize = Math.max(1, BASE_BATCH_SIZE); // Use constant as minimum, but at least 1
    let maxSize = Math.floor(availableForBatch / 25); // More aggressive scaling for massive RAM

    // For systems with massive RAM (>1TB available for batches), allow much larger batches
    if (availableForBatch > 1000) { // More than 1TB available
      maxSize = Math.min(1000, maxSize); // Cap at 1000 for systems with massive RAM
    } else {
      maxSize = Math.min(200, maxSize); // Conservative cap for smaller systems
    }

    let optimalSize = minSize;

    // Safety check: if maxSize is too small, use a reasonable default
    if (maxSize < minSize) {
      maxSize = Math.max(minSize, 100);
    }

    for (let iterations = 0; iterations < 15; iterations++) { // Reduced iterations
      const testSize = Math.floor((minSize + maxSize) / 2);
      const threads = BotnetUtilities.calculateHWGWThreads(ns, target, testSize, config);

      // Add safety check for unrealistic thread counts
      const totalThreads = threads.hackThreads + threads.growThreads + threads.weakenHackThreads + threads.weakenGrowThreads;
      if (totalThreads > 50000) {
        // If thread count is unrealistic, reduce maxSize dramatically
        maxSize = Math.floor(testSize * 0.1);
        continue;
      }

      const totalRAMNeeded =
        threads.hackThreads * scriptCosts.hack +
        threads.growThreads * scriptCosts.grow +
        threads.weakenHackThreads * scriptCosts.weaken +
        threads.weakenGrowThreads * scriptCosts.weaken;

      // Add another safety check for RAM requirements
      if (totalRAMNeeded > availableForBatch * 2) {
        // If RAM needed is more than double available, this is unrealistic
        maxSize = Math.floor(testSize * 0.5);
        continue;
      }

      if (totalRAMNeeded <= availableForBatch) {
        optimalSize = testSize;
        minSize = testSize + 1;
      } else {
        maxSize = testSize - 1;
      }

      if (minSize > maxSize) break;
    }

    // Return optimal size with reasonable bounds
    return Math.min(Math.max(optimalSize, BASE_BATCH_SIZE), DYNAMIC_BATCH_SIZE_MAX);
  }

  /**
   * Get total available RAM across all network servers
   */
  static getTotalNetworkRAM(ns: NS): number {
    const servers = BotnetUtilities.getAllServers(ns).filter(s => ns.hasRootAccess(s));
    return servers.reduce((total, server) => {
      return total + ns.getServerMaxRam(server);
    }, 0);
  }

  static calculateAvailableRAM(ns: NS): number {
    const servers = BotnetUtilities.getAllServers(ns).filter(s => ns.hasRootAccess(s));
    return servers.reduce((total, server) => {
      return total + BotnetUtilities.getAvailableRAM(ns, server);
    }, 0);
  }

  /**
   * Server Resource Management
   */
  static getAvailableRAM(ns: NS, hostname: string): number {
    const totalRAM = ns.getServerMaxRam(hostname);
    const usedRAM = ns.getServerUsedRam(hostname);

    // Reserve space for essential scripts on home server
    if (hostname === 'home') {
      // Essential scripts running on home:
      // - contracts.ts: ~17.4GB (documented)
      // - server-manager.ts: ~20-25GB (extensive NS API usage)
      // - navigator.ts: ~5-10GB (browser automation)
      // - health-check.ts: ~2-3GB (monitoring)
      // Total reservation: 55GB
      const ESSENTIAL_SCRIPTS_RESERVATION = 55; // GB
      return Math.max(0, totalRAM - usedRAM - ESSENTIAL_SCRIPTS_RESERVATION);
    }

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
  static calculateProfessionalTiming(ns: NS, target: string, baseTimeDelay: number, startTime: number): {
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
    const delayInterval = BASE_TIME_DELAY; // 250ms spacing between operations

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

  constructor(private logger: Logger) { }

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
        now + QUEUE_DELAY :
        lastBatchStart! + this.config.cycleTimingDelay;

      const timing = BotnetUtilities.calculateProfessionalTiming(this.ns, target, BASE_TIME_DELAY, batchStartTime);

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
    const batchDuration = this.ns.getWeakenTime(target) + (BASE_TIME_DELAY * 3);

    // More concurrent batches for faster servers
    const maxByTiming = Math.floor(batchDuration / this.config.cycleTimingDelay);

    // Constrain by RAM availability (rough estimate) - use 80% for HWGW, reserve 20% for prep
    const ramPerBatch = this.estimateBatchRAMCost(target);
    const availableRAMForHWGW = this.calculateAvailableRAMForHWGW();
    const maxByRAM = Math.floor(availableRAMForHWGW / ramPerBatch);

    return Math.min(maxByTiming, maxByRAM, this.config.maxBatches);
  }

  private async createWaveBatch(target: string, timing: any, batchNumber: number, startTime: number): Promise<ScheduledBatch | null> {
    // Calculate optimal batch size based on available RAM
    const dynamicBatchSize = BotnetUtilities.calculateOptimalBatchSize(this.ns, target, this.config);
    const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, dynamicBatchSize, this.config);
    const ramNeeded = this.estimateBatchRAMCost(target, dynamicBatchSize);

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
      expectedIncome: this.ns.getServerMaxMoney(target) * threads.hackThreads * this.ns.hackAnalyze(target),
      batchSize: dynamicBatchSize
    };
  }

  private findOptimalServerDistribution(ramNeeded: number): Array<{ server: string, ramAllocated: number }> {
    const servers = BotnetUtilities.getAllServers(this.ns)
      .filter(s => this.ns.hasRootAccess(s))
      .map(s => ({
        name: s,
        availableRAM: BotnetUtilities.getAvailableRAM(this.ns, s)
      }))
      .filter(s => s.availableRAM >= 1.75) // Minimum RAM per server
      .sort((a, b) => b.availableRAM - a.availableRAM); // Largest first

    const distribution: Array<{ server: string, ramAllocated: number }> = [];
    let remainingRAM = ramNeeded;

    // Distribute RAM across servers, starting with the largest
    for (const server of servers) {
      if (remainingRAM <= 0) break;

      const ramToAllocate = Math.min(remainingRAM, server.availableRAM);
      if (ramToAllocate >= 1.75) { // Only allocate if we can use at least 1 thread
        distribution.push({
          server: server.name,
          ramAllocated: ramToAllocate
        });
        remainingRAM -= ramToAllocate;
      }
    }

    // Only return distribution if we can allocate all required RAM
    if (remainingRAM <= 0) {
      return distribution;
    } else {
      this.logger.debug(`Cannot distribute ${this.ns.formatNumber(ramNeeded)}GB: only ${this.ns.formatNumber(ramNeeded - remainingRAM)}GB available across network`);
      return [];
    }
  }

  private async launchWaveBatch(batch: ScheduledBatch): Promise<boolean> {
    // Use original batch ID format that works with event processing: target-timestamp
    const batchId = `${batch.target}-${batch.startTime}`;

    // Find the best distribution of servers for this batch (not just one server)
    const serverDistribution = this.findOptimalServerDistribution(batch.ramAllocated);
    if (serverDistribution.length === 0) {
      this.logger.debug(`No servers available for batch ${batchId} requiring ${this.ns.formatNumber(batch.ramAllocated)}GB`);
      return false;
    }

    // Create BatchTracker record for event processing
    const batchTracker: BatchTracker = {
      id: batchId,
      target: batch.target,
      server: serverDistribution[0].server, // Primary server for tracking
      startTime: batch.startTime,
      expectedCompletionTime: batch.startTime + batch.timing.batchDuration + 10000, // 10s buffer
      batchSize: batch.batchSize,
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
      // Launch scripts with precise timing - distribute across the optimal servers
      const success = await Promise.all([
        this.launchScriptDistributed('hk', batch.target, batch.startTime + batch.timing.hackStartDelay, batch.threadCounts.hack, batchId, serverDistribution),
        this.launchScriptDistributed('wk', batch.target, batch.startTime + batch.timing.weakenHackStartDelay, batch.threadCounts.weakenHack, batchId, serverDistribution),
        this.launchScriptDistributed('gr', batch.target, batch.startTime + batch.timing.growStartDelay, batch.threadCounts.grow, batchId, serverDistribution),
        this.launchScriptDistributed('wk', batch.target, batch.startTime + batch.timing.weakenGrowStartDelay, batch.threadCounts.weakenGrow, batchId, serverDistribution)
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

    const scriptName = `remote/${scriptType}.js`;
    // Remote scripts expect: batchId, delayUntil, unused, unused
    const args = [batchId, startTime, 0, 0];

    // Try to distribute threads across multiple servers if needed
    const serversWithRAM = BotnetUtilities.getAllServers(this.ns)
      .filter(s => this.ns.hasRootAccess(s))
      .map(s => ({
        name: s,
        availableRAM: BotnetUtilities.getAvailableRAM(this.ns, s)
      }))
      .filter(s => s.availableRAM >= 1.75) // Need at least 1.75GB per thread
      .sort((a, b) => b.availableRAM - a.availableRAM);

    if (serversWithRAM.length === 0) {
      this.logger.debug(`No servers with available RAM for ${scriptType} (${threads} threads needed)`);
      return false;
    }

    let remainingThreads = threads;
    const launchedPids: number[] = [];

    // Distribute threads across servers based on available RAM
    for (const server of serversWithRAM) {
      if (remainingThreads <= 0) break;

      const maxThreadsOnServer = Math.floor(server.availableRAM / 1.75);
      const threadsToLaunch = Math.min(remainingThreads, maxThreadsOnServer);

      if (threadsToLaunch > 0) {
        try {
          // Ensure script exists on target server before execution
          if (!this.ns.fileExists(scriptName, server.name)) {
            this.logger.debug(`Copying ${scriptName} to ${server.name}`);
            await this.ns.scp([scriptName], server.name);

            // Verify the copy succeeded
            if (!this.ns.fileExists(scriptName, server.name)) {
              this.logger.error(`Failed to copy ${scriptName} to ${server.name}`);
              continue; // Skip this server
            }
          }

          // Get actual RAM costs for better diagnostics
          const scriptRAM = this.ns.getScriptRam(scriptName, server.name);
          const totalRAMNeeded = scriptRAM * threadsToLaunch;
          const actualAvailableRAM = BotnetUtilities.getAvailableRAM(this.ns, server.name);

          if (totalRAMNeeded > actualAvailableRAM) {
            this.logger.debug(`Insufficient RAM on ${server.name}: need ${this.ns.formatNumber(totalRAMNeeded)}GB, have ${this.ns.formatNumber(actualAvailableRAM)}GB`);
            continue; // Skip this server
          }

          const pid = this.ns.exec(scriptName, server.name, threadsToLaunch, ...args);
          if (pid !== 0) {
            launchedPids.push(pid);
            remainingThreads -= threadsToLaunch;
            this.logger.debug(`Launched ${scriptType}: ${threadsToLaunch} threads on ${server.name} (${this.ns.formatNumber(actualAvailableRAM)}GB available, ${this.ns.formatNumber(totalRAMNeeded)}GB used)`);
          } else {
            // Enhanced diagnostics for failed launches
            this.logger.error(`Failed to launch ${scriptType} on ${server.name}: exec returned 0`);
            this.logger.error(`  Script: ${scriptName}, Threads: ${threadsToLaunch}, RAM needed: ${this.ns.formatNumber(totalRAMNeeded)}GB`);
            this.logger.error(`  Server RAM: ${this.ns.formatNumber(this.ns.getServerUsedRam(server.name))}/${this.ns.formatNumber(this.ns.getServerMaxRam(server.name))}GB used`);
            this.logger.error(`  Available RAM: ${this.ns.formatNumber(actualAvailableRAM)}GB`);
            this.logger.error(`  Script exists: ${this.ns.fileExists(scriptName, server.name)}`);
          }
        } catch (error) {
          this.logger.error(`Failed to launch ${scriptType} on ${server.name}: ${error}`);
        }
      }
    }

    if (remainingThreads > 0) {
      this.logger.error(`Could only launch ${threads - remainingThreads}/${threads} ${scriptType} threads - insufficient RAM across network`);

      // Additional diagnostic information
      const totalRAMAvailable = serversWithRAM.reduce((sum, s) => sum + s.availableRAM, 0);
      const estimatedRAMNeeded = remainingThreads * 1.75;
      this.logger.error(`  Total network RAM available: ${this.ns.formatNumber(totalRAMAvailable)}GB`);
      this.logger.error(`  RAM needed for remaining threads: ${this.ns.formatNumber(estimatedRAMNeeded)}GB`);
      this.logger.error(`  Servers checked: ${serversWithRAM.length}`);

      return false;
    }

    this.logger.debug(`Successfully launched ${threads} ${scriptType} threads across ${launchedPids.length} servers`);
    return launchedPids.length > 0;
  }

  private async launchScriptDistributed(
    scriptType: string,
    target: string,
    startTime: number,
    threads: number,
    batchId: string,
    serverDistribution: Array<{ server: string, ramAllocated: number }>
  ): Promise<boolean> {
    if (threads <= 0) return true;

    const scriptName = `remote/${scriptType}.js`;
    const args = [batchId, startTime, 0, 0];
    const scriptRAM = 1.75; // All remote scripts use ~1.75GB per thread

    let remainingThreads = threads;
    const launchedPids: number[] = [];

    // Use the pre-calculated server distribution
    for (const allocation of serverDistribution) {
      if (remainingThreads <= 0) break;

      const maxThreadsOnServer = Math.floor(allocation.ramAllocated / scriptRAM);
      const threadsToLaunch = Math.min(remainingThreads, maxThreadsOnServer);

      if (threadsToLaunch > 0) {
        try {
          // Ensure script exists on target server
          if (!this.ns.fileExists(scriptName, allocation.server)) {
            await this.ns.scp([scriptName], allocation.server);
            if (!this.ns.fileExists(scriptName, allocation.server)) {
              this.logger.error(`Failed to copy ${scriptName} to ${allocation.server}`);
              continue;
            }
          }

          const pid = this.ns.exec(scriptName, allocation.server, threadsToLaunch, ...args);
          if (pid !== 0) {
            launchedPids.push(pid);
            remainingThreads -= threadsToLaunch;
            this.logger.debug(`Distributed ${scriptType}: ${threadsToLaunch} threads on ${allocation.server}`);
          } else {
            this.logger.error(`Failed to launch ${scriptType} on ${allocation.server}: exec returned 0`);
          }
        } catch (error) {
          this.logger.error(`Failed to launch ${scriptType} on ${allocation.server}: ${error}`);
        }
      }
    }

    if (remainingThreads > 0) {
      this.logger.error(`Could only launch ${threads - remainingThreads}/${threads} ${scriptType} threads via distribution`);
      return false;
    }

    this.logger.debug(`Successfully distributed ${threads} ${scriptType} threads across ${launchedPids.length} servers`);
    return launchedPids.length > 0;
  }

  private estimateBatchRAMCost(target: string, batchSize?: number): number {
    // Rough estimate: each script type costs ~1.75 GB per thread
    const usedBatchSize = batchSize || BASE_BATCH_SIZE;
    const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, usedBatchSize, this.config);
    return (threads.hackThreads + threads.weakenHackThreads + threads.growThreads + threads.weakenGrowThreads) * 1.75;
  }

  private calculateAvailableRAM(): number {
    const allServers = BotnetUtilities.getAllServers(this.ns);
    return allServers
      .filter(server => this.ns.hasRootAccess(server))
      .reduce((total, server) => total + (this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server)), 0);
  }

  private calculateAvailableRAMForHWGW(): number {
    // Reserve 20% of total RAM for prep operations
    const totalRAM = this.calculateAvailableRAM();
    return totalRAM * 0.8; // 80% for HWGW batching
  }

  private calculateAvailableRAMForPrep(): number {
    // Use 20% of total RAM for prep operations  
    const totalRAM = this.calculateAvailableRAM();
    return totalRAM * 0.2; // 20% for prep operations
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
  batchSize: number;
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

      const timing = BotnetUtilities.calculateProfessionalTiming(this.ns, target, BASE_TIME_DELAY, Date.now());
      const threads = BotnetUtilities.calculateHWGWThreads(this.ns, target, batchSize, this.config);

      // DEBUG: Check timing values
      const now = Date.now();
      // this.ns.print(`DEBUG Timing: hackTime=${timing.hackTime}ms, batchDuration=${timing.batchDuration}ms`);
      // this.ns.print(`DEBUG: now=${now}, expectedComplete=${now + timing.batchDuration + BATCH_TIMEOUT_BUFFER}`);

      const batchId = `${target}-${Date.now()}`;
      const batch: BatchTracker = {
        id: batchId,
        target,
        server,
        startTime: Date.now(),
        expectedCompletionTime: Date.now() + timing.batchDuration + BATCH_TIMEOUT_BUFFER,
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
      const batchStartTime = Date.now();
      const hackPid = this.ns.exec('/remote/hk.js', server, threads.hackThreads, batchId, batchStartTime + timing.hackStartDelay);
      const growPid = this.ns.exec('/remote/gr.js', server, threads.growThreads, batchId, batchStartTime + timing.growStartDelay);
      const weakenHackPid = this.ns.exec('/remote/wk.js', server, threads.weakenHackThreads, batchId + '-hack', batchStartTime + timing.weakenHackStartDelay);
      const weakenGrowPid = this.ns.exec('/remote/wk.js', server, threads.weakenGrowThreads, batchId + '-grow', batchStartTime + timing.weakenGrowStartDelay);

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

    // EMERGENCY FIX: If we have too many active batches, force cleanup the oldest ones
    const EMERGENCY_BATCH_LIMIT = 2000; // Maximum allowed active batches
    let batchesToForceCleanup: string[] = [];

    if (this.activeBatches.size > EMERGENCY_BATCH_LIMIT) {
      // Get oldest batches by startTime and force cleanup
      const sortedBatches = Array.from(this.activeBatches.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime);

      const excessCount = this.activeBatches.size - EMERGENCY_BATCH_LIMIT;
      batchesToForceCleanup = sortedBatches.slice(0, excessCount).map(([id,]) => id);

      this.logger.warn(`EMERGENCY CLEANUP: Removing ${excessCount} oldest batches (${this.activeBatches.size} > ${EMERGENCY_BATCH_LIMIT} limit)`);
    }

    for (const [batchId, batch] of this.activeBatches.entries()) {
      // Force cleanup if in emergency list
      if (batchesToForceCleanup.includes(batchId)) {
        timedOutBatches.push(batchId);
        continue;
      }

      // Fix invalid completion times - if completion time is in far future, force timeout
      if (batch.expectedCompletionTime > now + 86400000) { // More than 24 hours in future
        this.logger.warn(`Batch ${batchId} has invalid completion time ${batch.expectedCompletionTime}, forcing timeout`);
        timedOutBatches.push(batchId);
        continue;
      }

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

    for (const [batchId, batch] of this.activeBatches.entries()) {
      // Force cleanup if in emergency list
      if (batchesToForceCleanup.includes(batchId)) {
        timedOutBatches.push(batchId);
        continue;
      }

      // Fix invalid completion times - if completion time is in far future, force timeout
      if (batch.expectedCompletionTime > now + 86400000) { // More than 24 hours in future
        this.logger.warn(`Batch ${batchId} has invalid completion time ${batch.expectedCompletionTime}, forcing timeout`);
        timedOutBatches.push(batchId);
        continue;
      }

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

        this.logger.info(`Batch completed: ${batchId} -> $${this.ns.formatNumber(batch.moneyGained)} (${(batchTime / 1000).toFixed(1)}s)`);
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
  private debugMode: boolean;

  constructor(
    ns: NS,
    logger: Logger,
    config: BotnetConfiguration,
    targetPerformance: Map<string, TargetPerformance>,
    debugMode: boolean = false
  ) {
    this.ns = ns;
    this.logger = logger;
    this.config = config;
    this.targetPerformance = targetPerformance;
    this.currentTarget = null;
    this.lastEvaluationTime = 0;
    this.dynamicBatchSize = BASE_BATCH_SIZE;
    this.debugMode = debugMode;
  }

  async evaluateAndSelectTarget(): Promise<void> {
    const now = Date.now();

    // Evaluate more frequently if utilization is low (enables faster target rotation)
    const utilizationRatio = this.calculateCurrentUtilizationRatio();
    const dynamicInterval = utilizationRatio < 0.6 ?
      this.config.targetEvaluationInterval * 0.5 : // 50% faster when underutilized
      this.config.targetEvaluationInterval;

    // Only evaluate periodically to avoid excessive overhead
    const forceReeval = this.currentTarget &&
      (this.currentTarget.hostname === 'the-hub' ||
        this.currentTarget.analysis.moneyPerSecond < 50000);

    if (forceReeval && this.currentTarget) {
      if (this.debugMode) {
        this.ns.tprint(`🔄 FORCED RE-EVALUATION: Current target ${this.currentTarget.hostname} is suboptimal`);
      }
    } else if (now - this.lastEvaluationTime < dynamicInterval) {
      return;
    }

    this.lastEvaluationTime = now;

    const servers = BotnetUtilities.getAllServers(this.ns);
    const candidates: DynamicTarget[] = [];

    // Analyze all potential targets
    for (const hostname of servers) {
      const analysis = BotnetUtilities.analyzeTarget(this.ns, hostname, this.config, this.debugMode);
      if (analysis) {
        candidates.push({
          hostname,
          analysis,
          lastEvaluated: now
        });
      }
    }

    // Sort by money per second (highest first) - prioritize the most profitable targets
    candidates.sort((a, b) => b.analysis.moneyPerSecond - a.analysis.moneyPerSecond);

    if (candidates.length === 0) {
      this.logger.warn('No viable targets found');
      return;
    }

    const bestCandidate = candidates[0];

    // Show top 3 candidates for comparison if forced re-evaluation
    if (forceReeval && this.currentTarget && this.debugMode) {
      this.ns.tprint(`🏆 TOP TARGETS:`);
      for (let i = 0; i < Math.min(3, candidates.length); i++) {
        const candidate = candidates[i];
        const indicator = candidate.hostname === this.currentTarget.hostname ? ' ← CURRENT' : '';
        this.ns.tprint(`   ${i + 1}. ${candidate.hostname}: $${this.ns.formatNumber(candidate.analysis.moneyPerSecond)}/s${indicator}`);
      }
    }

    this.logger.info(`🎯 Best target: ${bestCandidate.hostname} ($${this.ns.formatNumber(bestCandidate.analysis.moneyPerSecond)}/s, ${Math.round(bestCandidate.analysis.hackTime / 1000)}s hack time)`);

    // Check if we should switch targets
    if (this.shouldSwitchTarget(bestCandidate)) {
      const oldTarget = this.currentTarget?.hostname || 'none';
      this.currentTarget = bestCandidate;

      // Update dynamic batch size based on target
      this.updateDynamicBatchSize(bestCandidate.analysis);

      if (oldTarget !== bestCandidate.hostname) {
        const switchReason = this.getTargetSwitchReason(bestCandidate);
        if (this.debugMode) {
          this.ns.tprint(`🚀 ===== TARGET SWITCH =====`);
          this.ns.tprint(`🚀 ${oldTarget} → ${bestCandidate.hostname}`);
          this.ns.tprint(`🚀 Reason: ${switchReason}`);
          this.ns.tprint(`🚀 New Money/s: $${this.ns.formatNumber(bestCandidate.analysis.moneyPerSecond)}/s`);
          this.ns.tprint(`🚀 ========================`);
        }
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

    // More aggressive switching when utilization is low
    const utilizationRatio = this.calculateCurrentUtilizationRatio();
    const improvementThreshold = utilizationRatio < 0.6 ?
      TARGET_IMPROVEMENT_THRESHOLD * 0.8 : // Lower bar when underutilized
      TARGET_IMPROVEMENT_THRESHOLD;

    // Debug info for target switching decision
    if (candidate.hostname !== this.currentTarget.hostname && this.debugMode) {
      this.ns.tprint(`🤔 Evaluating switch: ${this.currentTarget.hostname} (${currentEfficiency.toFixed(1)}) vs ${candidate.hostname} (${candidateEfficiency.toFixed(1)})`);
      this.ns.tprint(`🤔 Need ${improvementThreshold.toFixed(2)}x improvement, candidate is ${(candidateEfficiency / currentEfficiency).toFixed(2)}x`);
    }

    // Switch if candidate is significantly better
    if (candidateEfficiency > currentEfficiency * improvementThreshold) {
      return true;
    }

    // Switch if current target efficiency has dropped significantly
    const currentAnalysis = BotnetUtilities.analyzeTarget(this.ns, this.currentTarget.hostname, this.config);
    if (currentAnalysis && currentAnalysis.efficiencyScore < currentEfficiency * this.config.targetEfficiencyDropThreshold) {
      return true;
    }

    // Switch if current target is money depleted
    if (this.currentTarget.analysis.currentMoneyRatio < TARGET_MONEY_DEPLETED_THRESHOLD) {
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

    if (newEfficiencyRatio > TARGET_IMPROVEMENT_THRESHOLD) {
      return `new target ${(newEfficiencyRatio * 100).toFixed(1)}% more efficient`;
    }

    if (this.currentTarget.analysis.currentMoneyRatio < TARGET_MONEY_DEPLETED_THRESHOLD) {
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
    const avgEfficiency = 6000; // Rough baseline
    sizeFactor *= Math.max(0.5, Math.min(2.0, analysis.efficiencyScore / avgEfficiency));

    const newSize = Math.round(BASE_BATCH_SIZE * sizeFactor * DYNAMIC_BATCH_SIZE_MULTIPLIER);
    this.dynamicBatchSize = Math.max(
      DYNAMIC_BATCH_SIZE_MIN,
      Math.min(DYNAMIC_BATCH_SIZE_MAX, newSize)
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

  calculateCurrentUtilizationRatio(): number {
    const totalRAM = BotnetUtilities.getTotalNetworkRAM(this.ns);
    const usedRAM = totalRAM - BotnetUtilities.calculateAvailableRAM(this.ns);
    return totalRAM > 0 ? usedRAM / totalRAM : 0;
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

  /**
   * Get current event queue size for monitoring
   */
  getEventQueueSize(): number {
    return this.eventQueue.length;
  }

  async processEvents(): Promise<void> {
    let eventsProcessed = 0;
    this.stats.eventsThisCycle = 0;

    // CRITICAL FIX: Limit event queue size to prevent memory exhaustion
    const MAX_QUEUE_SIZE = 10000; // Hard limit on queue size
    const MAX_PORT_READS = 500;   // Max events to read from port per cycle

    // Read real events from port 20 (published by remote scripts)
    const port = this.ns.getPortHandle(20);
    let eventsRead = 0;

    // CRITICAL FIX: Drain port aggressively to prevent port overflow
    while (!port.empty() && eventsRead < MAX_PORT_READS && this.eventQueue.length < MAX_QUEUE_SIZE) {
      const rawEvent = port.read() as string;
      this.logger.debug(`Raw event received: ${rawEvent}`);
      const event = this.parseEvent(rawEvent);
      if (event) {
        this.eventQueue.push(event);
        eventsRead++;
        this.logger.debug(`Parsed event: ${event.type} for ${event.batchId} with value ${event.value}`);
      }
    }

    // CRITICAL FIX: Warn if queue is getting too large
    if (this.eventQueue.length > MAX_QUEUE_SIZE * 0.8) {
      this.logger.warn(`⚠️ Event queue near capacity: ${this.eventQueue.length}/${MAX_QUEUE_SIZE} - consider reducing maxBatches`);
    }

    // CRITICAL FIX: Drain port completely if overflowing (discard excess to prevent crash)
    let discardedEvents = 0;
    while (!port.empty() && this.eventQueue.length >= MAX_QUEUE_SIZE) {
      port.read(); // Discard event
      discardedEvents++;
    }
    if (discardedEvents > 0) {
      this.logger.error(`🚨 EMERGENCY: Discarded ${discardedEvents} events - event queue at capacity! Reduce maxBatches immediately.`);
    }

    if (eventsRead > 0) {
      this.logger.info(`Read ${eventsRead} events from port 20 (queue: ${this.eventQueue.length})`);
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

      // Extract target from batchId (format: target-timestamp or share-server-timestamp)
      const target = batchId.split('-')[0] === 'share' ? batchId.split('-')[1] : batchId.split('-')[0];

      // Handle share events
      if (eventType === 'share_started' || eventType === 'share_completed' || eventType === 'share_update') {
        return {
          type: 'share',
          batchId,
          timestamp: Date.now(),
          threads,
          success: true,
          value: result,
          server: target, // For share events, target is actually the server
          target: target,
          shareEvent: eventType
        };
      }

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
        this.logger.info(`Hack completed: ${event.target} -> $${this.ns.formatNumber(event.value)} (${event.threads} threads)`);
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

      case 'share':
        // Share events don't belong to batches, handle them separately
        if (event.shareEvent === 'share_started') {
          this.logger.info(`📤 Share started: ${event.server} -> ${event.threads} threads`);
        } else if (event.shareEvent === 'share_completed') {
          this.logger.info(`📥 Share completed: ${event.server} -> ${event.threads} threads`);
        } else if (event.shareEvent === 'share_update') {
          this.logger.debug(`📊 Share update: ${event.server} -> ${event.threads} threads, ${event.value} shares completed`);
        }
        // Note: Share statistics are tracked separately in the share management system
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

  // Share script management
  private enableSharing: boolean;
  private activeShareScripts: Map<string, number>; // server -> pid

  // Dynamic scaling state tracking
  private lastDynamicBatchCount: number;
  private lastScalingLogTime: number;

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

    // Initialize share script management
    this.enableSharing = false; // Will be set based on command line args
    this.activeShareScripts = new Map();

    // Initialize dynamic scaling state tracking
    this.lastDynamicBatchCount = this.config.maxBatches;
    this.lastScalingLogTime = 0;

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
      ns, this.logger, this.config, this.targetPerformance, debugMode
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

  /**
   * Deploy all remote scripts to all accessible servers
   * This ensures all servers can execute HWGW operations
   */
  async deployRemoteScripts(): Promise<void> {
    this.logger.info('🚀 Deploying remote scripts to all servers...');

    // List of all remote scripts to deploy (compiled .js versions)
    const remoteScripts = [
      '/remote/hk.js',
      '/remote/gr.js',
      '/remote/wk.js',
      '/remote/sh.js',
      '/remote/root.js'
    ];

    // Get all accessible servers
    const allServers = this.getAllAccessibleServers();
    let deploymentCount = 0;
    let errorCount = 0;

    for (const server of allServers) {
      // Skip home server - scripts already exist there
      if (server === 'home') continue;

      try {
        // Deploy all remote scripts to this server
        const copyResult = await this.ns.scp(remoteScripts, server);

        if (copyResult) {
          deploymentCount++;
          this.logger.debug(`✅ Deployed scripts to ${server}`);
        } else {
          errorCount++;
          this.logger.warn(`⚠️ Failed to deploy scripts to ${server}`);
        }
      } catch (error) {
        errorCount++;
        this.logger.error(`❌ Error deploying to ${server}: ${error}`);
      }
    }

    this.logger.info(`📦 Script deployment complete: ${deploymentCount} servers updated, ${errorCount} errors`);

    // Verify deployment on a few key servers
    await this.verifyScriptDeployment(allServers.slice(0, 5));
  }

  /**
   * Verify that remote scripts are properly deployed on sample servers
   */
  private async verifyScriptDeployment(serversToCheck: string[]): Promise<void> {
    const scriptToCheck = '/remote/hk.js'; // Check one representative script
    let verifiedCount = 0;

    for (const server of serversToCheck) {
      if (this.ns.fileExists(scriptToCheck, server)) {
        verifiedCount++;
        this.logger.debug(`✅ Verified ${scriptToCheck} on ${server}`);
      } else {
        this.logger.warn(`⚠️ Missing ${scriptToCheck} on ${server}`);
      }
    }

    this.logger.info(`🔍 Deployment verification: ${verifiedCount}/${serversToCheck.length} servers verified`);
  }

  /**
   * Get all accessible servers in the network
   */
  private getAllAccessibleServers(): string[] {
    const visited = new Set<string>();
    const queue = ['home'];
    const servers: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      servers.push(current);

      // Add connected servers to queue
      const connections = this.ns.scan(current);
      for (const connection of connections) {
        if (!visited.has(connection)) {
          queue.push(connection);
        }
      }
    }

    return servers;
  }

  /**
   * Attempt to crack a single server using available exploits
   * Returns true if root access was gained (or already had), false otherwise
   */
  private attemptCrackServer(hostname: string): boolean {
    // Skip if already rooted
    if (this.ns.hasRootAccess(hostname)) {
      return true;
    }

    // Check if we meet hacking level requirement
    const server = this.ns.getServer(hostname);
    if (server.requiredHackingSkill && server.requiredHackingSkill > this.ns.getPlayer().skills.hacking) {
      return false; // Can't hack yet
    }

    let portsOpened = 0;
    const portsRequired = server.numOpenPortsRequired || 0;

    // Try all available port-opening programs
    try { this.ns.brutessh(hostname); portsOpened++; } catch {}
    try { this.ns.ftpcrack(hostname); portsOpened++; } catch {}
    try { this.ns.relaysmtp(hostname); portsOpened++; } catch {}
    try { this.ns.httpworm(hostname); portsOpened++; } catch {}
    try { this.ns.sqlinject(hostname); portsOpened++; } catch {}

    // Check if we have enough ports open
    if (portsOpened < portsRequired) {
      return false; // Not enough ports
    }

    // Attempt nuke
    try {
      this.ns.nuke(hostname);
      return this.ns.hasRootAccess(hostname);
    } catch (error) {
      this.logger.warn(`Failed to nuke ${hostname}: ${error}`);
      return false;
    }
  }

  /**
   * Scan network and automatically crack all available servers
   * Runs periodically to catch new servers and level-ups
   */
  private lastCrackingTime: number = 0;
  private readonly CRACKING_INTERVAL = 60000; // Check every 60 seconds

  async autoCrackServers(): Promise<void> {
    const now = Date.now();
    
    // Only run every 60 seconds
    if (now - this.lastCrackingTime < this.CRACKING_INTERVAL) {
      return;
    }

    this.lastCrackingTime = now;

    // Get all servers in network
    const allServers = this.getAllAccessibleServers();
    const unrootedServers = allServers.filter(s => !this.ns.hasRootAccess(s));

    if (unrootedServers.length === 0) {
      return; // All servers already rooted
    }

    let crackedCount = 0;
    let failedCount = 0;

    for (const server of unrootedServers) {
      const success = this.attemptCrackServer(server);
      if (success) {
        crackedCount++;
        this.logger.info(`🔓 Cracked server: ${server}`);
      } else {
        failedCount++;
      }
    }

    if (crackedCount > 0) {
      this.logger.info(`🔐 Auto-crack complete: ${crackedCount} servers rooted, ${failedCount} failed (need more ports/levels)`);
      
      // Re-deploy scripts to newly rooted servers
      await this.deployRemoteScripts();
    }
  }

  /**
   * Manage share scripts on servers with excess RAM
   */
  async manageShareScripts(): Promise<void> {
    if (!this.enableSharing) {
      return;
    }

    // RESOURCE-CONSTRAINED SHARING: Use only 20% of network RAM for sharing
    // This prevents competition with HWGW operations which need 80% of RAM
    const allServers = BotnetUtilities.getAllServers(this.ns).filter(s => this.ns.hasRootAccess(s));

    // Calculate total network RAM budget for sharing (20% of total)
    const totalNetworkRAM = allServers.reduce((total, server) => {
      return total + this.ns.getServerMaxRam(server);
    }, 0);

    const shareRAMBudget = totalNetworkRAM * 0.2; // 20% of total network RAM for sharing
    let remainingShareBudget = shareRAMBudget;

    // Track current share RAM usage
    let currentShareRAMUsage = 0;
    for (const server of allServers) {
      if (this.activeShareScripts.has(server)) {
        // Estimate current share usage (using 1.8GB per share script as baseline)
        currentShareRAMUsage += this.ns.getServerUsedRam(server) * 0.5; // Conservative estimate
      }
    }

    this.logger.debug(`💰 Share budget: ${this.ns.formatNumber(shareRAMBudget)}GB total, ${this.ns.formatNumber(currentShareRAMUsage)}GB in use, ${this.ns.formatNumber(remainingShareBudget - currentShareRAMUsage)}GB available`);

    // If we're over budget, kill some share scripts to free up RAM for HWGW
    if (currentShareRAMUsage > shareRAMBudget) {
      await this.cleanupExcessShareScripts(currentShareRAMUsage - shareRAMBudget);
      return; // Exit early after cleanup to avoid launching new shares
    }

    // Only launch new shares if we have significant budget remaining
    remainingShareBudget -= currentShareRAMUsage;
    if (remainingShareBudget < 10) { // Need at least 10GB to be worth launching
      this.logger.debug(`💰 Share budget exhausted (${this.ns.formatNumber(remainingShareBudget)}GB remaining) - no new shares`);
      return;
    }

    // Get servers suitable for sharing (small RAM requirement, only use excess)
    const serversWithRAM = allServers.map(s => ({
      name: s,
      availableRAM: BotnetUtilities.getAvailableRAM(this.ns, s),
      maxRAM: this.ns.getServerMaxRam(s),
      usedRAM: this.ns.getServerUsedRam(s),
      hasShareScript: this.activeShareScripts.has(s),
      hasShareFile: this.ns.fileExists('/remote/sh.js', s)
    }));

    // Only use servers with at least 2GB available (reduced from 4.45GB)
    const MIN_SHARE_RAM = 2.0;
    const candidateServers = serversWithRAM.filter(s =>
      s.availableRAM >= MIN_SHARE_RAM &&
      s.hasShareFile &&
      !s.hasShareScript
    );

    if (candidateServers.length === 0) {
      this.logger.debug(`💰 No servers with ${MIN_SHARE_RAM}GB+ available for sharing`);
      return;
    }

    // Sort by available RAM (smallest first) to use least valuable servers for sharing
    candidateServers.sort((a, b) => a.availableRAM - b.availableRAM);

    let shareScriptsLaunched = 0;

    for (const server of candidateServers) {
      if (remainingShareBudget < MIN_SHARE_RAM) {
        this.logger.debug(`💰 Share budget exhausted, stopping launches`);
        break;
      }

      // Constrain share threads by both available RAM and remaining budget
      const maxThreadsByRAM = Math.floor(server.availableRAM / 1.8); // 1.8GB per share thread
      const maxThreadsByBudget = Math.floor(remainingShareBudget / 1.8);
      const shareThreads = Math.min(maxThreadsByRAM, maxThreadsByBudget, 100); // Cap at 100 threads per server

      if (shareThreads <= 0) continue;

      try {
        const batchId = `share-${server.name}-${Date.now()}`;
        const ramRequired = shareThreads * 1.8;

        this.logger.debug(`💰 Launching ${shareThreads} share threads on ${server.name} (${this.ns.formatNumber(ramRequired)}GB of ${this.ns.formatNumber(remainingShareBudget)}GB budget)`);

        const pid = this.ns.exec('/remote/sh.js', server.name, shareThreads, batchId, 1.0);

        if (pid !== 0) {
          this.activeShareScripts.set(server.name, pid);
          shareScriptsLaunched++;
          remainingShareBudget -= ramRequired;
          this.logger.info(`✅ Started sharing on ${server.name}: ${shareThreads} threads (${this.ns.formatNumber(remainingShareBudget)}GB budget remaining)`);
        } else {
          this.logger.warn(`💰 Failed to start sharing on ${server.name}`);
        }
      } catch (error) {
        this.logger.error(`💰 Share launch error on ${server.name}: ${error}`);
      }
    }

    if (shareScriptsLaunched > 0) {
      this.logger.info(`💰 Share system: +${shareScriptsLaunched} scripts launched (${this.activeShareScripts.size} total active, ${this.ns.formatNumber(shareRAMBudget - remainingShareBudget)}GB used)`);
    }
  }

  /**
   * Clean up excess share scripts to free RAM for HWGW operations
   */
  private async cleanupExcessShareScripts(excessRAM: number): Promise<void> {
    this.logger.info(`💰 Cleaning up ${this.ns.formatNumber(excessRAM)}GB excess share RAM`);

    let ramFreed = 0;
    const serversToKill = [];

    // Kill share scripts on servers with smallest available RAM first (least impact)
    const shareServers = Array.from(this.activeShareScripts.keys())
      .map(server => ({
        name: server,
        usedRAM: this.ns.getServerUsedRam(server),
        pid: this.activeShareScripts.get(server)!
      }))
      .sort((a, b) => a.usedRAM - b.usedRAM);

    for (const server of shareServers) {
      if (ramFreed >= excessRAM) break;

      try {
        this.ns.kill(server.pid);
        this.activeShareScripts.delete(server.name);
        ramFreed += server.usedRAM;
        serversToKill.push(server.name);
        this.logger.info(`🛑 Stopped sharing on ${server.name} (freed ${this.ns.formatNumber(server.usedRAM)}GB)`);
      } catch (error) {
        this.logger.debug(`Failed to stop sharing on ${server.name}: ${error}`);
      }
    }

    this.logger.info(`💰 Share cleanup: ${serversToKill.length} scripts stopped, ${this.ns.formatNumber(ramFreed)}GB freed`);
  }

  /**
   * Enable or disable sharing functionality
   */
  setSharing(enabled: boolean): void {
    // Only act if state is actually changing
    if (this.enableSharing === enabled) {
      return;
    }

    this.enableSharing = enabled;
    if (!enabled) {
      // Kill all active share scripts
      for (const [server, pid] of this.activeShareScripts) {
        try {
          this.ns.kill(pid);
        } catch (error) {
          // Ignore errors when killing
        }
      }
      this.activeShareScripts.clear();
      this.logger.info('🚫 Sharing disabled - all share scripts stopped');
    } else {
      this.logger.info('✅ Sharing enabled - will utilize excess RAM');
    }
  }

  /**
   * Calculate optimal batch count based on available RAM and current target
   */
  private calculateDynamicMaxBatches(): number {
    const currentTarget = this.targetManager.getCurrentTarget();
    if (!currentTarget) {
      this.logger.warn('No current target for dynamic batch calculation - using config default');
      return this.config.maxBatches;
    }

    // Calculate available RAM across network (use 80% for HWGW, reserve 20% for prep)
    const availableRAMForHWGW = BotnetUtilities.calculateAvailableRAM(this.ns) * 0.8;

    // Estimate RAM cost per batch for current target using current dynamic batch size
    const dynamicBatchSize = this.targetManager.getDynamicBatchSize();
    const threads = BotnetUtilities.calculateHWGWThreads(this.ns, currentTarget, dynamicBatchSize, this.config);
    const batchRAMCost = (threads.hackThreads + threads.weakenHackThreads + threads.growThreads + threads.weakenGrowThreads) * 1.75;

    if (batchRAMCost <= 0) {
      this.logger.warn(`Invalid batch RAM cost (${batchRAMCost}GB) - using config default`);
      return this.config.maxBatches;
    }

    // Calculate theoretical maximum batches (use configured RAM utilization for safety)
    const theoreticalMaxBatches = Math.floor((availableRAMForHWGW * this.config.maxRAMUtilization) / batchRAMCost);

    // CRITICAL FIX: Apply strict safety limits to prevent browser crashes
    // Even with massive RAM, limit batches to prevent event queue overflow
    const safeMinBatches = Math.max(50, this.config.maxBatches); // Never go below reasonable minimum
    const ABSOLUTE_MAX_BATCHES = 2000; // HARD CAP to prevent browser crashes
    const safeMaxBatches = Math.min(theoreticalMaxBatches, ABSOLUTE_MAX_BATCHES); // Cap at absolute maximum

    const dynamicMaxBatches = Math.max(safeMinBatches, Math.min(safeMaxBatches, ABSOLUTE_MAX_BATCHES));

    // Warn if we're hitting the absolute cap
    if (theoreticalMaxBatches > ABSOLUTE_MAX_BATCHES) {
      this.logger.warn(`⚠️ Theoretical max batches (${theoreticalMaxBatches}) exceeds safety limit - capping at ${ABSOLUTE_MAX_BATCHES} to prevent browser crashes`);
    }

    // Smart logging - only log when batch count actually changes significantly
    const batchCountChanged = Math.abs(dynamicMaxBatches - this.lastDynamicBatchCount) > Math.max(50, this.config.maxBatches * 0.1);
    const timeSinceLastLog = Date.now() - this.lastScalingLogTime;
    const logCooldownMet = timeSinceLastLog > 30000; // Minimum 30 seconds between scaling logs

    if (batchCountChanged || (dynamicMaxBatches !== this.config.maxBatches && logCooldownMet)) {
      const percentChange = ((dynamicMaxBatches - this.config.maxBatches) / this.config.maxBatches) * 100;
      this.logger.info(`🔢 Dynamic scaling: ${this.config.maxBatches} → ${dynamicMaxBatches} batches (${this.ns.formatNumber(availableRAMForHWGW)}GB available for HWGW after essential scripts reservation, ${this.ns.formatNumber(batchRAMCost)}GB per batch)`);
      this.lastDynamicBatchCount = dynamicMaxBatches;
      this.lastScalingLogTime = Date.now();
    }

    return dynamicMaxBatches;
  }

  async run(): Promise<void> {
    this.logger.info('Botnet Performance Edition initializing...');
    this.logger.info('=== BOTNET PERFORMANCE EDITION ===');

    // Deploy remote scripts to all servers FIRST
    await this.deployRemoteScripts();

    // AUTO-CRACK: Immediately attempt to root all available servers
    this.logger.info('🔐 Scanning network for unrooted servers...');
    await this.autoCrackServers();

    // Initialize target if not set
    if (!this.config.targetServer) {
      await this.targetManager.evaluateAndSelectTarget();
    }

    const target = this.targetManager.getCurrentTarget();
    const initialMaxBatches = this.calculateDynamicMaxBatches();
    this.logger.info(`🚀 Professional Wave System Initialized`);
    this.logger.info(`Target: ${target}, Dynamic Max Batches: ${initialMaxBatches} (Base: ${this.config.maxBatches}), Cycle Delay: ${this.config.cycleTimingDelay}ms`);
    this.logger.info(`🔢 Dynamic RAM scaling enabled - batch count adapts to target complexity and network capacity`);

    // Main operation loop
    while (true) {
      try {
        // Process events from completed operations
        await this.eventProcessor.processEvents();

        // Clean up completed batches
        await this.batchExecutor.cleanupCompletedBatches();

        // Evaluate and potentially switch targets
        await this.targetManager.evaluateAndSelectTarget();

        // Launch new batches using professional wave scheduling with burst mode
        const now = Date.now();
        const utilizationRatio = this.targetManager.calculateCurrentUtilizationRatio();
        const isLowUtilization = utilizationRatio < 0.4; // Under 40% utilization

        // Use burst mode when utilization is low - allow faster batch launching
        const effectiveCycleDelay = isLowUtilization ?
          Math.min(this.config.cycleTimingDelay, 500) :  // Burst: max 500ms between waves
          this.config.cycleTimingDelay;                  // Normal: use config delay

        // Calculate dynamic max batches based on current target and available RAM
        const dynamicMaxBatches = this.calculateDynamicMaxBatches();

        const canLaunchWave = this.activeBatches.size < dynamicMaxBatches &&
          (now - this.lastBatchTime) >= effectiveCycleDelay;

        if (canLaunchWave) {
          const currentTarget = this.targetManager.getCurrentTarget();

          // In burst mode, try to launch multiple waves to fill RAM faster
          let totalBatchesScheduled = 0;
          const maxWaves = isLowUtilization ? 5 : 1; // Launch up to 5 waves in burst mode

          for (let wave = 0; wave < maxWaves && this.activeBatches.size < dynamicMaxBatches; wave++) {
            const batchesScheduled = await this.waveScheduler.scheduleWaveSequence(currentTarget);
            if (batchesScheduled === 0) break; // Stop if no batches could be scheduled

            totalBatchesScheduled += batchesScheduled;

            // Small delay between waves in burst mode
            if (wave < maxWaves - 1 && isLowUtilization) {
              await this.ns.sleep(100); // 100ms between burst waves
            }
          }

          if (totalBatchesScheduled > 0) {
            this.lastBatchTime = now;
            const modeText = isLowUtilization ? `🚀 BURST (${maxWaves} waves)` : "🌊";
            this.logger.info(`${modeText} Launched ${totalBatchesScheduled} batches for ${currentTarget} (util: ${(utilizationRatio * 100).toFixed(1)}%)`);
          }
        }

        // Update performance metrics and utilization tracking
        await this.performanceTracker.updatePerformanceMetrics();

        // Update utilization tracking (like Alain's approach)
        const utilization = this.calculateNetworkUtilization();
        this.utilizationTracker.updateUtilization(utilization);

        // Manage share scripts on servers with excess RAM
        await this.manageShareScripts();

        // AUTO-CRACK: Periodically scan and root new servers
        await this.autoCrackServers();

        // Execute prep system for non-targeted servers needing preparation  
        await this.executePrepSystem();

        // Show dashboard with dynamic batch information
        await this.performanceTracker.showDashboard(
          this.targetManager,
          dynamicMaxBatches,
          this.eventProcessor.getEventQueueSize()
        );

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

  /**
   * Execute prep system for servers needing preparation
   */
  private async executePrepSystem(): Promise<void> {
    try {
      const currentTarget = this.targetManager.getCurrentTarget();
      if (!currentTarget) return;

      // Get available RAM for prep operations (use 20% of total RAM) 
      const allServers = BotnetUtilities.getAllServers(this.ns);
      const totalRAM = allServers
        .filter(server => this.ns.hasRootAccess(server))
        .reduce((total, server) => total + (this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server)), 0);

      const availablePrepRAM = totalRAM * 0.2;
      if (availablePrepRAM < 50) return; // Need at least 50GB for meaningful prep

      // Find servers that need prepping (excluding current target)
      const prepCandidates: Array<{
        hostname: string;
        securityGap: number;
        moneyRatio: number;
        priority: number;
      }> = [];

      for (const hostname of allServers) {
        if (hostname === currentTarget || hostname === 'home') continue;

        const analysis = BotnetUtilities.analyzeTarget(this.ns, hostname, this.config);
        if (!analysis) continue;

        // Check if server needs prep (not optimal)
        if (!analysis.isOptimal && analysis.maxMoney > this.config.minTargetMoney) {
          const securityGap = analysis.securityLevel - analysis.minSecurityLevel;
          const moneyRatio = analysis.currentMoneyRatio;

          // Priority score: higher security gap and lower money = higher priority
          const priority = securityGap * 2 + (1 - moneyRatio) * 3;

          prepCandidates.push({
            hostname,
            securityGap,
            moneyRatio,
            priority
          });
        }
      }

      if (prepCandidates.length === 0) return;

      // Sort by priority (highest first) and take top candidate
      prepCandidates.sort((a, b) => b.priority - a.priority);
      const prepTarget = prepCandidates[0];

      // Calculate prep threads needed
      const weakenThreadsNeeded = Math.max(0, Math.ceil(prepTarget.securityGap / 0.05));
      const growthNeeded = Math.max(1, 1 / Math.max(0.01, prepTarget.moneyRatio));
      const growThreadsNeeded = Math.min(1000, Math.ceil(this.ns.growthAnalyze(prepTarget.hostname, growthNeeded)));

      // Estimate RAM needed
      const prepRAMNeeded = (weakenThreadsNeeded + growThreadsNeeded) * 1.75;

      if (prepRAMNeeded <= availablePrepRAM && (weakenThreadsNeeded > 0 || growThreadsNeeded > 0)) {
        // Launch prep operations distributed across servers
        let remainingWeaken = weakenThreadsNeeded;
        let remainingGrow = growThreadsNeeded;

        for (const server of allServers) {
          if (remainingWeaken === 0 && remainingGrow === 0) break;
          if (!this.ns.hasRootAccess(server) || this.ns.getServerMaxRam(server) === 0) continue;

          const availableRAM = this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server);
          if (availableRAM < 1.75) continue;

          // Launch weaken threads first
          if (remainingWeaken > 0) {
            const weakenToLaunch = Math.min(remainingWeaken, Math.floor(availableRAM / 1.75));
            if (weakenToLaunch > 0) {
              this.ns.exec('remote/wk.js', server, weakenToLaunch, prepTarget.hostname, Date.now(), 'prep');
              remainingWeaken -= weakenToLaunch;
            }
          }

          // Launch grow threads with remaining RAM
          const remainingRAM = availableRAM - (Math.min(remainingWeaken, Math.floor(availableRAM / 1.75)) * 1.75);
          if (remainingGrow > 0 && remainingRAM >= 1.75) {
            const growToLaunch = Math.min(remainingGrow, Math.floor(remainingRAM / 1.75));
            if (growToLaunch > 0) {
              this.ns.exec('remote/gr.js', server, growToLaunch, prepTarget.hostname, Date.now(), 'prep');
              remainingGrow -= growToLaunch;
            }
          }
        }

        const totalLaunched = (weakenThreadsNeeded - remainingWeaken) + (growThreadsNeeded - remainingGrow);
        if (totalLaunched > 0) {
          this.logger.info(`🔧 PREP: ${prepTarget.hostname} | W:${weakenThreadsNeeded - remainingWeaken}t G:${growThreadsNeeded - remainingGrow}t | Pri:${prepTarget.priority.toFixed(1)}`);
        }
      }

    } catch (error) {
      // Silent failure for prep system to avoid spam
    }
  }
}

// ===== MAIN FUNCTION =====
// Usage: run botnet.js [--debug|-d] [--share|-s] [--cleanup|-c]
//   --debug/-d:   Enable debug mode with enhanced logging
//   --share/-s:   Enable automatic sharing on servers with excess RAM
//   --cleanup/-c: Clean up remote scripts and exit

export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL');
  
  // Early exit if prerequisites not met
  const prereqCheck = checkPrerequisites(ns);
  if (!prereqCheck.ready) {
    ns.tprint(`WARN: Botnet script cannot run - ${prereqCheck.reason}`);
    ns.tprint(`      Consider running server-manager.ts to root more servers or upgrading home RAM`);
    return;
  }

  // Check for debug flag
  const debugMode = ns.args.includes('--debug') || ns.args.includes('-d');

  // Check for share flag
  const shareMode = ns.args.includes('--share') || ns.args.includes('-s');

  // Check for cleanup flag
  if (ns.args.includes('--cleanup') || ns.args.includes('-c') || ns.args.includes('--clean')) {
    cleanupRemoteScriptsSync(ns);
    return;
  }

  const controller = new BotnetController(ns, debugMode);

  // Enable sharing if requested
  if (shareMode) {
    controller.setSharing(true);
  }

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
  const remoteScripts = ['remote/hk.js', 'remote/gr.js', 'remote/wk.js', 'remote/sh.js'];

  ns.tprint(`🔍 Scanning ${servers.length} servers for remote scripts...`);

  for (const server of servers) {
    if (ns.hasRootAccess(server)) {
      totalScanned++;

      // Get all running scripts on this server for debugging
      const runningScripts = ns.ps(server);
      const botnetScripts = runningScripts.filter(script =>
        script.filename.startsWith('remote/')
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