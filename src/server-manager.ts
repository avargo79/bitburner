import { AutocompleteData, NS } from "@ns";

interface ServerData {
    hostname: string;
    maxRam: number;
    hasAdminRights: boolean;
    requiredHackingSkill: number;
    purchasedByPlayer: boolean;
    cpuCores: number;
    maxMoney: number;
    moneyAvailable: number;
    hackDifficulty: number;
    minDifficulty: number;
}

interface ServerManagementResult {
    rootedCount: number;
    purchasedCount: number;
    upgradedCount: number;
    totalServers: number;
    totalRam: number;
    networkStats: NetworkStatistics;
    purchasedServerStats: PurchasedServerStatistics;
}

interface NetworkStatistics {
    totalServers: number;
    rootedServers: number;
    rootableServers: number;
    highValueTargets: number;
    totalRam: number;
    usableRam: number;
    averageHackLevel: number;
}

interface PurchasedServerStatistics {
    count: number;
    maxCount: number;
    totalRam: number;
    averageRam: number;
    upgradeableCount: number;
    nextUpgradeCost: number;
    totalInvestment: number;
}

// Configuration
const CONFIG = {
    PURCHASED_SERVER_START_RAM: 2,
    MAX_PURCHASED_SERVERS: 25,
    TARGET_RAM_POWER: 10, // 2^20 = 1TB max per server
    HOME_RAM_RESERVE: 32
};

export function autocomplete(data: AutocompleteData, _args: any) {
    return [
        ...data.servers,
        '--debug',
        '--max-servers',
        '--power',
        '--dashboard'
    ];
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL');

    const args = ns.flags([
        ['debug', false],
        ['max-servers', CONFIG.MAX_PURCHASED_SERVERS],
        ['power', CONFIG.TARGET_RAM_POWER],
        ['dashboard', true]
    ]);

    const debug = args.debug as boolean;
    const maxServers = args['max-servers'] as number;
    const targetRamPower = args['power'] as number;
    const showDashboard = args['dashboard'] as boolean;

    if (debug) ns.tprint("Server Manager starting...");

    let lastDashboardTime = 0;
    const dashboardInterval = 10000; // Show dashboard every 10 seconds

    while (true) {
        try {
            const result = await manageServers(ns, maxServers, targetRamPower, debug);
            const now = Date.now();

            // Show enhanced dashboard periodically or when significant changes occur
            if (showDashboard && (now - lastDashboardTime > dashboardInterval ||
                result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0)) {

                showServerManagementDashboard(ns, result);
                lastDashboardTime = now;
            } else if (!showDashboard && (result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0)) {
                // Simple status for non-dashboard mode
                ns.print(`Server Management: rooted=${result.rootedCount}, bought=${result.purchasedCount}, upgraded=${result.upgradedCount}`);
                ns.print(`Network: ${result.totalServers} servers, ${ns.formatNumber(result.totalRam)}GB total`);
            }

        } catch (error) {
            ns.print(`Server management error: ${error}`);
        }

        await ns.sleep(2000); // Check every 2 seconds
    }
}

async function manageServers(ns: NS, maxServers: number, targetRamPower: number, debug: boolean): Promise<ServerManagementResult> {
    // 1. Discover all servers
    const allServers = discoverAllServers(ns);
    const serverData = allServers.map(hostname => buildServerData(ns, hostname));

    // 2. Root new servers
    const rootedCount = rootServers(ns, serverData, debug);

    // 3. Manage purchased servers
    const { purchasedCount, upgradedCount } = await managePurchasedServers(ns, serverData, maxServers, targetRamPower, debug);

    // 4. Calculate comprehensive statistics
    const networkStats = calculateNetworkStatistics(ns, serverData);
    const purchasedServerStats = calculatePurchasedServerStatistics(ns, serverData, maxServers, targetRamPower);
    const totalRam = serverData.reduce((sum, s) => sum + s.maxRam, 0);

    return {
        rootedCount,
        purchasedCount,
        upgradedCount,
        totalServers: serverData.length,
        totalRam,
        networkStats,
        purchasedServerStats
    };
}

function discoverAllServers(ns: NS): string[] {
    const visited = new Set<string>();
    const queue = ['home'];
    const servers: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        servers.push(current);

        try {
            const neighbors = ns.scan(current);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        } catch (e) {
            // Skip servers we can't scan
        }
    }

    return servers;
}

function buildServerData(ns: NS, hostname: string): ServerData {
    try {
        const server = ns.getServer(hostname);
        return {
            hostname,
            maxRam: server.maxRam,
            hasAdminRights: server.hasAdminRights,
            requiredHackingSkill: server.requiredHackingSkill || 0,
            purchasedByPlayer: server.purchasedByPlayer || false,
            cpuCores: server.cpuCores || 1,
            maxMoney: server.moneyMax || 0,
            moneyAvailable: server.moneyAvailable || 0,
            hackDifficulty: server.hackDifficulty || 1,
            minDifficulty: server.minDifficulty || 1
        };
    } catch (e) {
        // Return safe defaults for inaccessible servers
        return {
            hostname,
            maxRam: 0,
            hasAdminRights: false,
            requiredHackingSkill: 999999,
            purchasedByPlayer: false,
            cpuCores: 1,
            maxMoney: 0,
            moneyAvailable: 0,
            hackDifficulty: 100,
            minDifficulty: 1
        };
    }
}

function rootServers(ns: NS, servers: ServerData[], debug: boolean): number {
    let rootedCount = 0;

    for (const server of servers) {
        if (server.hasAdminRights || server.hostname === 'home') continue;

        try {
            // Try all available exploit tools
            try { ns.brutessh(server.hostname); } catch (e) { }
            try { ns.ftpcrack(server.hostname); } catch (e) { }
            try { ns.relaysmtp(server.hostname); } catch (e) { }
            try { ns.httpworm(server.hostname); } catch (e) { }
            try { ns.sqlinject(server.hostname); } catch (e) { }

            // Attempt to nuke
            ns.nuke(server.hostname);
            server.hasAdminRights = true;
            rootedCount++;

            if (debug) {
                ns.print(`Rooted: ${server.hostname}`);
            }

        } catch (e) {
            // Couldn't root this server
        }
    }

    return rootedCount;
}

async function managePurchasedServers(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number, debug: boolean): Promise<{ purchasedCount: number, upgradedCount: number }> {
    let purchasedCount = 0;
    let upgradedCount = 0;

    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    const playerMoney = ns.getServerMoneyAvailable('home');

    // 1. Buy new servers if under limit
    if (purchasedServers.length < maxServers) {
        const serverName = `pserv-${purchasedServers.length + 1}`;
        const cost = ns.getPurchasedServerCost(CONFIG.PURCHASED_SERVER_START_RAM);

        if (playerMoney >= cost) {
            try {
                const hostname = ns.purchaseServer(serverName, CONFIG.PURCHASED_SERVER_START_RAM);
                if (hostname) {
                    purchasedCount = 1;
                    if (debug) {
                        ns.print(`Purchased: ${hostname} (${CONFIG.PURCHASED_SERVER_START_RAM}GB)`);
                    }
                }
            } catch (e) {
                // Purchase failed
            }
        }
    }

    // 2. Upgrade existing servers (one per cycle to avoid spending all money)
    if (purchasedServers.length > 0) {
        // Sort by RAM size (upgrade smallest first)
        purchasedServers.sort((a, b) => a.maxRam - b.maxRam);

        for (const server of purchasedServers) {
            const maxRam = Math.pow(2, targetRamPower);
            if (server.maxRam >= maxRam) continue; // Already at target

            const newRam = server.maxRam * 2;
            if (newRam > maxRam) continue; // Would exceed target

            const upgradeCost = ns.getPurchasedServerUpgradeCost(server.hostname, newRam);

            if (playerMoney >= upgradeCost) {
                if (ns.upgradePurchasedServer(server.hostname, newRam)) {
                    upgradedCount = 1;
                    if (debug) {
                        ns.print(`Upgraded: ${server.hostname} (${server.maxRam}GB → ${newRam}GB)`);
                    }
                    break; // Only upgrade one per cycle
                }
            }
        }
    }

    return { purchasedCount, upgradedCount };
}

function calculateNetworkStatistics(ns: NS, servers: ServerData[]): NetworkStatistics {
    let rootedServers = 0;
    let rootableServers = 0;
    let highValueTargets = 0;
    let usableRam = 0;
    let totalHackLevel = 0;
    let hackableServers = 0;

    const playerHackLevel = ns.getHackingLevel();

    for (const server of servers) {
        if (server.hasAdminRights) {
            rootedServers++;
            usableRam += server.maxRam;
        } else if (server.requiredHackingSkill <= playerHackLevel &&
            server.hostname !== 'home' && !server.purchasedByPlayer) {
            rootableServers++;
        }

        if (server.maxMoney > 1_000_000 && server.hasAdminRights) {
            highValueTargets++;
        }

        if (server.requiredHackingSkill > 0) {
            totalHackLevel += server.requiredHackingSkill;
            hackableServers++;
        }
    }

    return {
        totalServers: servers.length,
        rootedServers,
        rootableServers,
        highValueTargets,
        totalRam: servers.reduce((sum, s) => sum + s.maxRam, 0),
        usableRam,
        averageHackLevel: hackableServers > 0 ? Math.round(totalHackLevel / hackableServers) : 0
    };
}

function calculatePurchasedServerStatistics(ns: NS, servers: ServerData[], maxServers: number, targetRamPower: number): PurchasedServerStatistics {
    const purchasedServers = servers.filter(s => s.purchasedByPlayer);
    const maxRam = Math.pow(2, targetRamPower);

    let upgradeableCount = 0;
    let nextUpgradeCost = Infinity;
    let totalInvestment = 0;

    // Calculate total investment (rough estimate)
    for (const server of purchasedServers) {
        // Estimate cost based on RAM progression: start RAM, then doubling
        let currentRam = CONFIG.PURCHASED_SERVER_START_RAM;
        let serverCost = ns.getPurchasedServerCost(currentRam);

        while (currentRam < server.maxRam) {
            currentRam *= 2;
            serverCost += ns.getPurchasedServerUpgradeCost(server.hostname, currentRam);
        }
        totalInvestment += serverCost;

        // Check if server can be upgraded
        if (server.maxRam < maxRam) {
            upgradeableCount++;
            const upgradeCost = ns.getPurchasedServerUpgradeCost(server.hostname, server.maxRam * 2);
            if (upgradeCost < nextUpgradeCost) {
                nextUpgradeCost = upgradeCost;
            }
        }
    }

    const totalRam = purchasedServers.reduce((sum, s) => sum + s.maxRam, 0);

    return {
        count: purchasedServers.length,
        maxCount: maxServers,
        totalRam,
        averageRam: purchasedServers.length > 0 ? totalRam / purchasedServers.length : 0,
        upgradeableCount,
        nextUpgradeCost: nextUpgradeCost === Infinity ? 0 : nextUpgradeCost,
        totalInvestment
    };
}

function showServerManagementDashboard(ns: NS, result: ServerManagementResult): void {
    const playerMoney = ns.getServerMoneyAvailable('home');
    const playerHackLevel = ns.getHackingLevel();

    ns.clearLog();
    ns.print('┌─ SERVER MANAGEMENT DASHBOARD');

    // Network Overview
    ns.print('├─ NETWORK OVERVIEW');
    ns.print(`│ Total Network: ${result.networkStats.totalServers} servers | Rooted: ${result.networkStats.rootedServers} | Available: ${result.networkStats.rootableServers}`);
    ns.print(`│ RAM Capacity: ${ns.formatNumber(result.networkStats.totalRam)}GB total | ${ns.formatNumber(result.networkStats.usableRam)}GB usable | Utilization: ${((ns.getServerUsedRam('home') / result.networkStats.usableRam) * 100).toFixed(1)}%`);
    ns.print(`│ Network Stats: ${result.networkStats.highValueTargets} high-value targets | Avg hack level: ${result.networkStats.averageHackLevel} (player: ${playerHackLevel})`);

    // Purchased Servers
    ns.print('├─ PURCHASED SERVERS');
    const purchasedStats = result.purchasedServerStats;
    ns.print(`│ Fleet Status: ${purchasedStats.count}/${purchasedStats.maxCount} servers | ${ns.formatNumber(purchasedStats.totalRam)}GB total | Avg: ${ns.formatNumber(purchasedStats.averageRam)}GB per server`);

    if (purchasedStats.upgradeableCount > 0) {
        const canAffordUpgrade = playerMoney >= purchasedStats.nextUpgradeCost;
        const affordabilityStatus = canAffordUpgrade ? '✅ Affordable' : '💰 Need more money';
        ns.print(`│ Upgrades: ${purchasedStats.upgradeableCount} servers can be upgraded | Next: ${ns.formatNumber(purchasedStats.nextUpgradeCost)} ${affordabilityStatus}`);
    } else {
        ns.print(`│ Upgrades: All servers at maximum capacity`);
    }

    if (purchasedStats.count < purchasedStats.maxCount) {
        const newServerCost = ns.getPurchasedServerCost(CONFIG.PURCHASED_SERVER_START_RAM);
        const canAffordNew = playerMoney >= newServerCost;
        const newServerStatus = canAffordNew ? '✅ Can buy' : '💰 Need more money';
        ns.print(`│ Expansion: Can buy ${purchasedStats.maxCount - purchasedStats.count} more servers | Next: ${ns.formatNumber(newServerCost)} ${newServerStatus}`);
    }

    ns.print(`│ Investment: ${ns.formatNumber(purchasedStats.totalInvestment)} total invested | ROI: ${((purchasedStats.totalRam / (purchasedStats.totalInvestment / 1_000_000)) || 0).toFixed(1)}GB per $1M`);

    // Recent Activity
    if (result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0) {
        ns.print('├─ RECENT ACTIVITY');
        if (result.rootedCount > 0) ns.print(`│ 🔓 Rooted ${result.rootedCount} new servers`);
        if (result.purchasedCount > 0) ns.print(`│ 💳 Purchased ${result.purchasedCount} new servers`);
        if (result.upgradedCount > 0) ns.print(`│ ⬆️ Upgraded ${result.upgradedCount} servers`);
    }

    // Recommendations
    ns.print('├─ RECOMMENDATIONS');
    const recommendations = generateRecommendations(ns, result, playerMoney, playerHackLevel);
    if (recommendations.length > 0) {
        for (const rec of recommendations) {
            ns.print(`│ ${rec}`);
        }
    } else {
        ns.print(`│ 🎯 System optimally configured - continue operations`);
    }

    ns.print('└─────────────────────────────────────────────');
}

function generateRecommendations(ns: NS, result: ServerManagementResult, playerMoney: number, playerHackLevel: number): string[] {
    const recommendations: string[] = [];
    const purchased = result.purchasedServerStats;
    const network = result.networkStats;

    // Priority 1: Root available servers
    if (network.rootableServers > 0) {
        recommendations.push(`🔓 HIGH: Root ${network.rootableServers} available servers to expand network`);
    }

    // Priority 2: Buy new purchased servers if slots available and affordable
    if (purchased.count < purchased.maxCount) {
        const newServerCost = ns.getPurchasedServerCost(CONFIG.PURCHASED_SERVER_START_RAM);
        if (playerMoney >= newServerCost) {
            recommendations.push(`💳 MEDIUM: Purchase new server for ${ns.formatNumber(newServerCost)} (${purchased.maxCount - purchased.count} slots left)`);
        } else if (playerMoney >= newServerCost * 0.5) {
            recommendations.push(`💰 LOW: Save for new server (${ns.formatNumber(newServerCost - playerMoney)} more needed)`);
        }
    }

    // Priority 3: Upgrade existing servers
    if (purchased.upgradeableCount > 0 && purchased.nextUpgradeCost > 0) {
        if (playerMoney >= purchased.nextUpgradeCost) {
            recommendations.push(`⬆️ MEDIUM: Upgrade server for ${ns.formatNumber(purchased.nextUpgradeCost)} (${purchased.upgradeableCount} upgradeable)`);
        }
    }

    // Priority 4: Network growth suggestions
    if (network.rootedServers > 20 && purchased.count === 0) {
        recommendations.push(`🚀 MEDIUM: Consider purchasing servers for dedicated RAM capacity`);
    }

    // Priority 5: Hacking level recommendations
    const avgNetworkLevel = network.averageHackLevel;
    if (playerHackLevel < avgNetworkLevel * 0.8) {
        recommendations.push(`📚 LOW: Train hacking to access higher-level servers (current: ${playerHackLevel}, network avg: ${avgNetworkLevel})`);
    }

    return recommendations;
}