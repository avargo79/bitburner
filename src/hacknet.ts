import { NS } from "@ns";

// Lightweight interfaces for standalone operation
interface HacknetConfig {
  enabled: boolean;
  maxInvestment: number;
  minROIThreshold: number;
  capitalAllocation: {
    reserveRatio: number;
    minCashBuffer: number;
    maxHacknetShare: number;
  };
  upgradePreferences: {
    prioritizeLevel: boolean;
    prioritizeRAM: boolean;
    prioritizeCores: boolean;
    maxLevel: number;
    maxRAM: number;
    maxCores: number;
  };
  factionRequirements: {
    targetTotalLevels: number; // Target total levels for Netburners faction (100)
    prioritizeFactionGoal: boolean; // Prioritize reaching faction requirement over ROI
  };
  debug: boolean;
}

interface HacknetNode {
  index: number;
  name: string;
  level: number;
  ram: number;
  cores: number;
  production: number;
  totalProduction: number;
  timeOnline: number;
  upgradeCosts: {
    level: number;
    ram: number;
    cores: number;
  };
  roi: {
    level: number;
    ram: number;
    cores: number;
  };
  status: string;
}

interface HacknetMetrics {
  totalNodes: number;
  totalProduction: number;
  totalInvestment: number;
  totalReturn: number;
  averageROI: number;
  cashGenerated: number;
  uptime: number;
}

interface HacknetOpportunity {
  type: 'new_node' | 'upgrade_level' | 'upgrade_ram' | 'upgrade_cores';
  nodeIndex?: number;
  cost: number;
  benefit: number;
  roi: number;
  priority: number;
  description: string;
}

// Configuration and state
let config: HacknetConfig;
let debug = false;
let startTime = 0;
let nodes: HacknetNode[] = [];
let metrics: HacknetMetrics = {
  totalNodes: 0,
  totalProduction: 0,
  totalInvestment: 0,
  totalReturn: 0,
  averageROI: 0,
  cashGenerated: 0,
  uptime: 0
};
let opportunities: HacknetOpportunity[] = [];
let totalInvestment = 0;
let lastCashAmount = 0;

const defaultHacknetConfig: HacknetConfig = {
  enabled: true,
  maxInvestment: 50000000, // 50M max investment
  minROIThreshold: 0.1, // 10% minimum ROI for upgrades
  capitalAllocation: {
    reserveRatio: 0.3, // Keep 30% cash as reserve
    minCashBuffer: 1000000, // Keep at least 1M cash
    maxHacknetShare: 0.4 // Max 40% of available cash for hacknet
  },
  upgradePreferences: {
    prioritizeLevel: true,
    prioritizeRAM: false,
    prioritizeCores: false,
    maxLevel: 200,
    maxRAM: 64,
    maxCores: 16
  },
  factionRequirements: {
    targetTotalLevels: 100, // Netburners faction requirement
    prioritizeFactionGoal: true // Prioritize reaching 100 levels over pure ROI
  },
  debug: false
};

// Command line arguments schema
const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['help', false],
];

/**
 * Main entry point for standalone hacknet optimization system
 */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.clearLog();
  
  // Parse command line arguments
  const flags = ns.flags(argsSchema);
  
  // Handle help flag
  if (flags.help) {
    showHelp(ns);
    return;
  }
  
  // Set debug mode from flags
  debug = false; // Explicitly reset debug mode
  if (flags.debug) {
    debug = true;
  }
  
  // Check for existing hacknet instances
  const runningScripts = ns.ps();
  for (const script of runningScripts) {
    if (script.filename === 'hacknet.js' && script.pid !== ns.getRunningScript()?.pid) {
      ns.tprint(`[Hacknet] Another hacknet instance is already running (PID: ${script.pid}). Exiting.`);
      return;
    }
  }
  
  // Initialize configuration
  loadConfiguration(ns);
  loadInitialData(ns);
  startTime = Date.now();
  lastCashAmount = ns.getServerMoneyAvailable("home");
  
  if (debug) ns.tprint("[Hacknet] Starting standalone hacknet optimization system...");
  
  // Main optimization loop
  while (true) {
    try {
      await updateNodeData(ns);
      await analyzeOpportunities(ns);
      await executeOptimizations(ns);
      updateMetrics(ns);
      
      // Update status display with error handling
      try {
        updateStatusDisplay(ns);
      } catch (statusErr) {
        if (debug) ns.tprint('[Hacknet] Status display error: ' + statusErr);
      }
      
      await ns.sleep(5000); // Run every 5 seconds
    } catch (err) {
      ns.tprint('[Hacknet] ERROR: ' + (err && (err as any).message ? (err as any).message : err));
      await ns.sleep(15000); // Wait longer on error
    }
  }
}

/**
 * Show help information
 */
function showHelp(ns: NS): void {
  ns.tprint("=== Standalone Hacknet Optimization System ===");
  ns.tprint("");
  ns.tprint("Usage: run hacknet.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug     Enable verbose debug output");
  ns.tprint("  --help      Show this help message");
  ns.tprint("");
  ns.tprint("Examples:");
  ns.tprint("  run hacknet.js               # Run with default settings (quiet)");
  ns.tprint("  run hacknet.js --debug       # Run with verbose output");
  ns.tprint("  tail hacknet.js              # View real-time status display");
  ns.tprint("");
  ns.tprint("The hacknet system runs independently with ROI-driven optimization.");
  ns.tprint("Use 'tail hacknet.js' to view a real-time status dashboard with:");
  ns.tprint("• Node overview with production and stats");
  ns.tprint("• Investment tracking and ROI analysis");
  ns.tprint("• Upgrade opportunities ranked by ROI");
  ns.tprint("• Capital allocation and coordination with other systems");
}

/**
 * Load hacknet configuration
 */
function loadConfiguration(ns: NS): void {
  config = { ...defaultHacknetConfig };
  config.debug = debug;
  
  if (debug) {
    ns.tprint("[Hacknet] Configuration loaded:");
    ns.tprint(`  Max Investment: $${ns.formatNumber(config.maxInvestment)}`);
    ns.tprint(`  Min ROI Threshold: ${(config.minROIThreshold * 100).toFixed(1)}%`);
    ns.tprint(`  Reserve Ratio: ${(config.capitalAllocation.reserveRatio * 100).toFixed(1)}%`);
  }
}

/**
 * Load initial hacknet data
 */
function loadInitialData(ns: NS): void {
  // Calculate total investment so far
  totalInvestment = 0;
  
  // Initialize nodes array based on existing hacknet nodes
  nodes = [];
  for (let i = 0; i < ns.hacknet.numNodes(); i++) {
    const nodeStats = ns.hacknet.getNodeStats(i);
    totalInvestment += nodeStats.totalProduction * 0.1; // Rough estimate
    
    nodes.push({
      index: i,
      name: nodeStats.name,
      level: nodeStats.level,
      ram: nodeStats.ram,
      cores: nodeStats.cores,
      production: nodeStats.production,
      totalProduction: nodeStats.totalProduction,
      timeOnline: nodeStats.timeOnline,
      upgradeCosts: {
        level: 0,
        ram: 0,
        cores: 0
      },
      roi: {
        level: 0,
        ram: 0,
        cores: 0
      },
      status: 'active'
    });
  }
  
  if (debug) {
    ns.tprint(`[Hacknet] Loaded ${nodes.length} existing nodes`);
    ns.tprint(`[Hacknet] Estimated total investment: $${ns.formatNumber(totalInvestment)}`);
  }
}

/**
 * Update node data and costs
 */
async function updateNodeData(ns: NS): Promise<void> {
  // Update existing nodes
  for (let i = 0; i < nodes.length; i++) {
    const nodeStats = ns.hacknet.getNodeStats(i);
    const node = nodes[i];
    
    node.level = nodeStats.level;
    node.ram = nodeStats.ram;
    node.cores = nodeStats.cores;
    node.production = nodeStats.production;
    node.totalProduction = nodeStats.totalProduction;
    node.timeOnline = nodeStats.timeOnline;
    
    // Update upgrade costs
    node.upgradeCosts.level = ns.hacknet.getLevelUpgradeCost(i, 1);
    node.upgradeCosts.ram = ns.hacknet.getRamUpgradeCost(i, 1);
    node.upgradeCosts.cores = ns.hacknet.getCoreUpgradeCost(i, 1);
    
    // Calculate ROI for each upgrade type
    const currentProduction = node.production;
    
    // Estimate production increase for each upgrade
    const levelUpgradeIncrease = currentProduction * 0.01; // ~1% increase per level
    const ramUpgradeIncrease = currentProduction * 0.07; // ~7% increase per RAM upgrade
    const coreUpgradeIncrease = currentProduction * 0.05; // ~5% increase per core upgrade
    
    // Calculate payback time for each upgrade type (more realistic than ROI)
    const levelUpgradePayback = node.upgradeCosts.level > 0 ? node.upgradeCosts.level / (levelUpgradeIncrease * 3600) : Infinity;
    const ramUpgradePayback = node.upgradeCosts.ram > 0 ? node.upgradeCosts.ram / (ramUpgradeIncrease * 3600) : Infinity;
    const coreUpgradePayback = node.upgradeCosts.cores > 0 ? node.upgradeCosts.cores / (coreUpgradeIncrease * 3600) : Infinity;
    
    node.roi.level = levelUpgradePayback < Infinity ? levelUpgradeIncrease / node.upgradeCosts.level : 0;
    node.roi.ram = ramUpgradePayback < Infinity ? ramUpgradeIncrease / node.upgradeCosts.ram : 0;
    node.roi.cores = coreUpgradePayback < Infinity ? coreUpgradeIncrease / node.upgradeCosts.cores : 0;
  }
  
  // Add new nodes if they exist
  const currentNodeCount = ns.hacknet.numNodes();
  if (currentNodeCount > nodes.length) {
    for (let i = nodes.length; i < currentNodeCount; i++) {
      const nodeStats = ns.hacknet.getNodeStats(i);
      nodes.push({
        index: i,
        name: nodeStats.name,
        level: nodeStats.level,
        ram: nodeStats.ram,
        cores: nodeStats.cores,
        production: nodeStats.production,
        totalProduction: nodeStats.totalProduction,
        timeOnline: nodeStats.timeOnline,
        upgradeCosts: {
          level: ns.hacknet.getLevelUpgradeCost(i, 1),
          ram: ns.hacknet.getRamUpgradeCost(i, 1),
          cores: ns.hacknet.getCoreUpgradeCost(i, 1)
        },
        roi: { level: 0, ram: 0, cores: 0 },
        status: 'active'
      });
    }
  }
}

/**
 * Analyze upgrade and purchase opportunities
 */
async function analyzeOpportunities(ns: NS): Promise<void> {
  opportunities = [];
  
  if (!config.enabled) return;
  
  const currentCash = ns.getServerMoneyAvailable("home");
  const availableCash = Math.max(0, currentCash - config.capitalAllocation.minCashBuffer);
  const maxSpendable = Math.min(
    availableCash * config.capitalAllocation.maxHacknetShare,
    config.maxInvestment - totalInvestment
  );
  
  if (maxSpendable <= 0) return;
  
  // Calculate current total levels for faction requirement
  const totalLevels = nodes.reduce((sum, node) => sum + node.level, 0);
  const needsMoreLevelsForFaction = totalLevels < config.factionRequirements.targetTotalLevels;
  
  if (debug) {
    ns.tprint(`[Hacknet] Total levels: ${totalLevels}/${config.factionRequirements.targetTotalLevels} (Netburners faction)`);
  }
  
  // Analyze new node purchase - prioritize for faction efficiency
  if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    if (newNodeCost <= maxSpendable) {
      const estimatedProduction = nodes.length === 0 ? 1.5 : 2.0;
      const paybackHours = newNodeCost / (estimatedProduction * 3600);
      
      // When working toward faction goal, prioritize getting to 10-12 nodes first
      const targetNodeCount = Math.ceil(config.factionRequirements.targetTotalLevels / 10); // ~10 nodes for 100 levels
      const shouldPrioritizeMoreNodes = needsMoreLevelsForFaction && nodes.length < targetNodeCount;
      
      // More generous payback for new nodes when building toward faction goal
      const acceptablePaybackHours = shouldPrioritizeMoreNodes ? 2160 : (nodes.length < 3 ? 720 : 240); // 90 days vs 30/10 days
      
      if (debug) {
        ns.tprint(`[Hacknet] New node analysis: Cost=$${ns.formatNumber(newNodeCost)}, Payback=${paybackHours.toFixed(1)}h, Max=${acceptablePaybackHours}h, Target nodes: ${targetNodeCount}`);
      }
      
      if (paybackHours <= acceptablePaybackHours) {
        // Massive priority boost for new nodes when building faction base
        const factionNodeBonus = shouldPrioritizeMoreNodes ? 5000 : 0;
        const basePriority = (1 / paybackHours) * 1000;
        
        opportunities.push({
          type: 'new_node',
          cost: newNodeCost,
          benefit: estimatedProduction,
          roi: estimatedProduction / newNodeCost,
          priority: basePriority + factionNodeBonus,
          description: `Purchase new hacknet node (${ns.hacknet.numNodes() + 1}/${ns.hacknet.maxNumNodes()})${shouldPrioritizeMoreNodes ? ' [FACTION BASE]' : ''}`
        });
      }
    }
  }
  
  // Analyze upgrades for existing nodes
  for (const node of nodes) {
    // Level upgrades - prioritize even distribution for faction efficiency
    if (node.level < config.upgradePreferences.maxLevel) {
      const cost = node.upgradeCosts.level;
      const benefit = node.production * 0.01;
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;
      
      // When working toward faction goal, prefer upgrading lower-level nodes first
      const averageLevel = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.level, 0) / nodes.length : 1;
      const isLowLevelNode = node.level <= averageLevel; // This node is at or below average
      const shouldPrioritizeEvenLevels = needsMoreLevelsForFaction && config.factionRequirements.prioritizeFactionGoal;
      
      // More generous payback time if we need levels for faction, especially for low-level nodes
      const maxPaybackHours = shouldPrioritizeEvenLevels && isLowLevelNode ? 1440 : (needsMoreLevelsForFaction ? 720 : 240); // 60/30/10 days
      
      if (cost <= maxSpendable && cost > 0 && paybackHours <= maxPaybackHours) {
        // Extra priority boost for evening out levels when working toward faction
        const factionBonus = shouldPrioritizeEvenLevels && isLowLevelNode ? 3000 : (needsMoreLevelsForFaction ? 2000 : 0);
        const basePriority = (1 / paybackHours) * (config.upgradePreferences.prioritizeLevel ? 1500 : 1000);
        
        opportunities.push({
          type: 'upgrade_level',
          nodeIndex: node.index,
          cost: cost,
          benefit: benefit,
          roi: node.roi.level,
          priority: basePriority + factionBonus,
          description: `${node.name}: Level ${node.level} → ${node.level + 1}${needsMoreLevelsForFaction ? ' [FACTION]' : ''}${isLowLevelNode && shouldPrioritizeEvenLevels ? ' [SPREAD]' : ''}`
        });
      }
    }
    
    // RAM upgrades
    if (node.ram < config.upgradePreferences.maxRAM) {
      const cost = node.upgradeCosts.ram;
      const benefit = node.production * 0.07;
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;
      const maxPaybackHours = 240; // 10 days max payback for upgrades
      
      if (cost <= maxSpendable && cost > 0 && paybackHours <= maxPaybackHours) {
        opportunities.push({
          type: 'upgrade_ram',
          nodeIndex: node.index,
          cost: cost,
          benefit: benefit,
          roi: node.roi.ram,
          priority: (1 / paybackHours) * (config.upgradePreferences.prioritizeRAM ? 1500 : 1000),
          description: `${node.name}: RAM ${node.ram}GB → ${node.ram * 2}GB`
        });
      }
    }
    
    // Core upgrades
    if (node.cores < config.upgradePreferences.maxCores) {
      const cost = node.upgradeCosts.cores;
      const benefit = node.production * 0.05;
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;
      const maxPaybackHours = 240; // 10 days max payback for upgrades
      
      if (cost <= maxSpendable && cost > 0 && paybackHours <= maxPaybackHours) {
        opportunities.push({
          type: 'upgrade_cores',
          nodeIndex: node.index,
          cost: cost,
          benefit: benefit,
          roi: node.roi.cores,
          priority: (1 / paybackHours) * (config.upgradePreferences.prioritizeCores ? 1500 : 1000),
          description: `${node.name}: Cores ${node.cores} → ${node.cores + 1}`
        });
      }
    }
  }
  
  // Sort opportunities by priority (ROI)
  opportunities.sort((a, b) => b.priority - a.priority);
  
  if (debug && opportunities.length > 0) {
    ns.tprint(`[Hacknet] Found ${opportunities.length} upgrade opportunities`);
    for (let i = 0; i < Math.min(3, opportunities.length); i++) {
      const opp = opportunities[i];
      ns.tprint(`  ${i + 1}. ${opp.description} - Cost: $${ns.formatNumber(opp.cost)}, ROI: ${(opp.roi * 100).toFixed(2)}%`);
    }
  }
}

/**
 * Execute the best optimization opportunities
 */
async function executeOptimizations(ns: NS): Promise<void> {
  if (!config.enabled || opportunities.length === 0) return;
  
  const currentCash = ns.getServerMoneyAvailable("home");
  const availableCash = Math.max(0, currentCash - config.capitalAllocation.minCashBuffer);
  
  // Execute the best opportunity if we can afford it
  const bestOpp = opportunities[0];
  if (bestOpp.cost <= availableCash) {
    let success = false;
    
    try {
      switch (bestOpp.type) {
        case 'new_node':
          const nodeIndex = ns.hacknet.purchaseNode();
          if (nodeIndex >= 0) {
            totalInvestment += bestOpp.cost;
            success = true;
            if (debug) ns.tprint(`[Hacknet] Purchased new node: hacknet-node-${nodeIndex}`);
          }
          break;
          
        case 'upgrade_level':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeLevel(bestOpp.nodeIndex, 1);
            if (success) {
              totalInvestment += bestOpp.cost;
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;
          
        case 'upgrade_ram':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeRam(bestOpp.nodeIndex, 1);
            if (success) {
              totalInvestment += bestOpp.cost;
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;
          
        case 'upgrade_cores':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeCore(bestOpp.nodeIndex, 1);
            if (success) {
              totalInvestment += bestOpp.cost;
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;
      }
    } catch (err) {
      if (debug) ns.tprint(`[Hacknet] Failed to execute ${bestOpp.description}: ${err}`);
    }
  }
}

/**
 * Update metrics and statistics
 */
function updateMetrics(ns: NS): void {
  const currentCash = ns.getServerMoneyAvailable("home");
  const cashIncrease = Math.max(0, currentCash - lastCashAmount);
  
  metrics.totalNodes = nodes.length;
  metrics.totalProduction = nodes.reduce((sum, node) => sum + node.production, 0);
  metrics.totalInvestment = totalInvestment;
  metrics.totalReturn = nodes.reduce((sum, node) => sum + node.totalProduction, 0);
  metrics.averageROI = metrics.totalInvestment > 0 ? metrics.totalReturn / metrics.totalInvestment : 0;
  metrics.cashGenerated += cashIncrease;
  metrics.uptime = Date.now() - startTime;
  
  lastCashAmount = currentCash;
}

/**
 * Update status display for tailing
 */
function updateStatusDisplay(ns: NS): void {
  const currentCash = ns.getServerMoneyAvailable("home");
  const availableCash = Math.max(0, currentCash - config.capitalAllocation.minCashBuffer);
  const maxSpendable = Math.min(
    availableCash * config.capitalAllocation.maxHacknetShare,
    config.maxInvestment - totalInvestment
  );
  
  ns.clearLog();
  
  // Header
  ns.print("┌─────────────────────────────────────────────────────────────────────────────┐");
  ns.print("│                      🖧 HACKNET OPTIMIZATION SYSTEM                         │");
  ns.print("└─────────────────────────────────────────────────────────────────────────────┘");
  
  // Status overview with faction progress and strategy
  const uptimeHours = metrics.uptime / (1000 * 60 * 60);
  const status = config.enabled ? "🟢 ACTIVE" : "🔴 DISABLED";
  const totalLevels = nodes.reduce((sum, node) => sum + node.level, 0);
  const factionProgress = totalLevels >= config.factionRequirements.targetTotalLevels ? "✅" : `${totalLevels}/${config.factionRequirements.targetTotalLevels}`;
  
  const targetNodeCount = Math.ceil(config.factionRequirements.targetTotalLevels / 10);
  const needsMoreNodes = totalLevels < config.factionRequirements.targetTotalLevels && nodes.length < targetNodeCount;
  const strategy = needsMoreNodes ? `🎯 BUILD TO ${targetNodeCount} NODES` : (totalLevels < config.factionRequirements.targetTotalLevels ? "🎯 SPREAD LEVELS" : "💰 OPTIMIZE ROI");
  
  ns.print(`Status: ${status}  |  Uptime: ${uptimeHours.toFixed(1)}h  |  Nodes: ${metrics.totalNodes}/${ns.hacknet.maxNumNodes()}`);
  ns.print(`Netburners Faction: ${factionProgress}  |  Strategy: ${strategy}`);
  ns.print("");
  
  // Financial overview
  ns.print("┌─ FINANCIAL OVERVIEW");
  ns.print(`│ Total Investment:    $${ns.formatNumber(metrics.totalInvestment)}`);
  ns.print(`│ Total Return:        $${ns.formatNumber(metrics.totalReturn)}`);
  ns.print(`│ Net Profit:          $${ns.formatNumber(metrics.totalReturn - metrics.totalInvestment)}`);
  ns.print(`│ Current Production:  $${ns.formatNumber(metrics.totalProduction)}/sec`);
  ns.print(`│ Available to Spend:  $${ns.formatNumber(maxSpendable)}`);
  ns.print("");
  
  // Nodes overview
  if (nodes.length > 0) {
    ns.print("┌─ HACKNET NODES");
    
    // Show top 6 most productive nodes
    const sortedNodes = [...nodes].sort((a, b) => b.production - a.production);
    const displayNodes = sortedNodes.slice(0, 6);
    
    for (const node of displayNodes) {
      const prodDisplay = `$${ns.formatNumber(node.production)}/s`;
      const levelDisplay = `L${node.level}`;
      const ramDisplay = `${node.ram}GB`;
      const coresDisplay = `${node.cores}c`;
      const totalDisplay = `$${ns.formatNumber(node.totalProduction)}`;
      
      ns.print(`│ ${node.name.padEnd(15)} ${prodDisplay.padEnd(10)} ${levelDisplay.padEnd(4)} ${ramDisplay.padEnd(6)} ${coresDisplay.padEnd(4)} ${totalDisplay}`);
    }
    
    if (nodes.length > 6) {
      ns.print(`│ ... and ${nodes.length - 6} more nodes`);
    }
    
    ns.print("");
  }
  
  // Upgrade opportunities
  if (opportunities.length > 0) {
    ns.print("┌─ UPGRADE OPPORTUNITIES");
    
    const displayOpps = opportunities.slice(0, 5);
    for (let i = 0; i < displayOpps.length; i++) {
      const opp = displayOpps[i];
      const costDisplay = `$${ns.formatNumber(opp.cost)}`;
      const roiDisplay = `${(opp.roi * 100).toFixed(1)}%`;
      const priority = i === 0 ? "🔥" : "  ";
      
      ns.print(`│ ${priority} ${opp.description.padEnd(40)} ${costDisplay.padEnd(12)} ${roiDisplay}`);
    }
    
    if (opportunities.length > 5) {
      ns.print(`│ ... and ${opportunities.length - 5} more opportunities`);
    }
    
    ns.print("");
  } else if (config.enabled) {
    ns.print("┌─ NO OPPORTUNITIES");
    ns.print("│ No profitable upgrades available at current ROI threshold");
    ns.print(`│ Minimum ROI required: ${(config.minROIThreshold * 100).toFixed(1)}%`);
    ns.print("");
  }
  
  ns.print("");
  
  // Configuration summary
  const currentTotalLevels = nodes.reduce((sum, node) => sum + node.level, 0);
  const factionStatus = currentTotalLevels >= config.factionRequirements.targetTotalLevels ? "✅ READY" : "🎯 WORKING";
  
  ns.print("┌─ CONFIGURATION");
  ns.print(`│ Max Investment:   $${ns.formatNumber(config.maxInvestment)}  Min ROI: ${(config.minROIThreshold * 100).toFixed(1)}%`);
  ns.print(`│ Reserve Ratio:    ${(config.capitalAllocation.reserveRatio * 100).toFixed(0)}%          Cash Buffer: $${ns.formatNumber(config.capitalAllocation.minCashBuffer)}`);
  ns.print(`│ Netburners Goal:  ${factionStatus}     Levels: ${currentTotalLevels}/${config.factionRequirements.targetTotalLevels}`);
}