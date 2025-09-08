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
    
    node.roi.level = node.upgradeCosts.level > 0 ? levelUpgradeIncrease / node.upgradeCosts.level : 0;
    node.roi.ram = node.upgradeCosts.ram > 0 ? ramUpgradeIncrease / node.upgradeCosts.ram : 0;
    node.roi.cores = node.upgradeCosts.cores > 0 ? coreUpgradeIncrease / node.upgradeCosts.cores : 0;
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
  
  // Analyze new node purchase
  if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    if (newNodeCost <= maxSpendable) {
      const estimatedProduction = 1.5; // Base production for new node
      const roi = estimatedProduction / newNodeCost;
      
      if (roi >= config.minROIThreshold) {
        opportunities.push({
          type: 'new_node',
          cost: newNodeCost,
          benefit: estimatedProduction,
          roi: roi,
          priority: roi * 100,
          description: `Purchase new hacknet node (${ns.hacknet.numNodes() + 1}/${ns.hacknet.maxNumNodes()})`
        });
      }
    }
  }
  
  // Analyze upgrades for existing nodes
  for (const node of nodes) {
    // Level upgrades
    if (node.level < config.upgradePreferences.maxLevel) {
      const cost = node.upgradeCosts.level;
      if (cost <= maxSpendable && cost > 0 && node.roi.level >= config.minROIThreshold) {
        opportunities.push({
          type: 'upgrade_level',
          nodeIndex: node.index,
          cost: cost,
          benefit: node.production * 0.01,
          roi: node.roi.level,
          priority: node.roi.level * (config.upgradePreferences.prioritizeLevel ? 150 : 100),
          description: `${node.name}: Level ${node.level} → ${node.level + 1}`
        });
      }
    }
    
    // RAM upgrades
    if (node.ram < config.upgradePreferences.maxRAM) {
      const cost = node.upgradeCosts.ram;
      if (cost <= maxSpendable && cost > 0 && node.roi.ram >= config.minROIThreshold) {
        opportunities.push({
          type: 'upgrade_ram',
          nodeIndex: node.index,
          cost: cost,
          benefit: node.production * 0.07,
          roi: node.roi.ram,
          priority: node.roi.ram * (config.upgradePreferences.prioritizeRAM ? 150 : 100),
          description: `${node.name}: RAM ${node.ram}GB → ${node.ram * 2}GB`
        });
      }
    }
    
    // Core upgrades
    if (node.cores < config.upgradePreferences.maxCores) {
      const cost = node.upgradeCosts.cores;
      if (cost <= maxSpendable && cost > 0 && node.roi.cores >= config.minROIThreshold) {
        opportunities.push({
          type: 'upgrade_cores',
          nodeIndex: node.index,
          cost: cost,
          benefit: node.production * 0.05,
          roi: node.roi.cores,
          priority: node.roi.cores * (config.upgradePreferences.prioritizeCores ? 150 : 100),
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
  
  // Status overview
  const uptimeHours = metrics.uptime / (1000 * 60 * 60);
  const status = config.enabled ? "🟢 ACTIVE" : "🔴 DISABLED";
  ns.print(`Status: ${status}  |  Uptime: ${uptimeHours.toFixed(1)}h  |  Nodes: ${metrics.totalNodes}/${ns.hacknet.maxNumNodes()}`);
  ns.print("");
  
  // Financial overview
  ns.print("┌─ FINANCIAL OVERVIEW ──────────────────────────────────────────────────────┐");
  ns.print(`│ Total Investment:    $${ns.formatNumber(metrics.totalInvestment).padStart(12)}           │`);
  ns.print(`│ Total Return:        $${ns.formatNumber(metrics.totalReturn).padStart(12)}           │`);
  ns.print(`│ Net Profit:          $${ns.formatNumber(metrics.totalReturn - metrics.totalInvestment).padStart(12)}           │`);
  ns.print(`│ Current Production:  $${ns.formatNumber(metrics.totalProduction).padStart(12)}/sec      │`);
  ns.print(`│ Available to Spend:  $${ns.formatNumber(maxSpendable).padStart(12)}           │`);
  ns.print("└───────────────────────────────────────────────────────────────────────────┘");
  ns.print("");
  
  // Nodes overview
  if (nodes.length > 0) {
    ns.print("┌─ HACKNET NODES ───────────────────────────────────────────────────────────┐");
    
    // Show top 6 most productive nodes
    const sortedNodes = [...nodes].sort((a, b) => b.production - a.production);
    const displayNodes = sortedNodes.slice(0, 6);
    
    for (const node of displayNodes) {
      const prodDisplay = `$${ns.formatNumber(node.production)}/s`.padStart(10);
      const levelDisplay = `L${node.level}`.padStart(4);
      const ramDisplay = `${node.ram}GB`.padStart(6);
      const coresDisplay = `${node.cores}c`.padStart(4);
      const totalDisplay = `$${ns.formatNumber(node.totalProduction)}`.padStart(10);
      
      ns.print(`│ ${node.name.padEnd(15)} ${prodDisplay} ${levelDisplay} ${ramDisplay} ${coresDisplay} ${totalDisplay} │`);
    }
    
    if (nodes.length > 6) {
      ns.print(`│ ... and ${nodes.length - 6} more nodes                                           │`);
    }
    
    ns.print("└───────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
  }
  
  // Upgrade opportunities
  if (opportunities.length > 0) {
    ns.print("┌─ UPGRADE OPPORTUNITIES ───────────────────────────────────────────────────┐");
    
    const displayOpps = opportunities.slice(0, 5);
    for (let i = 0; i < displayOpps.length; i++) {
      const opp = displayOpps[i];
      const costDisplay = `$${ns.formatNumber(opp.cost)}`.padStart(10);
      const roiDisplay = `${(opp.roi * 100).toFixed(1)}%`.padStart(6);
      const priority = i === 0 ? "🔥" : "  ";
      
      ns.print(`│ ${priority} ${opp.description.padEnd(35)} ${costDisplay} ${roiDisplay} │`);
    }
    
    if (opportunities.length > 5) {
      ns.print(`│ ... and ${opportunities.length - 5} more opportunities                            │`);
    }
    
    ns.print("└───────────────────────────────────────────────────────────────────────────┘");
  } else if (config.enabled) {
    ns.print("┌─ NO OPPORTUNITIES ────────────────────────────────────────────────────────┐");
    ns.print("│ No profitable upgrades available at current ROI threshold                  │");
    ns.print(`│ Minimum ROI required: ${(config.minROIThreshold * 100).toFixed(1)}%                                           │`);
    ns.print("└───────────────────────────────────────────────────────────────────────────┘");
  }
  
  ns.print("");
  
  // Configuration summary
  ns.print("┌─ CONFIGURATION ───────────────────────────────────────────────────────────┐");
  ns.print(`│ Max Investment:   $${ns.formatNumber(config.maxInvestment).padStart(12)}  Min ROI: ${(config.minROIThreshold * 100).toFixed(1)}%     │`);
  ns.print(`│ Reserve Ratio:    ${(config.capitalAllocation.reserveRatio * 100).toFixed(0)}%          Cash Buffer: $${ns.formatNumber(config.capitalAllocation.minCashBuffer).padStart(8)} │`);
  ns.print(`│ Max Levels: ${config.upgradePreferences.maxLevel.toString().padStart(3)}   Max RAM: ${config.upgradePreferences.maxRAM.toString().padStart(3)}GB   Max Cores: ${config.upgradePreferences.maxCores.toString().padStart(2)}    │`);
  ns.print("└───────────────────────────────────────────────────────────────────────────┘");
}