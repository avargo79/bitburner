import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { ScriptTask } from "/lib/tasks";

export default (taskName: string = 'UpdatePlayer') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName, getDynamicScriptContent('ns.getPlayer', '{...ns.getPlayer(), hasTorRouter: ns.hasTorRouter()}', 'ns_data')),
)