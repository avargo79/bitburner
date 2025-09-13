import { NS } from "@ns";
import { ServerData, ServerFilter, ServerComparator, NetworkRAMSnapshot } from "/lib/botnet-types";
import { BOTNET_CONFIG } from "/lib/botnet-config";

// ===== CORE SERVER DISCOVERY AND DATA GATHERING =====

/**
 * Recursively discover all servers in the network
 */
export function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

/**
 * Build comprehensive server data for all discovered servers
 * Uses individual NS calls for optimal RAM efficiency
 */
export function buildServerData(ns: NS): ServerData[] {
    const hostnames = getServerList(ns);
    const servers: ServerData[] = [];
    
    for (const hostname of hostnames) {
        // Use individual cheap NS calls instead of expensive getServer()
        const serverData: ServerData = {
            hostname: hostname,
            hasAdminRights: ns.hasRootAccess(hostname),
            purchasedByPlayer: hostname.startsWith('pserv-'),
            requiredHackingSkill: ns.getServerRequiredHackingLevel(hostname) ?? 0,
            maxRam: ns.getServerMaxRam(hostname),
            ramUsed: ns.getServerUsedRam(hostname),
            moneyMax: ns.getServerMaxMoney(hostname) ?? 0,
            moneyAvailable: ns.getServerMoneyAvailable(hostname) ?? 0,
            hackDifficulty: ns.getServerSecurityLevel(hostname) ?? 0,
            minDifficulty: ns.getServerMinSecurityLevel(hostname) ?? 0,
            hackTime: ns.getHackTime(hostname),
            weakenTime: ns.getWeakenTime(hostname),
            growTime: ns.getGrowTime(hostname)
        };
        servers.push(serverData);
    }
    
    return servers;
}

// ===== SERVER FILTERING PREDICATES =====

/**
 * Filter for servers that can be used as hacking targets
 */
export const isTarget: ServerFilter = (server: ServerData) =>
    server.hasAdminRights
    && !server.purchasedByPlayer
    && server.moneyMax > 0;

/**
 * Filter for servers that can be used as attackers (have available RAM)
 */
export const isAttacker: ServerFilter = (server: ServerData) =>
    server.hasAdminRights
    && server.maxRam - server.ramUsed > 0;

/**
 * Calculate target value (money/time ratio)
 */
export function targetValue(server: ServerData): number {
    return Math.floor(server.moneyMax / server.weakenTime);
}

// ===== SERVER SORTING COMPARATORS =====

/**
 * Sort servers by target value (highest first)
 */
export const byValue: ServerComparator = (a: ServerData, b: ServerData) => 
    targetValue(b) - targetValue(a);

/**
 * Sort servers by available RAM (highest first)
 */
export const byAvailableRam: ServerComparator = (a: ServerData, b: ServerData) => 
    (b.maxRam - b.ramUsed) - (a.maxRam - a.ramUsed);

// ===== RAM COST CALCULATIONS =====

/**
 * Get the RAM cost for HWGW scripts
 */
export function getScriptRAMCost(): number {
    return BOTNET_CONFIG.SCRIPT_RAM_COST;
}

/**
 * Get the RAM cost for share scripts
 */
export function getShareScriptRAMCost(): number {
    return BOTNET_CONFIG.SHRAM_SCRIPT_RAM_COST;
}

// ===== NETWORK RAM ANALYSIS =====

/**
 * Take a snapshot of available RAM across all attacker servers
 */
export function takeNetworkRAMSnapshot(ns: NS, attackers: ServerData[]): NetworkRAMSnapshot {
    const servers = attackers.map(server => {
        const currentUsed = ns.getServerUsedRam(server.hostname);
        const currentMax = ns.getServerMaxRam(server.hostname);
        const available = currentMax - currentUsed;
        
        return {
            hostname: server.hostname,
            availableRAM: available,
            maxRAM: currentMax,
            usedRAM: currentUsed
        };
    });
    
    const totalAvailable = servers.reduce((sum, s) => sum + s.availableRAM, 0);
    const totalMax = servers.reduce((sum, s) => sum + s.maxRAM, 0);
    const totalUsed = servers.reduce((sum, s) => sum + s.usedRAM, 0);
    
    return {
        totalAvailable,
        totalMax,
        totalUsed,
        servers
    };
}

// ===== TARGET SELECTION UTILITIES =====

/**
 * Select servers that are ready for profitable hacking (good security and money state)
 */
export function selectHackableTargets(targets: ServerData[]): ServerData[] {
    return targets.filter(target => {
        const moneyRatio = target.moneyAvailable / target.moneyMax;
        const securityDifference = target.hackDifficulty - target.minDifficulty;
        
        // Ready for hacking: 90%+ money and reasonable security (under +80)
        return moneyRatio >= 0.90 && securityDifference <= 80.0;
    });
}

/**
 * Select servers that need prepping (not ready for optimal hacking)
 */
export function selectPrepTargets(targets: ServerData[]): ServerData[] {
    return targets.filter(target => {
        const moneyRatio = target.moneyAvailable / target.moneyMax;
        const securityDifference = target.hackDifficulty - target.minDifficulty;
        
        // Needs prep: security too high OR money too low
        return securityDifference > 80.0 || moneyRatio < 0.90;
    }).sort((a, b) => {
        // Prioritize by target value (money/time ratio)
        return targetValue(b) - targetValue(a);
    });
}

/**
 * Build a network snapshot with current server states
 */
export function buildNetworkSnapshot(ns: NS): ServerData[] {
    return buildServerData(ns);
}