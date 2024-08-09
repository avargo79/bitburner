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
    try { ns.nuke(hostname); } catch (e) { }
}