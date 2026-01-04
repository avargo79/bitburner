import { NS } from "@ns";

// Lightweight interfaces for standalone operation
interface HacknetConfig {
  enabled: boolean;
  maxPayoffTime: number; // Max hours for payback (more intuitive than ROI %)
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
  hashSpend: {
    enabled: boolean;
    strategy: 'money' | 'corp' | 'bladeburner' | 'contract';
    targetCorpFund: number; // Spend on Corp Funds until this amount
    minHashBuffer: number; // Keep this many hashes
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
    cache: number;
  };
  roi: {
    level: number;
    ram: number;
    cores: number;
    cache: number;
  };
  stats: {
    cache: number;
    hashCapacity: number;
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
  type: 'new_node' | 'upgrade_level' | 'upgrade_ram' | 'upgrade_cores' | 'upgrade_cache';
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
let lastCashAmount = 0;
let isServerMode = false;
let hashesSpentThisSession = 0;
let hashSpendingTarget = "";
const CACHE_FULL_THRESHOLD = 0.9;
const HASH_VALUE = 250000; // 4 hashes = $1M, so 1 hash = $250k


const defaultHacknetConfig: HacknetConfig = {
  enabled: true,
  maxPayoffTime: 72, // Max 72 hours (3 days) payback time for short bitnode runs
  capitalAllocation: {
    reserveRatio: 0.15, // Keep 15% cash as reserve (more aggressive for short runs)
    minCashBuffer: 1000000, // Keep at least 1M cash
    maxHacknetShare: 0.6 // Max 60% of available cash for hacknet (aggressive short-run strategy)
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
    prioritizeFactionGoal: false // Don't prioritize faction in short 3-4 day runs
  },
  hashSpend: {
    enabled: true,
    strategy: 'money',
    targetCorpFund: 1e9,
    minHashBuffer: 4 // Keep minimum 4 hashes for purchase
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
      if (isServerMode) manageHashes(ns);
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
    ns.tprint(`  Max Payoff Time: ${config.maxPayoffTime.toFixed(0)} hours`);
    ns.tprint(`  Max Hacknet Share: ${(config.capitalAllocation.maxHacknetShare * 100).toFixed(0)}% of available cash`);
    ns.tprint(`  Reserve Ratio: ${(config.capitalAllocation.reserveRatio * 100).toFixed(1)}%`);
  }
}

/**
 * Load initial hacknet data
 */
function loadInitialData(ns: NS): void {
  // Check if we are in Hacknet Server mode (BitNode-9 or SF9)
  // We check if the first node has hash capacity (if nodes exist) or checking hash capacity cost
  isServerMode = ns.hacknet.numNodes() > 0 ? ns.hacknet.hashCapacity() > 0 : ns.hacknet.getHashUpgradeLevel("Sell for Money") !== -1;

  if (debug) ns.tprint(`[Hacknet] Mode: ${isServerMode ? 'SERVER (Hashes)' : 'NODE (Money)'}`);

  // Initialize nodes array based on existing hacknet nodes
  nodes = [];
  for (let i = 0; i < ns.hacknet.numNodes(); i++) {
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
        level: 0,
        ram: 0,
        cores: 0,
        cache: 0
      },
      roi: {
        level: 0,
        ram: 0,
        cores: 0,
        cache: 0
      },
      stats: {
        cache: isServerMode ? (nodeStats.cache || 1) : 0,
        hashCapacity: isServerMode ? ns.hacknet.hashCapacity() : 0
      },
      status: 'active'
    });
  }

  if (debug) {
    ns.tprint(`[Hacknet] Loaded ${nodes.length} existing nodes`);
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

    if (isServerMode) {
      node.stats.cache = nodeStats.cache || 1;
      node.stats.hashCapacity = ns.hacknet.hashCapacity(); // Capacity is global but stats object is per node structure

      // Try to get accurate production using Formulas API (accounts for script RAM usage)
      try {
        const player = ns.getPlayer();
        const ramUsed = ns.getServerUsedRam(nodeStats.name);
        node.production = ns.formulas.hacknetServers.hashGainRate(
          nodeStats.level,
          ramUsed,
          nodeStats.ram,
          nodeStats.cores,
          player.mults.hacknet_node_money
        ) * HASH_VALUE;
      } catch {
        // Fallback if no Formulas API: Use reported production
        // Note: This will be inaccurate if scripts are running on hacknet servers
        node.production = nodeStats.production * HASH_VALUE;
      }
    }

    // Update upgrade costs
    node.upgradeCosts.level = ns.hacknet.getLevelUpgradeCost(i, 1);
    node.upgradeCosts.ram = ns.hacknet.getRamUpgradeCost(i, 1);
    node.upgradeCosts.cores = ns.hacknet.getCoreUpgradeCost(i, 1);
    node.upgradeCosts.cache = isServerMode ? ns.hacknet.getCacheUpgradeCost(i, 1) : 0;

    // Calculate ROI for each upgrade type
    const currentProductionValue = node.production; // This is now $/sec for both modes

    // Bitburner production formula: Production = Level × RAM_multiplier × Cores_multiplier × Constants
    // RAM_multiplier = 1.5^log2(RAM)
    // Cores_multiplier = (Cores + 5)
    // 
    // For accurate ROI, calculate the production increase from each upgrade:

    // Level upgrade: Linear increase (Level + 1) / Level
    const levelMultiplier = node.level / (node.level + 1);
    const levelUpgradeIncrease = currentProductionValue * (1 / levelMultiplier - 1);

    // RAM upgrade: RAM doubles, so multiplier goes from 1.5^log2(RAM) to 1.5^log2(RAM*2) = 1.5^(log2(RAM)+1)
    // Increase factor = 1.5^(log2(RAM)+1) / 1.5^log2(RAM) = 1.5
    const ramUpgradeIncrease = currentProductionValue * 0.5; // 50% increase when RAM doubles

    // Cores upgrade: Goes from (Cores + 5) to (Cores + 6)
    const coresMultiplier = (node.cores + 5) / (node.cores + 6);
    const coreUpgradeIncrease = currentProductionValue * (1 / coresMultiplier - 1);

    // Calculate payback time in hours
    const levelUpgradePayback = node.upgradeCosts.level > 0 ? node.upgradeCosts.level / (levelUpgradeIncrease * 3600) : Infinity;
    const ramUpgradePayback = node.upgradeCosts.ram > 0 ? node.upgradeCosts.ram / (ramUpgradeIncrease * 3600) : Infinity;
    const coreUpgradePayback = node.upgradeCosts.cores > 0 ? node.upgradeCosts.cores / (coreUpgradeIncrease * 3600) : Infinity;

    node.roi.level = levelUpgradePayback < Infinity ? 1 / levelUpgradePayback : 0; // Using 1/Payback is better ROI metric
    node.roi.ram = ramUpgradePayback < Infinity ? 1 / ramUpgradePayback : 0;
    node.roi.cores = coreUpgradePayback < Infinity ? 1 / coreUpgradePayback : 0;

    // Cache ROI is special: It's infinite if we are full, 0 otherwise
    if (isServerMode && ns.hacknet.numHashes() > ns.hacknet.hashCapacity() * CACHE_FULL_THRESHOLD) {
      // If we are full on hashes, cache is critical
      node.roi.cache = 1.0; // Mega priority
    } else {
      node.roi.cache = 0;
    }
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
          cores: ns.hacknet.getCoreUpgradeCost(i, 1),
          cache: isServerMode ? ns.hacknet.getCacheUpgradeCost(i, 1) : 0
        },
        roi: { level: 0, ram: 0, cores: 0, cache: 0 },
        stats: {
          cache: isServerMode ? (nodeStats.cache || 1) : 0,
          hashCapacity: isServerMode ? ns.hacknet.hashCapacity() : 0
        },
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
  const maxSpendable = availableCash * config.capitalAllocation.maxHacknetShare;

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
      // Estimate production: Use worst node production or fallback to estimate
      let estimatedProduction = nodes.length === 0 ? 1.5 : Math.min(...nodes.map(n => n.production));

      // Calculate payback time
      const paybackHours = newNodeCost / (estimatedProduction * 3600);

      // When working toward faction goal, prioritize getting to 10-12 nodes first
      const targetNodeCount = Math.ceil(config.factionRequirements.targetTotalLevels / 10); // ~10 nodes for 100 levels
      const shouldPrioritizeMoreNodes = needsMoreLevelsForFaction && nodes.length < targetNodeCount;

      // Multi-tier purchasing strategy: More aggressive when cheap
      const playerMoney = currentCash;
      let acceptablePaybackHours: number;
      if (shouldPrioritizeMoreNodes) {
        acceptablePaybackHours = 2160; // 90 days for faction building
      } else if (newNodeCost < playerMoney * 0.001) {
        acceptablePaybackHours = 1e100; // Essentially infinite - always buy if < 0.1% of money
      } else if (newNodeCost < playerMoney * 0.01) {
        acceptablePaybackHours = 720; // 30 days if < 1% of money
      } else {
        acceptablePaybackHours = config.maxPayoffTime; // Use default max
      }

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
      const levelMultiplier = node.level / (node.level + 1);
      const benefit = node.production * (1 / levelMultiplier - 1);
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;

      // When working toward faction goal, prefer upgrading lower-level nodes first
      const averageLevel = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.level, 0) / nodes.length : 1;
      const isLowLevelNode = node.level <= averageLevel; // This node is at or below average
      const shouldPrioritizeEvenLevels = needsMoreLevelsForFaction && config.factionRequirements.prioritizeFactionGoal;

      // Multi-tier purchasing: adjust threshold based on cost
      let maxPaybackHours: number;
      if (shouldPrioritizeEvenLevels && isLowLevelNode) {
        maxPaybackHours = 1440; // 60 days for faction spread
      } else if (cost < currentCash * 0.001) {
        maxPaybackHours = 1e100; // Always buy if < 0.1% of money
      } else if (cost < currentCash * 0.01) {
        maxPaybackHours = 720; // 30 days if < 1% of money  
      } else {
        maxPaybackHours = config.maxPayoffTime; // Use default
      }

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
      const benefit = node.production * 0.5; // 50% increase when RAM doubles
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;

      // Multi-tier purchasing
      const maxPaybackHours = cost < currentCash * 0.001 ? 1e100 :
        cost < currentCash * 0.01 ? 720 :
          config.maxPayoffTime;

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
      const coresMultiplier = (node.cores + 5) / (node.cores + 6);
      const benefit = node.production * (1 / coresMultiplier - 1);
      const paybackHours = cost > 0 ? cost / (benefit * 3600) : Infinity;

      // Multi-tier purchasing
      const maxPaybackHours = cost < currentCash * 0.001 ? 1e100 :
        cost < currentCash * 0.01 ? 720 :
          config.maxPayoffTime;

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


    // Cache upgrades (Server Mode Only)
    // Only upgrade cache when:
    // 1. We're at/near capacity and wasting hashes (CRITICAL)
    // 2. We want to save up for expensive hash purchases but lack capacity
    // 3. The upgrade is very cheap (< 0.1% of money)
    if (isServerMode) {
      const cost = node.upgradeCosts.cache;
      const currentHashes = ns.hacknet.numHashes();
      const capacity = ns.hacknet.hashCapacity();
      const isNearCapacity = currentHashes > capacity * CACHE_FULL_THRESHOLD;
      const isVeryCheap = cost < currentCash * 0.001;

      // Find minimum cache level across all nodes
      const minCacheLevel = Math.min(...nodes.map(n => n.stats.cache));
      const shouldEvenOutCache = node.stats.cache <= minCacheLevel;

      if (cost <= maxSpendable && (isNearCapacity || (isVeryCheap && shouldEvenOutCache))) {
        opportunities.push({
          type: 'upgrade_cache',
          nodeIndex: node.index,
          cost: cost,
          benefit: 0,
          roi: isNearCapacity ? 999 : 0.01,
          priority: isNearCapacity ? 999999 : (isVeryCheap ? 100 : 1),
          description: `${node.name}: Cache ${node.stats.cache} → ${node.stats.cache + 1} ${isNearCapacity ? '(CRITICAL)' : ''}`
        });
      }
    }
  } // End for loop

  // Sort opportunities by priority (ROI)
  opportunities.sort((a, b) => b.priority - a.priority);

  if (debug && opportunities.length > 0) {
    ns.tprint(`[Hacknet] Found ${opportunities.length} upgrade opportunities`);
    for (let i = 0; i < Math.min(3, opportunities.length); i++) {
      const opp = opportunities[i];
      ns.tprint(`  ${i + 1}. ${opp.description} - Cost: $${ns.formatNumber(opp.cost)}, ROI: ${(opp.roi * 100).toFixed(2)}%`);
    }
  }
} // End function

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
            success = true;
            if (debug) ns.tprint(`[Hacknet] Purchased new node: hacknet-node-${nodeIndex}`);
          }
          break;

        case 'upgrade_level':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeLevel(bestOpp.nodeIndex, 1);
            if (success) {
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;

        case 'upgrade_ram':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeRam(bestOpp.nodeIndex, 1);
            if (success) {
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;

        case 'upgrade_cores':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeCore(bestOpp.nodeIndex, 1);
            if (success) {
              if (debug) ns.tprint(`[Hacknet] ${bestOpp.description} - $${ns.formatNumber(bestOpp.cost)}`);
            }
          }
          break;

        case 'upgrade_cache':
          if (bestOpp.nodeIndex !== undefined) {
            success = ns.hacknet.upgradeCache(bestOpp.nodeIndex, 1);
            if (success) {
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
 * Manage Hash Spending (Server Mode)
 */
function manageHashes(ns: NS): void {
  if (!config.hashSpend.enabled) return;

  // Check capacity
  const currentHashes = ns.hacknet.numHashes();
  const capacity = ns.hacknet.hashCapacity();

  // If we are near full, we MUST spend to avoid waste
  const isEmergency = currentHashes > capacity * 0.95;

  // Auto-detect Bladeburner membership and adjust strategy
  let effectiveStrategy = config.hashSpend.strategy;
  try {
    const inBladeburner = ns.bladeburner.inBladeburner();
    if (inBladeburner && effectiveStrategy === 'money') {
      effectiveStrategy = 'bladeburner'; // Auto-switch to bladeburner if joined
    } else if (!inBladeburner && effectiveStrategy === 'bladeburner') {
      effectiveStrategy = 'money'; // Fallback to money if not in bladeburner
    }
  } catch {
    // If bladeburner API not available, keep original strategy
  }

  // Strategy selection
  let spendTarget = "Sell for Money";
  if (effectiveStrategy === 'corp') {
    spendTarget = "Sell for Corporation Funds";
  } else if (effectiveStrategy === 'bladeburner') {
    spendTarget = "Exchange for Bladeburner Rank";
  } else if (effectiveStrategy === 'contract') {
    spendTarget = "Generate Coding Contract";
  }

  hashSpendingTarget = spendTarget;

  // Spend loop
  let spentThisLoop = 0;
  while (ns.hacknet.numHashes() > config.hashSpend.minHashBuffer) {
    const cost = ns.hacknet.hashCost(spendTarget);
    if (ns.hacknet.numHashes() < cost) break;

    if (ns.hacknet.spendHashes(spendTarget)) {
      spentThisLoop += cost;
      hashesSpentThisSession += cost;
    }

    if (!isEmergency && ns.hacknet.numHashes() < capacity * 0.8) break;
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
  // Estimate total investment from total production (rough but good enough)
  metrics.totalInvestment = nodes.reduce((sum, node) => sum + node.totalProduction, 0) * 0.5;
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
  const maxSpendable = availableCash * config.capitalAllocation.maxHacknetShare;

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
  if (isServerMode) {
    const hashRate = nodes.reduce((s, n) => s + (n.production / HASH_VALUE), 0);
    ns.print(`Hashes: ${Math.floor(ns.hacknet.numHashes())} / ${ns.hacknet.hashCapacity()}  |  Rate: ${ns.formatNumber(hashRate, 1)}/sec`);
    if (config.hashSpend.enabled && hashSpendingTarget) {
      const spendIcon = hashesSpentThisSession > 0 ? "💸" : "⏸️";
      ns.print(`Hash Spending: ${spendIcon} ${hashSpendingTarget} (${ns.formatNumber(hashesSpentThisSession, 0)} spent this session)`);
    }
  }
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
    ns.print("│ No profitable upgrades available at current payoff threshold");
    ns.print(`│ Max payoff time: ${config.maxPayoffTime.toFixed(0)} hours (${(config.maxPayoffTime / 24).toFixed(1)} days)`);
    ns.print("");
  }

  ns.print("");

  // Configuration summary
  const currentTotalLevels = nodes.reduce((sum, node) => sum + node.level, 0);
  const factionStatus = currentTotalLevels >= config.factionRequirements.targetTotalLevels ? "✅ READY" : "🎯 WORKING";

  ns.print("┌─ CONFIGURATION");
  ns.print(`│ Max Payoff:       ${config.maxPayoffTime}h (${(config.maxPayoffTime / 24).toFixed(1)}d)     Hacknet Budget: ${(config.capitalAllocation.maxHacknetShare * 100).toFixed(0)}% of available cash`);
  ns.print(`│ Reserve Ratio:    ${(config.capitalAllocation.reserveRatio * 100).toFixed(0)}%          Cash Buffer: $${ns.formatNumber(config.capitalAllocation.minCashBuffer)}`);
  ns.print(`│ Netburners Goal:  ${factionStatus}     Levels: ${currentTotalLevels}/${config.factionRequirements.targetTotalLevels}`);
}