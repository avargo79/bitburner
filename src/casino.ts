import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptPlayer } from "/lib/models";

export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, "ns.getPlayer");
    ns.tprint(`Player: ${JSON.stringify(player)}`);

    // Travel to casino in Aevum
    // Go to the casino
    // Select blackjack

    // Save game button
    // Wager input
    // Start playing button

    // Save the game

    // Play the game until we lose
}
