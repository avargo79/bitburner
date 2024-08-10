import { NS } from "@ns";
import { Database } from "/lib/database";
import { IScriptServer } from "/models/ScriptServer";

export async function main(ns: NS): Promise<void> {
    const hostname = ns.args[0] as string;
    const database = await Database.getInstance();
    await database.open();

    let stillPrepping = true;
    while (stillPrepping) {
        const target = await database.get<IScriptServer>('servers', hostname);
        if (target.hackDifficulty! > target.minDifficulty!) {
            await ns.weaken(hostname);
        } else if (target.moneyAvailable! < target.moneyMax!) {
            await ns.grow(hostname);
        } else {
            stillPrepping = false;
        }
    }
}