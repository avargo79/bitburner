import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptServer } from "/lib/models";

export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();

    const database = await Database.getInstance();
    await database.open();

    const allServers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);

    const remotePIDs = allServers
        .flatMap(s => s.pids.filter(p => p.filename.startsWith("remote/")))
        .map(pid => ({ hostname: pid.args[0], filename: pid.filename }));
    for (const pid of remotePIDs) {
        ns.print(`Killing ${pid.filename} on ${pid.hostname}... ${ns.scriptKill(pid.filename, pid.hostname) ? 'OK' : 'FAILED'}`);
    }
}