import { AutocompleteData, NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import PrettyTable from "/lib/prettytable";
import { IScriptPlayer } from "/models/IScriptPlayer";
import { IScriptServer } from "/models/ScriptServer";

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['prep-only', false],
]

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);
    return data.txts;
}

const reserveRam = 32
const scripts = {
    weaken: "remote/hwgw.weaken.js",
    grow: "remote/hwgw.grow.js",
    hack: "remote/hwgw.hack.js",
}
const database = await Database.getInstance();
await database.open();

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();

    const options = ns.flags(argsSchema);

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
        && server.hackDifficulty! > server.minDifficulty!;
    const shouldGrow = (server: IScriptServer) =>
        isTarget(server)
        && server.moneyMax! > server.moneyAvailable!
        && getExecutingThreads(executingServer, server, scripts.weaken) < 1;
    const shouldHack = (server: IScriptServer) =>
        isTarget(server)
        && !shouldWeaken(server)
        && !shouldGrow(server)
        && executingServer.pids.find(p => p.filename === scripts.hack && p.args.includes(server.hostname)) === undefined;

    const sortByValue = (a: IScriptServer, b: IScriptServer) => getTargetValue(b) - getTargetValue(a)

    const refreshPlayer = async () => await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
    const refreshExecutingServer = async () => await database.get<IScriptServer>(DatabaseStoreName.Servers, 'home');
    const refreshServers = async (filterFn: (server: IScriptServer) => boolean) => (await database.getAll<IScriptServer>(DatabaseStoreName.Servers)).filter(filterFn);

    const getExecutingThreads = (executingServer: IScriptServer, target: IScriptServer, script: string) =>
        executingServer.pids
            .filter(p => p.filename === script && p.args.includes(target.hostname))
            .reduce((acc, p) => acc + p.threads, 0);

    while (true) {
        player = await refreshPlayer();
        executingServer = await refreshExecutingServer();

        ns.clearLog();
        await printStatus(ns, executingServer);

        // Weaken targets
        const weakenTargets = await refreshServers(shouldWeaken);
        weakenTargets.sort(sortByValue);
        for (const target of weakenTargets) {
            const executingThreads = getExecutingThreads(executingServer, target, scripts.weaken);

            const secDecrease = target.hackDifficulty! - target.minDifficulty!;
            const weakenThreads = Math.ceil(secDecrease * 20) - executingThreads;
            tryExecuteScript(ns, executingServer, scripts.weaken, target.hostname, weakenThreads);
        }
        await ns.sleep(1000);

        // Grow targets
        executingServer = await refreshExecutingServer();
        const growTargets = await refreshServers(shouldGrow);
        growTargets.sort(sortByValue);
        for (const target of growTargets) {
            const executingThreads = getExecutingThreads(executingServer, target, scripts.grow);
            if (executingThreads === 1 && !target.moneyAvailable) {
                ns.print(`Skipping grow on ${target.hostname} because no money available`);
                continue
            };

            let money = target.moneyMax! / target.moneyAvailable!;
            if (money == Infinity) money = target.moneyMax!;

            const scriptContext = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${money}))`, DatabaseStoreName.NS_Data);
            await (new DynamicScript('ns.growthAnalyze', scriptContext, [])).run(ns, true);
            const grThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');
            // If there is no money available, only run 1 thread to put money on the server
            const growThreads = target.moneyAvailable ? 1 : (grThreads - executingThreads);
            tryExecuteScript(ns, executingServer, scripts.grow, target.hostname, growThreads);
        }
        await ns.sleep(1000);

        // Hack targets if no weaken/grow targets
        executingServer = await refreshExecutingServer();
        const hackTargets = options["prep-only"] ? [] : await refreshServers(shouldHack);
        hackTargets.sort(sortByValue);
        for (const target of hackTargets) {
            const executingThreads = getExecutingThreads(executingServer, target, scripts.hack);

            const scriptContext = getDynamicScriptContent("ns.hackAnalyzeThreads", `Math.ceil(ns.hackAnalyzeThreads('${target.hostname}', ${target.moneyMax!}))`, DatabaseStoreName.NS_Data);
            await (new DynamicScript('ns.hackAnalyzeThreads', scriptContext, [])).run(ns, true);
            const hkThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeThreads');
            let hackThreads = hkThreads - executingThreads;
            if (hackThreads == Infinity) hackThreads = 0;
            hackThreads -= tryExecuteScript(ns, executingServer, scripts.hack, target.hostname, hackThreads);
        }
        await ns.sleep(1000);

        // Wait until threads available
        // executingServer = await refreshExecutingServer();
        // while ((executingServer.maxRam - executingServer.ramUsed - reserveRam) / 2 < 1) {
        //     executingServer = await refreshExecutingServer();
        //     await ns.sleep(100);
        // }
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