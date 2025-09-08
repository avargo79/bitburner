import { AutocompleteData, NS, ScriptArg } from "@ns";

/**
 * Botnet Management System
 * 
 * Complete botnet lifecycle automation:
 * - Advanced HWGW batching with precise timing coordination
 * - Automated server rooting (exploit tools + nuke)
 * - Purchased server management (buying and upgrading)
 * - Multi-server thread allocation across entire botnet
 * - Real-time performance monitoring and failure detection
 * 
 * Command-line options:
 * --debug=true          Enable detailed debug output
 * --repeat=true         Run continuously (vs single batch)
 * --rooting=true        Enable automatic server rooting
 * --purchasing=true     Enable purchased server management
 * --max-servers=25      Maximum purchased servers to buy
 * --target-ram-power=20 Target RAM power (2^20 = 1TB per server)
 */

// Self-contained interfaces - no external imports
interface ServerData {
    hostname: string;
    hasAdminRights: boolean;
    purchasedByPlayer: boolean;
    requiredHackingSkill: number;
    maxRam: number;
    ramUsed: number;
    moneyMax: number;
    moneyAvailable: number;
    hackDifficulty: number;
    minDifficulty: number;
    hackTime: number;
    weakenTime: number;
    growTime: number;
}

// Utility functions
function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

function buildServerData(ns: NS): ServerData[] {
    const hostnames = getServerList(ns);
    const servers: ServerData[] = [];
    
    for (const hostname of hostnames) {
        const server = ns.getServer(hostname);
        const serverData: ServerData = {
            hostname: hostname,
            hasAdminRights: server.hasAdminRights,
            purchasedByPlayer: server.purchasedByPlayer,
            requiredHackingSkill: server.requiredHackingSkill ?? 0,
            maxRam: server.maxRam,
            ramUsed: server.ramUsed,
            moneyMax: server.moneyMax ?? 0,
            moneyAvailable: server.moneyAvailable ?? 0,
            hackDifficulty: server.hackDifficulty ?? 0,
            minDifficulty: server.minDifficulty ?? 0,
            hackTime: ns.getHackTime(hostname),
            weakenTime: ns.getWeakenTime(hostname),
            growTime: ns.getGrowTime(hostname)
        };
        servers.push(serverData);
    }
    
    return servers;
}

const isTarget = (server: ServerData) =>
    server.hasAdminRights
    && !server.purchasedByPlayer
    && server.moneyMax > 0;

const isAttacker = (server: ServerData) =>
    server.hasAdminRights
    && server.maxRam - server.ramUsed > 0;

const targetValue = (server: ServerData) => Math.floor(server.moneyMax / server.weakenTime);

const byValue = (a: ServerData, b: ServerData) => targetValue(b) - targetValue(a);

const byAvailableRam = (a: ServerData, b: ServerData) => (b.maxRam - b.ramUsed) - (a.maxRam - a.ramUsed);

const reserveRam = 32;

// Server Management Functions
function rootServer(ns: NS, hostname: string): boolean {
    try {
        // Try all available exploit tools
        try { ns.brutessh(hostname); } catch (e) { }
        try { ns.ftpcrack(hostname); } catch (e) { }
        try { ns.relaysmtp(hostname); } catch (e) { }
        try { ns.httpworm(hostname); } catch (e) { }
        try { ns.sqlinject(hostname); } catch (e) { }
        
        // Attempt to nuke
        try { 
            ns.nuke(hostname); 
            return true;
        } catch (e) { 
            return false;
        }
    } catch (e) {
        return false;
    }
}

function performServerRooting(ns: NS, servers: ServerData[]): number {
    let rootedCount = 0;
    const unrootedServers = servers.filter(s => !s.hasAdminRights && s.hostname !== 'home');
    
    for (const server of unrootedServers) {
        if (rootServer(ns, server.hostname)) {
            rootedCount++;
            // Update the server data to reflect new admin rights
            server.hasAdminRights = true;
        }
    }
    
    return rootedCount;
}

function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number): { bought: number; upgraded: number } {
    const playerMoney = ns.getServerMoneyAvailable('home');
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    let bought = 0;
    let upgraded = 0;
    
    // Buy new servers if under limit and affordable
    if (purchasedServers.length < maxServers) {
        const baseCost = ns.getPurchasedServerCost(2); // 2GB starting RAM
        if (playerMoney >= baseCost) {
            const serverName = `pserv-${purchasedServers.length + 1}`;
            const hostname = ns.purchaseServer(serverName, 2);
            if (hostname) {
                bought++;
                ns.print(`Purchased server: ${hostname} (2GB)`);
            }
        }
    }
    
    // Upgrade existing servers
    if (purchasedServers.length > 0) {
        // Sort by RAM size (upgrade smallest first)
        purchasedServers.sort((a, b) => a.maxRam - b.maxRam);
        
        for (const server of purchasedServers) {
            const currentPower = Math.log2(server.maxRam);
            if (currentPower < targetRamPower) {
                const newRam = server.maxRam * 2;
                const upgradeCost = ns.getPurchasedServerUpgradeCost(server.hostname, newRam);
                
                if (playerMoney >= upgradeCost) {
                    if (ns.upgradePurchasedServer(server.hostname, newRam)) {
                        upgraded++;
                        ns.print(`Upgraded ${server.hostname}: ${server.maxRam}GB → ${newRam}GB`);
                        break; // Only upgrade one per cycle to avoid spending all money
                    }
                }
            }
        }
    }
    
    return { bought, upgraded };
}

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
    ['rooting', true],
    ['purchasing', true],
    ['max-servers', 25],
    ['target-ram-power', 20],
];

// Simple performance tracking
let botnetStartTime = Date.now();
let totalBatchCycles = 0;

let options: {
    [key: string]: string[] | ScriptArg;
};

export function autocomplete(data: AutocompleteData, _args: any) {
    data.flags(argsSchema);
    return [];
}

// Batching interfaces
interface INetworkRAMSnapshot {
    totalAvailable: number;
    servers: { hostname: string; availableRAM: number }[];
}

interface IHWGWBatch {
    target: ServerData;
    hackThreads: number;
    weaken1Threads: number;
    growThreads: number;
    weaken2Threads: number;
    totalThreads: number;
    hackStartDelay: number;
    weaken1StartDelay: number;
    growStartDelay: number;
    weaken2StartDelay: number;
}

interface IPrepBatch {
    target: ServerData;
    weakenThreads: number;
    growThreads: number;
    totalThreads: number;
    priority: 'security' | 'money';
}

interface IExecutionResults {
    totalScripts: number;
    successfulScripts: number;
    failedScripts: number;
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('sleep');
    ns.disableLog('run');
    ns.disableLog('scp');
    ns.disableLog('exec');
    ns.disableLog('scan');
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('getHackingLevel');
    ns.disableLog('getServer');
    ns.disableLog('ps');
    ns.disableLog('scriptKill');
    
    options = ns.flags(argsSchema);
    
    // Check if another botnet instance is already running
    const runningScripts = ns.ps();
    for (const script of runningScripts) {
        if (script.filename === 'botnet.js' && script.pid !== ns.getRunningScript()?.pid) {
            ns.tprint(`Botnet System: Another instance is already running (PID: ${script.pid}). Exiting.`);
            return; // Exit gracefully, let the existing instance continue
        }
    }
    
    if (options.debug) {
        ns.tprint(`Botnet System: Starting with PID ${ns.getRunningScript()?.pid} (rooting=${options.rooting}, purchasing=${options.purchasing})`);
    }
    
    ns.atExit(() => {
        // Kill all simple-* scripts directly using a more comprehensive approach
        try {
            // Get all servers in the network
            const allServers = getServerList(ns);
            let totalKilled = 0;
            for (const hostname of allServers) {
                try {
                    const server = ns.getServer(hostname);
                    if (server.hasAdminRights && server.maxRam > 0) {
                        const runningScripts = ns.ps(hostname);
                        for (const script of runningScripts) {
                            if (script.filename.includes('simple-')) {
                                const killed = ns.scriptKill(script.filename, hostname);
                                if (killed) totalKilled++;
                            }
                        }
                    }
                } catch (e) {
                    // Skip servers that can't be accessed
                }
            }
            if (totalKilled > 0) {
                ns.tprint(`Botnet cleanup: killed ${totalKilled} remote scripts`);
            }
        } catch (e) {
            // Fallback: just print a message
            ns.tprint(`Botnet cleanup failed - you may need to run 'killremote.js' manually`);
        }
    });

    do {
        ns.clearLog();

        const playerHackLevel = ns.getHackingLevel();
        const servers = buildServerData(ns);
        
        // PHASE 1: Server Management (if enabled)
        if (options.rooting) {
            const rootedCount = performServerRooting(ns, servers);
            if (rootedCount > 0) {
                ns.print(`Rooted ${rootedCount} new servers`);
            }
        }
        
        if (options.purchasing) {
            const maxServers = options['max-servers'] as number;
            const targetRamPower = options['target-ram-power'] as number;
            const serverManagement = managePurchasedServers(ns, servers, maxServers, targetRamPower);
            if (serverManagement.bought > 0 || serverManagement.upgraded > 0) {
                ns.print(`Server management: bought ${serverManagement.bought}, upgraded ${serverManagement.upgraded}`);
            }
        }
        
        // PHASE 2: HWGW Batching
        const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel).sort(byValue);
        const attackers = servers.filter(isAttacker).sort(byAvailableRam);
        
        if (attackers.length === 0) {
            ns.print('No attacker servers available. Rooting servers...');
            await ns.sleep(5000);
            continue;
        }
        
        // Copy remote scripts to all attackers
        attackers.forEach(s => {
            ns.scp('remote/simple-hack.js', s.hostname);
            ns.scp('remote/simple-weaken.js', s.hostname);
            ns.scp('remote/simple-grow.js', s.hostname);
        });

        // STEP 1: Snapshot Network RAM
        const networkRAMSnapshot = takeNetworkRAMSnapshot(ns, attackers);
        let remainingRAMBudget = networkRAMSnapshot.totalAvailable;
        const scriptRamCost = 1.75; // GB per thread
        
        if (options.debug) {
            ns.tprint(`Network RAM Budget: ${remainingRAMBudget.toFixed(2)}GB across ${networkRAMSnapshot.servers.length} servers`);
        }

        // STEP 2: Select Hackable Targets
        const hackableTargets = selectHackableTargets(targets);
        const nonReadyTargets = targets.filter(t => !hackableTargets.includes(t));
        
        if (options.debug) {
            ns.tprint(`Found ${hackableTargets.length} hack-ready targets, ${nonReadyTargets.length} need prep`);
        }

        // STEP 3: Allocate Full HWGW Batches
        const hwgwBatches: IHWGWBatch[] = [];
        
        while (remainingRAMBudget > scriptRamCost * 10) {
            let batchAllocatedThisRound = false;
            
            for (const target of hackableTargets) {
                const fullBatch = calculateFullHWGWBatch(ns, target);
                const batchRAMCost = fullBatch.totalThreads * scriptRamCost;
                
                if (batchRAMCost <= remainingRAMBudget) {
                    hwgwBatches.push(fullBatch);
                    remainingRAMBudget -= batchRAMCost;
                    batchAllocatedThisRound = true;
                    
                    if (options.debug) {
                        ns.tprint(`Allocated HWGW batch for ${target.hostname}: ${fullBatch.totalThreads} threads (${batchRAMCost.toFixed(2)}GB)`);
                    }
                }
            }
            
            if (!batchAllocatedThisRound) {
                break;
            }
        }

        // STEP 4: Prepare Future Targets
        const prepBatches: IPrepBatch[] = [];
        while (remainingRAMBudget >= scriptRamCost && nonReadyTargets.length > 0) {
            let prepAllocatedThisRound = false;
            
            for (const target of nonReadyTargets) {
                if (remainingRAMBudget < scriptRamCost) break;
                
                const prepBatch = calculatePrepBatch(ns, target, remainingRAMBudget, scriptRamCost);
                if (prepBatch && prepBatch.totalThreads > 0) {
                    const prepRAMCost = prepBatch.totalThreads * scriptRamCost;
                    prepBatches.push(prepBatch);
                    remainingRAMBudget -= prepRAMCost;
                    prepAllocatedThisRound = true;
                    
                    if (options.debug) {
                        ns.tprint(`Allocated prep batch for ${target.hostname}: ${prepBatch.totalThreads} threads (${prepRAMCost.toFixed(2)}GB)`);
                    }
                }
            }
            
            if (!prepAllocatedThisRound) {
                break;
            }
        }

        // STEP 5: Execute the batches
        const executionResults = executeHWGWBatches(ns, hwgwBatches, prepBatches, networkRAMSnapshot, scriptRamCost, !!options.debug);
        
        // Track batch cycles
        totalBatchCycles++;
        
        if (options.debug) {
            ns.tprint(`Execution Summary: ${executionResults.successfulScripts}/${executionResults.totalScripts} scripts started successfully`);
            ns.tprint(`Remaining RAM Budget: ${remainingRAMBudget.toFixed(2)}GB`);
        }

        // CONTINUOUS BATCHING
        while (true) {
            await ns.sleep(1000);
            ns.clearLog();
            
            const currentServers = buildServerData(ns);
            const currentAttackers = currentServers.filter(isAttacker).sort(byAvailableRam);
            const currentTargets = currentServers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel).sort(byValue);
            
            const currentNetworkRAM = takeNetworkRAMSnapshot(ns, currentAttackers);
            let availableRAM = currentNetworkRAM.totalAvailable;
            
            printStatus(ns, currentServers, playerHackLevel);
            
            if (availableRAM > scriptRamCost * 50) {
                if (options.debug) {
                    ns.tprint(`Detected ${availableRAM.toFixed(2)}GB available RAM - spawning additional batches`);
                }
                
                const currentHackableTargets = selectHackableTargets(currentTargets);
                const additionalHWGWBatches: IHWGWBatch[] = [];
                
                for (const target of currentHackableTargets) {
                    if (availableRAM < scriptRamCost * 10) continue;
                    
                    const batch = calculateFullHWGWBatch(ns, target);
                    const batchCost = batch.totalThreads * scriptRamCost;
                    
                    if (batchCost <= availableRAM) {
                        additionalHWGWBatches.push(batch);
                        availableRAM -= batchCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional HWGW batch for ${target.hostname}: ${batch.totalThreads} threads`);
                        }
                    }
                }
                
                const currentNonReadyTargets = currentTargets.filter(t => !currentHackableTargets.includes(t));
                const additionalPrepBatches: IPrepBatch[] = [];
                
                for (const target of currentNonReadyTargets) {
                    if (availableRAM < scriptRamCost) break;
                    
                    const prepBatch = calculatePrepBatch(ns, target, availableRAM, scriptRamCost);
                    if (prepBatch && prepBatch.totalThreads > 0) {
                        const prepCost = prepBatch.totalThreads * scriptRamCost;
                        additionalPrepBatches.push(prepBatch);
                        availableRAM -= prepCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional prep batch for ${target.hostname}: ${prepBatch.totalThreads} threads`);
                        }
                    }
                }
                
                if (additionalHWGWBatches.length > 0 || additionalPrepBatches.length > 0) {
                    executeHWGWBatches(ns, additionalHWGWBatches, additionalPrepBatches, currentNetworkRAM, scriptRamCost, !!options.debug);
                }
            }
            
            if (!options.repeat) {
                const running = currentServers.some(s => ns.ps(s.hostname).some(p => p.filename.includes('simple-')));
                if (!running) break;
            }
        }
    } while (options.repeat);
}

function printStatus(ns: NS, servers: ServerData[], playerHackLevel: number) {
    const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel);
    const attackers = servers.filter(isAttacker);
    
    const runningScripts = servers.flatMap(s => ns.ps(s.hostname).filter((p: any) => p.filename.includes('simple-')));
    const running = runningScripts.length > 0;
    
    // Server management stats
    const totalServers = servers.length;
    const rootedServers = servers.filter(s => s.hasAdminRights).length;
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    const purchasedCount = purchasedServers.length;
    const totalPurchasedRAM = purchasedServers.reduce((sum, s) => sum + s.maxRam, 0);
    
    if (running) {
        const scriptStats = { hack: 0, weaken: 0, grow: 0, total: runningScripts.length };
        runningScripts.forEach((p: any) => {
            if (p.filename.includes('hack')) scriptStats.hack++;
            if (p.filename.includes('weaken')) scriptStats.weaken++;
            if (p.filename.includes('grow')) scriptStats.grow++;
        });
        
        const totalRAM = attackers.reduce((sum, s) => sum + s.maxRam, 0);
        const usedRAM = attackers.reduce((sum, s) => sum + s.ramUsed, 0);
        const utilization = totalRAM > 0 ? (usedRAM / totalRAM * 100) : 0;
        
        const playerMoney = ns.getServerMoneyAvailable('home');
        
        let incomeRate = 0;
        try {
            incomeRate = ns.getTotalScriptIncome()[0] ?? 0;
        } catch {
            incomeRate = 0;
        }
        
        const readyTargets = targets.filter(t => {
            const securityOk = t.hackDifficulty <= t.minDifficulty + 5;
            const moneyOk = t.moneyAvailable >= t.moneyMax * 0.95;
            return securityOk && moneyOk;
        });
        const prepTargets = targets.filter(t => !readyTargets.includes(t));
        
        // Get active targets being attacked
        const activeTargets = new Map<string, { hack: number; weaken: number; grow: number }>();
        runningScripts.forEach((p: any) => {
            const target = p.args[0] as string;
            if (!activeTargets.has(target)) {
                activeTargets.set(target, { hack: 0, weaken: 0, grow: 0 });
            }
            const stats = activeTargets.get(target)!;
            if (p.filename.includes('hack')) stats.hack++;
            if (p.filename.includes('weaken')) stats.weaken++;
            if (p.filename.includes('grow')) stats.grow++;
        });
        
        // Get top 3 most active targets
        const topTargets = Array.from(activeTargets.entries())
            .sort(([,a], [,b]) => (b.hack + b.weaken + b.grow) - (a.hack + a.weaken + a.grow))
            .slice(0, 3);
        
        ns.print(`┌─ BOTNET SYSTEM STATUS ───────────────────────────────────────`);
        ns.print(`│ Scripts: ${scriptStats.total.toString().padEnd(3)} (H:${scriptStats.hack.toString().padStart(2)} W:${scriptStats.weaken.toString().padStart(2)} G:${scriptStats.grow.toString().padStart(2)})  RAM: ${utilization.toFixed(1)}% (${(usedRAM/1000).toFixed(1)}/${(totalRAM/1000).toFixed(1)}TB)`);
        ns.print(`│ Money: $${ns.formatNumber(playerMoney)}  Hack: ${playerHackLevel}  Income: $${ns.formatNumber(incomeRate)}/sec`);
        ns.print(`│ Servers: ${rootedServers}/${totalServers} rooted  Purchased: ${purchasedCount}/25 (${(totalPurchasedRAM/1000).toFixed(1)}TB)`);
        
        // Add uptime and cycle information
        const uptimeMs = Date.now() - botnetStartTime;
        const uptimeMin = Math.floor(uptimeMs / 60000);
        const uptimeSec = Math.floor((uptimeMs % 60000) / 1000);
        const cyclesPerMin = totalBatchCycles > 0 && uptimeMin > 0 ? (totalBatchCycles / uptimeMin).toFixed(1) : '0.0';
        
        ns.print(`│ Ready: ${readyTargets.length}  Prep: ${prepTargets.length}  Batches: ${totalBatchCycles} cycles (${cyclesPerMin}/min)`);
        ns.print(`│ Uptime: ${uptimeMin}m ${uptimeSec}s  Efficiency: $${(incomeRate / Math.max(scriptStats.total, 1)).toFixed(0)}/script`);
        
        if (topTargets.length > 0) {
            ns.print(`├─ ACTIVE TARGETS ────────────────────────────────────────────`);
            topTargets.forEach(([target, stats]) => {
                const total = stats.hack + stats.weaken + stats.grow;
                const targetDisplay = target.substring(0, 16).padEnd(16);
                ns.print(`│ ${targetDisplay} ${total.toString().padStart(3)} scripts (H:${stats.hack.toString().padStart(2)} W:${stats.weaken.toString().padStart(2)} G:${stats.grow.toString().padStart(2)})`);
            });
        }
        
        ns.print(`└──────────────────────────────────────────────────────────────`);
    } else {
        ns.print(`BOTNET: No active scripts - waiting for next cycle...`);
    }
}

function takeNetworkRAMSnapshot(ns: NS, attackers: ServerData[]): INetworkRAMSnapshot {
    const servers: { hostname: string; availableRAM: number }[] = [];
    let totalAvailable = 0;
    
    for (const attacker of attackers) {
        const realTimeServer = ns.getServer(attacker.hostname);
        const availableRam = realTimeServer.maxRam - realTimeServer.ramUsed;
        const reserveForHome = attacker.hostname === 'home' ? reserveRam : 0;
        const usableRAM = Math.max(0, availableRam - reserveForHome);
        
        servers.push({ hostname: attacker.hostname, availableRAM: usableRAM });
        totalAvailable += usableRAM;
    }
    
    return { totalAvailable, servers };
}

function selectHackableTargets(targets: ServerData[]): ServerData[] {
    const MONEY_THRESHOLD = 0.90; // Lowered from 0.95 to allow more targets
    const SECURITY_TOLERANCE = 8; // Increased from 5 to allow slightly less optimal targets
    
    const hackableTargets = targets.filter(target => {
        const moneyRatio = target.moneyAvailable / Math.max(target.moneyMax, 1);
        const securityOverMin = target.hackDifficulty - target.minDifficulty;
        
        return moneyRatio >= MONEY_THRESHOLD && securityOverMin <= SECURITY_TOLERANCE;
    });
    
    // Sort by efficiency: money per weaken time, prioritizing high-value quick targets
    return hackableTargets.sort((a, b) => {
        const efficiencyA = (a.moneyMax / a.weakenTime) * (a.moneyAvailable / a.moneyMax);
        const efficiencyB = (b.moneyMax / b.weakenTime) * (b.moneyAvailable / b.moneyMax);
        return efficiencyB - efficiencyA;
    });
}

function calculateFullHWGWBatch(ns: NS, target: ServerData): IHWGWBatch {
    // More aggressive hack percentage - target 75% of money instead of 50%
    const hackPercent = 0.75;
    const targetMoney = target.moneyAvailable * hackPercent;
    
    // Calculate hack threads more efficiently
    const baseHackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, targetMoney));
    // Remove the artificial cap of moneyAvailable/1000 which was too conservative
    const hackThreads = Math.max(1, baseHackThreads);
    
    // Calculate security increases and required weaken threads
    const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads, target.hostname);
    const weakenEffect = ns.weakenAnalyze(1);
    const weaken1Threads = Math.ceil(hackSecIncrease / weakenEffect);
    
    // Calculate grow threads needed to restore the money we're taking
    const moneyAfterHack = target.moneyAvailable - targetMoney;
    const growthNeeded = target.moneyMax / Math.max(moneyAfterHack, 1);
    // Cap growth analysis to prevent extreme values on very low-money targets
    const growThreads = Math.ceil(ns.growthAnalyze(target.hostname, Math.min(growthNeeded, 50)));
    
    const growSecIncrease = ns.growthAnalyzeSecurity(growThreads, target.hostname);
    const weaken2Threads = Math.ceil(growSecIncrease / weakenEffect);
    
    // Optimize timing - reduce gaps for faster cycles
    const gap = 150; // Reduced from 200ms for tighter timing
    const now = Date.now();
    
    // Calculate optimal timing for HWGW batch
    const hackStartDelay = now + target.weakenTime - target.hackTime + (3 * gap);
    const weaken1StartDelay = now + gap;
    const growStartDelay = now + target.weakenTime - target.growTime + (2 * gap);
    const weaken2StartDelay = now;
    
    return {
        target,
        hackThreads,
        weaken1Threads,
        growThreads,
        weaken2Threads,
        totalThreads: hackThreads + weaken1Threads + growThreads + weaken2Threads,
        hackStartDelay,
        weaken1StartDelay,
        growStartDelay,
        weaken2StartDelay
    };
}

function calculatePrepBatch(ns: NS, target: ServerData, availableRAMBudget: number, scriptRamCost: number): IPrepBatch | null {
    const maxThreadsAvailable = Math.floor(availableRAMBudget / scriptRamCost);
    
    const securityOverMin = target.hackDifficulty - target.minDifficulty;
    const moneyRatio = target.moneyAvailable / Math.max(target.moneyMax, 1);
    
    if (securityOverMin > 1) {
        const weakenEffect = ns.weakenAnalyze(1);
        const weakenThreadsNeeded = Math.ceil(securityOverMin / weakenEffect);
        const weakenThreads = Math.min(weakenThreadsNeeded, maxThreadsAvailable);
        
        return {
            target,
            weakenThreads,
            growThreads: 0,
            totalThreads: weakenThreads,
            priority: 'security'
        };
    } else if (moneyRatio < 0.95) {
        const growthMultiplier = target.moneyMax / Math.max(target.moneyAvailable, 1);
        const growThreadsNeeded = Math.ceil(ns.growthAnalyze(target.hostname, Math.min(growthMultiplier, 100)));
        const growThreads = Math.min(growThreadsNeeded, maxThreadsAvailable);
        
        return {
            target,
            weakenThreads: 0,
            growThreads,
            totalThreads: growThreads,
            priority: 'money'
        };
    }
    
    return null;
}

function executeHWGWBatches(ns: NS, hwgwBatches: IHWGWBatch[], prepBatches: IPrepBatch[], networkSnapshot: INetworkRAMSnapshot, scriptRamCost: number, debug: boolean): IExecutionResults {
    let totalScripts = 0;
    let successfulScripts = 0;
    let failedScripts = 0;
    
    const serverRAM: Record<string, number> = {};
    for (const server of networkSnapshot.servers) {
        serverRAM[server.hostname] = server.availableRAM;
    }
    
    for (const batch of hwgwBatches) {
        const scripts = [
            { type: 'hack', threads: batch.hackThreads, delay: batch.hackStartDelay },
            { type: 'weaken', threads: batch.weaken1Threads, delay: batch.weaken1StartDelay },
            { type: 'grow', threads: batch.growThreads, delay: batch.growStartDelay },
            { type: 'weaken', threads: batch.weaken2Threads, delay: batch.weaken2StartDelay }
        ];
        
        for (const script of scripts) {
            if (script.threads === 0) continue;
            
            const result = allocateAndExecuteScript(ns, script.type, script.threads, script.delay, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
    }
    
    for (const batch of prepBatches) {
        if (batch.weakenThreads > 0) {
            const result = allocateAndExecuteScript(ns, 'weaken', batch.weakenThreads, Date.now() + 1000, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
        
        if (batch.growThreads > 0) {
            const result = allocateAndExecuteScript(ns, 'grow', batch.growThreads, Date.now() + 1000, batch.target.hostname, serverRAM, scriptRamCost, debug);
            totalScripts++;
            if (result.success) successfulScripts++;
            else failedScripts++;
        }
    }
    
    return { totalScripts, successfulScripts, failedScripts };
}

function allocateAndExecuteScript(ns: NS, scriptType: string, threads: number, delay: number, targetHostname: string, serverRAM: Record<string, number>, scriptRamCost: number, debug: boolean): { success: boolean; pid: number } {
    if (threads <= 0) {
        if (debug) {
            ns.tprint(`ERROR: Invalid thread count ${threads} for ${scriptType} -> ${targetHostname}`);
        }
        return { success: false, pid: 0 };
    }
    
    let scriptFile = '';
    switch (scriptType) {
        case 'hack': scriptFile = 'remote/simple-hack.js'; break;
        case 'weaken': scriptFile = 'remote/simple-weaken.js'; break;
        case 'grow': scriptFile = 'remote/simple-grow.js'; break;
        default: return { success: false, pid: 0 };
    }
    
    let remainingThreads = threads;
    let totalSuccess = true;
    let firstPid = 0;
    
    for (const [hostname, availableRAM] of Object.entries(serverRAM)) {
        if (remainingThreads === 0) break;
        if (availableRAM < scriptRamCost) continue;
        
        const maxThreadsOnServer = Math.max(0, Math.floor(availableRAM / scriptRamCost));
        const threadsToAllocate = Math.min(remainingThreads, maxThreadsOnServer);
        
        if (threadsToAllocate <= 0) continue;
        
        const ramUsed = threadsToAllocate * scriptRamCost;
        serverRAM[hostname] -= ramUsed;
        
        const pid = ns.exec(scriptFile, hostname, threadsToAllocate, targetHostname, delay);
        const success = pid !== 0;
        
        if (!success) {
            // If script execution fails, restore RAM allocation for retry
            serverRAM[hostname] += ramUsed;
            totalSuccess = false;
            
            if (debug) {
                ns.tprint(`FAILED: ${scriptType} on ${hostname} (${threadsToAllocate}t) -> ${targetHostname} - RAM restored`);
            }
        } else {
            if (firstPid === 0) {
                firstPid = pid;
            }
            
            if (debug) {
                ns.tprint(`SUCCESS: ${scriptType} on ${hostname} (${threadsToAllocate}t/${threads}t) -> ${targetHostname} (PID: ${pid})`);
            }
        }
        
        remainingThreads -= threadsToAllocate;
    }
    
    if (remainingThreads > 0) {
        if (debug) {
            ns.tprint(`PARTIAL: ${scriptType} allocated ${threads - remainingThreads}/${threads} threads to ${targetHostname} (${remainingThreads} threads couldn't be allocated)`);
        }
        totalSuccess = false;
    }
    
    return { success: totalSuccess, pid: firstPid };
}