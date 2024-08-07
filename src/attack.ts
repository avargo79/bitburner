import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { ScriptServer, IScriptServer } from "/lib/models";

// remote/hwgw.weaken 1.75GB
// remote/hwgw.grow 1.75GB
// remote/hwgw.hack 1.70GB
export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    const servers = (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).map(s => new ScriptServer(s));
    const homeServer = servers.find(s => s.hostname === 'home') as ScriptServer;
    const remoteFiles = homeServer.files.filter(f => f.startsWith('remote/'));

    const attackers = servers.filter(s => (s.hasAdminRights && s.ram.max > 0) || s.purchasedByPlayer);
    for (const attacker of attackers) {
        ns.scp(remoteFiles, attacker.hostname)
    }

    const targets = servers.filter(s => s.hasAdminRights && !s.purchasedByPlayer && s.money.max > 0);
    const needsPrep = targets.filter(t => t.needsPrep);

    const weakenTarget = needsPrep.find(s => s.security.current > s.security.min);
    if (weakenTarget) {
        let weakenThreads = 1;
        let secDecrease = 1;

        while (true) {
            secDecrease = ns.weakenAnalyze(weakenThreads)
            if (weakenTarget.security.current - secDecrease > weakenTarget.security.min) {
                weakenThreads += 5;
                continue;
            }
            ns.tprint(`${weakenTarget.hostname} Sec: +${weakenTarget.security.current - weakenTarget.security.min}`);
            ns.tprint(`Weakening ${weakenTarget.hostname} by ${secDecrease} with ${weakenThreads} threads.`);
            break;
        }
        const orgThreads = weakenThreads;

        for (const attacker of attackers) {
            const attackerAvailableThreads = Math.floor(attacker.ram.available / 1.75);
            const threads = Math.min(weakenThreads, attackerAvailableThreads);
            const pid = ns.exec('remote/hwgw.weaken.js', attacker.hostname, threads, weakenTarget.hostname, 0);
            weakenThreads -= pid > 0 ? threads : 0;

            if (weakenThreads === 0) break;
        }
        if (weakenThreads > 0)
            ns.tprint(`${weakenThreads} threads more needed.  should decrease by ${ns.weakenAnalyze(orgThreads - weakenThreads)} (${weakenTarget.security.current - weakenTarget.security.min - ns.weakenAnalyze(orgThreads - weakenThreads)})`);
    }

    const growTarget = needsPrep.find(s => s.money.max > s.money.current && s.security.current === s.security.min);
    if (growTarget) {
        let money = growTarget.money.max / growTarget.money.current;
        if (money == Infinity) money = growTarget.money.max;
        let growThreads = Math.ceil(ns.growthAnalyze(growTarget.hostname, money));

        for (const attacker of attackers) {
            const attackerAvailableThreads = Math.floor(attacker.ram.available / 1.75);
            const threads = Math.min(growThreads, attackerAvailableThreads);
            ns.exec('remote/hwgw.grow.js', attacker.hostname, threads, growTarget.hostname, 0);
            growThreads -= threads;

            if (growThreads === 0) break;
        }
    }
}