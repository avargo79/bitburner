import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'UpdateServers') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName,
        'getServerList(ns).map(server => ({ hack: {hkTime: -1, wkTime: -1, grTime: -1}, ...ns.getServer(server), files: ns.ls(server), pids: ns.ps(server)})).forEach(server => database.saveRecord("servers", server))',
        ['import { getServerList } from "/lib/network";']
    )
)