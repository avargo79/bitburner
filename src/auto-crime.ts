import { NS } from "@ns";

/**
 * Automated Crime for Early Money & Stats
 * 
 * This script automates committing crimes to:
 * - Generate early money when hacking is nerfed
 * - Increase combat stats for faction work
 * - Build karma (if needed for gang or other mechanics)
 * 
 * Smart crime selection based on success rate and rewards.
 */

interface CrimeStats {
  name: string;
  time: number;
  money: number;
  difficulty: number;
  karma: number;
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['target-crime', ''],  // Specific crime to focus on (empty = auto-select)
  ['min-success-rate', 0.75],  // Minimum success rate to attempt crime
  ['prioritize-money', true],  // Prioritize money over stats
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
  const targetCrime = flags['target-crime'] as string;
  const minSuccessRate = flags['min-success-rate'] as number;
  const prioritizeMoney = flags['prioritize-money'] as boolean;

  if (debug) ns.tprint("[AutoCrime] Starting automated crime...");

  let totalMoneyEarned = 0;
  let totalCrimesDone = 0;
  const startTime = Date.now();

  // Main loop
  while (true) {
    try {
      // Check if player has joined factions - if so, stop crime work
      const player = ns.getPlayer();
      if (player.factions.length > 0) {
        if (debug) ns.print("[AutoCrime] Player has joined factions - stopping crime work");
        ns.tprint("[AutoCrime] ✓ Factions joined - switching to faction work");
        ns.tprint("[AutoCrime] Crime automation no longer needed. Exiting...");
        return;
      }

      // Check if player has good money - if so, crime is less important
      const money = ns.getServerMoneyAvailable("home");
      if (money > 10000000) {
        if (debug) ns.print("[AutoCrime] Have $10m+ - crime work less important");
        ns.tprint("[AutoCrime] ✓ Have $10m+ - crime automation no longer needed");
        ns.tprint("[AutoCrime] Exiting to allow faction work...");
        return;
      }

      // Select best crime
      const crimeToCommit = targetCrime || selectBestCrime(ns, minSuccessRate, prioritizeMoney, debug);

      if (!crimeToCommit) {
        ns.tprint("[AutoCrime] ERROR: No suitable crime found!");
        await ns.sleep(60000);
        continue;
      }

      // Get crime stats
      const crimeChance = ns.singularity.getCrimeChance(crimeToCommit as any);
      const crimeStats = ns.singularity.getCrimeStats(crimeToCommit as any);

      // Commit the crime
      if (debug) ns.print(`[AutoCrime] Committing ${crimeToCommit} (${(crimeChance * 100).toFixed(1)}% success)`);

      ns.singularity.commitCrime(crimeToCommit as any, false);

      // Wait for crime to complete
      await ns.sleep(crimeStats.time);

      // Update stats (estimate - actual result depends on success)
      if (crimeChance >= minSuccessRate) {
        totalMoneyEarned += crimeStats.money * crimeChance;
        totalCrimesDone++;
      }

      // Update status display
      updateStatusDisplay(ns, crimeToCommit, crimeChance, totalMoneyEarned, totalCrimesDone, startTime);

      await ns.sleep(100);
    } catch (err) {
      ns.tprint(`[AutoCrime] ERROR: ${err}`);
      await ns.sleep(30000);
    }
  }
}

function showHelp(ns: NS): void {
  ns.tprint("=== Automated Crime ===");
  ns.tprint("");
  ns.tprint("Usage: run auto-crime.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug                      Enable verbose debug output");
  ns.tprint("  --target-crime <name>        Specific crime to focus on (e.g., 'Homicide')");
  ns.tprint("  --min-success-rate <num>     Minimum success rate to attempt (default: 0.75)");
  ns.tprint("  --prioritize-money           Prioritize money over stats (default: true)");
  ns.tprint("  --help                       Show this help message");
  ns.tprint("");
  ns.tprint("Available crimes:");
  ns.tprint("  Shoplift, Rob Store, Mug, Larceny, Deal Drugs, Bond Forgery,");
  ns.tprint("  Traffick Arms, Homicide, Grand Theft Auto, Kidnap, Assassination, Heist");
  ns.tprint("");
  ns.tprint("This script automates crime to generate money and stats.");
  ns.tprint("Use 'tail auto-crime.js' to monitor progress.");
}

function selectBestCrime(ns: NS, minSuccessRate: number, prioritizeMoney: boolean, debug: boolean): string {
  const crimes = [
    "Shoplift",
    "Rob Store",
    "Mug",
    "Larceny",
    "Deal Drugs",
    "Bond Forgery",
    "Traffick Arms",
    "Homicide",
    "Grand Theft Auto",
    "Kidnap",
    "Assassination",
    "Heist"
  ];

  let bestCrime = "Shoplift";
  let bestValue = 0;

  for (const crime of crimes) {
    const chance = ns.singularity.getCrimeChance(crime as any);

    if (chance < minSuccessRate) {
      continue;
    }

    const stats = ns.singularity.getCrimeStats(crime as any);

    // Calculate value (money per second with success rate factored in)
    const moneyPerSecond = (stats.money * chance) / (stats.time / 1000);

    if (moneyPerSecond > bestValue) {
      bestValue = moneyPerSecond;
      bestCrime = crime;
    }
  }

  if (debug) {
    ns.print(`[AutoCrime] Selected ${bestCrime} (${formatMoney(bestValue)}/sec expected)`);
  }

  return bestCrime;
}

function updateStatusDisplay(ns: NS, currentCrime: string, successRate: number, totalMoney: number, totalCrimes: number, startTime: number): void {
  ns.clearLog();

  const runtime = Date.now() - startTime;
  const moneyPerHour = (totalMoney / runtime) * 3600000;

  ns.print("═══════════════════════════════════════════════");
  ns.print("  Automated Crime");
  ns.print("═══════════════════════════════════════════════");
  ns.print("");

  ns.print(`Current Crime: ${currentCrime}`);
  ns.print(`Success Rate: ${(successRate * 100).toFixed(1)}%`);
  ns.print("");

  ns.print("Statistics:");
  ns.print("─────────────────────────────────────────────");
  ns.print(`Total Crimes: ${totalCrimes}`);
  ns.print(`Money Earned: $${formatMoney(totalMoney)}`);
  ns.print(`Money/Hour: $${formatMoney(moneyPerHour)}`);
  ns.print(`Runtime: ${formatDuration(runtime)}`);
  ns.print("");

  // Get current player stats
  const player = ns.getPlayer();
  ns.print("Combat Stats:");
  ns.print(`  Strength:  ${player.skills.strength}`);
  ns.print(`  Defense:   ${player.skills.defense}`);
  ns.print(`  Dexterity: ${player.skills.dexterity}`);
  ns.print(`  Agility:   ${player.skills.agility}`);
  ns.print("");

  // Show available crimes with success rates
  ns.print("Crime Success Rates:");
  ns.print("─────────────────────────────────────────────");

  const displayCrimes = ["Shoplift", "Mug", "Homicide", "Heist"];
  for (const crime of displayCrimes) {
    const chance = ns.singularity.getCrimeChance(crime as any);
    const stats = ns.singularity.getCrimeStats(crime as any);
    const moneyPerSec = (stats.money * chance) / (stats.time / 1000);

    const bar = createProgressBar(chance * 100, 15);
    ns.print(`${crime.padEnd(12)} ${bar} $${formatMoney(moneyPerSec).padStart(8)}/s`);
  }

  ns.print("");
  ns.print("═══════════════════════════════════════════════");
}

function createProgressBar(percent: number, width: number): string {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${" ".repeat(empty)}]`;
}

function formatMoney(amount: number): string {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 't';
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'b';
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'm';
  if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'k';
  return amount.toFixed(2);
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
