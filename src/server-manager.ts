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
}

// Configuration
const CONFIG = {
    PURCHASED_SERVER_START_RAM: 2,
    MAX_PURCHASED_SERVERS: 25,
    TARGET_RAM_POWER: 13, // 2^20 = 1TB max per server
    HOME_RAM_RESERVE: 32
};

export function autocomplete(data: AutocompleteData, _args: any) {
    return [
        ...data.servers,
        '--debug',
        '--max-servers',
        '--power'
    ];
}

export async function main(ns: NS): Promise<void> {
    const args = ns.flags([
        ['debug', false],
        ['max-servers', CONFIG.MAX_PURCHASED_SERVERS],
        ['power', CONFIG.TARGET_RAM_POWER]
    ]);

    const debug = args.debug as boolean;
    const maxServers = args['max-servers'] as number;
    const targetRamPower = args['power'] as number;

    if (debug) ns.tprint("Server Manager starting...");

    while (true) {
        try {
            const result = await manageServers(ns, maxServers, targetRamPower, debug);

            if (debug || result.rootedCount > 0 || result.purchasedCount > 0 || result.upgradedCount > 0) {
                ns.print(`Server Management: rooted=${result.rootedCount}, bought=${result.purchasedCount}, upgraded=${result.upgradedCount}`);
                ns.print(`Network: ${result.totalServers} servers, ${(result.totalRam / 1000).toFixed(1)}TB total`);
            }

        } catch (error) {
            ns.print(`Server management error: ${error}`);
        }

        await ns.sleep(2000); // Check every 10 seconds
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

    // 4. Calculate totals
    const totalRam = serverData.reduce((sum, s) => sum + s.maxRam, 0);

    return {
        rootedCount,
        purchasedCount,
        upgradedCount,
        totalServers: serverData.length,
        totalRam
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