import { AutocompleteData, NS } from "@ns";

/**
 * Check if server-manager script prerequisites are met
 * @param {NS} ns - Netscript API
 * @returns {{ready: boolean, reason?: string}} Prerequisite check result
 */
export function checkPrerequisites(ns: NS): { ready: boolean; reason?: string } {
    // Server manager uses scan, getServer, and other basic APIs
    // These are always available
    return { ready: true };
}

interface ServerStats {
    totalServers: number;
    rootedServers: number;
    purchasedServers: number;
    totalRam: number;
    purchasedRam: number;
    lowestRam: number;
    highestRam: number;
    nextUpgradeCost: number;
    serversAtTarget: number;
}

const CONFIG = {
    PURCHASED_SERVER_START_RAM: 2,
    MAX_PURCHASED_SERVERS: 25,
    TARGET_RAM_POWER: 12, // 2^12 = 4096GB = 4TB max per server
};

export function autocomplete(data: AutocompleteData, _args: any) {
    return [...data.servers, '--no-backdoors', '--no-dashboard'];
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL');

    while (true) {
        const stats = await manageAllServers(ns);

        displayStats(ns, stats);

        await ns.sleep(1000);
    }
}

async function manageAllServers(ns: NS): Promise<ServerStats> {
    const allServers = getAllServers(ns);
    const playerHackLevel = ns.getHackingLevel();

    let rootedCount = 0;
    let totalRam = 0;
    let purchasedCount = 0;

    // Process all network servers
    for (const hostname of allServers) {
        const server = ns.getServer(hostname);
        totalRam += server.maxRam;

        if (server.purchasedByPlayer) {
            purchasedCount++;
            continue;
        }

        // Root server if possible
        if (!server.hasAdminRights && (server.requiredHackingSkill || 0) <= playerHackLevel) {
            if (rootServer(ns, hostname)) {
                rootedCount++;
            }
        }
    }

    // Collect purchased server stats
    const purchasedServers = ns.getPurchasedServers();
    const maxRam = Math.pow(2, CONFIG.TARGET_RAM_POWER);
    let purchasedRam = 0;
    let lowestRam = Infinity;
    let highestRam = 0;
    let serversAtTarget = 0;
    let lowestRamServer: string | null = null;

    for (const hostname of purchasedServers) {
        const server = ns.getServer(hostname);
        const currentRam = server.maxRam;
        purchasedRam += currentRam;

        if (currentRam < lowestRam) {
            lowestRam = currentRam;
            lowestRamServer = hostname;
        }
        if (currentRam > highestRam) {
            highestRam = currentRam;
        }
        if (currentRam >= maxRam) {
            serversAtTarget++;
        }
    }

    // Calculate next upgrade cost
    let nextUpgradeCost = 0;
    if (lowestRamServer && lowestRam < maxRam) {
        nextUpgradeCost = ns.getPurchasedServerUpgradeCost(lowestRamServer, lowestRam * 2);
    }

    // Manage purchased servers
    await managePurchasedServers(ns);

    return {
        totalServers: allServers.length,
        rootedServers: allServers.filter(h => ns.getServer(h).hasAdminRights).length,
        purchasedServers: purchasedCount,
        totalRam,
        purchasedRam,
        lowestRam: lowestRam === Infinity ? 0 : lowestRam,
        highestRam,
        nextUpgradeCost,
        serversAtTarget
    };
}

function getAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        try {
            ns.scan(current).forEach(neighbor => {
                if (!visited.has(neighbor)) queue.push(neighbor);
            });
        } catch (e) { /* ignore */ }
    }

    return Array.from(visited);
}

function rootServer(ns: NS, hostname: string): boolean {
    try {
        const ports = [
            () => ns.brutessh(hostname),
            () => ns.ftpcrack(hostname),
            () => ns.relaysmtp(hostname),
            () => ns.httpworm(hostname),
            () => ns.sqlinject(hostname)
        ];

        // Open all available ports
        for (const openPort of ports) {
            try { openPort(); } catch (e) { /* ignore */ }
        }

        ns.nuke(hostname);
        return true;
    } catch (e) {
        return false;
    }
}

function findPath(ns: NS, target: string): string[] | null {
    const visited = new Set<string>();
    const queue = [{ hostname: 'home', path: ['home'] }];

    while (queue.length > 0) {
        const { hostname, path } = queue.shift()!;

        if (hostname === target) return path;
        if (visited.has(hostname)) continue;
        visited.add(hostname);

        try {
            for (const neighbor of ns.scan(hostname)) {
                if (!visited.has(neighbor)) {
                    queue.push({ hostname: neighbor, path: [...path, neighbor] });
                }
            }
        } catch (e) { /* ignore */ }
    }

    return null;
}

async function managePurchasedServers(ns: NS): Promise<void> {
    const playerMoney = ns.getServerMoneyAvailable('home');
    const purchasedServers = ns.getPurchasedServers();

    // Buy new servers if under limit and affordable
    if (purchasedServers.length < CONFIG.MAX_PURCHASED_SERVERS) {
        const startRam = Math.pow(2, CONFIG.PURCHASED_SERVER_START_RAM);
        const cost = ns.getPurchasedServerCost(startRam);

        if (playerMoney > cost * 2) { // Keep some money buffer
            const name = `pserv-${purchasedServers.length}`;
            ns.purchaseServer(name, startRam);
        }
    }

    // Upgrade the server with lowest RAM if affordable
    if (purchasedServers.length > 0) {
        // Find server with lowest RAM that can be upgraded
        const maxRam = Math.pow(2, CONFIG.TARGET_RAM_POWER);
        let lowestRamServer: string | null = null;
        let lowestRam = Infinity;

        for (const hostname of purchasedServers) {
            const server = ns.getServer(hostname);
            const currentRam = server.maxRam;

            if (currentRam < maxRam && currentRam < lowestRam) {
                lowestRam = currentRam;
                lowestRamServer = hostname;
            }
        }

        // If no server needs upgrading, all are at target - exit script
        if (!lowestRamServer) {
            ns.tprint(`SUCCESS: All ${purchasedServers.length} purchased servers have reached target RAM (${ns.formatRam(maxRam)})`);
            ns.exit();
        }

        // Upgrade the lowest RAM server if affordable
        const newRam = lowestRam * 2;
        const cost = ns.getPurchasedServerUpgradeCost(lowestRamServer, newRam);

        if (cost > 0 && playerMoney > cost * 2) {
            ns.upgradePurchasedServer(lowestRamServer, newRam);
        }
    }
}

function displayStats(ns: NS, stats: ServerStats): void {
    const maxRam = Math.pow(2, CONFIG.TARGET_RAM_POWER);
    const playerMoney = ns.getServerMoneyAvailable('home');
    const canAffordUpgrade = stats.nextUpgradeCost > 0 && playerMoney > stats.nextUpgradeCost * 2;

    ns.clearLog();
    ns.print('┌─────────────────────────────────────────');
    ns.print('│ SERVER MANAGER');
    ns.print('├─────────────────────────────────────────');
    ns.print(`│ Network Servers: ${stats.totalServers} total | ${stats.rootedServers} rooted`);
    ns.print(`│ Total RAM: ${ns.formatRam(stats.totalRam)}`);
    ns.print('├─────────────────────────────────────────');
    ns.print(`│ Purchased Servers: ${stats.purchasedServers}/${CONFIG.MAX_PURCHASED_SERVERS}`);

    if (stats.purchasedServers > 0) {
        ns.print(`│ Purchased RAM: ${ns.formatRam(stats.purchasedRam)}`);
        ns.print(`│ RAM Range: ${ns.formatRam(stats.lowestRam)} - ${ns.formatRam(stats.highestRam)}`);
        ns.print(`│ Target: ${ns.formatRam(maxRam)} (${stats.serversAtTarget}/${stats.purchasedServers} complete)`);

        if (stats.nextUpgradeCost > 0) {
            const upgradeStatus = canAffordUpgrade ? '✓' : '✗';
            ns.print('├─────────────────────────────────────────');
            ns.print(`│ Next Upgrade: ${ns.formatRam(stats.lowestRam)} → ${ns.formatRam(stats.lowestRam * 2)}`);
            ns.print(`│ Cost: ${ns.formatNumber(stats.nextUpgradeCost)} ${upgradeStatus}`);
            ns.print(`│ Money: ${ns.formatNumber(playerMoney)}`);
        }
    } else if (stats.purchasedServers === 0) {
        const startRam = Math.pow(2, CONFIG.PURCHASED_SERVER_START_RAM);
        const cost = ns.getPurchasedServerCost(startRam);
        const canBuy = playerMoney > cost * 2;
        ns.print(`│ First Server Cost: ${ns.formatNumber(cost)} ${canBuy ? '✓' : '✗'}`);
    }

    ns.print('└─────────────────────────────────────────');
}