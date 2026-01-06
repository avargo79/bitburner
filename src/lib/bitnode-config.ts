import { NS } from "@ns";

export type TrainingStrategy = "gym-only" | "crime-training" | "skip-if-high" | "minimal";
export type MoneyStrategy = "casino" | "crime" | "hacking" | "minimal";

export interface StatTargets {
  str: number;
  def: number;
  dex: number;
  agi: number;
  hack: number;
}

export interface ScriptPriority {
  name: string;
  priority: number; // 1=highest, 10=lowest
}

export interface BitnodeConfig {
  id: number;
  name: string;
  statTargets: StatTargets;
  trainingStrategy: TrainingStrategy;
  moneyTarget: number;
  moneyStrategy: MoneyStrategy;
  scriptPriorities: ScriptPriority[];
  specialInstructions?: string;
}

// ============================
// Bitnode Configurations
// ============================

const BN1_CONFIG: BitnodeConfig = {
  id: 1,
  name: "Source Genesis",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 50 },
  trainingStrategy: "gym-only",
  moneyTarget: 1_000_000, // 1M for basic needs
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
    { name: "casino-bot.ts", priority: 8 },
  ],
  specialInstructions: "Balanced progression, focus on unlocking features",
};

const BN2_CONFIG: BitnodeConfig = {
  id: 2,
  name: "Rise of the Underworld",
  statTargets: { str: 30, def: 30, dex: 30, agi: 30, hack: 30 },
  trainingStrategy: "minimal",
  moneyTarget: 200_000, // Enough for gang creation
  moneyStrategy: "crime",
  scriptPriorities: [
    { name: "gangs.ts", priority: 1 }, // TOP priority in gang bitnode
    { name: "contracts.ts", priority: 2 },
    { name: "botnet.ts", priority: 3 },
    { name: "server-manager.ts", priority: 4 },
    { name: "sleeve-crime.ts", priority: 5 },
    { name: "sleeve.ts", priority: 6 },
    { name: "hacknet.ts", priority: 7 },
    { name: "bladeburner.ts", priority: 8 },
  ],
  specialInstructions: "Prioritize gang creation and management",
};

const BN3_CONFIG: BitnodeConfig = {
  id: 3,
  name: "Corporatocracy",
  statTargets: { str: 30, def: 30, dex: 30, agi: 30, hack: 100 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 150_000_000_000, // 150B for corp seed funding
  moneyStrategy: "casino",
  scriptPriorities: [
    { name: "casino-bot.ts", priority: 1 }, // Fast money for corp
    { name: "contracts.ts", priority: 2 },
    { name: "botnet.ts", priority: 3 },
    { name: "server-manager.ts", priority: 4 },
    { name: "corp.ts", priority: 5 }, // Corp automation when available
    { name: "sleeve.ts", priority: 6 },
    { name: "gangs.ts", priority: 7 },
    { name: "bladeburner.ts", priority: 8 },
    { name: "hacknet.ts", priority: 9 },
  ],
  specialInstructions: "Focus on fast money generation for corporation",
};

const BN4_CONFIG: BitnodeConfig = {
  id: 4,
  name: "The Singularity",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 10 },
  trainingStrategy: "gym-only",
  moneyTarget: 10_000_000_000, // 10B for full automation
  moneyStrategy: "casino",
  scriptPriorities: [
    { name: "casino-bot.ts", priority: 1 },
    { name: "contracts.ts", priority: 2 },
    { name: "sleeve.ts", priority: 3 },
    { name: "gangs.ts", priority: 4 },
    { name: "bladeburner.ts", priority: 5 },
    { name: "server-manager.ts", priority: 6 },
    { name: "hacknet.ts", priority: 7 },
    { name: "botnet.ts", priority: 8 },
  ],
  specialInstructions: "Casino grinding for fast augmentation purchasing",
};

const BN5_CONFIG: BitnodeConfig = {
  id: 5,
  name: "Artificial Intelligence",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 100 },
  trainingStrategy: "gym-only",
  moneyTarget: 5_000_000, // 5M
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Standard hacking focus, access to formulas API",
};

const BN6_CONFIG: BitnodeConfig = {
  id: 6,
  name: "Bladeburners",
  statTargets: { str: 100, def: 100, dex: 100, agi: 100, hack: 50 },
  trainingStrategy: "gym-only",
  moneyTarget: 1_000_000, // 1M
  moneyStrategy: "crime",
  scriptPriorities: [
    { name: "bladeburner.ts", priority: 1 }, // TOP priority
    { name: "sleeve-bladeburner.ts", priority: 2 },
    { name: "contracts.ts", priority: 3 },
    { name: "botnet.ts", priority: 4 },
    { name: "server-manager.ts", priority: 5 },
    { name: "sleeve.ts", priority: 6 },
    { name: "gangs.ts", priority: 7 },
    { name: "hacknet.ts", priority: 8 },
  ],
  specialInstructions: "Heavy combat stat focus for Bladeburner operations",
};

const BN7_CONFIG: BitnodeConfig = {
  id: 7,
  name: "Bladeburners 2079",
  statTargets: { str: 100, def: 100, dex: 100, agi: 100, hack: 50 },
  trainingStrategy: "gym-only",
  moneyTarget: 1_000_000, // 1M
  moneyStrategy: "crime",
  scriptPriorities: [
    { name: "bladeburner.ts", priority: 1 },
    { name: "sleeve-bladeburner.ts", priority: 2 },
    { name: "contracts.ts", priority: 3 },
    { name: "botnet.ts", priority: 4 },
    { name: "server-manager.ts", priority: 5 },
    { name: "sleeve.ts", priority: 6 },
    { name: "gangs.ts", priority: 7 },
    { name: "hacknet.ts", priority: 8 },
  ],
  specialInstructions: "Bladeburner-focused progression",
};

const BN8_CONFIG: BitnodeConfig = {
  id: 8,
  name: "Ghost of Wall Street",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 100 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 10_000_000, // 10M for stock market access
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "stocks.ts", priority: 3 }, // Stock market focus
    { name: "server-manager.ts", priority: 4 },
    { name: "sleeve.ts", priority: 5 },
    { name: "hacknet.ts", priority: 6 },
    { name: "gangs.ts", priority: 7 },
  ],
  specialInstructions: "Stock market focus, no Bladeburner",
};

const BN9_CONFIG: BitnodeConfig = {
  id: 9,
  name: "Hacktocracy",
  statTargets: { str: 30, def: 30, dex: 30, agi: 30, hack: 100 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 1_000_000, // 1M
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "hacknet.ts", priority: 3 }, // Hacknet priority
    { name: "server-manager.ts", priority: 4 },
    { name: "sleeve.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Hacknet nodes are key income source",
};

const BN10_CONFIG: BitnodeConfig = {
  id: 10,
  name: "Digital Carbon",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 50 },
  trainingStrategy: "gym-only",
  moneyTarget: 1_000_000, // 1M
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "sleeve.ts", priority: 1 }, // Sleeve focus
    { name: "contracts.ts", priority: 2 },
    { name: "botnet.ts", priority: 3 },
    { name: "server-manager.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Sleeve management is central mechanic",
};

const BN11_CONFIG: BitnodeConfig = {
  id: 11,
  name: "The Big Crash",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 100 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 5_000_000, // 5M
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Challenging progression, focus on hacking",
};

const BN12_CONFIG: BitnodeConfig = {
  id: 12,
  name: "The Recursion",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 50 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 1_000_000, // 1M
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Recursion mechanics, fast progression",
};

const BN13_CONFIG: BitnodeConfig = {
  id: 13,
  name: "They're lunatics",
  statTargets: { str: 100, def: 100, dex: 100, agi: 100, hack: 100 },
  trainingStrategy: "gym-only",
  moneyTarget: 10_000_000, // 10M
  moneyStrategy: "crime",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "gangs.ts", priority: 5 },
    { name: "bladeburner.ts", priority: 6 },
    { name: "hacknet.ts", priority: 7 },
  ],
  specialInstructions: "Extreme difficulty, high stat requirements",
};

// Fallback config for unknown bitnodes
const DEFAULT_CONFIG: BitnodeConfig = {
  id: 0,
  name: "Unknown BitNode",
  statTargets: { str: 50, def: 50, dex: 50, agi: 50, hack: 50 },
  trainingStrategy: "skip-if-high",
  moneyTarget: 5_000_000, // 5M conservative
  moneyStrategy: "hacking",
  scriptPriorities: [
    { name: "contracts.ts", priority: 1 },
    { name: "botnet.ts", priority: 2 },
    { name: "server-manager.ts", priority: 3 },
    { name: "sleeve.ts", priority: 4 },
    { name: "hacknet.ts", priority: 5 },
    { name: "gangs.ts", priority: 6 },
    { name: "bladeburner.ts", priority: 7 },
  ],
  specialInstructions: "Conservative defaults for unknown bitnode",
};

// Map of all configs
const BITNODE_CONFIGS: Map<number, BitnodeConfig> = new Map([
  [1, BN1_CONFIG],
  [2, BN2_CONFIG],
  [3, BN3_CONFIG],
  [4, BN4_CONFIG],
  [5, BN5_CONFIG],
  [6, BN6_CONFIG],
  [7, BN7_CONFIG],
  [8, BN8_CONFIG],
  [9, BN9_CONFIG],
  [10, BN10_CONFIG],
  [11, BN11_CONFIG],
  [12, BN12_CONFIG],
  [13, BN13_CONFIG],
]);

/**
 * Get configuration for current bitnode
 * @param {NS} ns - Netscript API
 * @returns {BitnodeConfig} Configuration for the current bitnode
 */
export function getBitnodeConfig(ns: NS): BitnodeConfig {
  const resetInfo = ns.getResetInfo();
  const bitnodeId = resetInfo?.currentNode ?? 1;
  
  return BITNODE_CONFIGS.get(bitnodeId) ?? DEFAULT_CONFIG;
}

/**
 * Get configuration for specific bitnode
 * @param {number} bitnodeId - The bitnode ID (1-13)
 * @returns {BitnodeConfig} Configuration for the specified bitnode
 */
export function getBitnodeConfigById(bitnodeId: number): BitnodeConfig {
  return BITNODE_CONFIGS.get(bitnodeId) ?? DEFAULT_CONFIG;
}

/**
 * Override config with CLI arguments
 * @param {BitnodeConfig} config - Base configuration to override
 * @param {(string | number | boolean)[]} args - CLI arguments array
 * @returns {BitnodeConfig} Configuration with overrides applied
 */
export function applyConfigOverrides(
  config: BitnodeConfig,
  args: (string | number | boolean)[]
): BitnodeConfig {
  const overridden = { ...config };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg !== "string" || !arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const value = args[i + 1];

    switch (key) {
      case "stat-target":
        if (typeof value === "number") {
          overridden.statTargets = {
            str: value,
            def: value,
            dex: value,
            agi: value,
            hack: value,
          };
        }
        break;

      case "str-target":
        if (typeof value === "number") overridden.statTargets.str = value;
        break;

      case "def-target":
        if (typeof value === "number") overridden.statTargets.def = value;
        break;

      case "dex-target":
        if (typeof value === "number") overridden.statTargets.dex = value;
        break;

      case "agi-target":
        if (typeof value === "number") overridden.statTargets.agi = value;
        break;

      case "hack-target":
        if (typeof value === "number") overridden.statTargets.hack = value;
        break;

      case "money-target":
        if (typeof value === "number") overridden.moneyTarget = value;
        break;

      case "training-strategy":
        if (
          typeof value === "string" &&
          ["gym-only", "crime-training", "skip-if-high", "minimal"].includes(value)
        ) {
          overridden.trainingStrategy = value as TrainingStrategy;
        }
        break;

      case "money-strategy":
        if (
          typeof value === "string" &&
          ["casino", "crime", "hacking", "minimal"].includes(value)
        ) {
          overridden.moneyStrategy = value as MoneyStrategy;
        }
        break;
    }
  }

  return overridden;
}

/**
 * Check if specific stats need training
 * @param {NS} ns - Netscript API
 * @param {BitnodeConfig} config - Bitnode configuration with stat targets
 * @returns {{str: boolean, def: boolean, dex: boolean, agi: boolean, hack: boolean, any: boolean}} Object indicating which stats need training
 */
export function needsTraining(ns: NS, config: BitnodeConfig): {
  str: boolean;
  def: boolean;
  dex: boolean;
  agi: boolean;
  hack: boolean;
  any: boolean;
} {
  const player = ns.getPlayer();
  const { skills } = player;

  const needs = {
    str: skills.strength < config.statTargets.str,
    def: skills.defense < config.statTargets.def,
    dex: skills.dexterity < config.statTargets.dex,
    agi: skills.agility < config.statTargets.agi,
    hack: skills.hacking < config.statTargets.hack,
    any: false,
  };

  needs.any = needs.str || needs.def || needs.dex || needs.agi || needs.hack;

  return needs;
}

/**
 * Check if money target is met
 * @param {NS} ns - Netscript API
 * @param {BitnodeConfig} config - Bitnode configuration with money target
 * @returns {boolean} True if player needs more money to reach target
 */
export function needsMoney(ns: NS, config: BitnodeConfig): boolean {
  const player = ns.getPlayer();
  return player.money < config.moneyTarget;
}
