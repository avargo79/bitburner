import { NS } from "@ns";
import PrettyTable from "/lib/prettytable";

export function autocomplete(data: { servers: any }, args: any) {
    return data.servers;
}

// Helper function to get all servers in the network
function getServerList(ns: NS, host: string = 'home', network = new Set<string>()): string[] {
    network.add(host);
    ns.scan(host).filter((hostname: string) => !network.has(hostname)).forEach((neighbor: string) => getServerList(ns, neighbor, network));
    return [...network];
}

interface ServerAnalysis {
    hostname: string;
    requiredHackingSkill: number;
    hasAdminRights: boolean;
    backdoorInstalled: boolean;
    purchasedByPlayer: boolean;
    portsRequired: number;
    maxRam: number;
    moneyMax: number;
    moneyCurrent: number;
    securityMin: number;
    securityCurrent: number;
    power: number;
    isTarget: boolean;
    isAttacker: boolean;
    needsPrep: boolean;
}

function analyzeServer(ns: NS, hostname: string): ServerAnalysis {
    const server = ns.getServer(hostname);
    const moneyMax = server.moneyMax || 0;
    const moneyCurrent = server.moneyAvailable || 0;
    const securityMin = server.minDifficulty || 0;
    const securityCurrent = server.hackDifficulty || 0;
    const requiredHackingSkill = server.requiredHackingSkill || 0;
    
    const isTarget = server.hasAdminRights && !server.purchasedByPlayer && moneyMax > 0;
    const isAttacker = server.hasAdminRights && server.maxRam > 0;
    const needsPrep = isTarget && (securityCurrent > securityMin + 5 || moneyCurrent < moneyMax * 0.95);
    
    return {
        hostname,
        requiredHackingSkill,
        hasAdminRights: server.hasAdminRights,
        backdoorInstalled: server.backdoorInstalled || false,
        purchasedByPlayer: server.purchasedByPlayer || false,
        portsRequired: server.numOpenPortsRequired || 0,
        maxRam: server.maxRam,
        moneyMax,
        moneyCurrent,
        securityMin,
        securityCurrent,
        power: server.maxRam > 0 ? Math.log2(server.maxRam) : 0, // Power based on RAM (log base 2)
        isTarget,
        isAttacker,
        needsPrep
    };
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const data = ns.flags([
        ["value", false],
        ["money", false],
        ["level", true],
        ["power", false],
        ["all", false],
        ["reverse", false],
        ["purchased", false],
        ["targets", false],
        ["attackers", false],
        ["prep", false],
        ["monitor", false],
    ]);

    const printFn = data["monitor"] ? ns.print : ns.tprint;
    if (data["monitor"]) ns.tail();

    do {
        if (data["monitor"]) ns.clearLog();

        const player = ns.getPlayer();
        const serverNames = getServerList(ns);
        let servers = serverNames.map(hostname => analyzeServer(ns, hostname));

        if (data["purchased"]) {
            servers = servers.filter((s) => s.purchasedByPlayer || s.hostname === "home");
        } else if (data["targets"]) {
            servers = servers.filter((s) => s.isTarget && player.skills.hacking >= s.requiredHackingSkill);
        } else if (data["attackers"]) {
            servers = servers.filter((s) => s.isAttacker);
        } else if (data["prep"]) {
            servers = servers.filter((s) => s.isTarget && player.skills.hacking >= s.requiredHackingSkill && s.needsPrep);
        } else if (!data["all"]) {
            servers = servers.filter((s) => player.skills.hacking >= s.requiredHackingSkill);
        }

        if (data["value"]) {
            servers.sort((a, b) => Math.floor(a.moneyMax / ns.getWeakenTime(a.hostname)) - Math.floor(b.moneyMax / ns.getWeakenTime(b.hostname)));
        } else if (data["money"]) {
            servers.sort((a, b) => a.moneyMax - b.moneyMax);
        } else if (data["level"]) {
            servers.sort((a, b) => a.requiredHackingSkill - b.requiredHackingSkill);
        } else if (data["power"]) {
            servers.sort((a, b) => a.power - b.power);
        }

        if (data["reverse"]) {
            servers.reverse();
        }

        const pt = new PrettyTable();
        const headers = ["SERVERNAME", "LEVEL", "HACKED", "PREPPED", "CASH%", "SEC+", "POWER", "WK", "$", "V"];
        const rows = servers.map((s) => [
            s.hostname,
            s.requiredHackingSkill,
            s.hasAdminRights ? (s.backdoorInstalled ? "✓it" : "✓oot") : s.portsRequired,
            s.purchasedByPlayer ? "N/A" : s.needsPrep ? "No" : "Yes",
            ns.formatPercent(s.moneyCurrent / s.moneyMax || 0),
            ns.formatNumber(s.isTarget ? s.securityCurrent - s.securityMin : 1),
            s.maxRam > 0 ? Math.round(s.power).toString() : "",
            s.moneyMax > 0 ? ns.tFormat(ns.getWeakenTime(s.hostname)) : "N/A",
            s.moneyMax > 0 ? formatMoney(s.moneyMax) : "$0",
            s.moneyMax > 0 ? Math.floor(s.moneyMax / ns.getWeakenTime(s.hostname)) : 0,
        ]);

        pt.create(headers, rows);

        printFn(pt.print());
        printFn("Total Results: ", servers.length);
        await ns.sleep(1000);
    } while (data["monitor"]);

}

function formatMoney(val: number): string {
    return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
