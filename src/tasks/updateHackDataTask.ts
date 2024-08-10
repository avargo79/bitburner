import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/models/ScriptTask";

export default (taskName: string = 'UpdateHackData') => new ScriptTask(
    { name: taskName, priority: 90, lastRun: 0, interval: 1000, enabled: false },
    new DynamicScript(taskName, `
        const servers = await database.getAll(DatabaseStoreName.Servers);
        
        for(const server of servers.filter(s => s.hostname !== 'darkweb')){
            const result = { ...server, hackData: { hkTime: ns.getHackTime(server.hostname), wkTime: ns.getWeakenTime(server.hostname), grTime: ns.getGrowTime(server.hostname) } }
            await database.saveRecord(DatabaseStoreName.Servers, result)
        }
        `,
        ['import { getServerList } from "/lib/network";']
    )
)
