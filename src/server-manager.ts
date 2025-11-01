import { AutocompleteData, NS } from "@ns";

interface ServerStats {
    totalServers: number;
    rootedServers: number;
    backdooredServers: number;
    purchasedServers: number;
    totalRam: number;
}

const CONFIG = {
    PURCHASED_SERVER_START_RAM: 2,
    MAX_PURCHASED_SERVERS: 25,
    TARGET_RAM_POWER: 20, // 2^20 = 1TB max per server
};

export function autocomplete(data: AutocompleteData, _args: any) {
    return [...data.servers, '--no-backdoors', '--no-dashboard'];
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL');

    const args = ns.flags([
        ['no-backdoors', false],
        ['no-dashboard', false]
    ]);

    const enableBackdoors = !args['no-backdoors'] && !!ns.singularity;
    const showDashboard = !args['no-dashboard'];

    while (true) {
        const stats = await manageAllServers(ns, enableBackdoors);
        
        if (showDashboard) {
            displayStats(ns, stats);
        }

        await ns.sleep(5000);
    }
}

async function manageAllServers(ns: NS, enableBackdoors: boolean): Promise<ServerStats> {
    const allServers = getAllServers(ns);
    const playerHackLevel = ns.getHackingLevel();
    
    let rootedCount = 0;
    let backdooredCount = 0;
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

        // Backdoor if possible
        if (enableBackdoors && 
            server.hasAdminRights && 
            !server.backdoorInstalled &&
            (server.requiredHackingSkill || 0) <= playerHackLevel &&
            hostname !== 'home') {
            
            if (await backdoorServer(ns, hostname)) {
                backdooredCount++;
            }
        }
    }

    // Manage purchased servers
    await managePurchasedServers(ns);

    return {
        totalServers: allServers.length,
        rootedServers: allServers.filter(h => ns.getServer(h).hasAdminRights).length,
        backdooredServers: allServers.filter(h => ns.getServer(h).backdoorInstalled).length,
        purchasedServers: purchasedCount,
        totalRam
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

async function backdoorServer(ns: NS, hostname: string): Promise<boolean> {
    if (!ns.singularity) return false;
    
    try {
        const path = findPath(ns, hostname);
        if (!path) return false;

        // Navigate to server
        for (const server of path.slice(1)) {
            await ns.singularity.connect(server);
        }

        // Install backdoor
        await ns.singularity.installBackdoor();
        
        // Return home
        await ns.singularity.connect('home');
        return true;
    } catch (e) {
        try { await ns.singularity.connect('home'); } catch (e2) { /* ignore */ }
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

    // Upgrade one server per cycle if affordable
    for (const hostname of purchasedServers) {
        const server = ns.getServer(hostname);
        const currentRam = server.maxRam;
        const maxRam = Math.pow(2, CONFIG.TARGET_RAM_POWER);
        
        if (currentRam < maxRam) {
            const newRam = currentRam * 2;
            const cost = ns.getPurchasedServerUpgradeCost(hostname, newRam);
            
            if (cost > 0 && playerMoney > cost * 2) {
                ns.upgradePurchasedServer(hostname, newRam);
                break; // Only upgrade one per cycle
            }
        }
    }
}

function displayStats(ns: NS, stats: ServerStats): void {
    ns.clearLog();
    ns.print('┌─ SERVER MANAGER');
    ns.print(`│ Network: ${stats.totalServers} total | ${stats.rootedServers} rooted | ${stats.backdooredServers} backdoored`);
    ns.print(`│ Purchased: ${stats.purchasedServers}/${CONFIG.MAX_PURCHASED_SERVERS} servers`);
    ns.print(`│ RAM: ${ns.formatNumber(stats.totalRam)}GB total`);
    ns.print('└─────────────────────────');
}