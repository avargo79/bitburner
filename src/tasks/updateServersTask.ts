import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'UpdateServers') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName, `
        const allServers = getServerList(ns);
        for (const hostname of allServers) {
            let server = await database.get(DatabaseStoreName.Servers, hostname);
            if (!server) server = { ...ns.getServer(hostname) };
            const updatedServer = { ...server, ...ns.getServer(hostname), files: ns.ls(hostname), pids: ns.ps(hostname), lastUpdated: Date.now() };
            await database.saveRecord(DatabaseStoreName.Servers, updatedServer)
        }
        `,
        ['import { getServerList } from "/lib/network";']
    )
)