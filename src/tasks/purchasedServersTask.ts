import { DynamicScript } from "lib/system";
import { ScriptTask } from "models/ScriptTask";

export default (taskName: string = 'PurchasedServers') => new ScriptTask(
    { name: taskName, priority: 10, lastRun: 0, interval: 10000, enabled: true },
    new DynamicScript(taskName, `
        const player = await database.get(DatabaseStoreName.NS_Data, "ns.getPlayer");

        await DynamicScript.new("ns.getPurchasedServerLimit",
            getDynamicScriptContent("ns.getPurchasedServerLimit", "ns.getPurchasedServerLimit()")
        ).run(ns, true);
        await DynamicScript.new("ns.getPurchasedServerMaxRam",
            getDynamicScriptContent("ns.getPurchasedServerMaxRam", "ns.getPurchasedServerMaxRam()")
        ).run(ns, true);
        await DynamicScript.new("ns.getPurchasedServerCost",
            getDynamicScriptContent("ns.getPurchasedServerCost", "ns.getPurchasedServerCost(2)")
        ).run(ns, true);
        await DynamicScript.new("ns.getPurchasedServers",
            getDynamicScriptContent("ns.getPurchasedServers", "ns.getPurchasedServers()")
        ).run(ns, true);

        const max_servers = await database.get(DatabaseStoreName.NS_Data, "ns.getPurchasedServerLimit");
        const max_ram = await database.get(DatabaseStoreName.NS_Data, "ns.getPurchasedServerMaxRam");
        const base_cost = await database.get(DatabaseStoreName.NS_Data, "ns.getPurchasedServerCost");

        let config = await database.get(DatabaseStoreName.Configuration, "purchasedServersTask.js");
        if (!config) {
            config = { key: "purchasedServersTask.js", value: { maxPower: 13 } };
            await database.saveRecord(DatabaseStoreName.Configuration, config);
        }
        const max_power = config.value.maxPower;

const servers = await database.get(DatabaseStoreName.NS_Data, "ns.getPurchasedServers") || [];

if (!Array.isArray(servers)) {
    // Data not ready, skip this cycle
    return;
}

if (servers.length < max_servers && player.money < base_cost) {
            return;
        } else if (servers.length < max_servers && player.money >= base_cost) {
            await DynamicScript.new("ns.purchaseServer", "ns.purchaseServer('pserve-" + (servers.length + 1).toString() + "', 2)").run(ns, true);
            return
        }

        var getPower = server => Math.max(0, Math.log2(server.maxRam));
        const networkServers = await database.getAll(DatabaseStoreName.Servers);
        const purchasedServers = networkServers.filter(s => servers.includes(s.hostname));
       if (purchasedServers.some((s) => getPower(s) < max_power && s.maxRam < max_ram)) {
            purchasedServers.sort((a, b) => a.maxRam - b.maxRam);
            const target = purchasedServers[0];
            const upgrade_ram = target.maxRam * 2;
             await DynamicScript.new("ns.getPurchasedServerUpgradeCost", 
                getDynamicScriptContent("ns.getPurchasedServerUpgradeCost", "ns.getPurchasedServerUpgradeCost('" + target.hostname + "', " + upgrade_ram + ")")
            ).run(ns, true);
            const upgrade_cost = await database.get(DatabaseStoreName.NS_Data, "ns.getPurchasedServerUpgradeCost");

            if (player.money < upgrade_cost) {
                return
            }

            const upgradePurchasedServerScript = 
                await DynamicScript.new("ns.upgradePurchasedServer", "ns.upgradePurchasedServer('" + target.hostname + "', " + upgrade_ram + ")"
            ).run(ns, true);
            return;
        } 
        `,
        [
            'import { DynamicScript, getDynamicScriptContent } from "lib/system";',
        ]
    )
)