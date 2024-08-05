import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/tasks";

export default (taskName: string = 'UpdatePlayer') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName,
        'getServerList(ns).map(server => ({ ...ns.getServer(server), files: ns.ls(server), pids: ns.ps(server), hack: { wkTime: ns.getWeakenTime(server.hostname), grTime: ns.getGrowTime(server.hostname), hkTime: ns.getHackTime(server.hostname) }})).forEach(server => database.saveRecord("servers", server))',
        ['import { getServerList } from "/lib/network";']
    )
)