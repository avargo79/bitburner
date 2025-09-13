import { NS } from "@ns";

export interface ServerManagerClient {
    getNetworkSnapshot(): Promise<NetworkSnapshot>;
}

export interface NetworkSnapshot {
    servers: ServerInfo[];
    totalRam: number;
    availableRam: number;
    attackerRam: number;
    rootedCount: number;
}

export interface ServerInfo {
    hostname: string;
    maxRam: number;
    availableRam: number;
    hasAdminRights: boolean;
    purchasedByPlayer: boolean;
    cpuCores: number;
    isAttacker: boolean; // Has RAM and admin rights
    isTarget: boolean;   // Has money and admin rights
}

/**
 * Simple client to get network data managed by server-manager.ts
 * This allows botnet-v2 to focus purely on RAM allocation and script execution
 */
export class SimpleServerManager implements ServerManagerClient {
    constructor(private ns: NS) {}

    async getNetworkSnapshot(): Promise<NetworkSnapshot> {
        const servers = this.discoverAllServers();
        const serverInfos = servers.map(hostname => this.buildServerInfo(hostname));
        
        const totalRam = serverInfos.reduce((sum, s) => sum + s.maxRam, 0);
        const availableRam = serverInfos.reduce((sum, s) => sum + s.availableRam, 0);
        const attackerRam = serverInfos.filter(s => s.isAttacker).reduce((sum, s) => sum + s.maxRam, 0);
        const rootedCount = serverInfos.filter(s => s.hasAdminRights && !s.purchasedByPlayer).length;
        
        return {
            servers: serverInfos,
            totalRam,
            availableRam,
            attackerRam,
            rootedCount
        };
    }

    private discoverAllServers(): string[] {
        const visited = new Set<string>();
        const queue = ['home'];
        const servers: string[] = [];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            
            visited.add(current);
            servers.push(current);
            
            try {
                const neighbors = this.ns.scan(current);
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

    private buildServerInfo(hostname: string): ServerInfo {
        try {
            const server = this.ns.getServer(hostname);
            
            const hasAdminRights = server.hasAdminRights;
            const hasRam = server.maxRam > 0;
            const hasMoney = (server.moneyMax || 0) > 0;
            const isHome = hostname === 'home';
            const isPurchased = server.purchasedByPlayer;
            const maxRam = server.maxRam;
            const usedRam = this.ns.getServerUsedRam(hostname);
            const availableRam = maxRam - usedRam;
            
            return {
                hostname,
                maxRam,
                availableRam,
                hasAdminRights,
                purchasedByPlayer: isPurchased,
                cpuCores: server.cpuCores,
                isAttacker: hasAdminRights && hasRam && !isHome, // Can run scripts
                isTarget: hasAdminRights && hasMoney && !isPurchased && !isHome // Can be hacked
            };
        } catch (e) {
            return {
                hostname,
                maxRam: 0,
                availableRam: 0,
                hasAdminRights: false,
                purchasedByPlayer: false,
                cpuCores: 1,
                isAttacker: false,
                isTarget: false
            };
        }
    }
}