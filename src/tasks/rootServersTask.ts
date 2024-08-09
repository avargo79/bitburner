import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'RootServers') => new ScriptTask(
    { name: taskName, priority: 20, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, `
        const servers = await database.getAll(DatabaseStoreName.Servers);
        const targets = servers.filter(s => !s.hasAdminRights);
        for (const target of targets) {
            try { ns.brutessh(target.hostname); ns.ftpcrack(target.hostname); ns.relaysmtp(target.hostname); ns.httpworm(target.hostname); ns.sqlinject(target.hostname); } catch (e) { }
            try { ns.nuke(target.hostname); } catch (e) { }
        }
    `, [])
)