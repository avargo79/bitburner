import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptServer } from "/lib/models";

export function autocomplete(data: { servers: any }, args: any) {
    return data.servers;
}

export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    const hostname = ns.args[0] as string;

    try { ns.brutessh(hostname); ns.ftpcrack(hostname); ns.relaysmtp(hostname); ns.httpworm(hostname); ns.sqlinject(hostname); } catch (e) { }
    try {
        ns.nuke(hostname);

    } catch (e) { }

    await ns.sleep(1000);
    const remoteHost = await database.get<IScriptServer>('servers', hostname);

    if (remoteHost.hasAdminRights) {
        const homeServer = await database.get<IScriptServer>(DatabaseStoreName.Servers, 'home');
        ns.scp(homeServer.files.filter(f => f.startsWith('remote/') || f.startsWith('lib/')), hostname);
        ns.exec('remote/wgh.loop.js', hostname, Math.floor((remoteHost.maxRam - remoteHost.ramUsed) / 2), hostname);
    }
}