import { NS } from "@ns";
import { Database } from "/lib/database";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { IScriptPlayer, IScriptServer, ScriptServer } from "/lib/models";

export async function main(ns: NS): Promise<void> {
    const database = new Database();
    await database.open();

    database.saveRecord('ns_data', { command: 'ns.getPurchasedServerLimit', result: ns.getPurchasedServerLimit() });
    database.saveRecord('ns_data', { command: 'ns.getPurchasedServerMaxRam', result: ns.getPurchasedServerMaxRam() });
    database.saveRecord('ns_data', { command: 'ns.getPurchasedServerCost(2)', result: ns.getPurchasedServerCost(2) });

    (new DynamicScript('ns.getPurchasedServers', getDynamicScriptContent('ns.getPurchasedServers', 'ns.getPurchasedServers()', 'ns_data')))
        .run(ns, true);

    const maxServers = await database.get<number>('ns_data', 'ns.getPurchasedServerLimit');
    const maxRam = await database.get<number>('ns_data', 'ns.getPurchasedServerMaxRam');
    const baseCost = await database.get<number>('ns_data', 'ns.getPurchasedServerCost(2)');

    while (true) {
        const player = await database.get<IScriptPlayer>("ns_data", "ns.getPlayer");
        const allServers = (await database.getAll<IScriptServer>("servers"))
            .map(server => new ScriptServer(server));
        const purchaseServers = (await database.get<string[]>('ns_data', 'ns.getPurchasedServers'))
            .map(hostname => allServers.find(server => server.hostname === hostname)) as ScriptServer[];

        // purchase max servers
        if (purchaseServers.length < maxServers) {
            while (player.money < baseCost) {
                await ns.sleep(1000);
            }

            (new DynamicScript('ns.purchaseServer', `ns.purchaseServer("pserv-${purchaseServers.length}", 2 )`))
                .run(ns, true);
        } else{
            purchaseServers.sort((a, b) => a.ram.max - b.ram.max);
        }
    }
}