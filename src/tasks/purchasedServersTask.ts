import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'PurchasedServers') => new ScriptTask(
    { name: taskName, priority: 10, lastRun: 0, interval: 10000, enabled: false },
    new DynamicScript(taskName, 'ns.run("purchasedservers.js");'
    )
)