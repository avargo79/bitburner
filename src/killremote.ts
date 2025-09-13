import { NS } from "@ns";

function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();

    const allServers = getServerList(ns);
    let totalKilled = 0;

    for (const hostname of allServers) {
        try {
            const server = ns.getServer(hostname);
            const runningScripts = ns.ps(hostname);
            for (const script of runningScripts) {
                if (script.filename.startsWith('remote/')) {
                    const killed = ns.scriptKill(script.filename, hostname);
                    if (killed) {
                        ns.print(`Killed ${script.filename} on ${hostname}`);
                        totalKilled++;
                    }
                }
            }
        } catch (e) {
            // Skip servers that can't be accessed
        }
    }

    ns.tprint(`Cleanup complete: ${totalKilled} remote scripts killed`);
}