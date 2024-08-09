import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptPlayer, IScriptServer } from "/lib/models";
import { DynamicScript, getDynamicScriptContent } from "./lib/system";
import PrettyTable from "./lib/prettytable";

const reserveRam = 32
const database = await Database.getInstance();
await database.open();

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();

    let player: IScriptPlayer;
    let executingServer: IScriptServer;

    const getTargetValue = (server: IScriptServer) => Math.floor(server.moneyMax! / server.hackData.wkTime);
    const isTarget = (server: IScriptServer) =>
        server.hasAdminRights
        && !server.purchasedByPlayer
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

    while (true) {
        player = await refreshPlayer();
        executingServer = await refreshExecutingServer();

        ns.clearLog();
        printStatus(ns, executingServer);

        // Weaken targets
        const weakenTargets = await refreshServers(shouldWeaken);
        weakenTargets.sort(sortByValue);
        for (const target of weakenTargets) {
            const executingThreads = executingServer.pids
                .filter(p => p.filename === "remote/hwgw.weaken.js" && p.args.includes(target.hostname))
                .reduce((acc, p) => acc + p.threads, 0);

            const secDecrease = target.hackDifficulty! - target.minDifficulty!;
            let weakenThreads = Math.ceil(secDecrease * 20) - executingThreads;
            weakenThreads -= tryExecuteScript(ns, executingServer, 'remote/hwgw.weaken.js', target.hostname, weakenThreads);
        }
        await ns.sleep(1000);

        // Grow targets
        executingServer = await refreshExecutingServer();
        const growTargets = await refreshServers(shouldGrow);
        growTargets.sort(sortByValue);
        for (const target of growTargets) {
            const executingThreads = executingServer.pids
                .filter(p => p.filename === "remote/hwgw.grow.js" && p.args.includes(target.hostname))
                .reduce((acc, p) => acc + p.threads, 0);

            let money = target.moneyMax! / target.moneyAvailable!;
            if (money == Infinity) money = target.moneyMax!;

            const scriptContext = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${money}))`, DatabaseStoreName.NS_Data);
            await (new DynamicScript('ns.growthAnalyze', scriptContext, [])).run(ns, true);
            const grThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');
            let growThreads = grThreads - executingThreads;
            growThreads -= tryExecuteScript(ns, executingServer, 'remote/hwgw.grow.js', target.hostname, growThreads);
        }
        await ns.sleep(1000);

        // Hack targets if no weaken/grow targets
        executingServer = await refreshExecutingServer();
        const hackTargets = await refreshServers(shouldHack);
        hackTargets.sort(sortByValue);
        for (const target of hackTargets) {
            const executingThreads = executingServer.pids
                .filter(p => p.filename === "remote/hwgw.hack.js" && p.args.includes(target.hostname))
                .reduce((acc, p) => acc + p.threads, 0);

            const scriptContext = getDynamicScriptContent("ns.hackAnalyzeThreads", `Math.ceil(ns.hackAnalyzeThreads('${target.hostname}', ${target.moneyMax!}))`, DatabaseStoreName.NS_Data);
            await (new DynamicScript('ns.hackAnalyzeThreads', scriptContext, [])).run(ns, true);
            const hkThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeThreads');
            let hackThreads = hkThreads - executingThreads;
            if (hackThreads == Infinity) hackThreads = 1;
            hackThreads -= tryExecuteScript(ns, executingServer, 'remote/hwgw.hack.js', target.hostname, hackThreads);
        }
        await ns.sleep(1000);

        // Wait until threads available
        let sleepingUntilThreads = (executingServer.maxRam - executingServer.ramUsed - reserveRam) / 2 < 1
        while (sleepingUntilThreads) {
            executingServer = await refreshExecutingServer();
            sleepingUntilThreads = (executingServer.maxRam - executingServer.ramUsed - reserveRam) / 2 < 1;
            await ns.sleep(100);
        }
    }
}

function tryExecuteScript(ns: NS, executingServer: IScriptServer, script: string, hostname: string, threads: number) {
    const availableThreads = Math.floor(((executingServer.maxRam - reserveRam) - executingServer.ramUsed) / 2);
    const execThreads = Math.min(threads, availableThreads);
    if (execThreads <= 0) return 0;
    const pid = ns.exec(script, executingServer.hostname, execThreads, hostname, 0);
    return pid > 0 ? execThreads : 0;
}

async function printStatus(ns: NS, executingServer: IScriptServer) {
    const remoteScripts = executingServer.pids
        .filter(p => p.filename.startsWith("remote/"));

    const rows = remoteScripts.map(s => [s.args[0], s.filename, s.threads]).reduce((acc, s) => {
        // find the entry where [hostname, filename] is the same, if not found, push the new entry
        if (!acc.find(e => e[0] === s[0] && e[1] === s[1])) acc.push(s);
        // if found, add the threads to the existing entry
        const element = acc.find(e => e[0] === s[0] && e[1] === s[1]);

        element[2] += s[2];

        return acc;
    }, []);

    const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
    rows.forEach(r => {
        const server = servers.find(s => s.hostname === r[0])!;
        r.push(ns.formatNumber(server.hackDifficulty! - server.minDifficulty!));
        r.push(ns.formatPercent(server.moneyAvailable! / server.moneyMax! || 0));
    });
    rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));

    const pt = new PrettyTable();
    const headers = ["SERVERNAME", "SCRIPT", "THREADS", "SEC+", "$"];
    pt.create(headers, rows);
    ns.print(pt.print());
}

function formatMoney(val: number): string {
    return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}