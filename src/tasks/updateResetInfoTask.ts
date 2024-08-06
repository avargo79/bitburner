import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { ScriptTask } from "/lib/models";
import { DatabaseStoreName } from "/lib/database";

export default (taskName: string = 'UpdateResetInfo') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, getDynamicScriptContent('ns.getResetInfo', 'ns.getResetInfo()', DatabaseStoreName.NS_Data))
)