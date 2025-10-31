import { NS } from "@ns";

/**
 * Automated Faction Management for BitNode Speed Runs
 * 
 * This script automates:
 * - Joining all available factions
 * - Working for factions to gain reputation
 * - Prioritizing factions based on augmentation needs
 * - Intelligent work type selection (hacking/field/security)
 */

interface FactionWorkConfig {
  name: string;
  priority: number;
  targetRep: number;
  currentRep: number;
  workType: string;
  augmentations: string[];
}

const argsSchema: [string, string | number | boolean | string[]][] = [
  ['debug', false],
  ['work-continuously', true],  // Keep working for factions
  ['target-rep', 50000],  // Target reputation per faction (covers most augmentations)
  ['prioritize-daedalus', true],  // Focus on Daedalus once joined (needs 2.5M for Red Pill)
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
  const workContinuously = flags['work-continuously'] as boolean;
  const targetRep = flags['target-rep'] as number;
  const prioritizeDaedalus = flags['prioritize-daedalus'] as boolean;

  if (debug) ns.tprint("[AutoFactions] Starting automated faction management...");

  // Main loop
  while (workContinuously) {
    try {
      // Try to get company faction invites by working
      const isWorkingForCompany = await tryWorkForCompanyFactions(ns, debug);

      // If we started company work, skip faction work this iteration
      if (isWorkingForCompany) {
        if (debug) ns.print("[AutoFactions] Started company work, skipping faction work");
        await ns.sleep(10000);
        continue;
      }

      // Travel to cities to get faction invites
      await tryTravelForFactionInvites(ns, debug);

      // Try to backdoor servers for faction invites
      await tryBackdoorFactionServers(ns, debug);

      // Check for faction invitations and join them
      await checkAndJoinFactions(ns, debug);

      // Determine best faction to work for (only if not working for company)
      const bestFaction = await selectBestFaction(ns, targetRep, prioritizeDaedalus, debug);

      if (bestFaction) {
        await workForFaction(ns, bestFaction, debug);
      } else {
        if (debug) ns.print("[AutoFactions] No suitable faction to work for. Waiting...");
      }

      // Update status display
      updateStatusDisplay(ns, targetRep);

      await ns.sleep(10000); // Check every 10 seconds
    } catch (err) {
      ns.tprint(`[AutoFactions] ERROR: ${err}`);
      await ns.sleep(30000);
    }
  }
}

function showHelp(ns: NS): void {
  ns.tprint("=== Automated Faction Management ===");
  ns.tprint("");
  ns.tprint("Usage: run auto-factions.js [options]");
  ns.tprint("");
  ns.tprint("Options:");
  ns.tprint("  --debug                  Enable verbose debug output");
  ns.tprint("  --work-continuously      Keep working for factions (default: true)");
  ns.tprint("  --target-rep <number>    Target reputation per faction (default: 50000)");
  ns.tprint("                           Most augs need 2.5K-50K rep, high-end augs need 100K-175K");
  ns.tprint("  --prioritize-daedalus    Focus on Daedalus once joined (default: true)");
  ns.tprint("                           Red Pill requires 2.5M rep from Daedalus");
  ns.tprint("  --help                   Show this help message");
  ns.tprint("");
  ns.tprint("This script automates faction work to maximize reputation gain.");
  ns.tprint("Use 'tail auto-factions.js' to monitor progress.");
}

function isFactionsConflict(faction: string, existingFactions: string[]): boolean {
  // Define mutually exclusive faction groups
  const gangFactions = ["Slum Snakes", "Tetrads", "The Syndicate", "The Dark Army", "Speakers for the Dead"];

  // Define city faction enemy relationships (from Bitburner source: FactionInfo.tsx)
  const cityFactionEnemies: { [key: string]: string[] } = {
    "Sector-12": ["Chongqing", "New Tokyo", "Ishima", "Volhaven"],
    "Aevum": ["Chongqing", "New Tokyo", "Ishima", "Volhaven"],
    "Chongqing": ["Sector-12", "Aevum", "Volhaven"],
    "New Tokyo": ["Sector-12", "Aevum", "Volhaven"],
    "Ishima": ["Sector-12", "Aevum", "Volhaven"],
    "Volhaven": ["Chongqing", "Sector-12", "New Tokyo", "Aevum", "Ishima"],
  };

  // Check gang faction conflicts (can only be in ONE gang faction)
  if (gangFactions.includes(faction)) {
    const hasOtherGang = existingFactions.some(f => gangFactions.includes(f) && f !== faction);
    if (hasOtherGang) return true;
  }

  // Check city faction enemy conflicts
  if (cityFactionEnemies[faction]) {
    const enemies = cityFactionEnemies[faction];
    const hasEnemyFaction = existingFactions.some(f => enemies.includes(f));
    if (hasEnemyFaction) return true;
  }

  return false;
}

async function checkAndJoinFactions(ns: NS, debug: boolean): Promise<void> {
  const invitations = ns.singularity.checkFactionInvitations();
  const player = ns.getPlayer();

  // Define city factions that have enemy relationships
  const cityFactions = ["Sector-12", "Aevum", "Chongqing", "New Tokyo", "Ishima", "Volhaven"];

  // Separate city faction invites from others
  const cityInvites = invitations.filter(f => cityFactions.includes(f));
  const otherInvites = invitations.filter(f => !cityFactions.includes(f));

  // Join all non-city factions immediately (no conflicts)
  for (const faction of otherInvites) {
    // Check for faction conflicts before joining
    if (isFactionsConflict(faction, player.factions)) {
      if (debug) {
        const gangFactions = ["Slum Snakes", "Tetrads", "The Syndicate", "The Dark Army", "Speakers for the Dead"];

        if (gangFactions.includes(faction)) {
          const currentGang = player.factions.find(f => gangFactions.includes(f));
          ns.print(`[AutoFactions] Skipping ${faction} (already in gang: ${currentGang})`);
        }
      }
      continue;
    }

    const joined = ns.singularity.joinFaction(faction);
    if (joined) {
      ns.tprint(`[AutoFactions] SUCCESS: Joined ${faction}!`);
    }
  }

  // Handle city factions strategically
  if (cityInvites.length > 0) {
    await handleCityFactionInvites(ns, cityInvites, player, debug);
  }
}

async function handleCityFactionInvites(ns: NS, cityInvites: string[], player: any, debug: boolean): Promise<void> {
  // Check if we already joined a city faction
  const cityFactions = ["Sector-12", "Aevum", "Chongqing", "New Tokyo", "Ishima", "Volhaven"];
  const joinedCityFactions = player.factions.filter((f: string) => cityFactions.includes(f));

  if (joinedCityFactions.length > 0) {
    // Already in a city faction, can't join conflicting ones
    for (const faction of cityInvites) {
      if (isFactionsConflict(faction, player.factions)) {
        if (debug) {
          const enemyFaction = joinedCityFactions.find((f: string) => isFactionsConflict(faction, [f]));
          ns.print(`[AutoFactions] Skipping ${faction} (enemy of ${enemyFaction})`);
        }
      } else {
        // No conflict (e.g., Sector-12 + Aevum are compatible)
        const joined = ns.singularity.joinFaction(faction);
        if (joined) {
          ns.tprint(`[AutoFactions] SUCCESS: Joined ${faction}!`);
        }
      }
    }
    return;
  }

  // No city factions joined yet - pick the BEST one based on augmentations
  const bestCity = await selectBestCityFaction(ns, cityInvites, debug);

  if (bestCity) {
    const joined = ns.singularity.joinFaction(bestCity);
    if (joined) {
      ns.tprint(`[AutoFactions] SUCCESS: Joined ${bestCity}! (selected as best city faction)`);
    }
  }
}

async function selectBestCityFaction(ns: NS, cityInvites: string[], debug: boolean): Promise<string | null> {
  if (cityInvites.length === 0) return null;
  if (cityInvites.length === 1) return cityInvites[0];

  // Rank city factions by their augmentation value
  // Some city factions have better augmentations than others
  const cityFactionPriority: { [key: string]: number } = {
    "Sector-12": 1,    // Good all-around augmentations
    "Aevum": 2,        // Compatible with Sector-12
    "New Tokyo": 3,    // Has Neuroreceptor Management (very good!)
    "Chongqing": 4,    // Decent augmentations
    "Ishima": 5,       // Decent augmentations  
    "Volhaven": 6,     // Conflicts with most others, save for later run
  };

  // Sort by priority (lower number = higher priority)
  const sortedInvites = cityInvites.sort((a, b) => {
    const priorityA = cityFactionPriority[a] || 999;
    const priorityB = cityFactionPriority[b] || 999;
    return priorityA - priorityB;
  });

  const bestCity = sortedInvites[0];

  if (debug) {
    ns.print(`[AutoFactions] Multiple city faction invites available:`);
    for (const city of sortedInvites) {
      ns.print(`  - ${city} (priority ${cityFactionPriority[city]})`);
    }
    ns.print(`[AutoFactions] Selected ${bestCity} as best city faction`);
  }

  return bestCity;
}

// Track companies we've already tried to work for
const attemptedCompanies = new Set<string>();

async function tryWorkForCompanyFactions(ns: NS, debug: boolean): Promise<boolean> {
  const player = ns.getPlayer();

  // Major company factions ORDERED BY PRIORITY (best ROI first)
  const companyFactions = [
    // Tier 1: Best ROI companies (highest priority)
    { company: "ECorp", faction: "ECorp", city: "Aevum", repReq: 200000, priority: 1, hackingAugs: true },
    { company: "Four Sigma", faction: "Four Sigma", city: "Sector-12", repReq: 200000, priority: 2, hackingAugs: true },
    { company: "MegaCorp", faction: "MegaCorp", city: "Sector-12", repReq: 200000, priority: 3, hackingAugs: true },

    // Tier 2: Solid companies (good augmentations)
    { company: "Clarke Incorporated", faction: "Clarke Incorporated", city: "Aevum", repReq: 200000, priority: 4, hackingAugs: true },
    { company: "Bachman & Associates", faction: "Bachman & Associates", city: "Aevum", repReq: 200000, priority: 5, hackingAugs: true },
    { company: "NWO", faction: "NWO", city: "Volhaven", repReq: 200000, priority: 6, hackingAugs: true },

    // Tier 3: Optional companies (if time permits)
    { company: "Blade Industries", faction: "Blade Industries", city: "Sector-12", repReq: 200000, priority: 7, hackingAugs: true },
    { company: "OmniTek Incorporated", faction: "OmniTek Incorporated", city: "Volhaven", repReq: 200000, priority: 8, hackingAugs: true },
    { company: "KuaiGong International", faction: "KuaiGong International", city: "Chongqing", repReq: 200000, priority: 9, hackingAugs: true },
    { company: "Fulcrum Technologies", faction: "Fulcrum Secret Technologies", city: "Aevum", repReq: 250000, priority: 10, hackingAugs: true },
  ];

  // Check if player already has company factions
  for (const { company, faction, city, repReq } of companyFactions) {
    // Skip if already in this faction
    if (player.factions.includes(faction)) {
      continue;
    }

    // Skip if we've already attempted this company
    if (attemptedCompanies.has(company)) {
      continue;
    }

    // Skip if faction would conflict
    if (isFactionsConflict(faction, player.factions)) {
      attemptedCompanies.add(company);
      continue;
    }

    // Check if we meet company reputation requirement (need to work there first)
    const currentCompanyRep = ns.singularity.getCompanyRep(company as any);

    if (currentCompanyRep < repReq) {
      // Try to apply for job if not working there
      const currentWork = ns.singularity.getCurrentWork();
      const isWorkingForCompany = currentWork?.type === "COMPANY" && currentWork.companyName === company;

      if (!isWorkingForCompany) {
        // Make sure we're in the right city
        if (player.city !== city) {
          const traveled = ns.singularity.travelToCity(city as any);
          if (!traveled) {
            if (debug) ns.print(`[AutoFactions] Failed to travel to ${city} for ${company}`);
            continue;
          }
          if (debug) ns.print(`[AutoFactions] Traveled to ${city} for ${company}`);
          await ns.sleep(500);
        }

        // Try to apply for software job (best for reputation)
        const applied = ns.singularity.applyToCompany(company as any, "Software");
        if (applied) {
          // Start working with focus enabled for better rep gain
          const workStarted = ns.singularity.workForCompany(company as any, true);
          if (workStarted) {
            ns.tprint(`[AutoFactions] ✓ Got job at ${company} - working for company reputation... [FOCUSED]`);
            if (debug) ns.print(`[AutoFactions] Working at ${company} with focus enabled`);
          } else {
            ns.tprint(`[AutoFactions] ✓ Got job at ${company} - working for company reputation...`);
          }
          attemptedCompanies.add(company);
          return true; // Successfully started company work
        } else if (debug) {
          ns.print(`[AutoFactions] Failed to get job at ${company} (may need higher stats)`);
          attemptedCompanies.add(company);
        }
      } else {
        if (debug) ns.print(`[AutoFactions] Already working at ${company} (${currentCompanyRep.toFixed(0)}/${repReq} rep)`);
        return true; // Already working for company
      }
    } else {
      // Have enough company rep - faction invite should arrive automatically
      if (debug) ns.print(`[AutoFactions] Have ${currentCompanyRep.toFixed(0)} rep with ${company}, waiting for ${faction} invite...`);
      attemptedCompanies.add(company);
    }
  }

  return false; // Not working for any company
}

// Track which cities we've already visited to avoid re-traveling
const visitedCitiesForFactions = new Set<string>();

async function tryTravelForFactionInvites(ns: NS, debug: boolean): Promise<void> {
  const player = ns.getPlayer();

  // Map of city-based factions (using proper city names as types)
  type CityName = "Aevum" | "Chongqing" | "Sector-12" | "New Tokyo" | "Ishima" | "Volhaven";

  const cityFactions: Array<{ faction: string; city: CityName; moneyReq: number; hackReq: number }> = [
    { faction: "Tian Di Hui", city: "Chongqing", moneyReq: 1000000, hackReq: 50 },
    { faction: "Sector-12", city: "Sector-12", moneyReq: 15000000, hackReq: 0 },
    { faction: "New Tokyo", city: "New Tokyo", moneyReq: 20000000, hackReq: 0 },
    { faction: "Ishima", city: "Ishima", moneyReq: 30000000, hackReq: 0 },
    { faction: "Aevum", city: "Aevum", moneyReq: 40000000, hackReq: 0 },
    { faction: "Chongqing", city: "Chongqing", moneyReq: 20000000, hackReq: 0 },
    { faction: "Volhaven", city: "Volhaven", moneyReq: 50000000, hackReq: 0 },
  ];

  const currentMoney = ns.getServerMoneyAvailable("home");
  const currentCity = player.city;
  const pendingInvitations = ns.singularity.checkFactionInvitations();

  for (const { faction, city, moneyReq, hackReq } of cityFactions) {
    // Skip if already in faction
    if (player.factions.includes(faction)) {
      visitedCitiesForFactions.add(city); // Mark as visited since we're already in the faction
      continue;
    }

    // Skip if we already have a pending invitation
    if (pendingInvitations.includes(faction)) {
      visitedCitiesForFactions.add(city); // Mark as visited since invite already received
      continue;
    }

    // Skip if this faction would conflict with existing factions
    if (isFactionsConflict(faction, player.factions)) {
      visitedCitiesForFactions.add(city); // Mark as visited to avoid wasting travel
      if (debug) {
        const gangFactions = ["Slum Snakes", "Tetrads", "The Syndicate", "The Dark Army", "Speakers for the Dead"];
        const cityFactionEnemies: { [key: string]: string[] } = {
          "Sector-12": ["Aevum", "Volhaven"],
          "Aevum": ["Sector-12", "Volhaven", "Chongqing"],
          "Volhaven": ["Sector-12", "Aevum"],
          "Chongqing": ["Aevum", "Ishima", "New Tokyo"],
          "New Tokyo": ["Chongqing", "Ishima"],
          "Ishima": ["Chongqing", "New Tokyo"],
        };

        if (gangFactions.includes(faction)) {
          const currentGang = player.factions.find(f => gangFactions.includes(f));
          ns.print(`[AutoFactions] Skipping travel for ${faction} (already in gang: ${currentGang})`);
        } else if (cityFactionEnemies[faction]) {
          const enemyFaction = player.factions.find(f => cityFactionEnemies[faction].includes(f));
          ns.print(`[AutoFactions] Skipping travel to ${city} (${faction} is enemy of ${enemyFaction})`);
        }
      }
      continue;
    }

    // Skip if we've already traveled to this city for faction invites
    if (visitedCitiesForFactions.has(city)) {
      continue;
    }

    // Skip if we don't meet requirements
    if (currentMoney < moneyReq) {
      continue;
    }

    if (player.skills.hacking < hackReq) {
      continue;
    }

    // Travel to the city
    try {
      const travelCost = 200000; // Cost to travel between cities
      if (currentMoney < travelCost) {
        continue;
      }

      const traveled = ns.singularity.travelToCity(city);
      if (traveled) {
        visitedCitiesForFactions.add(city); // Mark this city as visited
        if (debug) ns.print(`[AutoFactions] Traveled to ${city} for ${faction} faction invite`);
        ns.tprint(`[AutoFactions] ✓ Traveled to ${city} - ${faction} invite should arrive soon`);
        await ns.sleep(1000); // Wait a moment for invite to trigger
        return; // Only travel to one city per loop iteration
      }
    } catch (err) {
      if (debug) ns.print(`[AutoFactions] Error traveling to ${city}: ${err}`);
    }
  }
}

function findPathToServer(ns: NS, target: string, current = "home", visited = new Set<string>()): string[] | null {
  if (current === target) {
    return [current];
  }

  visited.add(current);
  const neighbors = ns.scan(current);

  for (const neighbor of neighbors) {
    if (visited.has(neighbor)) continue;

    const path = findPathToServer(ns, target, neighbor, visited);
    if (path) {
      return [current, ...path];
    }
  }

  return null;
}

async function tryBackdoorFactionServers(ns: NS, debug: boolean): Promise<void> {
  const player = ns.getPlayer();

  // Map of faction servers that need backdoors
  const factionServers = [
    { faction: "CyberSec", server: "CSEC", minHackLevel: 51 },
    { faction: "NiteSec", server: "avmnite-02h", minHackLevel: 202 },
    { faction: "The Black Hand", server: "I.I.I.I", minHackLevel: 340 },
    { faction: "BitRunners", server: "run4theh111z", minHackLevel: 505 },
  ];

  for (const { faction, server, minHackLevel } of factionServers) {
    // Skip if already in faction
    if (player.factions.includes(faction)) {
      continue;
    }

    // Skip if we don't have the hacking level
    if (player.skills.hacking < minHackLevel) {
      continue;
    }

    // Check if server exists and we can access it
    if (!ns.serverExists(server)) {
      continue;
    }

    // Check if server has root access
    const hasRoot = ns.hasRootAccess(server);
    if (!hasRoot) {
      // Try to gain root access
      try {
        // Open ports
        const portsRequired = ns.getServerNumPortsRequired(server);
        let portsOpened = 0;

        if (ns.fileExists("BruteSSH.exe", "home")) {
          ns.brutessh(server);
          portsOpened++;
        }
        if (ns.fileExists("FTPCrack.exe", "home")) {
          ns.ftpcrack(server);
          portsOpened++;
        }
        if (ns.fileExists("relaySMTP.exe", "home")) {
          ns.relaysmtp(server);
          portsOpened++;
        }
        if (ns.fileExists("HTTPWorm.exe", "home")) {
          ns.httpworm(server);
          portsOpened++;
        }
        if (ns.fileExists("SQLInject.exe", "home")) {
          ns.sqlinject(server);
          portsOpened++;
        }

        if (portsOpened >= portsRequired) {
          ns.nuke(server);
          if (debug) ns.print(`[AutoFactions] Gained root on ${server}`);
        } else {
          if (debug) ns.print(`[AutoFactions] Cannot root ${server} (need ${portsRequired} ports, have ${portsOpened})`);
          continue;
        }
      } catch (err) {
        continue;
      }
    }

    // Check if backdoor is already installed
    const serverObj = ns.getServer(server);
    if (serverObj.backdoorInstalled) {
      continue;
    }

    // Try to install backdoor
    try {
      if (debug) ns.print(`[AutoFactions] Installing backdoor on ${server} for ${faction}...`);

      // Find path to server
      const path = findPathToServer(ns, server);
      if (!path) {
        if (debug) ns.print(`[AutoFactions] Could not find path to ${server}`);
        continue;
      }

      // Navigate to server by following the path
      let currentServer = "home";
      for (let i = 1; i < path.length; i++) {
        const nextServer = path[i];
        const connected = ns.singularity.connect(nextServer);
        if (!connected) {
          if (debug) ns.print(`[AutoFactions] Failed to connect to ${nextServer}`);
          break;
        }
        currentServer = nextServer;
      }

      // Check if we reached the target
      if (currentServer === server) {
        await ns.singularity.installBackdoor();
        ns.tprint(`[AutoFactions] ✓ Backdoor installed on ${server}! ${faction} invite should arrive soon.`);
      }

      // Always return to home
      ns.singularity.connect("home");
    } catch (err) {
      if (debug) ns.print(`[AutoFactions] Error backdooring ${server}: ${err}`);
      // Make sure we return to home even on error
      try {
        ns.singularity.connect("home");
      } catch { }
    }
  }
}

async function selectBestFaction(ns: NS, targetRep: number, prioritizeDaedalus: boolean, debug: boolean): Promise<string | null> {
  const player = ns.getPlayer();
  const factions = player.factions;

  if (factions.length === 0) {
    return null;
  }

  // If we're in Daedalus and prioritizing it, work for it
  if (prioritizeDaedalus && factions.includes("Daedalus")) {
    const daedalusRep = ns.singularity.getFactionRep("Daedalus");
    const redPillRepReq = ns.singularity.getAugmentationRepReq("The Red Pill");

    if (daedalusRep < redPillRepReq) {
      if (debug) ns.print(`[AutoFactions] Prioritizing Daedalus (${daedalusRep.toFixed(0)}/${redPillRepReq.toFixed(0)} rep)`);
      return "Daedalus";
    }
  }

  // PRIORITY-BASED FACTION SELECTION
  // Prioritize early-game factions first, then move to harder ones
  const factionPriority = [
    // Tier 1: Early game hacking factions (easiest to access)
    "CyberSec",           // Priority 1: Backdoor CSEC, cheapest exp aug
    "Tian Di Hui",        // Priority 2: Easy city faction, good early augs

    // Tier 2: Early-mid game hacking factions
    "Netburners",         // Priority 3: Hacknet focus, easy to join
    "NiteSec",            // Priority 4: Backdoor avmnite-02h, good exp aug

    // Tier 3: Mid game hacking factions
    "The Black Hand",     // Priority 5: Backdoor I.I.I.I

    // Tier 4: Advanced hacking factions
    "BitRunners",         // Priority 6: Backdoor run4theh111z, excellent augs

    // Tier 5: City factions (join when convenient)
    "Sector-12",
    "Aevum",
    "Chongqing",
    "New Tokyo",
    "Ishima",
    "Volhaven",

    // Tier 6: Company factions (handled separately, but include here)
    "ECorp",
    "MegaCorp",
    "Four Sigma",
    "Clarke Incorporated",
    "Bachman & Associates",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "KuaiGong International",
    "Fulcrum Secret Technologies",

    // Tier 7: Endgame factions
    "The Covenant",
    "Illuminati",
  ];

  // Find highest priority faction that's below target rep
  for (const faction of factionPriority) {
    if (!factions.includes(faction)) continue;

    const rep = ns.singularity.getFactionRep(faction);

    // Check if all augmentations are already owned
    const augs = ns.singularity.getAugmentationsFromFaction(faction);
    const owned = ns.singularity.getOwnedAugmentations(true); // Include pending
    const available = augs.filter(aug => !owned.includes(aug));

    if (available.length === 0) {
      if (debug) ns.print(`[AutoFactions] Skipping ${faction} - all augmentations owned`);
      continue; // Skip this faction, all augs already purchased
    }

    if (rep < targetRep) {
      if (debug) ns.print(`[AutoFactions] Selected ${faction} (priority-based, ${rep.toFixed(0)}/${targetRep} rep, ${available.length} augs remaining)`);
      return faction;
    }
  }

  // Fallback: Find faction with MOST AVAILABLE AUGMENTATIONS that's below target rep
  let bestFaction: string | null = null;
  let maxAvailableAugs = 0;

  for (const faction of factions) {
    const rep = ns.singularity.getFactionRep(faction);

    // Only consider factions below target rep
    if (rep >= targetRep) continue;

    // Count available augmentations (not owned)
    const augs = ns.singularity.getAugmentationsFromFaction(faction);
    const owned = ns.singularity.getOwnedAugmentations(true);
    const available = augs.filter(aug => !owned.includes(aug));

    // Skip factions with no available augmentations
    if (available.length === 0) continue;

    // Pick faction with most available augmentations
    if (available.length > maxAvailableAugs) {
      maxAvailableAugs = available.length;
      bestFaction = faction;
    }
  }

  // If all factions are above target, work for the one with most augmentations available
  if (!bestFaction) {
    let maxAugs = 0;

    for (const faction of factions) {
      const augs = ns.singularity.getAugmentationsFromFaction(faction);
      const owned = ns.singularity.getOwnedAugmentations(true);
      const available = augs.filter(aug => !owned.includes(aug));

      // Skip factions with no available augmentations
      if (available.length === 0) continue;

      if (available.length > maxAugs) {
        maxAugs = available.length;
        bestFaction = faction;
      }
    }
  }

  if (debug && bestFaction) {
    ns.print(`[AutoFactions] Selected ${bestFaction} (fallback: has ${maxAvailableAugs} available augs)`);
  }

  return bestFaction;
}

async function workForFaction(ns: NS, faction: string, debug: boolean): Promise<void> {
  const player = ns.getPlayer();

  // Determine best work type based on player stats
  let workType = "hacking";

  const hackingLevel = player.skills.hacking;
  const combatLevel = Math.max(
    player.skills.strength,
    player.skills.defense,
    player.skills.dexterity,
    player.skills.agility
  );

  // Use combat work if combat stats are significantly higher
  if (combatLevel > hackingLevel * 1.5) {
    workType = "field";
  }

  // Special factions that prefer specific work types
  const hackingFactions = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners", "Netburners"];
  const combatFactions = ["Slum Snakes", "Tetrads", "The Syndicate", "The Dark Army", "Speakers for the Dead"];

  if (hackingFactions.includes(faction)) {
    workType = "hacking";
  } else if (combatFactions.includes(faction)) {
    workType = "field";
  }

  // Try to start work (with focus enabled for better rep gain)
  let success = false;

  try {
    if (workType === "hacking") {
      success = ns.singularity.workForFaction(faction, "hacking", true);
    } else if (workType === "field") {
      success = ns.singularity.workForFaction(faction, "field", true);
    }

    if (!success) {
      // Fallback to security work if others fail
      success = ns.singularity.workForFaction(faction, "security", true);
    }

    if (success) {
      ns.tprint(`[AutoFactions] Started working for ${faction} (${workType}) [FOCUSED]`);
      if (debug) ns.print(`[AutoFactions] Working for ${faction} (${workType}) with focus enabled`);
    }
  } catch (err) {
    if (debug) ns.print(`[AutoFactions] Failed to work for ${faction}: ${err}`);
  }
}

function updateStatusDisplay(ns: NS, targetRep: number): void {
  ns.clearLog();

  const player = ns.getPlayer();
  const factions = player.factions;

  ns.print("═══════════════════════════════════════════════");
  ns.print("  Automated Faction Management");
  ns.print("═══════════════════════════════════════════════");
  ns.print("");

  if (factions.length === 0) {
    ns.print("No factions joined yet.");
    ns.print("");
    ns.print("Tips to get faction invites:");
    ns.print("  - Increase hacking level");
    ns.print("  - Backdoor servers");
    ns.print("  - Visit cities (Aevum, Chongqing, Sector-12)");
    ns.print("  - Accumulate money ($15m+ for Illuminati)");
    return;
  }

  ns.print(`Joined Factions: ${factions.length}`);
  ns.print("");

  // Get current work
  const currentWork = ns.singularity.getCurrentWork();
  if (currentWork && currentWork.type === "FACTION") {
    ns.print(`Currently working for: ${currentWork.factionName}`);
    ns.print(`Work type: ${currentWork.factionWorkType}`);
    ns.print("");
  }

  ns.print("Faction Reputation Progress:");
  ns.print("─────────────────────────────────────────────");

  // Sort factions by reputation (lowest first)
  const factionData = factions.map(f => ({
    name: f,
    rep: ns.singularity.getFactionRep(f),
    favor: ns.singularity.getFactionFavor(f)
  })).sort((a, b) => a.rep - b.rep);

  for (const faction of factionData.slice(0, 10)) {
    const progress = Math.min(100, (faction.rep / targetRep) * 100);
    const bar = createProgressBar(progress, 20);

    ns.print(`${faction.name.padEnd(20)} ${bar} ${formatNumber(faction.rep)}/${formatNumber(targetRep)}`);
  }

  if (factionData.length > 10) {
    ns.print(`... and ${factionData.length - 10} more`);
  }

  ns.print("");
  ns.print("═══════════════════════════════════════════════");
}

function createProgressBar(percent: number, width: number): string {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${" ".repeat(empty)}]`;
}

function formatNumber(num: number): string {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(0);
}
