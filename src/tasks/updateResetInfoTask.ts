import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'UpdateResetInfo') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, getDynamicScriptContent('ns.getResetInfo', 'ns.getResetInfo()', 'ns_data'))
)