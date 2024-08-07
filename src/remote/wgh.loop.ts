import { NS } from "@ns";
import { IScriptServer } from "/lib/models";
import { Database } from "/lib/database";

export async function main(ns: NS): Promise<void> {
    const hostname = ns.args[0] as string;
    const database = await Database.getInstance();
    await database.open();

    while (true) {
        const target = await database.get<IScriptServer>('servers', hostname);
        if (target.hackDifficulty! > target.minDifficulty!) {
            await ns.weaken(hostname);
        } else if (target.moneyAvailable! < target.moneyMax!) {
            await ns.grow(hostname);
        } else {
            await ns.hack(hostname);
        }
    }
}