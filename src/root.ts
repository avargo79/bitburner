import { NS } from "@ns";
import { Database } from "/lib/database";
import { IScriptServer, ScriptServer } from "./lib/models";

export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    const hostname = ns.args[0] as string;

    try { ns.brutessh(hostname); ns.ftpcrack(hostname); ns.relaysmtp(hostname); ns.httpworm(hostname); ns.sqlinject(hostname); } catch (e) { }
    try {
        ns.nuke(hostname);
        const home = new ScriptServer(await database.get<IScriptServer>('servers', ''));
        const target = new ScriptServer(await database.get<IScriptServer>('servers', hostname));

        ns.scp(home.files.filter(f => f.startsWith('remote/')), hostname);
        ns.exec('remote/hwhw.prep.js', hostname, Math.floor(target.ram.available / 2.3));
    } catch (e) { }
}