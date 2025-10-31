import { NS } from "@ns";

/**
 * Automated Augmentation Purchasing for BitNode Speed Runs
 * 
 * This script automates:
 * - Identifying purchasable augmentations from all factions
 * - Prioritizing augmentations by cost (cheapest first for BN completion)
 * - Purchasing augmentations when requirements are met
 * - Installing augmentations when target count is reached
 */

interface AugmentationInfo {
  name: string;
  faction: string;
  repReq: number;
  currentRep: number;
  price: number;
  owned: boolean;
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['auto-purchase', true],  // Automatically purchase when affordable
  ['target-count', 30],  // Target augmentation count (for Daedalus)
  ['auto-install', true],  // Automatically install when target reached
  ['reserve-money', 1000000000],  // Reserve money for other purposes (1b default)
  ['prioritize-neuroflux', true],  // Buy NeuroFlux to reach target count
  ['early-install', true],  // Trigger early install when prices become too expensive
  ['early-install-multiplier', 10],  // Install early if avg aug costs 10x+ current affordable rate
  ['help', false],
];

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.clearLog();

  const flags = ns.flags(argsSchema);

  if (flags.help) {
    showHelp(ns);
    return;
  }

  const debug = flags['debug'] as boolean;
  const autoPurchase = flags['auto-purchase'] as boolean;
  const targetCount = flags['target-count'] as number;
  const autoInstall = flags['auto-install'] as boolean;
  const reserveMoney = flags['reserve-money'] as number;
  const prioritizeNeuroflux = flags['prioritize-neuroflux'] as boolean;
  const earlyInstall = flags['early-install'] as boolean;
  const earlyInstallMultiplier = flags['early-install-multiplier'] as number;

  if (debug) ns.tprint("[AutoAugs] Starting automated augmentation purchasing...");

  // Main loop
  while (true) {
    try {
      const player = ns.getPlayer();
      const money = ns.getServerMoneyAvailable("home");
      const availableMoney = money - reserveMoney;

      // Get all augmentations
      const allAugs = await getAllAvailableAugmentations(ns);
      const ownedAugs = ns.singularity.getOwnedAugmentations(true);
      const installedAugs = ns.singularity.getOwnedAugmentations(false);

      // Filter to only unowned augmentations
      const unownedAugs = allAugs.filter(aug => !ownedAugs.includes(aug.name));

      // Update status display
      updateStatusDisplay(ns, unownedAugs, ownedAugs.length, targetCount, availableMoney);

      // Check if we should do an early install (soft reset strategy)
      if (earlyInstall && ownedAugs.length > installedAugs.length && ownedAugs.length >= 5) {
        const shouldEarlyInstall = await checkEarlyInstallConditions(
          ns,
          unownedAugs,
          ownedAugs.length,
          availableMoney,
          earlyInstallMultiplier,
          debug
        );

        if (shouldEarlyInstall) {
          ns.tprint("");
          ns.tprint("═══════════════════════════════════════════════");
          ns.tprint("[AutoAugs] 🔄 EARLY INSTALL TRIGGERED!");
          ns.tprint("═══════════════════════════════════════════════");
          ns.tprint(`Current augmentations: ${ownedAugs.length}`);
          ns.tprint(`Remaining augmentations are too expensive relative to income.`);
          ns.tprint(`Installing now will reset prices and speed up next run.`);
          ns.tprint("");
          ns.tprint("Installing augmentations and restarting bn4.js...");
          ns.singularity.installAugmentations("bn4.js");
          return;
        }
      }

      // Check if we should install augmentations (target count reached)
      if (ownedAugs.length >= targetCount && ownedAugs.length > installedAugs.length) {
        ns.tprint("");
        ns.tprint(`[AutoAugs] Target augmentation count reached: ${ownedAugs.length}/${targetCount}`);

        if (autoInstall) {
          ns.tprint("[AutoAugs] Auto-installing augmentations...");
          ns.singularity.installAugmentations("bn4.js");
          return;
        } else {
          ns.tprint("[AutoAugs] Run with --auto-install to automatically install augmentations.");
          ns.tprint("[AutoAugs] Or manually install via Augmentations menu.");
          return;
        }
      }

      // Auto-purchase augmentations
      if (autoPurchase && availableMoney > 0) {
        await purchaseAffordableAugmentations(ns, unownedAugs, availableMoney, prioritizeNeuroflux, targetCount, ownedAugs.length, debug);
      }

      await ns.sleep(10000); // Check every 10 seconds
    } catch (err) {
      ns.tprint(`[AutoAugs] ERROR: ${err}`);
      await ns.sleep(30000);
    }
  }
}

function showHelp(ns: NS): void {
  ns.tprint("=== Automated Augmentation Purchasing ===");
  ns.tprint("");
  ns.tprint("Usage: run auto-augs.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug                     Enable verbose debug output");
  ns.tprint("  --auto-purchase             Automatically purchase when affordable (default: true)");
  ns.tprint("  --target-count <number>     Target augmentation count (default: 30 for Daedalus)");
  ns.tprint("  --auto-install              Automatically install when target reached (default: true)");
  ns.tprint("  --reserve-money <number>    Reserve money for other purposes (default: 1b)");
  ns.tprint("  --prioritize-neuroflux      Buy NeuroFlux to reach target count (default: true)");
  ns.tprint("  --early-install             Trigger early install for soft resets (default: true)");
  ns.tprint("  --early-install-multiplier  Price threshold multiplier (default: 10)");
  ns.tprint("  --help                      Show this help message");
  ns.tprint("");
  ns.tprint("Early Install Strategy:");
  ns.tprint("  When augmentation prices become too expensive (10x+ current money),");
  ns.tprint("  the script will automatically install and reset. This 'soft reset'");
  ns.tprint("  strategy resets prices and uses your new multipliers to progress faster.");
  ns.tprint("");
  ns.tprint("This script automates augmentation purchasing to speed up BN completion.");
  ns.tprint("Use 'tail auto-augs.js' to monitor progress.");
}

async function getAllAvailableAugmentations(ns: NS): Promise<AugmentationInfo[]> {
  const player = ns.getPlayer();
  const factions = player.factions;
  const augmentations: AugmentationInfo[] = [];

  for (const faction of factions) {
    const factionAugs = ns.singularity.getAugmentationsFromFaction(faction);
    const currentRep = ns.singularity.getFactionRep(faction);

    for (const augName of factionAugs) {
      // Skip if already in list (available from multiple factions)
      if (augmentations.some(a => a.name === augName)) {
        continue;
      }

      const repReq = ns.singularity.getAugmentationRepReq(augName);
      const price = ns.singularity.getAugmentationPrice(augName);
      const owned = ns.singularity.getOwnedAugmentations(true).includes(augName);

      augmentations.push({
        name: augName,
        faction: faction,
        repReq: repReq,
        currentRep: currentRep,
        price: price,
        owned: owned
      });
    }
  }

  return augmentations;
}

async function purchaseAffordableAugmentations(
  ns: NS,
  augmentations: AugmentationInfo[],
  availableMoney: number,
  prioritizeNeuroflux: boolean,
  targetCount: number,
  currentCount: number,
  debug: boolean
): Promise<void> {
  // Sort augmentations by price (cheapest first for fast count increase)
  const sortedAugs = augmentations
    .filter(aug => aug.currentRep >= aug.repReq && aug.price <= availableMoney)
    .sort((a, b) => a.price - b.price);

  if (sortedAugs.length === 0) {
    return;
  }

  // If we're close to target count and prioritizing NeuroFlux, buy it repeatedly
  const neurofluxAug = sortedAugs.find(aug => aug.name === "NeuroFlux Governor");

  if (prioritizeNeuroflux && neurofluxAug && (targetCount - currentCount) <= 10) {
    // Buy NeuroFlux multiple times to quickly reach target
    let purchased = 0;

    while (purchased < 5 && ns.getServerMoneyAvailable("home") - ns.singularity.getAugmentationPrice("NeuroFlux Governor") >= 0) {
      const success = ns.singularity.purchaseAugmentation(neurofluxAug.faction, "NeuroFlux Governor");

      if (success) {
        purchased++;
        const price = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
        ns.tprint(`[AutoAugs] Purchased NeuroFlux Governor #${purchased} for $${formatMoney(price)}`);
      } else {
        break;
      }

      await ns.sleep(100);
    }

    if (purchased > 0) {
      return;
    }
  }

  // Purchase the cheapest affordable augmentation
  const augToBuy = sortedAugs[0];

  const success = ns.singularity.purchaseAugmentation(augToBuy.faction, augToBuy.name);

  if (success) {
    ns.tprint(`[AutoAugs] Purchased ${augToBuy.name} from ${augToBuy.faction} for $${formatMoney(augToBuy.price)}`);
  } else if (debug) {
    ns.print(`[AutoAugs] Failed to purchase ${augToBuy.name}`);
  }
}

async function checkEarlyInstallConditions(
  ns: NS,
  unownedAugs: AugmentationInfo[],
  currentAugCount: number,
  availableMoney: number,
  multiplier: number,
  debug: boolean
): Promise<boolean> {
  // Only consider early install after at least 5 augs (got some useful multipliers)
  if (currentAugCount < 5) return false;

  // Calculate augmentation price multiplier from owned augs
  // Each aug increases prices by 1.9x (90% increase)
  const priceMultiplier = Math.pow(1.9, currentAugCount);

  // Get augmentations we have rep for
  const augsWithRep = unownedAugs.filter(aug => aug.currentRep >= aug.repReq);

  if (augsWithRep.length === 0) {
    // No augs available with current rep, not a good time to reset
    return false;
  }

  // Sort by price to find cheapest available augs
  const sortedByPrice = augsWithRep.sort((a, b) => a.price - b.price);

  // Get the cheapest 5 augs we have rep for
  const cheapestAugs = sortedByPrice.slice(0, Math.min(5, sortedByPrice.length));
  const avgCheapestPrice = cheapestAugs.reduce((sum, aug) => sum + aug.price, 0) / cheapestAugs.length;

  // Calculate what we can currently afford in reasonable time
  const reasonableAffordThreshold = availableMoney * multiplier; // Default 10x current money

  if (debug) {
    ns.print(`[AutoAugs] Early Install Check:`);
    ns.print(`  Current aug count: ${currentAugCount}`);
    ns.print(`  Price multiplier: ${priceMultiplier.toFixed(2)}x`);
    ns.print(`  Avg cheapest aug price: $${formatMoney(avgCheapestPrice)}`);
    ns.print(`  Reasonable afford threshold: $${formatMoney(reasonableAffordThreshold)}`);
    ns.print(`  Available money: $${formatMoney(availableMoney)}`);
  }

  // Trigger early install if:
  // 1. We have at least 5 augs (got some multipliers)
  // 2. Average price of cheapest available augs is > multiplier × current money
  // 3. Price multiplier is significant (>3x base prices for early detection)

  const avgTooExpensive = avgCheapestPrice > reasonableAffordThreshold;
  const significantMultiplier = priceMultiplier > 3;
  const hasUsefulMultipliers = currentAugCount >= 5;

  if (avgTooExpensive && significantMultiplier && hasUsefulMultipliers) {
    if (debug) {
      ns.print(`[AutoAugs] ✓ Early install conditions met!`);
      ns.print(`  - Avg aug price (${formatMoney(avgCheapestPrice)}) > ${multiplier}x money (${formatMoney(reasonableAffordThreshold)})`);
      ns.print(`  - Price multiplier ${priceMultiplier.toFixed(2)}x > 3x threshold`);
      ns.print(`  - Have ${currentAugCount} augs with useful multipliers`);
    }
    return true;
  }

  // Additional check: If we're stuck with very few affordable augs (< 3) and prices are high
  const affordableCount = augsWithRep.filter(aug => aug.price <= availableMoney * 2).length;
  if (affordableCount < 3 && priceMultiplier > 5 && currentAugCount >= 5) {
    if (debug) {
      ns.print(`[AutoAugs] ✓ Early install triggered by lack of affordable options!`);
      ns.print(`  - Only ${affordableCount} augs affordable within 2x current money`);
      ns.print(`  - Price multiplier ${priceMultiplier.toFixed(2)}x very high`);
      ns.print(`  - Have ${currentAugCount} augs (>= 5 threshold)`);
    }
    return true;
  }

  return false;
}

function updateStatusDisplay(ns: NS, availableAugs: AugmentationInfo[], ownedCount: number, targetCount: number, availableMoney: number): void {
  ns.clearLog();

  ns.print("═══════════════════════════════════════════════");
  ns.print("  Automated Augmentation Purchasing");
  ns.print("═══════════════════════════════════════════════");
  ns.print("");

  // Progress towards target
  const progress = Math.min(100, (ownedCount / targetCount) * 100);
  const progressBar = createProgressBar(progress, 30);

  ns.print(`Augmentation Progress: ${ownedCount}/${targetCount}`);
  ns.print(progressBar);
  ns.print("");

  // Show price multiplier info
  const priceMultiplier = Math.pow(1.9, ownedCount);
  ns.print(`Price Multiplier: ${priceMultiplier.toFixed(2)}x base cost`);

  if (ownedCount >= 5) {
    const augsWithRep = availableAugs.filter(aug => aug.currentRep >= aug.repReq);
    if (augsWithRep.length > 0) {
      const sortedByPrice = augsWithRep.sort((a, b) => a.price - b.price);
      const cheapest5 = sortedByPrice.slice(0, Math.min(5, sortedByPrice.length));
      const avgPrice = cheapest5.reduce((sum, aug) => sum + aug.price, 0) / cheapest5.length;
      const threshold = availableMoney * 10;

      if (avgPrice > threshold && priceMultiplier > 3) {
        ns.print(`⚠️  Early install recommended - prices getting too high!`);
      }
    }
  }

  ns.print("");

  ns.print(`Available Money: $${formatMoney(availableMoney)}`);
  ns.print("");

  // Purchasable augmentations
  const purchasable = availableAugs.filter(aug =>
    aug.currentRep >= aug.repReq && aug.price <= availableMoney
  );

  if (purchasable.length > 0) {
    ns.print(`Immediately Purchasable: ${purchasable.length}`);
    ns.print("─────────────────────────────────────────────");

    // Sort by price
    const sorted = purchasable.sort((a, b) => a.price - b.price);

    for (const aug of sorted.slice(0, 5)) {
      ns.print(`${aug.name.substring(0, 30).padEnd(30)} $${formatMoney(aug.price).padStart(10)}`);
    }

    if (sorted.length > 5) {
      ns.print(`... and ${sorted.length - 5} more`);
    }
  } else {
    ns.print("No augmentations currently purchasable.");
  }

  ns.print("");

  // Next augmentations (by rep requirement)
  const needMoreRep = availableAugs.filter(aug => aug.currentRep < aug.repReq);

  if (needMoreRep.length > 0) {
    ns.print("Next Targets (need more reputation):");
    ns.print("─────────────────────────────────────────────");

    const sorted = needMoreRep.sort((a, b) => (a.repReq - a.currentRep) - (b.repReq - b.currentRep));

    for (const aug of sorted.slice(0, 5)) {
      const repNeeded = aug.repReq - aug.currentRep;
      const repProgress = (aug.currentRep / aug.repReq) * 100;

      ns.print(`${aug.name.substring(0, 25).padEnd(25)} ${aug.faction.substring(0, 15).padEnd(15)} +${formatNumber(repNeeded)} rep (${repProgress.toFixed(0)}%)`);
    }

    if (sorted.length > 5) {
      ns.print(`... and ${sorted.length - 5} more`);
    }
  }

  ns.print("");

  // Special note about NeuroFlux
  const hasNeuroflux = availableAugs.some(aug => aug.name === "NeuroFlux Governor" && aug.currentRep >= aug.repReq);
  if (hasNeuroflux && ownedCount < targetCount) {
    ns.print("💡 TIP: NeuroFlux Governor can be purchased repeatedly!");
    ns.print("   Use it to quickly reach your target augmentation count.");
  }

  ns.print("");
  ns.print("═══════════════════════════════════════════════");
}

function createProgressBar(percent: number, width: number): string {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${" ".repeat(empty)}] ${percent.toFixed(1)}%`;
}

function formatMoney(amount: number): string {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 't';
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'b';
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'm';
  if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'k';
  return amount.toFixed(2);
}

function formatNumber(num: number): string {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(0);
}
