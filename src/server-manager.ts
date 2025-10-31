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
    backdoorInstalled: boolean;
}

interface ServerManagementResult {
    rootedCount: number;
    purchasedCount: number;
    upgradedCount: number;
    backdooredCount: number;
    totalServers: number;
    totalRam: number;
    networkStats: NetworkStatistics;
    purchasedServerStats: PurchasedServerStatistics;
}

interface NetworkStatistics {
    totalServers: number;
    rootedServers: number;
    rootableServers: number;
    backdooredServers: number;
    backdoorableServers: number;
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
    HOME_RAM_RESERVE: 32,
    ENABLE_BACKDOORS: true
};

export function autocomplete(data: AutocompleteData, _args: any) {
    return [
        ...data.servers,
        '--debug',
        '--max-servers',
        '--power',
        '--dashboard',
        '--no-backdoors',
        '--test-backdoors'
    ];
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL');

    const args = ns.flags([
        ['debug', false],
        ['max-servers', CONFIG.MAX_PURCHASED_SERVERS],
        ['power', CONFIG.TARGET_RAM_POWER],
        ['dashboard', true],
        ['no-backdoors', false],
        ['test-backdoors', false]
    ]);

    const debug = args.debug as boolean;
    const maxServers = args['max-servers'] as number;
    const targetRamPower = args['power'] as number;
    const showDashboard = args['dashboard'] as boolean;
    const enableBackdoors = !args['no-backdoors'] as boolean && CONFIG.ENABLE_BACKDOORS;
    const testBackdoors = args['test-backdoors'] as boolean;

    if (testBackdoors) {
        ns.tprint("🧪 Running backdoor test mode");
        await testBackdoorFunctionality(ns);
        return;
    }

    if (debug) ns.tprint("Server Manager starting...");

    let lastDashboardTime = 0;
    const dashboardInterval = 10000; // Show dashboard every 10 seconds

    while (true) {
        try {
            const result = await manageServers(ns, maxServers, targetRamPower, enableBackdoors, debug);
            const now = Date.now();

            // Show enhanced dashboard periodically or when significant changes occur
            if (showDashboard && (now - lastDashboardTime > dashboardInterval ||
                result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0 || result.backdooredCount > 0)) {

                showServerManagementDashboard(ns, result);
                lastDashboardTime = now;
            } else if (!showDashboard && (result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0 || result.backdooredCount > 0)) {
                // Simple status for non-dashboard mode
                ns.print(`Server Management: rooted=${result.rootedCount}, backdoored=${result.backdooredCount}, bought=${result.purchasedCount}, upgraded=${result.upgradedCount}`);
                ns.print(`Network: ${result.totalServers} servers, ${ns.formatNumber(result.totalRam)}GB total`);
            }

        } catch (error) {
            ns.print(`Server management error: ${error}`);
        }

        await ns.sleep(2000); // Check every 2 seconds
    }
}

async function manageServers(ns: NS, maxServers: number, targetRamPower: number, enableBackdoors: boolean, debug: boolean): Promise<ServerManagementResult> {
    // 1. Discover all servers
    const allServers = discoverAllServers(ns);
    const serverData = allServers.map(hostname => buildServerData(ns, hostname));

    // 2. Root new servers
    const rootedCount = rootServers(ns, serverData, debug);

    // 3. Backdoor servers that meet requirements (if enabled)
    if (debug && enableBackdoors) {
        ns.print(`🚪 Backdoor functionality enabled - checking for backdoor opportunities`);
    } else if (debug && !enableBackdoors) {
        ns.print(`🚪 Backdoor functionality disabled`);
    }

    const backdooredCount = enableBackdoors ? await backdoorServers(ns, serverData, debug) : 0;

    // 4. Manage purchased servers
    const { purchasedCount, upgradedCount } = await managePurchasedServers(ns, serverData, maxServers, targetRamPower, debug);

    // 5. Calculate comprehensive statistics
    const networkStats = calculateNetworkStatistics(ns, serverData);
    const purchasedServerStats = calculatePurchasedServerStatistics(ns, serverData, maxServers, targetRamPower);
    const totalRam = serverData.reduce((sum, s) => sum + s.maxRam, 0);

    return {
        rootedCount,
        purchasedCount,
        upgradedCount,
        backdooredCount,
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
            minDifficulty: server.minDifficulty || 1,
            backdoorInstalled: server.backdoorInstalled === true  // Handle undefined properly
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
            minDifficulty: 1,
            backdoorInstalled: false
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

async function backdoorServers(ns: NS, servers: ServerData[], debug: boolean): Promise<number> {
    let backdooredCount = 0;
    const playerHackLevel = ns.getHackingLevel();

    // Check if Singularity API is available
    if (!ns.singularity) {
        if (debug) {
            ns.print(`❌ Singularity API not available - backdoor functionality disabled`);
            ns.print(`   Requirements:`);
            ns.print(`   - Source-File 4 (The Singularity) is required`);
            ns.print(`   - Complete BitNode-4 or have SF4 from previous runs`);
            ns.print(`   - RAM costs are 16x/4x/1x based on SF4 level (1/2/3+)`);
        }
        return 0;
    }

    // Check if we can actually call Singularity functions
    try {
        // Test if we can call a basic Singularity function
        ns.singularity.getCurrentWork();
        if (debug) {
            ns.print(`✅ Singularity API accessible and functional`);
        }
    } catch (e) {
        if (debug) {
            ns.print(`❌ Singularity API exists but not functional: ${e}`);
            ns.print(`   This usually means insufficient Source-File 4 level`);
        }
        return 0;
    }

    if (debug) {
        const candidateServers = servers.filter(s =>
            !s.backdoorInstalled &&
            s.hasAdminRights &&
            !s.purchasedByPlayer &&
            s.hostname !== 'home' &&
            s.requiredHackingSkill <= playerHackLevel
        );
        ns.print(`Checking ${candidateServers.length} servers for backdoor opportunities`);
        candidateServers.forEach(s => ns.print(`  - ${s.hostname} (hack level: ${s.requiredHackingSkill})`));
    }

    for (const server of servers) {
        // Skip if already backdoored, not rooted, player-purchased, or home
        if (server.backdoorInstalled ||
            !server.hasAdminRights ||
            server.purchasedByPlayer ||
            server.hostname === 'home') {
            continue;
        }

        // Skip if player doesn't have sufficient hacking level
        if (server.requiredHackingSkill > playerHackLevel) {
            continue;
        }

        try {
            if (debug) {
                ns.print(`Attempting to backdoor: ${server.hostname} (hack level: ${server.requiredHackingSkill})`);
            }

            // Use Singularity API to connect and install backdoor
            if (await installBackdoorViaSingularity(ns, server.hostname, debug)) {
                server.backdoorInstalled = true;
                backdooredCount++;

                if (debug) {
                    ns.print(`✅ Successfully backdoored: ${server.hostname}`);
                } else {
                    ns.print(`Backdoored: ${server.hostname}`);
                }
            } else {
                if (debug) {
                    ns.print(`❌ Failed to backdoor: ${server.hostname}`);
                }
            }

        } catch (e) {
            if (debug) {
                ns.print(`❌ Exception while backdooring ${server.hostname}: ${e}`);
            } else {
                ns.print(`Failed to backdoor ${server.hostname}: ${e}`);
            }
        }

        // Always return to home after each backdoor attempt (success or failure)
        try {
            if (ns.getHostname() !== 'home') {
                ns.singularity.connect('home');
                if (debug && ns.getHostname() !== 'home') {
                    ns.print(`Warning: Failed to return to home, currently on ${ns.getHostname()}`);
                }
            }
        } catch (e) {
            if (debug) {
                ns.print(`Error returning to home after ${server.hostname}: ${e}`);
            }
        }

        // Small delay between backdoor attempts
        await ns.sleep(100);
    }

    // Final verification that we're on home after all backdoor operations
    try {
        if (ns.getHostname() !== 'home') {
            ns.singularity.connect('home');
            if (debug) {
                ns.print(`Final return to home completed. Current server: ${ns.getHostname()}`);
            }
        }
    } catch (e) {
        if (debug) {
            ns.print(`Warning: Final return to home failed: ${e}. Current server: ${ns.getHostname()}`);
        }
    }

    return backdooredCount;
}

async function installBackdoorViaSingularity(ns: NS, hostname: string, debug: boolean): Promise<boolean> {
    try {
        if (debug) {
            ns.print(`  🔍 Finding path to ${hostname}`);
        }

        // Find path to the target server
        const path = findPathToServer(ns, hostname);
        if (!path) {
            if (debug) ns.print(`  ❌ Could not find path to ${hostname}`);
            return false;
        }

        if (debug) {
            ns.print(`  🛤️ Path to ${hostname}: ${path.join(' -> ')}`);
        }

        // Connect to the server using Singularity API
        for (let i = 1; i < path.length; i++) {
            const target = path[i];

            if (debug) {
                ns.print(`  🔗 Connecting terminal to ${target}`);
                ns.print(`  ℹ️ Note: Script location (${ns.getHostname()}) != terminal location`);
            }

            const connectResult = ns.singularity.connect(target);
            if (debug) {
                ns.print(`  🔌 ns.singularity.connect(${target}) returned: ${connectResult}`);
            }

            if (!connectResult) {
                if (debug) ns.print(`  ❌ Connection to ${target} failed`);
                // Return terminal to home before failing
                try {
                    ns.singularity.connect('home');
                } catch (e) {
                    if (debug) ns.print(`  ❌ Failed to return terminal to home: ${e}`);
                }
                return false;
            }

            // Small delay to allow connection to complete
            await ns.sleep(100);
        }

        if (debug) {
            ns.print(`  🎯 Terminal should now be on ${hostname}, installing backdoor...`);
        }

        // Install backdoor using Singularity API
        await ns.singularity.installBackdoor();

        if (debug) {
            ns.print(`  ✅ Backdoor installation completed for ${hostname}`);
        }

        // Always return to home after successful backdoor
        try {
            ns.singularity.connect('home');
        } catch (e) {
            if (debug) ns.print(`Warning: Failed to return to home after backdooring ${hostname}: ${e}`);
        }

        return true;

    } catch (e) {
        if (debug) {
            ns.print(`Singularity backdoor failed for ${hostname}: ${e}`);
        }

        // Ensure we return to home even if backdoor failed
        try {
            ns.singularity.connect('home');
        } catch (e2) {
            if (debug) ns.print(`Critical: Failed to return to home after backdoor error: ${e2}`);
        }

        return false;
    }
}

function findPathToServer(ns: NS, targetHostname: string): string[] | null {
    const visited = new Set<string>();
    const queue: { hostname: string; path: string[] }[] = [{ hostname: 'home', path: ['home'] }];

    while (queue.length > 0) {
        const { hostname, path } = queue.shift()!;

        if (hostname === targetHostname) {
            return path;
        }

        if (visited.has(hostname)) continue;
        visited.add(hostname);

        try {
            const neighbors = ns.scan(hostname);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push({ hostname: neighbor, path: [...path, neighbor] });
                }
            }
        } catch (e) {
            // Skip servers we can't scan
        }
    }

    return null;
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
    let backdooredServers = 0;
    let backdoorableServers = 0;
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

        if (server.backdoorInstalled) {
            backdooredServers++;
        } else if (server.hasAdminRights &&
            !server.purchasedByPlayer &&
            server.hostname !== 'home' &&
            server.requiredHackingSkill <= playerHackLevel) {
            backdoorableServers++;
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
        backdooredServers,
        backdoorableServers,
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
    ns.print(`│ Backdoors: ${result.networkStats.backdooredServers} installed | ${result.networkStats.backdoorableServers} available | Access enhanced: ${result.networkStats.backdooredServers > 0 ? '✅' : '❌'}`);
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
    if (result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0 || result.backdooredCount > 0) {
        ns.print('├─ RECENT ACTIVITY');
        if (result.rootedCount > 0) ns.print(`│ 🔓 Rooted ${result.rootedCount} new servers`);
        if (result.backdooredCount > 0) ns.print(`│ 🚪 Backdoored ${result.backdooredCount} servers`);
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

    // Priority 2: Backdoor available servers
    if (network.backdoorableServers > 0) {
        recommendations.push(`🚪 HIGH: Backdoor ${network.backdoorableServers} servers for enhanced access and faction benefits`);
    }

    // Priority 3: Buy new purchased servers if slots available and affordable
    if (purchased.count < purchased.maxCount) {
        const newServerCost = ns.getPurchasedServerCost(CONFIG.PURCHASED_SERVER_START_RAM);
        if (playerMoney >= newServerCost) {
            recommendations.push(`💳 MEDIUM: Purchase new server for ${ns.formatNumber(newServerCost)} (${purchased.maxCount - purchased.count} slots left)`);
        } else if (playerMoney >= newServerCost * 0.5) {
            recommendations.push(`💰 LOW: Save for new server (${ns.formatNumber(newServerCost - playerMoney)} more needed)`);
        }
    }

    // Priority 4: Upgrade existing servers
    if (purchased.upgradeableCount > 0 && purchased.nextUpgradeCost > 0) {
        if (playerMoney >= purchased.nextUpgradeCost) {
            recommendations.push(`⬆️ MEDIUM: Upgrade server for ${ns.formatNumber(purchased.nextUpgradeCost)} (${purchased.upgradeableCount} upgradeable)`);
        }
    }

    // Priority 5: Network growth suggestions
    if (network.rootedServers > 20 && purchased.count === 0) {
        recommendations.push(`🚀 MEDIUM: Consider purchasing servers for dedicated RAM capacity`);
    }

    // Priority 6: Hacking level recommendations
    const avgNetworkLevel = network.averageHackLevel;
    if (playerHackLevel < avgNetworkLevel * 0.8) {
        recommendations.push(`📚 LOW: Train hacking to access higher-level servers (current: ${playerHackLevel}, network avg: ${avgNetworkLevel})`);
    }

    // Priority 7: Backdoor benefits info
    if (network.backdooredServers > 0 && network.backdoorableServers === 0) {
        recommendations.push(`✅ EXCELLENT: All available servers backdoored - maximum network access achieved`);
    }

    return recommendations;
}

async function testBackdoorFunctionality(ns: NS): Promise<void> {
    ns.tprint("🔍 Testing backdoor functionality...");

    // Check Singularity API availability
    if (!ns.singularity) {
        ns.tprint("❌ Singularity API not available!");
        ns.tprint("   Requirements for backdoor functionality:");
        ns.tprint("   - Must have Source-File 4 (The Singularity)");
        ns.tprint("   - Complete BitNode-4 or obtain SF4 from previous runs");
        ns.tprint("   - RAM costs: 16x (SF4.1), 4x (SF4.2), 1x (SF4.3+)");
        return;
    }

    // Test Singularity API functionality
    try {
        ns.singularity.getCurrentWork();
        ns.tprint("✅ Singularity API available and functional");
    } catch (e) {
        ns.tprint("❌ Singularity API exists but not functional!");
        ns.tprint(`   Error: ${e}`);
        ns.tprint("   This usually indicates insufficient Source-File 4 level");
        return;
    }

    // Test basic Singularity functionality
    try {
        const initialServer = ns.getHostname();
        ns.tprint(`📍 Script running on: ${initialServer} (this is script location, not terminal location)`);

        // Test connecting to home (should be safe)
        ns.tprint(`🏠 Testing terminal connection to home...`);
        const homeConnectResult = ns.singularity.connect('home');
        await ns.sleep(100);
        ns.tprint(`🔌 Connect to home returned: ${homeConnectResult}`);

        // Get available neighbors from home
        const neighbors = ns.scan('home');
        ns.tprint(`🌐 Neighbors from home: ${neighbors.join(', ')}`);

        if (neighbors.length > 1) { // More than just the current server
            const testTarget = neighbors.find(n => n !== initialServer) || neighbors[0];
            ns.tprint(`🎯 Testing terminal connection to: ${testTarget}`);

            const testConnectResult = ns.singularity.connect(testTarget);
            await ns.sleep(200);
            ns.tprint(`🔌 Connect to ${testTarget} returned: ${testConnectResult}`);

            if (testConnectResult) {
                ns.tprint(`✅ Terminal connection appears to be working!`);
                ns.tprint(`ℹ️ Note: We cannot verify terminal location via NS API`);

                // Return terminal to home
                const homeReturn = ns.singularity.connect('home');
                await ns.sleep(100);
                ns.tprint(`🏠 Return to home result: ${homeReturn}`);
            } else {
                ns.tprint(`❌ Singularity connection not working properly`);
                ns.tprint(`   This might be a game version issue or Singularity access problem`);
            }
        }

    } catch (e) {
        ns.tprint(`❌ Error during Singularity test: ${e}`);
    }

    // Test basic functions
    try {
        const currentServer = ns.getHostname();
        ns.tprint(`📍 Current server: ${currentServer}`);

        // Discover servers
        const allServers = discoverAllServers(ns);
        const serverData = allServers.map(hostname => buildServerData(ns, hostname));
        ns.tprint(`🌐 Discovered ${allServers.length} servers`);

        // Find backdoor candidates
        const playerHackLevel = ns.getHackingLevel();
        const candidates = serverData.filter(s =>
            !s.backdoorInstalled &&
            s.hasAdminRights &&
            !s.purchasedByPlayer &&
            s.hostname !== 'home' &&
            s.requiredHackingSkill <= playerHackLevel
        );

        ns.tprint(`🎯 Found ${candidates.length} backdoor candidates:`);
        candidates.forEach(s => {
            ns.tprint(`   - ${s.hostname} (hack level: ${s.requiredHackingSkill}, already backdoored: ${s.backdoorInstalled})`);
        });

        if (candidates.length > 0) {
            const testServer = candidates[0];
            ns.tprint(`🧪 Testing backdoor on ${testServer.hostname}...`);

            const success = await installBackdoorViaSingularity(ns, testServer.hostname, true);
            if (success) {
                ns.tprint(`✅ Test backdoor successful on ${testServer.hostname}`);
            } else {
                ns.tprint(`❌ Test backdoor failed on ${testServer.hostname}`);
            }
        } else {
            ns.tprint("ℹ️ No backdoor candidates available for testing");
        }

    } catch (e) {
        ns.tprint(`❌ Error during backdoor test: ${e}`);
    }
}