import { NS } from '@ns';

/**
 * Network Prep Script
 * Launches grow and weaken operations to prepare servers for HWGW batching
 * 
 * Optimal server conditions for HWGW:
 * - Security at minimum level
 * - Money at maximum level
 * 
 * Usage: run prep.js [target] [--continuous]
 * - target: Optional target server (default: auto-select best target)
 * - --continuous: Keep running until manually stopped
 */

interface PrepStatus {
  target: string;
  currentSecurity: number;
  minSecurity: number;
  currentMoney: number;
  maxMoney: number;
  isPrepped: boolean;
  securityDelta: number;
  moneyRatio: number;
}

interface BotnetServer {
  hostname: string;
  maxRam: number;
  usedRam: number;
  freeRam: number;
  hasRoot: boolean;
}

const SECURITY_OPTIMAL_THRESHOLD = 5.0;  // Max security above minimum
const MONEY_OPTIMAL_RATIO = 0.75;        // Minimum 75% of max money
const MIN_TARGET_MONEY = 1e6;            // Minimum $1M for viable targets

export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL');
  ns.enableLog('exec');

  const args = ns.args;
  let targetServer = args[0] as string || '';
  const continuous = args.includes('--continuous');
  const killOthers = args.includes('--kill');

  // Get RAM costs for remote scripts
  const weakenRam = ns.getScriptRam('/remote/wk.js');
  const growRam = ns.getScriptRam('/remote/gr.js');

  ns.print(`Script RAM costs: weaken=${weakenRam.toFixed(2)}GB, grow=${growRam.toFixed(2)}GB`);

  // Optionally kill other scripts to free up RAM
  if (killOthers) {
    ns.tprint('INFO: Killing all scripts except prep.js to free RAM...');
    const allServers: string[] = [];
    const visited = new Set<string>();
    const queue = ['home'];

    while (queue.length > 0) {
      const hostname = queue.shift()!;
      if (visited.has(hostname)) continue;
      visited.add(hostname);
      allServers.push(hostname);

      const connected = ns.scan(hostname);
      for (const server of connected) {
        if (!visited.has(server)) {
          queue.push(server);
        }
      }
    }

    let killedCount = 0;
    for (const server of allServers) {
      if (!ns.hasRootAccess(server)) continue;
      const processes = ns.ps(server);
      for (const proc of processes) {
        if (!proc.filename.includes('prep.js')) {
          if (ns.kill(proc.pid)) {
            killedCount++;
          }
        }
      }
    }
    ns.tprint(`INFO: Killed ${killedCount} processes`);
    await ns.sleep(1000); // Give time for processes to clean up
  }

  // If no target specified, find the best one
  if (!targetServer) {
    const bestTarget = findBestTarget(ns);
    if (!bestTarget) {
      ns.tprint('ERROR: No viable target found for prep');
      return;
    }
    targetServer = bestTarget;
    ns.tprint(`INFO: Auto-selected target: ${targetServer}`);
  }

  // Validate target exists and is hackable
  if (!ns.serverExists(targetServer)) {
    ns.tprint(`ERROR: Target server '${targetServer}' does not exist`);
    return;
  }

  if (!ns.hasRootAccess(targetServer)) {
    ns.tprint(`ERROR: No root access to '${targetServer}'`);
    return;
  }

  const playerHackLevel = ns.getHackingLevel();
  const requiredHackLevel = ns.getServerRequiredHackingLevel(targetServer);

  if (playerHackLevel < requiredHackLevel) {
    ns.tprint(`ERROR: Insufficient hacking level for '${targetServer}' (need ${requiredHackLevel}, have ${playerHackLevel})`);
    return;
  }

  // Main prep loop
  let iteration = 0;
  do {
    iteration++;
    ns.print(`\n=== Prep Iteration ${iteration} ===`);

    const status = getServerStatus(ns, targetServer);
    displayStatus(ns, status);

    if (status.isPrepped) {
      ns.tprint(`SUCCESS: ${targetServer} is fully prepped and ready for HWGW!`);
      ns.tprint(`  Security: ${status.currentSecurity.toFixed(2)} (min: ${status.minSecurity.toFixed(2)})`);
      ns.tprint(`  Money: $${ns.formatNumber(status.currentMoney)} / $${ns.formatNumber(status.maxMoney)} (${(status.moneyRatio * 100).toFixed(1)}%)`);

      if (!continuous) {
        return;
      }

      // In continuous mode, sleep and check again
      await ns.sleep(10000);
      continue;
    }

    // Get available botnet servers
    const botnet = getBotnetServers(ns, Math.max(weakenRam, growRam));
    if (botnet.length === 0) {
      ns.tprint('ERROR: No servers available for prep operations');
      return;
    }

    // Display RAM summary
    const totalRam = botnet.reduce((sum, s) => sum + s.maxRam, 0);
    const usedRam = botnet.reduce((sum, s) => sum + s.usedRam, 0);
    const freeRam = botnet.reduce((sum, s) => sum + s.freeRam, 0);
    const freePercent = (freeRam / totalRam) * 100;

    ns.print(`\nBotnet RAM Summary:`);
    ns.print(`  Servers: ${botnet.length}`);
    ns.print(`  Total RAM: ${ns.formatRam(totalRam)}`);
    ns.print(`  Used RAM: ${ns.formatRam(usedRam)}`);
    ns.print(`  Free RAM: ${ns.formatRam(freeRam)} (${freePercent.toFixed(1)}%)`);
    ns.print(`  Max threads (grow): ${Math.floor(freeRam / growRam)}`);
    ns.print(`  Max threads (weaken): ${Math.floor(freeRam / weakenRam)}\n`);

    ns.print(`Found ${botnet.length} servers with root access`);

    // Calculate what operations are needed
    const needWeaken = status.securityDelta > 0;
    const needGrow = status.moneyRatio < 1.0;

    if (needWeaken) {
      const weakenAmount = status.securityDelta;
      const threadsNeeded = Math.ceil(weakenAmount / 0.05); // 0.05 security per weaken thread

      ns.print(`Need to reduce security by ${weakenAmount.toFixed(2)} (${threadsNeeded} threads)`);

      const threadsLaunched = launchOperation(ns, botnet, targetServer, 'wk', threadsNeeded, weakenRam);
      ns.print(`Launched ${threadsLaunched}/${threadsNeeded} weaken threads`);

      if (threadsLaunched > 0) {
        // Wait for weaken to complete
        const weakenTime = ns.getWeakenTime(targetServer);
        ns.print(`Waiting ${ns.tFormat(weakenTime)} for weaken to complete...`);
        await ns.sleep(weakenTime + 1000);
      }
    }

    if (needGrow) {
      const growthNeeded = status.maxMoney / Math.max(1, status.currentMoney);
      const threadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, growthNeeded));

      ns.print(`Need to grow money by ${growthNeeded.toFixed(2)}x (${threadsNeeded} threads)`);

      const threadsLaunched = launchOperation(ns, botnet, targetServer, 'gr', threadsNeeded, growRam);
      ns.print(`Launched ${threadsLaunched}/${threadsNeeded} grow threads`);

      if (threadsLaunched > 0) {
        // Wait for grow to complete
        const growTime = ns.getGrowTime(targetServer);
        ns.print(`Waiting ${ns.tFormat(growTime)} for grow to complete...`);
        await ns.sleep(growTime + 1000);

        // Grow increases security, so we may need another weaken pass
        const securityIncrease = threadsLaunched * 0.004; // 0.004 security per grow thread
        ns.print(`Grow will increase security by ${securityIncrease.toFixed(2)}`);
      }
    }

    // Brief pause between iterations
    await ns.sleep(1000);

  } while (continuous || !getServerStatus(ns, targetServer).isPrepped);

  // Final status
  const finalStatus = getServerStatus(ns, targetServer);
  if (finalStatus.isPrepped) {
    ns.tprint(`SUCCESS: ${targetServer} prep complete!`);
  } else {
    ns.tprint(`WARNING: Prep incomplete - may need more iterations or RAM`);
  }
}

function getServerStatus(ns: NS, target: string): PrepStatus {
  const currentSecurity = ns.getServerSecurityLevel(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);
  const currentMoney = ns.getServerMoneyAvailable(target);
  const maxMoney = ns.getServerMaxMoney(target);

  const securityDelta = Math.max(0, currentSecurity - minSecurity);
  const moneyRatio = maxMoney > 0 ? currentMoney / maxMoney : 0;

  const isPrepped = securityDelta <= SECURITY_OPTIMAL_THRESHOLD &&
    moneyRatio >= MONEY_OPTIMAL_RATIO;

  return {
    target,
    currentSecurity,
    minSecurity,
    currentMoney,
    maxMoney,
    isPrepped,
    securityDelta,
    moneyRatio
  };
}

function displayStatus(ns: NS, status: PrepStatus): void {
  ns.print(`Target: ${status.target}`);
  ns.print(`Security: ${status.currentSecurity.toFixed(2)} / ${status.minSecurity.toFixed(2)} (delta: ${status.securityDelta.toFixed(2)})`);
  ns.print(`Money: $${ns.formatNumber(status.currentMoney)} / $${ns.formatNumber(status.maxMoney)} (${(status.moneyRatio * 100).toFixed(1)}%)`);
  ns.print(`Status: ${status.isPrepped ? '✓ READY' : '✗ NEEDS PREP'}`);
}

function getBotnetServers(ns: NS, minRamPerThread: number): BotnetServer[] {
  const servers: BotnetServer[] = [];
  const visited = new Set<string>();
  const queue = ['home'];

  while (queue.length > 0) {
    const hostname = queue.shift()!;

    if (visited.has(hostname)) continue;
    visited.add(hostname);

    // Add connected servers to queue
    const connected = ns.scan(hostname);
    for (const server of connected) {
      if (!visited.has(server)) {
        queue.push(server);
      }
    }

    // Check if this server has root access
    if (!ns.hasRootAccess(hostname)) continue;

    const maxRam = ns.getServerMaxRam(hostname);
    const usedRam = ns.getServerUsedRam(hostname);
    const freeRam = maxRam - usedRam;

    // Only include servers with enough RAM for at least 1 thread
    if (freeRam >= minRamPerThread) {
      servers.push({
        hostname,
        maxRam,
        usedRam,
        freeRam,
        hasRoot: true
      });
    }
  }

  // Sort by free RAM (most available first)
  servers.sort((a, b) => b.freeRam - a.freeRam);

  return servers;
}

function launchOperation(
  ns: NS,
  botnet: BotnetServer[],
  target: string,
  operation: 'gr' | 'wk',
  threadsNeeded: number,
  scriptRamCost: number
): number {
  const scriptName = `/remote/${operation}.js`;
  let threadsLaunched = 0;

  // Create a unique batch ID for tracking
  const batchId = `${target}-${Date.now()}`;

  // Distribute threads across botnet servers
  for (const server of botnet) {
    if (threadsLaunched >= threadsNeeded) break;

    const maxThreads = Math.floor(server.freeRam / scriptRamCost);
    const threadsToLaunch = Math.min(maxThreads, threadsNeeded - threadsLaunched);

    if (threadsToLaunch <= 0) continue;

    // Launch the operation
    const pid = ns.exec(scriptName, server.hostname, threadsToLaunch, batchId, 0);

    if (pid > 0) {
      threadsLaunched += threadsToLaunch;
      ns.print(`  ${server.hostname}: ${threadsToLaunch} threads (PID ${pid})`);
    }
  }

  return threadsLaunched;
}

function findBestTarget(ns: NS): string | null {
  const playerHackLevel = ns.getHackingLevel();
  const servers: Array<{ hostname: string, score: number }> = [];
  const visited = new Set<string>();
  const queue = ['home'];

  // Scan all servers
  while (queue.length > 0) {
    const hostname = queue.shift()!;

    if (visited.has(hostname)) continue;
    visited.add(hostname);

    const connected = ns.scan(hostname);
    for (const server of connected) {
      if (!visited.has(server)) {
        queue.push(server);
      }
    }

    // Skip if we can't hack this server
    if (!ns.hasRootAccess(hostname)) continue;

    const requiredLevel = ns.getServerRequiredHackingLevel(hostname);
    if (requiredLevel > playerHackLevel) continue;

    const maxMoney = ns.getServerMaxMoney(hostname);
    if (maxMoney < MIN_TARGET_MONEY) continue;

    // Score based on max money and hack time
    const hackTime = ns.getHackTime(hostname);
    const score = maxMoney / hackTime;

    servers.push({ hostname, score });
  }

  // Sort by score (highest first)
  servers.sort((a, b) => b.score - a.score);

  return servers.length > 0 ? servers[0].hostname : null;
}
