import { NS } from "@ns";
import { ServerData, BotnetOptions, StatusData } from "/lib/botnet-types";
import { FactionDetector } from "/lib/botnet-faction-detection";

// ===== STATUS MONITORING SYSTEM =====

/**
 * Status Monitoring Module
 * Handles comprehensive system status reporting and monitoring
 */

export interface IBotnetStatusData {
    servers: {
        total: number;
        rooted: number;
        purchased: {
            count: number;
            totalRAM: number;
        };
    };
    scripts: {
        total: number;
        hack: number;
        weaken: number;
        grow: number;
        running: boolean;
    };
    performance: {
        playerMoney: number;
        playerHackLevel: number;
        incomeRate: number;
        ramUtilization: number;
        usedRAM: number;
        totalRAM: number;
    };
    targets: {
        ready: number;
        prep: number;
    };
    runtime: {
        uptime: {
            minutes: number;
            seconds: number;
        };
        totalBatchCycles: number;
        cyclesPerMinute: number;
    };
    repboost?: {
        isActive: boolean;
        faction: string | null;
        threads: {
            base: number;
            effective: number;
        };
        servers: number;
        ramUsed: number;
        runtime: number;
        reputationBonus: number;
    };
}

/**
 * Server filtering predicates for status calculations
 */
const isTarget = (server: ServerData) =>
    server.hasAdminRights
    && !server.purchasedByPlayer
    && server.moneyMax > 0;

const isAttacker = (server: ServerData) =>
    server.hasAdminRights
    && server.maxRam - server.ramUsed > 0;

/**
 * Gather comprehensive botnet status data
 */
export function gatherBotnetStatusData(
    ns: NS, 
    servers: ServerData[], 
    playerHackLevel: number, 
    options: BotnetOptions,
    botnetStartTime: number,
    totalBatchCycles: number,
    currentShareAllocation?: any,
    repboostSystemActive?: boolean,
    repboostStartTime?: number
): IBotnetStatusData {
    const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill <= playerHackLevel);
    const attackers = servers.filter(isAttacker);
    
    // Debug: Check what scripts are running
    const allRunningScripts = servers.flatMap(s => ns.ps(s.hostname));
    const runningScripts = servers.flatMap(s => ns.ps(s.hostname).filter((p: any) => p.filename.includes('simple-')));
    const running = runningScripts.length > 0;
    
    // Server management stats
    const totalServers = servers.length;
    const rootedServers = servers.filter(s => s.hasAdminRights).length;
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    const purchasedCount = purchasedServers.length;
    const totalPurchasedRAM = purchasedServers.reduce((sum, s) => sum + s.maxRam, 0);
    
    // Script stats
    const scriptStats = { hack: 0, weaken: 0, grow: 0, total: runningScripts.length };
    if (running) {
        runningScripts.forEach((p: any) => {
            if (p.filename.includes('hack')) scriptStats.hack++;
            if (p.filename.includes('weaken')) scriptStats.weaken++;
            if (p.filename.includes('grow')) scriptStats.grow++;
        });
    }
    
    // Performance stats
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
    
    // Target stats
    const readyTargets = targets.filter(t => {
        const securityOk = t.hackDifficulty <= t.minDifficulty + 5;
        const moneyOk = t.moneyAvailable >= t.moneyMax * 0.95;
        return securityOk && moneyOk;
    });
    const prepTargets = targets.filter(t => !readyTargets.includes(t));
    
    // Runtime stats
    const uptimeMs = Date.now() - botnetStartTime;
    const uptimeMin = Math.floor(uptimeMs / 60000);
    const uptimeSec = Math.floor((uptimeMs % 60000) / 1000);
    const cyclesPerMin = totalBatchCycles > 0 && uptimeMin > 0 ? (totalBatchCycles / uptimeMin) : 0;
    
    const statusData: IBotnetStatusData = {
        servers: {
            total: totalServers,
            rooted: rootedServers,
            purchased: {
                count: purchasedCount,
                totalRAM: totalPurchasedRAM
            }
        },
        scripts: {
            total: scriptStats.total,
            hack: scriptStats.hack,
            weaken: scriptStats.weaken,
            grow: scriptStats.grow,
            running
        },
        performance: {
            playerMoney,
            playerHackLevel,
            incomeRate,
            ramUtilization: utilization,
            usedRAM,
            totalRAM
        },
        targets: {
            ready: readyTargets.length,
            prep: prepTargets.length
        },
        runtime: {
            uptime: {
                minutes: uptimeMin,
                seconds: uptimeSec
            },
            totalBatchCycles,
            cyclesPerMinute: cyclesPerMin
        }
    };
    
    // Add repboost stats if enabled
    if (options.repboost && repboostSystemActive) {
        // Detect current faction work using FactionDetector
        const factionDetector = new FactionDetector();
        const factionWork = factionDetector.detectFactionWork();
        
        // Count actual running share scripts
        const sharePattern = 'sh' + 'are';
        const simpleSharePattern = 'simple-' + sharePattern;
        const shareScript = 'remote/simple-' + sharePattern + '.js';
        const shareScripts = servers.flatMap(s => 
            ns.ps(s.hostname).filter((p: any) => 
                p.filename.includes(sharePattern) || p.filename.includes(simpleSharePattern) || p.filename === shareScript
            )
        );
        
        const totalShareThreads = shareScripts.reduce((sum: number, script: any) => sum + script.threads, 0);
        const shareServers = new Set(shareScripts.map((script: any) => script.server)).size;
        const shareRAMUsed = shareScripts.reduce((sum: number, script: any) => {
            const ramCost = ns.getScriptRam(script.filename, script.server);
            return sum + (ramCost * script.threads);
        }, 0);
        
        statusData.repboost = {
            isActive: shareScripts.length > 0,
            faction: factionWork.isWorkingForFaction ? factionWork.detectedFactionName : null,
            threads: {
                base: totalShareThreads,
                effective: totalShareThreads // Will be same for share scripts
            },
            servers: shareServers,
            ramUsed: shareRAMUsed,
            runtime: repboostStartTime && repboostStartTime > 0 ? Math.floor((Date.now() - repboostStartTime) / 1000) : 0,
            reputationBonus: 1.0 // Share scripts don't have variable bonus
        };
    }
    
    return statusData;
}

/**
 * Print formatted botnet status to console
 */
export function printBotnetStatus(ns: NS, statusData: IBotnetStatusData, servers: ServerData[], options: BotnetOptions): void {
    ns.clearLog(); // Clear immediately before printing to prevent flashing
    
    if (!statusData.scripts.running) {
        ns.print(`BOTNET: No active scripts - waiting for next cycle...`);
        return;
    }
    
    // Get active targets being attacked
    const runningScripts = servers.flatMap(s => ns.ps(s.hostname).filter((p: any) => p.filename.includes('simple-')));
    const activeTargets = new Map<string, { hack: number; weaken: number; grow: number }>();
    
    runningScripts.forEach((p: any) => {
        const target = p.args && p.args[0] ? String(p.args[0]) : 'unknown';
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
    
    // Main status display
    ns.print(`┌─ BOTNET SYSTEM STATUS ───────────────────────────────────────`);
    ns.print(`│ Scripts: ${statusData.scripts.total.toString().padEnd(3)} (H:${statusData.scripts.hack.toString().padStart(2)} W:${statusData.scripts.weaken.toString().padStart(2)} G:${statusData.scripts.grow.toString().padStart(2)})  RAM: ${statusData.performance.ramUtilization.toFixed(1)}% (${(statusData.performance.usedRAM/1000).toFixed(1)}/${(statusData.performance.totalRAM/1000).toFixed(1)}TB)`);
    ns.print(`│ Money: $${ns.formatNumber(statusData.performance.playerMoney)}  Hack: ${statusData.performance.playerHackLevel}  Income: $${ns.formatNumber(statusData.performance.incomeRate)}/sec`);
    ns.print(`│ Servers: ${statusData.servers.rooted}/${statusData.servers.total}  Purchased: ${statusData.servers.purchased.count}/25 (${(statusData.servers.purchased.totalRAM/1000).toFixed(1)}TB)`);
    ns.print(`│ Ready: ${statusData.targets.ready}  Prep: ${statusData.targets.prep}  Batches: ${statusData.runtime.totalBatchCycles} cycles (${statusData.runtime.cyclesPerMinute.toFixed(1)}/min)`);
    ns.print(`│ Uptime: ${statusData.runtime.uptime.minutes}m ${statusData.runtime.uptime.seconds}s  Efficiency: $${(statusData.performance.incomeRate / Math.max(statusData.scripts.total, 1)).toFixed(0)}/script`);
    
    // Active targets section
    if (topTargets.length > 0) {
        ns.print(`├─ ACTIVE TARGETS ────────────────────────────────────────────`);
        topTargets.forEach(([target, stats]) => {
            const total = stats.hack + stats.weaken + stats.grow;
            const targetDisplay = target.substring(0, 16).padEnd(16);
            ns.print(`│ ${targetDisplay} ${total.toString().padStart(3)} scripts (H:${stats.hack.toString().padStart(2)} W:${stats.weaken.toString().padStart(2)} G:${stats.grow.toString().padStart(2)})`);
        });
    }
    
    // Repboost system section
    if (statusData.repboost) {
        ns.print(`├─ REPBOOST SYSTEM ───────────────────────────────────────────`);
        
        if (statusData.repboost.isActive) {
            ns.print(`│ Status: ACTIVE (${statusData.repboost.runtime}s)  Faction: ${statusData.repboost.faction || 'Unknown'}`);
            ns.print(`│ Threads: ${statusData.repboost.threads.base} base → ${statusData.repboost.threads.effective.toFixed(0)} effective  Rep bonus: ${statusData.repboost.reputationBonus.toFixed(3)}x`);
            ns.print(`│ Servers: ${statusData.repboost.servers}  RAM used: ${(statusData.repboost.ramUsed/1000).toFixed(1)}GB`);
        } else {
            ns.print(`│ Status: DISABLED - No repboost work detected`);
        }
    }
    
    ns.print(`└──────────────────────────────────────────────────────────────`);
}

/**
 * Execute status monitoring cycle
 * Gathers data and prints formatted status display
 */
export function executeStatusMonitoring(
    ns: NS, 
    servers: ServerData[], 
    playerHackLevel: number, 
    options: BotnetOptions,
    botnetStartTime: number,
    totalBatchCycles: number,
    currentShareAllocation?: any,
    repboostSystemActive?: boolean,
    repboostStartTime?: number
): void {
    const statusData = gatherBotnetStatusData(
        ns, 
        servers, 
        playerHackLevel, 
        options, 
        botnetStartTime, 
        totalBatchCycles,
        currentShareAllocation,
        repboostSystemActive,
        repboostStartTime
    );
    
    printBotnetStatus(ns, statusData, servers, options);
}