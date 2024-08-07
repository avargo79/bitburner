import { NS } from "@ns";
import PrettyTable from "./lib/prettytable";

import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptServer, IScriptPlayer, ScriptServer } from "/lib/models";

export function autocomplete(data: { servers: any }, args: any) {
    return data.servers;
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const database = await Database.getInstance();
    await database.open();

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

        const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, "ns.getPlayer");
        let servers = (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).map(s => new ScriptServer(s));

        if (data["purchased"]) {
            servers = servers.filter((s) => s.purchasedByPlayer || s.hostname === "home");
        } else if (data["targets"]) {
            servers = servers.filter((s) => s.isTarget);
        } else if (data["attackers"]) {
            servers = servers.filter((s) => s.isAttacker);
        } else if (data["prep"]) {
            servers = servers.filter((s) => s.isTarget && (s.security.current > s.security.min || s.money.current < s.money.max));
        } else if (!data["all"]) {
            servers = servers.filter((s) => player.skills.hacking >= s.requiredHackingSkill);
        }

        if (data["value"]) {
            servers.sort((a, b) => Math.floor(a.money.max / ns.getWeakenTime(a.hostname)) - Math.floor(b.money.max / ns.getWeakenTime(b.hostname)));
        } else if (data["money"]) {
            servers.sort((a, b) => a.money.max - b.money.max);
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
            s.hasAdminRights ? (s.backdoorInstalled ? "\u0138it" : "\u01a6oot") : s.ports.required,
            s.purchasedByPlayer ? "N/A" : s.needsPrep ? "No" : "Yes",
            ns.formatPercent(s.money.current / s.money.max || 0),
            ns.formatNumber(s.isTarget ? s.security.current - s.security.min : 1),
            s.power || "",
            ns.tFormat(ns.getWeakenTime(s.hostname)) || "",
            formatMoney(ns.getServerMaxMoney(s.hostname)),
            Math.floor(ns.getServerMaxMoney(s.hostname) / ns.getWeakenTime(s.hostname)),
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
