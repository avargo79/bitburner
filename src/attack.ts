import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptPlayer, IScriptServer } from "/lib/models";
import { Colors } from "./lib/consts";

const reserveRam = 32
export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();

    const database = await Database.getInstance();
    await database.open();

    let player: IScriptPlayer;
    let executingServer: IScriptServer;

    const getTargetValue = (server: IScriptServer) => Math.floor(server.moneyMax! / server.hackData.wkTime);
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
        && executingServer.pids.find(p => p.filename === "remote/hwgw.hack" && p.args.includes(server.hostname)) === undefined;

    const sortByValue = (a: IScriptServer, b: IScriptServer) => getTargetValue(b) - getTargetValue(a)

    const refreshPlayer = async () => await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
    const refreshExecutingServer = async () => await database.get<IScriptServer>(DatabaseStoreName.Servers, 'home');
    const refreshServers = async (filterFn: (server: IScriptServer) => boolean) => (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).filter(filterFn);

    const tryExec = (executingServer: IScriptServer, script: string, hostname: string, threads: number) => {
        const availableThreads = Math.floor(((executingServer.maxRam - reserveRam) - executingServer.ramUsed) / 2);
        const execThreads = Math.min(threads, availableThreads);
        if (execThreads <= 0) return 0;
        ns.print(`${hostname}: Trying to exec '${script}' with ${Colors.brightRed}${execThreads}${Colors.reset} threads(req=${Colors.brightBlue}${threads}${Colors.reset})`);
        const pid = ns.exec(script, executingServer.hostname, execThreads, hostname, 0);
        return pid > 0 ? execThreads : 0;
    };
    const tryWeaken = (executingServer: IScriptServer, target: IScriptServer) => {
        const executingThreads = executingServer.pids
            .filter(p => p.filename === "remote/hwgw.weaken.js" && p.args.includes(target.hostname))
            .reduce((acc, p) => acc + p.threads, 0);
        const secDecrease = target.hackDifficulty! - target.minDifficulty!;
        let weakenThreads = Math.ceil(secDecrease * 20) - executingThreads;

        weakenThreads -= tryExec(executingServer, 'remote/hwgw.weaken.js', target.hostname, weakenThreads);
    }
    const tryGrow = (executingServer: IScriptServer, target: IScriptServer) => {
        const money = target.moneyMax! / target.moneyAvailable!;
        const executingThreads = executingServer.pids
            .filter(p => p.filename === "remote/hwgw.grow.js" && p.args.includes(target.hostname))
            .reduce((acc, p) => acc + p.threads, 0);
        let growThreads = Math.ceil(ns.growthAnalyze(target.hostname, money == Infinity ? target.moneyMax! : money)) - executingThreads;
        growThreads -= tryExec(executingServer, 'remote/hwgw.grow.js', target.hostname, growThreads);
    }
    const tryHack = (executingServer: IScriptServer, target: IScriptServer) => {
        const executingThreads = executingServer.pids
            .filter(p => p.filename === "remote/hwgw.hack.js" && p.args.includes(target.hostname))
            .reduce((acc, p) => acc + p.threads, 0);
        let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyMax!)) - executingThreads;
        if (hackThreads == Infinity) hackThreads = 1;

        hackThreads -= tryExec(executingServer, 'remote/hwgw.hack.js', target.hostname, hackThreads);
    }

    while (true) {
        ns.clearLog();
        player = await refreshPlayer();

        // Weaken targets
        executingServer = await refreshExecutingServer();
        const weakenTargets = await refreshServers(shouldWeaken);
        weakenTargets.sort(sortByValue);
        weakenTargets.forEach(target => tryWeaken(executingServer, target));
        await ns.sleep(1000);

        // Grow targets
        executingServer = await refreshExecutingServer();
        const growTargets = await refreshServers(shouldGrow);
        growTargets.sort(sortByValue);
        growTargets.forEach(target => tryGrow(executingServer, target));
        await ns.sleep(1000);

        // Hack targets if no weaken/grow targets
        if (weakenTargets.length === 0 && growTargets.length === 0) {
            executingServer = await refreshExecutingServer();
            const hackTargets = await refreshServers(shouldHack);
            hackTargets.sort(sortByValue);
            hackTargets.forEach(target => tryHack(executingServer, target));
            await ns.sleep(1000);
        }

        // Wait until threads available
        let sleepingUntilThreads = (executingServer.maxRam - executingServer.ramUsed - reserveRam) / 2 < 1
        while (sleepingUntilThreads) {
            executingServer = await refreshExecutingServer();
            sleepingUntilThreads = (executingServer.maxRam - executingServer.ramUsed - reserveRam) / 2 < 1;
            const maxRam = executingServer.maxRam - reserveRam;
            const availableRam = maxRam - executingServer.ramUsed;
            ns.print(`Sleeping until threads available. Current RAM: ${Colors.brightRed}${ns.formatRam(availableRam)}/${ns.formatRam(maxRam)}${Colors.reset}`);
            await ns.sleep(1000);
        }
    }
}

function formatMoney(money: number): string {
    return money.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
