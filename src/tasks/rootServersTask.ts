import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'RootServers') => new ScriptTask(
    { name: taskName, priority: 20, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, '(await database.getAll("servers")).filter(s => !s.hasAdminRights).map(s => s.hostname).forEach(s => { try{ ns.brutessh(s); ns.ftpcrack(s); ns.relaysmtp(s); ns.httpworm(s); ns.sqlinject(s); } catch(e){} try{ ns.nuke(s); } catch(e){} });'
    )
)