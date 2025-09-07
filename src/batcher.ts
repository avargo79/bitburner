import { AutocompleteData, NS, ScriptArg } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { disableLogs, DynamicScript, getDynamicScriptContent } from "/lib/system";
import { IScriptPlayer } from "/models/IScriptPlayer";
import { byAvailableRam, byValue, getAvailableThreads, isAttacker, IScriptServer, isTarget, shouldGrow, shouldHack, shouldWeaken, targetValue } from "/models/ScriptServer";
import { IHackScriptArgs } from "./models/IRemoteScriptArgs";
import PrettyTable from "./lib/prettytable";

const reserveRam = 32;

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
]
let options: {
    [key: string]: string[] | ScriptArg;
};

const database = await Database.getInstance();
await database.open();

// Global metrics tracking
let totalBatchCycles = 0;
let startTime = Date.now();
let totalErrorCount = 0;
let totalScriptCount = 0;

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);
    return [];
}

// Advanced HWGW Batching Algorithm Implementation

interface INetworkRAMSnapshot {
    totalAvailable: number;
    servers: { hostname: string; availableRAM: number }[];
}

interface IHWGWBatch {
    target: IScriptServer;
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
    target: IScriptServer;
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
    disableLogs(ns, ['sleep', 'run', 'scp', 'exec']);
    options = ns.flags(argsSchema);
    ns.atExit(() => {
        ns.exec('killremote.js', 'home');
    });

    do {
        ns.clearLog();

        const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
        const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);

        const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill! <= player.skills.hacking).sort(byValue);
        const attackers = servers.filter(isAttacker).sort(byAvailableRam);
        attackers.forEach(s => {
            ns.scp('remote/simple-hack.js', s.hostname);
            ns.scp('remote/simple-weaken.js', s.hostname);
            ns.scp('remote/simple-grow.js', s.hostname);
        });

        // STEP 1: Snapshot Network RAM - Take total budget for spawning scripts
        const networkRAMSnapshot = takeNetworkRAMSnapshot(ns, attackers);
        let remainingRAMBudget = networkRAMSnapshot.totalAvailable;
        const scriptRamCost = 1.75; // GB per thread for simple scripts
        
        if (options.debug) {
            ns.tprint(`Network RAM Budget: ${remainingRAMBudget.toFixed(2)}GB across ${networkRAMSnapshot.servers.length} servers`);
        }

        // STEP 2: Select Hackable Targets (95% money, security tolerance)
        const hackableTargets = selectHackableTargets(targets, player.skills.hacking);
        const nonReadyTargets = targets.filter(t => !hackableTargets.includes(t) && t.requiredHackingSkill! <= player.skills.hacking);
        
        if (options.debug) {
            ns.tprint(`Found ${hackableTargets.length} hack-ready targets, ${nonReadyTargets.length} need prep`);
        }

        // STEP 3: Allocate Full HWGW Batches - AGGRESSIVE BATCHING
        const hwgwBatches: IHWGWBatch[] = [];
        
        // Keep spawning batches until RAM is exhausted
        while (remainingRAMBudget > scriptRamCost * 10) { // Reserve some minimum RAM
            let batchAllocatedThisRound = false;
            
            for (const target of hackableTargets) {
                if (!target.hackData) {
                    continue;
                }

                const fullBatch = await calculateFullHWGWBatch(ns, target);
                const batchRAMCost = fullBatch.totalThreads * scriptRamCost;
                
                // STEP 4: Discard Partial Hack Batches - Only allow complete HWGW cycles
                if (batchRAMCost <= remainingRAMBudget) {
                    hwgwBatches.push(fullBatch);
                    remainingRAMBudget -= batchRAMCost;
                    batchAllocatedThisRound = true;
                    
                    if (options.debug) {
                        ns.tprint(`Allocated HWGW batch for ${target.hostname}: ${fullBatch.totalThreads} threads (${batchRAMCost.toFixed(2)}GB)`);
                    }
                }
            }
            
            // If no batches were allocated this round, break to avoid infinite loop
            if (!batchAllocatedThisRound) {
                break;
            }
        }

        // STEP 5: Prepare Future Targets with remaining RAM - AGGRESSIVE PREP
        const prepBatches: IPrepBatch[] = [];
        while (remainingRAMBudget >= scriptRamCost && nonReadyTargets.length > 0) {
            let prepAllocatedThisRound = false;
            
            for (const target of nonReadyTargets) {
                if (remainingRAMBudget < scriptRamCost) break;
                
                const prepBatch = await calculatePrepBatch(ns, target, remainingRAMBudget, scriptRamCost);
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
            
            // If no prep was allocated this round, break to avoid infinite loop
            if (!prepAllocatedThisRound) {
                break;
            }
        }

        // STEP 6: Finalize Output - Execute the batches
        const executionResults = await executeHWGWBatches(ns, hwgwBatches, prepBatches, networkRAMSnapshot, scriptRamCost, !!options.debug);
        
        if (options.debug) {
            ns.tprint(`Execution Summary: ${executionResults.successfulScripts}/${executionResults.totalScripts} scripts started successfully`);
            ns.tprint(`Remaining RAM Budget: ${remainingRAMBudget.toFixed(2)}GB`);
        }

        // CONTINUOUS BATCHING: Keep spawning new batches as old ones complete
        while (true) {
            await ns.sleep(1000); // Check every second for available RAM
            ns.clearLog();
            
            // Get fresh server data
            const currentServers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
            const currentAttackers = currentServers.filter(isAttacker).sort(byAvailableRam);
            const currentTargets = currentServers.filter(s => isTarget(s) && s.requiredHackingSkill! <= player.skills.hacking).sort(byValue);
            
            // Take new RAM snapshot
            const currentNetworkRAM = takeNetworkRAMSnapshot(ns, currentAttackers);
            let availableRAM = currentNetworkRAM.totalAvailable;
            
            // Show status
            await printStatus(ns);
            
            // If significant RAM is available, spawn more batches
            if (availableRAM > scriptRamCost * 50) { // At least 87.5GB available
                if (options.debug) {
                    ns.tprint(`Detected ${availableRAM.toFixed(2)}GB available RAM - spawning additional batches`);
                }
                
                // Spawn additional HWGW batches
                const currentHackableTargets = selectHackableTargets(currentTargets, player.skills.hacking);
                const additionalHWGWBatches: IHWGWBatch[] = [];
                
                for (const target of currentHackableTargets) {
                    if (!target.hackData || availableRAM < scriptRamCost * 10) continue;
                    
                    const batch = await calculateFullHWGWBatch(ns, target);
                    const batchCost = batch.totalThreads * scriptRamCost;
                    
                    if (batchCost <= availableRAM) {
                        additionalHWGWBatches.push(batch);
                        availableRAM -= batchCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional HWGW batch for ${target.hostname}: ${batch.totalThreads} threads`);
                        }
                    }
                }
                
                // Spawn additional prep batches
                const currentNonReadyTargets = currentTargets.filter(t => !currentHackableTargets.includes(t));
                const additionalPrepBatches: IPrepBatch[] = [];
                
                for (const target of currentNonReadyTargets) {
                    if (availableRAM < scriptRamCost) break;
                    
                    const prepBatch = await calculatePrepBatch(ns, target, availableRAM, scriptRamCost);
                    if (prepBatch && prepBatch.totalThreads > 0) {
                        const prepCost = prepBatch.totalThreads * scriptRamCost;
                        additionalPrepBatches.push(prepBatch);
                        availableRAM -= prepCost;
                        
                        if (options.debug) {
                            ns.tprint(`Spawning additional prep batch for ${target.hostname}: ${prepBatch.totalThreads} threads`);
                        }
                    }
                }
                
                // Execute additional batches
                if (additionalHWGWBatches.length > 0 || additionalPrepBatches.length > 0) {
                    await executeHWGWBatches(ns, additionalHWGWBatches, additionalPrepBatches, currentNetworkRAM, scriptRamCost, !!options.debug);
                }
            }
            
            // Check if we should continue (if repeat is enabled)
            if (!options.repeat) {
                const running = currentServers.some(s => s.pids.some(p => p.filename.includes('simple-')));
                if (!running) break;
            }
        }
    } while (options.repeat)
}

async function printStatus(ns: NS) {
    const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
    const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
    const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill! <= player.skills.hacking);
    const attackers = servers.filter(isAttacker);
    
    // Check if any scripts are running
    const running = servers.some(s => s.pids.some(p => p.filename.includes('simple-')));
    
    if (running) {
        // Build entire display in memory first to reduce flicker
        const display: string[] = [];
        
        // Calculate script statistics
        const scriptStats = { hack: 0, weaken: 0, grow: 0, total: 0 };
        const targetStats = new Map<string, { hack: number; weaken: number; grow: number; }>();
        
        for (const server of servers) {
            for (const pid of server.pids.filter(p => p.filename.includes('simple-'))) {
                scriptStats.total++;
                if (pid.filename.includes('hack')) scriptStats.hack++;
                if (pid.filename.includes('weaken')) scriptStats.weaken++;
                if (pid.filename.includes('grow')) scriptStats.grow++;
                
                // Track per-target activity (args[0] is target hostname)
                const target = pid.args[0] as string;
                if (!targetStats.has(target)) {
                    targetStats.set(target, { hack: 0, weaken: 0, grow: 0 });
                }
                const stat = targetStats.get(target)!;
                if (pid.filename.includes('hack')) stat.hack++;
                if (pid.filename.includes('weaken')) stat.weaken++;
                if (pid.filename.includes('grow')) stat.grow++;
            }
        }
        
        // Calculate resource utilization
        const totalRAM = attackers.reduce((sum, s) => sum + s.maxRam, 0);
        const usedRAM = attackers.reduce((sum, s) => sum + s.ramUsed, 0);
        const utilization = totalRAM > 0 ? (usedRAM / totalRAM * 100) : 0;
        
        const playerMoney = player?.money ?? 0;
        const hackLevel = player?.skills?.hacking ?? 0;
        
        // Get total script income safely
        let incomeRate = 0;
        try {
            incomeRate = ns.getTotalScriptIncome()[0] ?? 0;
        } catch {
            incomeRate = 0;
        }
        
        // Calculate additional metrics
        const readyTargets = targets.filter(t => {
            const securityOk = (t.hackDifficulty || 0) <= (t.minDifficulty || 0) + 5;
            const moneyOk = (t.moneyAvailable || 0) >= (t.moneyMax || 1) * 0.95;
            return securityOk && moneyOk;
        });
        const prepTargets = targets.filter(t => !readyTargets.includes(t));
        
        // Calculate uptime
        const uptimeMs = Date.now() - (ns.getScriptName() === 'batcher.js' ? Date.now() - 10000 : Date.now()); // Rough estimate
        const uptimeMinutes = Math.floor(uptimeMs / 60000);
        const uptimeSeconds = Math.floor((uptimeMs % 60000) / 1000);
        const uptimeStr = `${uptimeMinutes}m ${uptimeSeconds}s`;
        
        // Header section - clean left-only border design
        display.push(`┌─ BATCHER STATUS ─────────────────────────────────────────────`);
        
        // Enhanced header lines with new metrics
        const scriptsLine = `Scripts: ${scriptStats.total.toString().padEnd(3)} (H:${scriptStats.hack.toString().padStart(2)} W:${scriptStats.weaken.toString().padStart(2)} G:${scriptStats.grow.toString().padStart(2)})  RAM: ${utilization.toFixed(1)}% (${(usedRAM/1000).toFixed(1)}/${(totalRAM/1000).toFixed(1)}TB)`;
        display.push(`│ ${scriptsLine}`);
        
        const moneyLine = `Money: $${ns.formatNumber(playerMoney)}  Hack: ${hackLevel}  Income: $${ns.formatNumber(incomeRate)}/sec`;
        display.push(`│ ${moneyLine}`);
        
        // New metrics line
        const metricsLine = `Ready: ${readyTargets.length}  Prep: ${prepTargets.length}  Uptime: ${uptimeStr}  Batches: ${Math.floor(scriptStats.total / 4)} cycles`;
        display.push(`│ ${metricsLine}`);
        
        // Show active targets (top 8 most active)
        const sortedTargets = Array.from(targetStats.entries())
            .sort(([,a], [,b]) => (b.hack + b.weaken + b.grow) - (a.hack + a.weaken + a.grow))
            .slice(0, 8);
            
        if (sortedTargets.length > 0) {
            display.push(`├─ ACTIVE TARGETS ────────────────────────────────────────────`);
            for (let i = 0; i < sortedTargets.length; i += 2) {
                const [name1, stats1] = sortedTargets[i];
                const display1 = `${name1.substring(0, 12).padEnd(12)} H:${stats1.hack.toString().padStart(2)} W:${stats1.weaken.toString().padStart(2)} G:${stats1.grow.toString().padStart(2)}`;
                
                if (i + 1 < sortedTargets.length) {
                    const [name2, stats2] = sortedTargets[i + 1];
                    const display2 = `${name2.substring(0, 12).padEnd(12)} H:${stats2.hack.toString().padStart(2)} W:${stats2.weaken.toString().padStart(2)} G:${stats2.grow.toString().padStart(2)}`;
                    display.push(`│ ${display1} │ ${display2}`);
                } else {
                    display.push(`│ ${display1}`);
                }
            }
        }
        
        // Show server distribution (top 6 most utilized)
        const serverUtilization = attackers
            .map(s => ({ name: s.hostname, used: s.ramUsed, max: s.maxRam, util: s.maxRam > 0 ? s.ramUsed / s.maxRam : 0 }))
            .filter(s => s.used > 0)
            .sort((a, b) => b.used - a.used)
            .slice(0, 6);
            
        if (serverUtilization.length > 0) {
            display.push(`├─ SERVER UTILIZATION ────────────────────────────────────────`);
            for (let i = 0; i < serverUtilization.length; i += 2) {
                const s1 = serverUtilization[i];
                const display1 = `${s1.name.substring(0, 12).padEnd(12)} ${(s1.util * 100).toFixed(0).padStart(3)}%`;
                
                if (i + 1 < serverUtilization.length) {
                    const s2 = serverUtilization[i + 1];
                    const display2 = `${s2.name.substring(0, 12).padEnd(12)} ${(s2.util * 100).toFixed(0).padStart(3)}%`;
                    display.push(`│ ${display1} │ ${display2}`);
                } else {
                    display.push(`│ ${display1}`);
                }
            }
        }
        
        display.push(`└──────────────────────────────────────────────────────────────`);
        
        // Print entire display at once to reduce flicker
        display.forEach(line => ns.print(line));
    } else {
        ns.print(`BATCHER: No active scripts - waiting for next cycle...`);
    }
    
    return running;
}

function takeNetworkRAMSnapshot(ns: NS, attackers: IScriptServer[]): INetworkRAMSnapshot {
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

function selectHackableTargets(targets: IScriptServer[], hackingSkill: number): IScriptServer[] {
    const MONEY_THRESHOLD = 0.95; // 95% of max money
    const SECURITY_TOLERANCE = 5; // Allow up to +5 security over minimum
    
    return targets.filter(target => {
        // Must be within hacking skill
        if (target.requiredHackingSkill! > hackingSkill) return false;
        
        // Must have hackData
        if (!target.hackData) return false;
        
        // Money check: >= 95% of max money
        const moneyRatio = (target.moneyAvailable || 0) / (target.moneyMax || 1);
        if (moneyRatio < MONEY_THRESHOLD) return false;
        
        // Security check: <= minimum + tolerance
        const securityOverMin = (target.hackDifficulty || 0) - (target.minDifficulty || 0);
        if (securityOverMin > SECURITY_TOLERANCE) return false;
        
        return true;
    });
}

async function calculateFullHWGWBatch(ns: NS, target: IScriptServer): Promise<IHWGWBatch> {
    // Calculate hack threads for significant money extraction
    const hackAnalyzeThreadsScript = getDynamicScriptContent("ns.hackAnalyzeThreads", `Math.ceil(ns.hackAnalyzeThreads('${target.hostname}', ${target.moneyAvailable! * 0.5}))`);
    await DynamicScript.new('HackAnalyzeThreads', hackAnalyzeThreadsScript, []).run(ns, true);
    const baseHackThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeThreads');
    const hackThreads = Math.min(baseHackThreads || 1, Math.floor(target.moneyAvailable! / 1000)); // Cap threads
    
    // Calculate security increase from hack
    const hackAnalyzeSecurityScript = getDynamicScriptContent("ns.hackAnalyzeSecurity", `ns.hackAnalyzeSecurity(${hackThreads}, '${target.hostname}')`);
    await DynamicScript.new('HackAnalyzeSecurity', hackAnalyzeSecurityScript, []).run(ns, true);
    const hackSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeSecurity');
    
    // Calculate weaken effect per thread
    const weakenAnalyzeScript = getDynamicScriptContent("ns.weakenAnalyze", `ns.weakenAnalyze(1)`);
    await DynamicScript.new('WeakenAnalyze', weakenAnalyzeScript, []).run(ns, true);
    const weakenEffect = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.weakenAnalyze');
    
    // Weaken1 threads to counter hack security increase
    const weaken1Threads = Math.ceil(hackSecIncrease / weakenEffect);
    
    // Calculate grow threads to restore money
    const growthAnalyzeScript = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${target.moneyMax! / Math.max(target.moneyAvailable! - (target.moneyAvailable! * 0.5), 1)}))`);
    await DynamicScript.new('GrowthAnalyze', growthAnalyzeScript, []).run(ns, true);
    const growThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');
    
    // Calculate security increase from grow
    const growthAnalyzeSecurityScript = getDynamicScriptContent("ns.growthAnalyzeSecurity", `ns.growthAnalyzeSecurity(${growThreads}, '${target.hostname}')`);
    await DynamicScript.new('GrowthAnalyzeSecurity', growthAnalyzeSecurityScript, []).run(ns, true);
    const growSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyzeSecurity');
    
    // Weaken2 threads to counter grow security increase
    const weaken2Threads = Math.ceil(growSecIncrease / weakenEffect);
    
    // Calculate timing offsets for proper HWGW sequence
    const hackTime = target.hackData.hkTime;
    const weakenTime = target.hackData.wkTime;
    const growTime = target.hackData.grTime;
    
    const gap = 200; // 200ms gap between completions
    const now = Date.now();
    
    // Schedule so operations finish in sequence: hack -> weaken1 -> grow -> weaken2
    const hackStartDelay = now + weakenTime - hackTime + (3 * gap);
    const weaken1StartDelay = now + gap;
    const growStartDelay = now + weakenTime - growTime + (2 * gap);
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

async function calculatePrepBatch(ns: NS, target: IScriptServer, availableRAMBudget: number, scriptRamCost: number): Promise<IPrepBatch | null> {
    if (!target.hackData) return null;
    
    const maxThreadsAvailable = Math.floor(availableRAMBudget / scriptRamCost);
    
    // Determine priority: security first, then money
    const securityOverMin = (target.hackDifficulty || 0) - (target.minDifficulty || 0);
    const moneyRatio = (target.moneyAvailable || 0) / (target.moneyMax || 1);
    
    if (securityOverMin > 1) {
        // Security priority - need to weaken
        const weakenAnalyzeScript = getDynamicScriptContent("ns.weakenAnalyze", `ns.weakenAnalyze(1)`);
        await DynamicScript.new('WeakenAnalyze', weakenAnalyzeScript, []).run(ns, true);
        const weakenEffect = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.weakenAnalyze');
        
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
        // Money priority - need to grow
        const growthMultiplier = target.moneyMax! / Math.max(target.moneyAvailable!, 1);
        const growthAnalyzeScript = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${Math.min(growthMultiplier, 100)}))`);
        await DynamicScript.new('GrowthAnalyze', growthAnalyzeScript, []).run(ns, true);
        const growThreadsNeeded = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');
        
        const growThreads = Math.min(growThreadsNeeded, maxThreadsAvailable);
        
        return {
            target,
            weakenThreads: 0,
            growThreads,
            totalThreads: growThreads,
            priority: 'money'
        };
    }
    
    return null; // Target doesn't need prep
}

async function executeHWGWBatches(ns: NS, hwgwBatches: IHWGWBatch[], prepBatches: IPrepBatch[], networkSnapshot: INetworkRAMSnapshot, scriptRamCost: number, debug: boolean): Promise<IExecutionResults> {
    let totalScripts = 0;
    let successfulScripts = 0;
    let failedScripts = 0;
    
    // Create a copy of network snapshot for tracking allocations
    const serverRAM: Record<string, number> = {};
    for (const server of networkSnapshot.servers) {
        serverRAM[server.hostname] = server.availableRAM;
    }
    
    // Execute HWGW batches
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
    
    // Execute prep batches
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
    // Safety check: ensure threads is positive
    if (threads <= 0) {
        if (debug) {
            ns.tprint(`ERROR: Invalid thread count ${threads} for ${scriptType} -> ${targetHostname}`);
        }
        return { success: false, pid: 0 };
    }
    
    // Determine script file
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
    
    // Split threads across multiple servers as needed
    for (const [hostname, availableRAM] of Object.entries(serverRAM)) {
        if (remainingThreads === 0) break;
        if (availableRAM < scriptRamCost) continue; // Skip servers with insufficient RAM for even 1 thread
        
        // Calculate how many threads this server can handle (ensure positive)
        const maxThreadsOnServer = Math.max(0, Math.floor(availableRAM / scriptRamCost));
        const threadsToAllocate = Math.min(remainingThreads, maxThreadsOnServer);
        
        if (threadsToAllocate <= 0) continue;
        
        // Allocate RAM
        const ramUsed = threadsToAllocate * scriptRamCost;
        serverRAM[hostname] -= ramUsed;
        
        // Execute script
        const pid = ns.exec(scriptFile, hostname, threadsToAllocate, targetHostname, delay);
        const success = pid !== 0;
        
        if (!success) {
            totalSuccess = false;
        } else if (firstPid === 0) {
            firstPid = pid; // Return the first successful PID
        }
        
        if (debug) {
            ns.tprint(`${success ? 'SUCCESS' : 'FAILED'}: ${scriptType} on ${hostname} (${threadsToAllocate}t/${threads}t) -> ${targetHostname} (PID: ${pid})`);
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