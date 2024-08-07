import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'RootServers') => new ScriptTask(
    { name: taskName, priority: 20, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(taskName, `
        const servers = await database.getAll("servers");
        const targets = servers.filter(s => !s.hasAdminRights).map(s => s.hostname);
        for (const hostname of targets) {
            try{ 
                ns.brutessh(hostname); 
                ns.ftpcrack(hostname); 
                ns.relaysmtp(hostname); 
                ns.httpworm(hostname); 
                ns.sqlinject(hostname); 
            } catch(e){} 
                
            try{ 
                ns.nuke(hostname); 

                const home = await database.get('servers', 'home');
                const target = await database.get('servers', hostname);
                ns.scp(home.files.filter(f => f.startsWith('remote/')), hostname, 'home');
                ns.scp(home.files.filter(f => f.startsWith('lib/')), hostname, 'home');
                ns.exec('remote/hwhw.prep.js', hostname, Math.floor(target.ram.available / 1.9), hostname);
            } catch(e){} 
        }
    `, [])
)