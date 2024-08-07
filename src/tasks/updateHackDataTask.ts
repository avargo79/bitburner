import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'UpdateHackData') => new ScriptTask(
    { name: taskName, priority: 90, lastRun: 0, interval: 1000, enabled: true },
    new DynamicScript(taskName, `
        const servers = await database.getAll(DatabaseStoreName.Servers);
        servers.forEach(server => {
            const result = {...server, hackData: {hkTime: ns.getHackTime(server.hostname), wkTime: ns.getWeakenTime(server.hostname), grTime: ns.getGrowTime(server.hostname) } }
            database.saveRecord(DatabaseStoreName.Servers, result)
        });
        `,
        ['import { getServerList } from "/lib/network";']
    )
)