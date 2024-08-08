import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'RootServers') => new ScriptTask(
    { name: taskName, priority: 20, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, `
        const servers = await database.getAll(DatabaseStoreName.Servers);
        const targets = servers.filter(s => !s.hasAdminRights);
        for (const target of targets) {
            try { ns.brutessh(target.hostname); ns.ftpcrack(target.hostname); ns.relaysmtp(target.hostname); ns.httpworm(target.hostname); ns.sqlinject(target.hostname); } catch (e) { }
            try { 
                ns.nuke(target.hostname);
                
                const homeServer = await database.get(DatabaseStoreName.Servers, 'home');
                ns.scp(homeServer.files.filter(f => f.startsWith('remote/') || f.startsWith('lib/')), target.hostname);
                const player = await database.get(DatabaseStoreName.NS_Data, 'ns.getPlayer');
                if(player.skills.hacking >= target.requiredHackingSkill) {
                    ns.exec('remote/wgh.loop.js', target.hostname, Math.floor((target.maxRam - target.ramUsed) / 2), target.hostname);
                }
            } catch (e) { }
        }
    `, [])
)