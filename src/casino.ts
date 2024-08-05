import { NS, Player } from "@ns";
import { Database } from "/lib/database";

export async function main(ns: NS): Promise<void> {
    const database = new Database('ScriptDb', 1);
    await database.open();
    const player = await database.get<Player>('player')
    ns.tprint(`Player: ${JSON.stringify(player)}`);
    // await database.deleteRecord('player', 1);
}
