import { NS } from "@ns";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { Database, DatabaseStoreName } from "/lib/database";
import { ScriptTask } from "/models/ScriptTask";
import { IScriptPlayer } from "/models/IScriptPlayer";
import { IScriptServer } from "/models/ScriptServer";

export default (taskName: string = 'PurchasedServers') => new ScriptTask(
    { name: taskName, priority: 10, lastRun: 0, interval: 10000, enabled: false },
    new DynamicScript(taskName, 'ns.run("purchasedservers.js");'
    )
)

const database = await Database.getInstance();
await database.open();

async function main(ns: NS) {
    const data = ns.flags([["max-power", 13]]);

    const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');


    DynamicScript.new('ns.getPurchasedServerLimit', getDynamicScriptContent("ns.getPurchasedServerLimit", `ns.getPurchasedServerLimit()`), []).run(ns, true);
    DynamicScript.new('ns.getPurchasedServerMaxRam', getDynamicScriptContent("ns.getPurchasedServerMaxRam", `ns.getPurchasedServerMaxRam()`), []).run(ns, true);
    DynamicScript.new('ns.getPurchasedServerCost', getDynamicScriptContent("ns.getPurchasedServerCost", `ns.getPurchasedServerCost(2)`), []).run(ns, true);
    DynamicScript.new('ns.getPurchasedServers', getDynamicScriptContent("ns.getPurchasedServers", `ns.getPurchasedServers()`), []).run(ns, true);

    const max_servers = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerLimit');
    const max_ram = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerMaxRam');
    const base_cost = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServerCost');
    const max_power = data["max-power"] as number;

    const servers = await database.get<string[]>(DatabaseStoreName.NS_Data, 'ns.getPurchasedServers');

    if (servers.length < max_servers && player.money < base_cost) {
        return;
    } else if (servers.length < max_servers && player.money >= base_cost) {
        ns.purchaseServer(`pserve-${servers.length + 1}`, 2);
    }

    var getPower = (server: IScriptServer) => Math.max(0, Math.log2(server.maxRam));
    // while (current_servers.some((s) => getPower(s.power) < max_power && s.ram.max < max_ram)) {
    //     current_servers.sort((a, b) => a.ram.max - b.ram.max);
    //     const target = current_servers[0];
    //     const upgrade_ram = target.ram.max * 2;
    //     const upgrade_cost = ns.getPurchasedServerUpgradeCost(target.id, upgrade_ram);

    //     while (player.money < upgrade_cost) {
    //         await ns.sleep(10);
    //     }

    //     ns.upgradePurchasedServer(target.id, upgrade_ram);

    //     await ns.sleep(10);
    // }

    ns.tprint("Completed purchasing servers");
}