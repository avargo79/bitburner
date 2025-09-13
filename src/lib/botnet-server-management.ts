import { NS } from "@ns";
import { ServerData, IPurchasedServerResult } from "/lib/botnet-types";
import { BOTNET_CONFIG } from "/lib/botnet-config";
import { isAttacker, isTarget, byAvailableRam, byValue } from "/lib/botnet-utils";

// ===== SERVER ROOTING OPERATIONS =====

/**
 * Attempt to root a single server using all available exploit tools
 */
export function rootServer(ns: NS, hostname: string): boolean {
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

/**
 * Perform rooting operations on all unrooted servers
 * Updates server data in-place and returns count of newly rooted servers
 */
export function performServerRooting(ns: NS, servers: ServerData[]): number {
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

// ===== PURCHASED SERVER MANAGEMENT =====

/**
 * Manage purchased server lifecycle: buying new servers and upgrading existing ones
 * Uses remote scripts to avoid RAM costs for server management operations
 */
export async function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number): Promise<IPurchasedServerResult> {
    const playerMoney = ns.getServerMoneyAvailable('home');
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    let bought = 0;
    let upgraded = 0;
    
    // Buy new servers if under limit and affordable (using remote script to avoid RAM cost)
    if (purchasedServers.length < maxServers) {
        const serverName = `pserv-${purchasedServers.length + 1}`;
        
        // Copy and run the purchasing script remotely
        await ns.scp('remote/simple-purchase.js', 'home');
        const pid = ns.exec('remote/simple-purchase.js', 'home', 1, 
            serverName, 
            BOTNET_CONFIG.PURCHASED_SERVER_START_RAM, 
            "false" // debug flag
        );
        
        if (pid > 0) {
            // Wait a bit for the script to complete
            await ns.sleep(100);
            bought++;
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
                        break; // Only upgrade one per cycle to avoid spending all money
                    }
                }
            }
        }
    }
    
    return { 
        bought, 
        upgraded, 
        currentCount: purchasedServers.length,
        targetRamPower 
    };
}

// ===== SERVER FILTERING AND SELECTION =====

/**
 * Get viable attackers (servers with available RAM for script execution)
 */
export function getViableAttackers(servers: ServerData[]): ServerData[] {
    return servers.filter(isAttacker).sort(byAvailableRam);
}

/**
 * Get viable targets (rooted servers with money that can be hacked)
 */
export function getViableTargets(servers: ServerData[], playerHackLevel: number): ServerData[] {
    return servers
        .filter(server => isTarget(server) && server.requiredHackingSkill <= playerHackLevel)
        .sort(byValue);
}