import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { IScriptPlayer, IScriptServer, ScriptServer } from "/lib/models";

export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    database.saveRecord(DatabaseStoreName.NS_Data, { command: 'ns.getPurchasedServerLimit', result: ns.getPurchasedServerLimit() });
    database.saveRecord(DatabaseStoreName.NS_Data, { command: 'ns.getPurchasedServerMaxRam', result: ns.getPurchasedServerMaxRam() });
    database.saveRecord(DatabaseStoreName.NS_Data, { command: 'ns.getPurchasedServerCost(2)', result: ns.getPurchasedServerCost(2) });

    (new DynamicScript('ns.getPurchasedServers',
        getDynamicScriptContent('ns.getPurchasedServers', 'ns.getPurchasedServers()', DatabaseStoreName.NS_Data)
    )).run(ns, true);

    const maxServers = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerLimit');
    const maxRam = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerMaxRam');
    const baseCost = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerCost(2)');

    while (true) {
        const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, "ns.getPlayer");
        const allServers = (await database.getAll<IScriptServer>(DatabaseStoreName.Servers))
            .map(server => new ScriptServer(server));
        const purchaseServers = (await database.get<string[]>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServers'))
            .map(hostname => allServers.find(server => server.hostname === hostname)) as ScriptServer[];

        // purchase max servers
        if (purchaseServers.length < maxServers) {
            while (player.money < baseCost) {
                await ns.sleep(1000);
            }

            (new DynamicScript('ns.purchaseServer', `ns.purchaseServer("pserv-${purchaseServers.length}", 2 )`))
                .run(ns, true);
        } else {
            purchaseServers.sort((a, b) => a.ram.max - b.ram.max);
        }
    }
}