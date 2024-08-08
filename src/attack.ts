import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptPlayer, IScriptServer } from "/lib/models";
import { Colors } from "./lib/consts";

const reserveRam = 32

// remote/hwgw.weaken 1.75GB
// remote/hwgw.grow 1.75GB
// remote/hwgw.hack 1.70GB
export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    const database = await Database.getInstance();
    await database.open();

    const isTarget = (server: IScriptServer) =>
        server.hasAdminRights
        && player.skills.hacking >= server.requiredHackingSkill!
        && (server.moneyMax ?? 0) > 0;
    const shouldWeaken = (server: IScriptServer) =>
        isTarget(server)
        && server.hackDifficulty! > server.minDifficulty!
    const shouldGrow = (server: IScriptServer) =>
        isTarget(server)
        && server.moneyMax! > server.moneyAvailable!
    const shouldHack = (server: IScriptServer) =>
        isTarget(server)
        && !shouldWeaken(server)
        && !shouldGrow(server)
        && homeServer.pids.find(p => p.filename === "remote/hwgw.hack" && p.args.includes(server.hostname)) === undefined;

    const refreshPlayer = async () => database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
    const refreshHomeServer = async () => database.get<IScriptServer>(DatabaseStoreName.Servers, 'home');
    const refreshServers = async (filterFn: (server: IScriptServer) => boolean) => (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).filter(filterFn);
    const tryExec = async (script: string, hostname: string, threads: number) => {
        const execServer = await refreshHomeServer();
        const availableThreads = Math.floor((execServer.maxRam - execServer.ramUsed - reserveRam) / 2);
        const execThreads = Math.min(threads, availableThreads);
        if (execThreads <= 0) return 0;
        ns.print(`\tTrying to exec '${script}' on ${hostname} with ${Colors.brightRed}${execThreads}${Colors.reset} threads(req=${Colors.brightBlue}${threads}${Colors.reset})`);
        const pid = ns.exec(script, execServer.hostname, execThreads, hostname, 0);
        return pid > 0 ? execThreads : 0;
    };

    let player = await refreshPlayer();
    let homeServer = await refreshHomeServer();

    while (true) {
        ns.clearLog();
        player = await refreshPlayer();
        homeServer = await refreshHomeServer();

        const weakenTargets = await refreshServers(shouldWeaken);
        weakenTargets.sort((a, b) => a.hackData.wkTime - b.hackData.wkTime);
        for (const target of weakenTargets) {
            ns.print(`WEAKEN: ${target.hostname} Sec: ${target.hackDifficulty} Money: ${formatMoney(target.moneyAvailable!)}/${formatMoney(target.moneyMax!)}`);

            let secDecrease = target.hackDifficulty! - target.minDifficulty!;
            let weakenThreads = Math.ceil(secDecrease * 20);

            weakenThreads -= await tryExec('remote/hwgw.weaken.js', target.hostname, weakenThreads);
            await ns.sleep(1000);
            ns.print("\n");
            if (weakenThreads === 0) break;
        }

        const growTargets = await refreshServers(shouldGrow);
        growTargets.sort((a, b) => a.hackData.grTime - b.hackData.grTime);
        for (const target of growTargets) {
            ns.print(`GROW: ${target.hostname} Sec: ${target.hackDifficulty} Money: ${formatMoney(target.moneyAvailable!)}/${formatMoney(target.moneyMax!)}`);

            let money = target.moneyMax! / target.moneyAvailable!;
            let growThreads = Math.ceil(ns.growthAnalyze(target.hostname, money == Infinity ? target.moneyMax! : money));

            growThreads -= await tryExec('remote/hwgw.grow.js', target.hostname, growThreads);
            await ns.sleep(1000);
            ns.print("\n");
            if (growThreads === 0) break;
        }

        const hackTargets = await refreshServers(shouldHack);
        hackTargets.sort((a, b) => a.hackData.hkTime - b.hackData.hkTime);
        for (const target of hackTargets) {
            ns.print(`HACK: ${target.hostname} Money: ${formatMoney(target.moneyMax!)}`);

            let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyMax!));
            if (hackThreads == Infinity) hackThreads = 1;

            hackThreads -= await tryExec('remote/hwgw.hack.js', target.hostname, hackThreads);
            await ns.sleep(1000);
            ns.print("\n");
            if (hackThreads === 0) break;
        }

        let sleepingUntilThreads = true
        do {
            const server = await refreshHomeServer();
            sleepingUntilThreads = (server.maxRam - server.ramUsed - reserveRam) / 2 < 1;
            await ns.sleep(20000);
        } while (sleepingUntilThreads);
    }
}

function formatMoney(money: number): string {
    return money.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
