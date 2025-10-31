import { NS } from "@ns";

/**
 * BitNode 4: The Singularity - Speed Completion Strategy
 * 
 * BitNode 4 unlocks Singularity functions (automation APIs) for use in other BitNodes.
 * 
 * Key Information:
 * - This BitNode has moderate difficulty multipliers
 * - Main focus: Unlock SF4.3 for 1x RAM cost on singularity functions (vs 16x at SF4.1, 4x at SF4.2)
 * - BN4 Multipliers:
 *   - ServerMaxMoney: 0.1125 (11.25% normal)
 *   - ScriptHackMoney: 0.2 (20% normal money from hacking)
 *   - HackExpGain: 0.4 (40% normal exp gain)
 *   - CompanyWorkMoney: 0.1 (10% normal company salary)
 *   - CrimeMoney: 0.2 (20% normal crime money)
 *   - ClassGymExpGain: 0.5 (50% normal training efficiency)
 * 
 * Strategy:
 * 1. Early game: Hack weak servers for money since hacking is nerfed
 * 2. Use Singularity functions to automate faction work and augmentation purchases
 * 3. Focus on getting Daedalus invite (30 augmentations required)
 * 4. Install The Red Pill augmentation from Daedalus
 * 5. Destroy w0r1d_d43m0n (requires hack level based on BN difficulty)
 * 
 * Completion Time: 2-4 hours with automation
 */

interface StrategyConfig {
  targetFactions: string[];
  priorityAugmentations: string[];
  minMoneyForAugs: number;
  targetHackLevel: number;
  useCrimes: boolean;
  useCompanyWork: boolean;
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['auto-destroy', true],  // Automatically destroy w0r1d_d43m0n when ready
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
  const autoDestroy = flags['auto-destroy'] as boolean;

  ns.tprint("=== BitNode 4: The Singularity Speed Run ===");
  ns.tprint("");

  // Check if we're actually in BN4
  const currentBN = ns.getResetInfo().currentNode;
  if (currentBN !== 4) {
    ns.tprint(`WARNING: You are in BitNode ${currentBN}, not BitNode 4. This script is optimized for BN4.`);
    ns.tprint("Strategy will still work but multipliers may be different.");
    ns.tprint("");
  }

  // Check if we need to run bootstrap first
  const money = ns.getServerMoneyAvailable("home");
  const homeRam = ns.getServerMaxRam("home");
  const player = ns.getPlayer();

  // RAM requirements: bn4.js (59.7GB) + auto-augs (28.2GB) + auto-factions (26.1GB) + auto-crime (17.1GB) + botnet (11GB) + contracts (29GB) = 171.1GB
  const requiredRam = 256; // Minimum to run all automation scripts
  const optimalRam = 512;  // Optimal for comfortable operation with headroom

  if (money < 50000000 || homeRam < requiredRam || player.skills.hacking < 10) {
    ns.tprint("⚠️  BOOTSTRAP REQUIRED");
    ns.tprint("");
    ns.tprint("You need initial resources before full automation can start:");
    ns.tprint(`  Current Money: $${formatMoney(money)} (need $50m+ for 256GB RAM)`);
    ns.tprint(`  Home RAM: ${homeRam}GB (need ${requiredRam}GB minimum, ${optimalRam}GB optimal)`);
    ns.tprint(`  Hacking Level: ${player.skills.hacking} (need 10+)`);
    ns.tprint("");
    ns.tprint("⚠️  RAM REQUIREMENTS (ACTUAL COSTS):");
    ns.tprint("  bn4.js         : 59.7GB");
    ns.tprint("  auto-augs.js   : 28.2GB");
    ns.tprint("  auto-factions.js: 26.1GB");
    ns.tprint("  auto-crime.js  : 17.1GB");
    ns.tprint("  botnet.js      : 11.0GB");
    ns.tprint("  contracts.js   : 29.0GB");
    ns.tprint("  ─────────────────────────");
    ns.tprint("  TOTAL          : 171.1GB");
    ns.tprint("");
    ns.tprint("Recommended startup sequence:");
    ns.tprint("  1. run start.js           - Bootstrap stats & initial money");
    ns.tprint("  2. Wait for casino to get $50m+ (for 256GB RAM)");
    ns.tprint("  3. Upgrade home RAM to 256GB ($24m) or 512GB ($96m)");
    ns.tprint("  4. Kill start.js and casino-bot.js");
    ns.tprint("  5. Re-run: run bn4.js");
    ns.tprint("");
    ns.tprint("Or to auto-bootstrap now:");
    ns.tprint("  run start.js              - Will auto-casino until $10b");
    ns.tprint("  (accumulate $50-100m for 256-512GB RAM, then re-run bn4.js)");
    ns.tprint("");
    return;
  }

  // Configuration for BN4 completion
  const config: StrategyConfig = {
    targetFactions: [
      // Early game factions (easy to join)
      "Tian Di Hui",
      "Netburners",
      "CyberSec",
      // Mid game factions
      "NiteSec",
      "The Black Hand",
      "BitRunners",
      // Late game for Daedalus requirements
      "Illuminati",
      "Daedalus"
    ],
    priorityAugmentations: [
      "The Red Pill",  // Final aug needed to destroy w0r1d_d43m0n
    ],
    minMoneyForAugs: 100000000,  // $100m minimum before buying augs
    targetHackLevel: 3000,  // Target before attempting w0r1d_d43m0n
    useCrimes: true,  // Crime is nerfed but still useful early
    useCompanyWork: false  // Company work heavily nerfed in BN4
  };

  ns.tprint("Strategy Overview:");
  ns.tprint("─────────────────────────────────────────────");
  ns.tprint("Phase 1: Early Money (Hack weak servers)");
  ns.tprint("Phase 2: Join Factions (Use Singularity APIs)");
  ns.tprint("Phase 3: Farm Reputation & Buy Augmentations");
  ns.tprint("Phase 4: Get 30+ Augs → Join Daedalus");
  ns.tprint("Phase 5: Buy The Red Pill → Destroy w0r1d_d43m0n");
  ns.tprint("");

  // Phase 1: Setup automation
  ns.tprint(">>> Phase 1: Setting up automation...");
  await setupAutomation(ns, debug);

  // Phase 2: Monitor progress
  ns.tprint(">>> Phase 2: Monitoring progress...");
  await monitorProgress(ns, config, autoDestroy, debug);

  ns.tprint("");
  ns.tprint("=== BN4 Script Complete ===");
}

function showHelp(ns: NS): void {
  ns.tprint("=== BitNode 4: The Singularity - Speed Completion ===");
  ns.tprint("");
  ns.tprint("Usage: run bn4.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug           Enable verbose debug output");
  ns.tprint("  --auto-destroy    Automatically destroy w0r1d_d43m0n when ready (default: true)");
  ns.tprint("  --help            Show this help message");
  ns.tprint("");
  ns.tprint("This script orchestrates a fast completion of BitNode 4 by:");
  ns.tprint("1. Setting up automated hacking (botnet.js)");
  ns.tprint("2. Automating faction work and augmentation purchases");
  ns.tprint("3. Getting 30+ augmentations to join Daedalus");
  ns.tprint("4. Buying The Red Pill and destroying w0r1d_d43m0n");
  ns.tprint("");
  ns.tprint("BitNode 4 Key Stats:");
  ns.tprint("  - Money from hacking: 20% normal");
  ns.tprint("  - Hack exp gain: 40% normal");
  ns.tprint("  - Company salary: 10% normal (avoid company work!)");
  ns.tprint("  - Crime money: 20% normal");
  ns.tprint("");
  ns.tprint("Recommended: Run botnet.js, contracts.js in parallel for income");
}

async function setupAutomation(ns: NS, debug: boolean): Promise<void> {
  const player = ns.getPlayer();
  const hasFactions = player.factions.length > 0;
  const money = ns.getServerMoneyAvailable("home");

  const scriptsToRun = [
    { script: "botnet.js", args: [], ram: 4.0, desc: "Automated hacking for income" },
    { script: "contracts.js", args: [], ram: 2.5, desc: "Solve coding contracts" },
    { script: "auto-factions.js", args: [], ram: 3.0, desc: "Automated faction work" },
    { script: "auto-augs.js", args: ["--target-count", "30", "--auto-install"], ram: 3.5, desc: "Automated augmentation purchasing and installation" },
    // Only run auto-crime if we don't have factions yet AND need money
    ...((!hasFactions && money < 10000000) ? [
      { script: "auto-crime.js", args: ["--prioritize-money"], ram: 2.5, desc: "Early money generation (pre-faction)" }
    ] : []),
  ];

  ns.tprint("");
  ns.tprint("Phase 1: Setting up automation...");
  if (!hasFactions && money < 10000000) {
    ns.tprint("  • Crime work will run until factions are joined");
  } else if (hasFactions) {
    ns.tprint("  • Skipping crime work (factions already joined)");
  } else {
    ns.tprint("  • Skipping crime work (have sufficient money)");
  }
  ns.tprint("");

  for (const { script, args, ram, desc } of scriptsToRun) {
    if (ns.fileExists(script, "home")) {
      // Check if already running
      if (!ns.scriptRunning(script, "home")) {
        const pid = ns.run(script, 1, ...args);
        if (pid > 0) {
          ns.tprint(`✓ Started ${script} - ${desc}`);
          if (debug) ns.tprint(`  PID: ${pid}, Args: ${JSON.stringify(args)}`);
        } else {
          ns.tprint(`✗ Failed to start ${script} (need ${ram}GB RAM)`);
        }
      } else {
        ns.tprint(`✓ ${script} already running`);
      }
    } else {
      ns.tprint(`⚠ ${script} not found - skipping`);
    }
  }

  ns.tprint("");
  ns.tprint("Automation Setup Complete!");
  ns.tprint("─────────────────────────────────────────────");
  ns.tprint("tail auto-factions.js  - Monitor faction work");
  ns.tprint("tail auto-augs.js      - Monitor augmentation purchases");
  ns.tprint("tail auto-crime.js     - Monitor crime income");
  ns.tprint("tail botnet.js         - Monitor hacking operations");
  ns.tprint("");
}

async function monitorProgress(ns: NS, config: StrategyConfig, autoDestroy: boolean, debug: boolean): Promise<void> {
  const startTime = Date.now();
  let lastUpdate = 0;
  const updateInterval = 30000; // Update every 30 seconds

  while (true) {
    const now = Date.now();

    if (now - lastUpdate >= updateInterval) {
      lastUpdate = now;
      const elapsed = now - startTime;

      ns.clearLog();
      ns.print("═══════════════════════════════════════════════════");
      ns.print("  BitNode 4 Progress Monitor");
      ns.print("═══════════════════════════════════════════════════");
      ns.print(`Runtime: ${formatDuration(elapsed)}`);
      ns.print("");

      // Get current stats
      const player = ns.getPlayer();
      const money = ns.getServerMoneyAvailable("home");
      const hackLevel = player.skills.hacking;

      ns.print("Current Stats:");
      ns.print(`  Hacking Level: ${hackLevel}`);
      ns.print(`  Money: $${formatMoney(money)}`);
      ns.print("");

      // Check augmentation count
      const installedAugs = ns.singularity.getOwnedAugmentations();
      const purchasedAugs = ns.singularity.getOwnedAugmentations(true);
      const totalAugs = purchasedAugs.length;
      const newAugs = totalAugs - installedAugs.length;

      ns.print("Augmentation Progress:");
      ns.print(`  Installed: ${installedAugs.length}`);
      ns.print(`  Purchased (not installed): ${newAugs}`);
      ns.print(`  Total: ${totalAugs}`);
      ns.print(`  Needed for Daedalus: ${Math.max(0, 30 - totalAugs)}`);
      ns.print("");

      // Check faction status
      const factions = ns.getPlayer().factions;
      ns.print("Joined Factions:");
      for (const faction of factions.slice(0, 5)) {
        const rep = ns.singularity.getFactionRep(faction);
        ns.print(`  ${faction}: ${formatNumber(rep)} rep`);
      }
      if (factions.length > 5) {
        ns.print(`  ... and ${factions.length - 5} more`);
      }
      ns.print("");

      // Check if we can join Daedalus
      const canJoinDaedalus = totalAugs >= 30 && hackLevel >= 2500 && money >= 100000000000;
      if (canJoinDaedalus && !factions.includes("Daedalus")) {
        ns.print("✓ You can join Daedalus!");
        ns.print("  Attempting to join...");

        // Check for faction invitations
        const invites = ns.singularity.checkFactionInvitations();
        if (invites.includes("Daedalus")) {
          ns.singularity.joinFaction("Daedalus");
          ns.tprint("SUCCESS: Joined Daedalus!");
        }
      }

      // Check if we have The Red Pill
      const hasRedPill = installedAugs.includes("The Red Pill");
      const hasPurchasedRedPill = purchasedAugs.includes("The Red Pill");

      if (hasRedPill) {
        ns.print("");
        ns.print("✓ The Red Pill is installed!");

        // Check if w0r1d_d43m0n is accessible
        const servers = ns.scan("home");
        let wdAccessible = false;

        for (const server of servers) {
          const scanned = ns.scan(server);
          if (scanned.includes("w0r1d_d43m0n")) {
            wdAccessible = true;
            break;
          }
        }

        if (wdAccessible) {
          const wdHackLevel = ns.getServerRequiredHackingLevel("w0r1d_d43m0n");
          const hasRoot = ns.hasRootAccess("w0r1d_d43m0n");

          ns.print(`  w0r1d_d43m0n hack requirement: ${wdHackLevel}`);
          ns.print(`  Your hacking level: ${hackLevel}`);
          ns.print(`  Root access: ${hasRoot ? "✓" : "✗"}`);

          if (hackLevel >= wdHackLevel && hasRoot) {
            ns.print("");
            ns.print("═══════════════════════════════════════════════════");
            ns.print("  🎉 READY TO COMPLETE BN4! 🎉");
            ns.print("═══════════════════════════════════════════════════");

            if (autoDestroy) {
              ns.tprint("");
              ns.tprint("SUCCESS: Destroying w0r1d_d43m0n...");

              // Determine next BitNode (default to BN5 for intelligence)
              const nextBN = 5;

              try {
                ns.singularity.destroyW0r1dD43m0n(nextBN, "bn4.js");
                ns.tprint("BitNode destroyed! Starting next BN...");
              } catch (err) {
                ns.tprint(`ERROR: Failed to destroy BitNode: ${err}`);
                ns.tprint("You may need to do this manually in the Hacking > w0r1d_d43m0n page");
              }

              return;
            } else {
              ns.tprint("");
              ns.tprint("INFO: Ready to destroy BitNode 4!");
              ns.tprint("Run with --auto-destroy flag to automatically proceed,");
              ns.tprint("or manually destroy w0r1d_d43m0n via the Hacking menu.");
              return;
            }
          }
        }
      } else if (hasPurchasedRedPill) {
        ns.print("");
        ns.print("⚠ The Red Pill purchased but not installed");
        ns.print("  Install augmentations to proceed!");
      } else if (factions.includes("Daedalus")) {
        const daedalusRep = ns.singularity.getFactionRep("Daedalus");
        const redPillCost = ns.singularity.getAugmentationRepReq("The Red Pill");

        ns.print("");
        ns.print("Working towards The Red Pill:");
        ns.print(`  Daedalus Rep: ${formatNumber(daedalusRep)} / ${formatNumber(redPillCost)}`);
        ns.print(`  Progress: ${((daedalusRep / redPillCost) * 100).toFixed(1)}%`);

        if (daedalusRep >= redPillCost) {
          ns.print("");
          ns.print("✓ Can purchase The Red Pill!");

          const price = ns.singularity.getAugmentationPrice("The Red Pill");
          if (money >= price) {
            ns.print("  Purchasing...");
            if (ns.singularity.purchaseAugmentation("Daedalus", "The Red Pill")) {
              ns.tprint("SUCCESS: Purchased The Red Pill!");
              ns.tprint("Install augmentations to proceed.");
            }
          } else {
            ns.print(`  Need $${formatMoney(price)} (have $${formatMoney(money)})`);
          }
        }
      }

      ns.print("");
      ns.print("═══════════════════════════════════════════════════");
      ns.print("tail bn4.js to view this monitor");
    }

    await ns.sleep(5000);
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatMoney(amount: number): string {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 't';
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'b';
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'm';
  if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'k';
  return amount.toFixed(2);
}

function formatNumber(num: number): string {
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(0);
}
