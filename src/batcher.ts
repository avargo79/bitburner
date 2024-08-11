import { AutocompleteData, NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { disableLogs, DynamicScript, getDynamicScriptContent } from "/lib/system";
import { IScriptPlayer } from "/models/IScriptPlayer";
import { IScriptServer } from "/models/ScriptServer";
import { IHackScriptArgs } from "./models/IRemoteScriptArgs";
import PrettyTable from "./lib/prettytable";

const reserveRam = 32;

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['target', ''],
    ['debug', false],
    ['prep', false],
    ['repeat', false],
]

const database = await Database.getInstance();
await database.open();

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);
    const lastFlag = args.length > 0 ? args[args.length - 1] : null;
    if (lastFlag == "--target")
        return data.servers;

    return [];
}

export async function main(ns: NS): Promise<void> {
    disableLogs(ns, ['sleep', 'run', 'scp', 'exec']);
    const options = ns.flags(argsSchema);
    ns.setTitle('Batcher' + (options.debug ? ' - Debug' : ''));

    do {
        ns.clearLog()

        const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
        const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);

        const targets = servers.filter(s => isTarget(s, player)).sort(byValue);
        const bestTarget = options.target
            ? targets.find(s => s.hostname === options.target)!
            : targets.reduce((acc, cur) => targetValue(cur) > targetValue(acc) ? cur : acc);

        const attackers = servers.filter(isAttacker).sort(byAvailableRam);
        attackers.forEach(s => ns.scp('remote/hwg.js', s.hostname));

        const batch = !options.prep && (!shouldWeaken(bestTarget, player) && !shouldGrow(bestTarget, player))
            ? await initializeHackBatch(ns, 'Best Target Batch', bestTarget)
            : await initializePrepBatch(ns, 'Best Target Prep Batch', bestTarget);
        timings['hk'] = batch.finishAt - 400;
        timings['wk1'] = batch.finishAt - 300;
        timings['gr'] = batch.finishAt - 200;
        timings['wk2'] = batch.finishAt - 100;

        const attackFinishTime = Date.now() + bestTarget.hackData.wkTime + 1000;

        for (const attacker of attackers) {
            const maxRam = attacker.maxRam - (attacker.hostname === 'home' ? reserveRam : 0);
            let availableThreads = Math.floor((maxRam - attacker.ramUsed) / 2);
            if (availableThreads < 1) continue;

            if (!options.prep && (shouldHack(bestTarget, player)))
                availableThreads -= buildHkScripts(batch, attacker, availableThreads, attackFinishTime);
            availableThreads -= buildWk1Scripts(batch, attacker, availableThreads, attackFinishTime);
            availableThreads -= buildGrScripts(batch, attacker, availableThreads, attackFinishTime);
            availableThreads -= buildWk2Scripts(batch, attacker, availableThreads, attackFinishTime);
        }

        if (options.debug) {
            batch.scripts.forEach(s => ns.print(`${s.hostname}: Type: ${s.type} Threads: ${s.threads} Target: ${s.scriptArgs.hostname}`));
            return;
        }

        for (const script of batch.scripts) {
            if (options.debug) break;
            ns.exec('remote/hwg.js', script.hostname, script.threads, JSON.stringify(script.scriptArgs));
        }

        const totalNetworkThreads = servers.reduce((acc, cur) => acc + ((cur.maxRam - (cur.hostname === 'home' ? reserveRam : 0)) / 2), 0);
        const totalThreads = batch.scripts.reduce((acc, cur) => acc + cur.threads, 0);
        const totalBatchThreads = batch.hackThreads + batch.weakenThreads1 + batch.growThreads + batch.weakenThreads2;
        do {
            await ns.sleep(500);
            ns.clearLog();
            ns.print(`Batch: '${batch.name}' Target: ${batch.target.hostname}`)
            ns.print(`\tHack: ${batch.hackThreads}, Weaken: ${batch.weakenThreads1}, Grow: ${batch.growThreads}, Weaken: ${batch.weakenThreads2}`);
            ns.print(`\tNetwork Threads: ${totalNetworkThreads} Batch Threads: ${totalThreads}/${totalBatchThreads}`);
            ns.print(`\tComplete: ${ns.tFormat(batch.finishAt - Date.now())}`)
        } while (await printStatus(ns, batch))
    } while (options.repeat)
}

async function printStatus(ns: NS, batch: IBatch) {
    const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);

    const rows = servers
        .flatMap(s => s.pids.filter((pid => pid.filename.startsWith("remote/"))).map(pid => ({ ...pid, args: { ...JSON.parse(pid.args[0]) }, hostname: s.hostname })))
        .sort((a, b) => (timings[a.args.batchType] - Date.now()) - (timings[b.args.batchType] - Date.now()))
        .map(pid => [
            pid.hostname,
            batch.target.hostname,
            pid.args.batchType,
            pid.threads,
            pid.args.delayUntil - Date.now() <= 0
                ? 'Running'
                : ns.tFormat(pid.args.delayUntil - Date.now()),
        ]);

    const pt = new PrettyTable();
    const headers = ["HOSTNAME", "TARGET", "TYPE", "THREADS", "DELAY"];
    pt.create(headers, rows);
    ns.print(pt.print());
    return rows.length
}


function buildHkScripts(batch: IBatch, attacker: IScriptServer, availableThreads: number, attackFinishTime: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'hk';
    const hackType = 'hack';
    const batchThreads = batch.hackThreads;
    const delayUntil = Math.ceil((attackFinishTime - batch.target.hackData.hkTime) - 400);

    const neededThreads = batchThreads - batch.scripts.reduce((acc, cur) => cur.type === batchType ? acc + cur.threads : acc, 0);
    const threads = Math.min(availableThreads, neededThreads);
    if (threads > 0) {
        batch.scripts.push({
            hostname: attacker.hostname,
            type: batchType,
            scriptArgs: { hostname: batch.target.hostname, type: hackType, batchType, delayUntil },
            threads: threads,
        });
    }
    return threads;
}
function buildWk1Scripts(batch: IBatch, attacker: IScriptServer, availableThreads: number, attackFinishTime: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'wk1';
    const hackType = 'weaken';
    const batchThreads = batch.weakenThreads1;
    const delayUntil = Math.ceil((attackFinishTime - batch.target.hackData.wkTime) - 300);

    const neededThreads = batchThreads - batch.scripts.reduce((acc, cur) => cur.type === batchType ? acc + cur.threads : acc, 0);
    const threads = Math.min(availableThreads, neededThreads);
    if (threads > 0) {
        batch.scripts.push({
            hostname: attacker.hostname,
            type: batchType,
            scriptArgs: { hostname: batch.target.hostname, type: hackType, batchType, delayUntil },
            threads: threads,
        });
    }
    return threads;
}
function buildGrScripts(batch: IBatch, attacker: IScriptServer, availableThreads: number, attackFinishTime: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'gr';
    const hackType = 'grow';
    const batchThreads = batch.growThreads;
    const delayUntil = Math.ceil((attackFinishTime - batch.target.hackData.grTime) - 200);

    const neededThreads = batchThreads - batch.scripts.reduce((acc, cur) => cur.type === batchType ? acc + cur.threads : acc, 0);
    const threads = Math.min(availableThreads, neededThreads);
    if (threads > 0) {
        batch.scripts.push({
            hostname: attacker.hostname,
            type: batchType,
            scriptArgs: { hostname: batch.target.hostname, type: hackType, batchType, delayUntil },
            threads: threads,
        });
    }
    return threads;
}
function buildWk2Scripts(batch: IBatch, attacker: IScriptServer, availableThreads: number, attackFinishTime: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'wk2';
    const hackType = 'weaken';
    const batchThreads = batch.weakenThreads2;
    const delayUntil = Math.ceil((attackFinishTime - batch.target.hackData.wkTime) - 100);

    const neededThreads = batchThreads - batch.scripts.reduce((acc, cur) => cur.type === batchType ? acc + cur.threads : acc, 0);
    const threads = Math.min(availableThreads, neededThreads);
    if (threads > 0) {
        batch.scripts.push({
            hostname: attacker.hostname,
            type: batchType,
            scriptArgs: { hostname: batch.target.hostname, type: hackType, batchType, delayUntil },
            threads: threads,
        });
    }
    return threads;
}

interface IBatch {
    name: string,
    target: IScriptServer,
    hackThreads: number,
    weakenThreads1: number,
    growThreads: number,
    weakenThreads2: number,
    scripts: IScriptBatch[],
    finishAt: number;
}

interface IScriptBatch {
    hostname: string,
    type: 'hk' | 'wk1' | 'gr' | 'wk2',
    scriptArgs: IHackScriptArgs,
    threads: number,
}

const isTarget = (server: IScriptServer, player: IScriptPlayer) =>
    server.hasAdminRights
    && !server.purchasedByPlayer
    && player.skills.hacking >= server.requiredHackingSkill!
    && (server.moneyMax ?? 0) > 0;
const isAttacker = (server: IScriptServer) =>
    server.hasAdminRights
    && server.maxRam - server.ramUsed > 0;

const shouldWeaken = (server: IScriptServer, player: IScriptPlayer) =>
    isTarget(server, player)
    && (server.hackDifficulty ?? 0) > (server.minDifficulty ?? 0);
const shouldGrow = (server: IScriptServer, player: IScriptPlayer) =>
    isTarget(server, player)
    && (server.moneyMax ?? 0) > (server.moneyAvailable ?? 0);
const shouldHack = (server: IScriptServer, player: IScriptPlayer) =>
    isTarget(server, player)
    && !shouldWeaken(server, player)
    && !shouldGrow(server, player);

const targetValue = (server: IScriptServer) => Math.floor(server.moneyMax! / server.hackData.wkTime);

const byValue = (a: IScriptServer, b: IScriptServer) => targetValue(b) - targetValue(a)
const byAvailableRam = (a: IScriptServer, b: IScriptServer) => b.maxRam - a.maxRam;


const timings: Record<string, number> = {};
async function initializeHackBatch(ns: NS, name: string, target: IScriptServer): Promise<IBatch> {
    const batch: IBatch = {
        name,
        target,
        hackThreads: 0,
        weakenThreads1: 0,
        growThreads: 0,
        weakenThreads2: 0,
        scripts: [],
        finishAt: Date.now() + target.hackData.wkTime + 1000
    }

    const hackAnalyzeThreadsScript = getDynamicScriptContent("ns.hackAnalyzeThreads", `Math.ceil(ns.hackAnalyzeThreads('${target.hostname}', ${target.moneyAvailable!}))`);
    await DynamicScript.new('HackAnalyzeThreads', hackAnalyzeThreadsScript, []).run(ns, true);
    batch.hackThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeThreads');
    if (batch.hackThreads == Infinity) batch.hackThreads = 0;

    const hackAnalyzeSecurityScript = getDynamicScriptContent("ns.hackAnalyzeSecurity", `ns.hackAnalyzeSecurity(${batch.hackThreads})`);
    await DynamicScript.new('HackAnalyzeSecurity', hackAnalyzeSecurityScript, []).run(ns, true);
    const hackSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeSecurity');

    const weakenAnalyzeScript = getDynamicScriptContent("ns.weakenAnalyze", `ns.weakenAnalyze(1)`);
    await DynamicScript.new('WeakenAnalyze', weakenAnalyzeScript, []).run(ns, true);
    const weakenEffect = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.weakenAnalyze');
    batch.weakenThreads1 = Math.ceil(hackSecIncrease / weakenEffect);

    const growthAnalyzeScript = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${target.moneyMax!}))`);
    await DynamicScript.new('GrowthAnalyze', growthAnalyzeScript, []).run(ns, true);
    batch.growThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');

    const growthAnalyzeSecurityScript = getDynamicScriptContent("ns.growthAnalyzeSecurity", `ns.growthAnalyzeSecurity(${batch.growThreads!}, '${target.hostname}')`);
    await DynamicScript.new('GrowthAnalyzeSecurity', growthAnalyzeSecurityScript, []).run(ns, true);
    const growSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyzeSecurity');

    batch.weakenThreads2 = Math.ceil(growSecIncrease / weakenEffect);

    return batch;
}
async function initializePrepBatch(ns: NS, name: string, target: IScriptServer): Promise<IBatch> {
    const batch: IBatch = {
        name,
        target,
        hackThreads: 0,
        weakenThreads1: 0,
        growThreads: 0,
        weakenThreads2: 0,
        scripts: [],
        finishAt: Date.now() + target.hackData.wkTime + 1000
    }

    await DynamicScript.new('WeakenAnalyze', getDynamicScriptContent("ns.weakenAnalyze", `ns.weakenAnalyze(1)`)).run(ns, true);
    const weakenEffect = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.weakenAnalyze');
    const secDecrease = target.hackDifficulty! - target.minDifficulty!;
    batch.weakenThreads1 = weakenEffect > 0 ? Math.ceil(secDecrease / weakenEffect) : 0;

    let money = target.moneyMax! / target.moneyAvailable!;
    if (money == Infinity) money = target.moneyMax!;
    await DynamicScript.new('GrowthAnalyze', getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${money}))`), []).run(ns, true);
    const growthAnalyzeThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');
    // If there is no money available, only run 1 thread to put money on the server
    batch.growThreads = !target.moneyAvailable ? 1 : growthAnalyzeThreads;

    await DynamicScript.new('GrowthAnalyzeSecurity', getDynamicScriptContent("ns.growthAnalyzeSecurity", `ns.growthAnalyzeSecurity(${batch.growThreads}, '${target.hostname}')`), []).run(ns, true);
    const growSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyzeSecurity');
    batch.weakenThreads2 = Math.ceil(growSecIncrease / weakenEffect);

    return batch;
}