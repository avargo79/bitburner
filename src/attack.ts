import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { ScriptServer, IScriptServer } from "/lib/models";

export async function main(ns: NS): Promise<void> {
    const database = await Database.getInstance();
    await database.open();

    const servers = (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).map(s => new ScriptServer(s));
    const homeServer = servers.find(s => s.hostname === 'home') as ScriptServer;
    const remoteFiles = homeServer.files.filter(f => f.startsWith('remote/'));

    const attackers = servers.filter(s => s.hasAdminRights && s.ram.max > 0);
    for (const attacker of attackers) {
        ns.scp(remoteFiles, attacker.hostname)
    }

    const targets = servers.filter(s => s.hasAdminRights && !s.purchasedByPlayer && s.money.max > 0);

    const needsPrep = targets.filter(t => t.needsPrep);
    // const canAttack = targets.filter(t => !t.needsPrep);

    for (const target of needsPrep) {
        let attacker = new ScriptServer(await database.get<IScriptServer>(DatabaseStoreName.Servers, 'home'));

        // remote/hwgw.weaken 1.75GB
        // remote/hwgw.grow 1.75GB
        // remote/hwgw.hack 1.70GB
        let weakenTheads = target.security.current > target.security.min
            ? Math.ceil((target.security.current - target.security.min) * 20)
            : 0;
        weakenTheads = Math.min(weakenTheads, Math.floor(attacker.ram.available / 1.75));
        if (weakenTheads > 0) {
            ns.tprint(`Weakening: ${target.hostname}`);
            ns.exec('remote/hwgw.weaken.js', attacker.hostname, weakenTheads, target.hostname, 0);
        }

        attacker = new ScriptServer(await database.get<IScriptServer>(DatabaseStoreName.Servers, 'home'))
        let money = target.money.max / target.money.current;
        if (money == Infinity) money = target.money.max;
        let growThreads = Math.ceil(ns.growthAnalyze(target.hostname, money));
        growThreads = Math.min(growThreads, Math.floor(attacker.ram.available / 1.75));
        if (growThreads > 0) {
            ns.tprint(`Growing: ${target.hostname}`);
            ns.exec('remote/hwgw.grow.js', attacker.hostname, growThreads, target.hostname, 0);
        }
        //weakenTheads = Math.ceil(this.instance.hackAnalyzeSecurity(this.hackThreads, this.id)) + 10;

        // return weakenTheads == Infinity ? 1 : weakenTheads;
        // const needsPrep =
        //     (target.moneyAvailable ?? 0) < (target.moneyMax ?? 0) ||
        //     (target.hackDifficulty ?? 0) > (target.hackDifficulty ?? 0);

        // if() {
        //     ns.run('attack.js', 1, target.hostname);
        // }
    }
}