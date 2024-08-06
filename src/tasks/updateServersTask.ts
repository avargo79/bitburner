import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'UpdatePServers') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName,
        'getServerList(ns).map(server => ({ ...ns.getServer(server), files: ns.ls(server), pids: ns.ps(server)})).forEach(server => database.saveRecord("servers", server))',
        ['import { getServerList } from "/lib/network";']
    )
)