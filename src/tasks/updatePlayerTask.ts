import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { ScriptTask } from "/lib/models";
import { DatabaseStoreName } from "/lib/database";

export default (taskName: string = 'UpdatePlayer') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName, getDynamicScriptContent('ns.getPlayer', '{...ns.getPlayer(), hasTorRouter: ns.hasTorRouter()}', DatabaseStoreName.NS_Data)),
)