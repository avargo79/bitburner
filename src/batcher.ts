import { AutocompleteData, NS, ScriptArg } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { disableLogs, DynamicScript, getDynamicScriptContent } from "/lib/system";
import { IScriptPlayer } from "/models/IScriptPlayer";
import { byAvailableRam, byValue, getAvailableThreads, isAttacker, IScriptServer, isTarget, shouldGrow, shouldHack, shouldWeaken, targetValue } from "/models/ScriptServer";
import { IHackScriptArgs } from "./models/IRemoteScriptArgs";
import PrettyTable from "./lib/prettytable";

const reserveRam = 32;

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['debug', false],
    ['repeat', true],
    ['prep-only', true],
]
let options: {
    [key: string]: string[] | ScriptArg;
};

const database = await Database.getInstance();
await database.open();

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);

    return [];
}

export async function main(ns: NS): Promise<void> {
    disableLogs(ns, ['sleep', 'run', 'scp', 'exec']);
    options = ns.flags(argsSchema);
    ns.atExit(() => {
        ns.exec('killremote.js', 'home');
    });

    do {
        ns.clearLog()

        const player = await database.get<IScriptPlayer>(DatabaseStoreName.NS_Data, 'ns.getPlayer');
        const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);

        const targets = servers.filter(s => isTarget(s) && s.requiredHackingSkill! <= player.skills.hacking).sort(byValue);
        const attackers = servers.filter(isAttacker).sort(byAvailableRam);
        attackers.forEach(s => ns.scp('remote/hwg.js', s.hostname));

        // Get a current view of all the attacking servers and their thread count
        const attackerThreads: Record<string, number> = servers.filter(isAttacker)
            .reduce((acc, cur) => ({
                ...acc,
                [cur.hostname]: Math.floor(getAvailableThreads(cur) - (cur.hostname === 'home' ? reserveRam : 0) / 2)
            }), {});

        // build batchers for server that need to be hacked
        const serversToHack = targets.filter(t => shouldHack(t));
        const hackBatches = [];
        for (const target of serversToHack) {

            if (!target.hackData)
                ns.print(target.hostname, ' has no hackData');

            const hackBatch = await initializeHackBatch(ns, 'Hack Batch', target);
            hackBatches.push(hackBatch);
        }

        // build batches for server that need to be prepped
        const serversToPrep = targets.filter(t => shouldWeaken(t) || shouldGrow(t));
        const prepBatches = [];
        for (const target of serversToPrep) {
            prepBatches.push(await initializePrepBatch(ns, 'Prep Batch', target));
        }

        // run the batches
        const batches = [...buildHackBatches(hackBatches, attackers, attackerThreads), ...buildPrepBatches(prepBatches, attackers, attackerThreads)];
        // const batches = [batches_og.find(b => b.name === 'Prep Batch')!];
        if (options.debug) debugBatches(ns, batches);

        for (const batch of batches) {
            for (const script of batch.scripts) {
                // if (options.debug) ns.tprint(`Running ${script.type} on ${script.hostname} with ${script.threads} threads, delay until ${script.scriptArgs.delayUntil}`);
                const pid = ns.exec('remote/hwg.js', script.hostname, script.threads, JSON.stringify(script.scriptArgs));
                if (pid === 0) {
                    // ns.toast(`Failed to start ${script.type} on ${script.hostname}`, 'error');
                }
            }
        }

        do {
            await ns.sleep(100);
            ns.clearLog();
        } while (await printStatus(ns, batches))
    } while (options.repeat)
}


async function printStatus(ns: NS, batches: IBatch[]) {
    const rows = [];

    for (const batch of batches) {
        rows.push([
            batch.name,
            batch.target.hostname,
            batch.deadline - Date.now() > 0 ? ns.tFormat(batch.deadline - Date.now()) : 'Complete',
        ]);
    }
    const pt = new PrettyTable();
    const headers = ["NAME", "TARGET", "COMPLETE"];
    pt.create(headers, rows);
    ns.print(pt.print());

    const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
    const running = servers.some(s => s.pids.some(p => p.filename === 'remote/hwg.js'));
    return running;
}


async function initializeHackBatch(ns: NS, name: string, target: IScriptServer): Promise<IBatch> {
    const batch: IBatch = Batch.new();
    batch.name = name;
    batch.target = target;

    const hackAnalyzeThreadsScript = getDynamicScriptContent("ns.hackAnalyzeThreads", `Math.ceil(ns.hackAnalyzeThreads('${target.hostname}', ${target.moneyAvailable!}))`);
    await DynamicScript.new('HackAnalyzeThreads', hackAnalyzeThreadsScript, []).run(ns, true);
    batch.hackThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeThreads');
    if (batch.hackThreads == Infinity) batch.hackThreads = 0;

    const hackAnalyzeSecurityScript = getDynamicScriptContent("ns.hackAnalyzeSecurity", `ns.hackAnalyzeSecurity(${batch.hackThreads}, '${target.hostname}')`);
    await DynamicScript.new('HackAnalyzeSecurity', hackAnalyzeSecurityScript, []).run(ns, true);
    const hackSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.hackAnalyzeSecurity');

    const weakenAnalyzeScript = getDynamicScriptContent("ns.weakenAnalyze", `ns.weakenAnalyze(1)`);
    await DynamicScript.new('WeakenAnalyze', weakenAnalyzeScript, []).run(ns, true);
    const weakenEffect = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.weakenAnalyze');
    batch.weakenThreads1 = Math.ceil(hackSecIncrease / weakenEffect);

    const growthAnalyzeScript = getDynamicScriptContent("ns.growthAnalyze", `Math.ceil(ns.growthAnalyze('${target.hostname}', ${target.moneyMax!}))`);
    await DynamicScript.new('GrowthAnalyze', growthAnalyzeScript, []).run(ns, true);
    batch.growThreads = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyze');

    // const growthAnalyzeSecurityScript = getDynamicScriptContent("ns.growthAnalyzeSecurity", `ns.growthAnalyzeSecurity(${batch.growThreads!}, '${target.hostname}')`);
    // await DynamicScript.new('GrowthAnalyzeSecurity', growthAnalyzeSecurityScript, []).run(ns, true);
    // const growSecIncrease = await database.get<number>(DatabaseStoreName.NS_Data, 'ns.growthAnalyzeSecurity');

    // batch.weakenThreads2 = Math.ceil(growSecIncrease / weakenEffect);
    batch.weakenThreads2 = Math.ceil(batch.growThreads / 12.5) + 15

    return batch;
}
function buildHackBatches(hackBatches: IBatch[], attackers: IScriptServer[], attackerThreads: Record<string, number>) {
    if (options['preop-only'] || hackBatches.length === 0) return hackBatches;
    const bestTargetBatch = hackBatches.sort((a, b) => targetValue(b.target) - targetValue(a.target))[0];

    // determine how many time the best target batch can run from total attacker threads available
    let totalThreads = Object.values(attackerThreads).reduce((acc, cur) => acc + cur, 0);
    const totalBatchThreads = bestTargetBatch.hackThreads + bestTargetBatch.weakenThreads1 + bestTargetBatch.growThreads + bestTargetBatch.weakenThreads2;
    const totalRuns = Math.floor(totalThreads / totalBatchThreads);

    // build the hack batches
    const offSet = 1000;
    const batches: IBatch[] = [];
    for (let i = 0; i < totalRuns; i++) {
        const hackBatch: IBatch = { ...bestTargetBatch, name: `Hack Batch ${i + 1}` };
        hackBatch.deadline = Date.now() + hackBatch.target.hackData.wkTime + 1000 + (i * offSet);

        for (const attacker of attackers) {
            buildBatchScripts(attacker, hackBatch, attackerThreads);
        }
        batches.push(hackBatch);
    }
    return batches.filter(b => b.scripts.length > 0);
}


async function initializePrepBatch(ns: NS, name: string, target: IScriptServer): Promise<IBatch> {
    const batch: IBatch = Batch.new();
    batch.name = name;
    batch.target = target;

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
function buildPrepBatches(prepBatches: IBatch[], attackers: IScriptServer[], attackerThreads: Record<string, number>) {
    if (prepBatches.length === 0) return prepBatches;
    let remainingThreads = attackers.reduce((acc, cur) => acc + (getAvailableThreads(cur) - (cur.hostname === 'home' ? reserveRam : 0)), 0);

    const batches: IBatch[] = [];
    while (remainingThreads > 0) {
        const prepBatch = prepBatches.pop();
        if (prepBatch === undefined) break;
        prepBatch.deadline = Date.now() + prepBatch.target.hackData.wkTime + 1000;

        for (const attacker of attackers) {
            buildBatchScripts(attacker, prepBatch, attackerThreads);
        }
        batches.push(prepBatch);
    }
    return batches.filter(b => b.scripts.length > 0);
}


function buildBatchScripts(attacker: IScriptServer, batch: IBatch, attackerThreads: Record<string, number>) {
    if (attackerThreads[attacker.hostname] < 1) return;

    if (!options.prep && (shouldHack(batch.target)))
        attackerThreads[attacker.hostname] -= buildHkScripts(batch, attacker, attackerThreads[attacker.hostname]);
    attackerThreads[attacker.hostname] -= buildWk1Scripts(batch, attacker, attackerThreads[attacker.hostname]);
    attackerThreads[attacker.hostname] -= buildGrScripts(batch, attacker, attackerThreads[attacker.hostname]);
    attackerThreads[attacker.hostname] -= buildWk2Scripts(batch, attacker, attackerThreads[attacker.hostname]);
}
function buildHkScripts(batch: IBatch, attacker: IScriptServer, availableThreads: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'hk';
    const hackType = 'hack';
    const batchThreads = batch.hackThreads;
    const delayUntil = Math.ceil((batch.deadline - batch.target.hackData.hkTime) - 400);

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
function buildWk1Scripts(batch: IBatch, attacker: IScriptServer, availableThreads: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'wk1';
    const hackType = 'weaken';
    const batchThreads = batch.weakenThreads1;
    const delayUntil = Math.ceil((batch.deadline - batch.target.hackData.wkTime) - 300);

    const currentBatchThreads = batch.scripts.reduce((acc, cur) => cur.type === batchType ? acc + cur.threads : acc, 0);
    const neededThreads = batchThreads - currentBatchThreads;
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
function buildGrScripts(batch: IBatch, attacker: IScriptServer, availableThreads: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'gr';
    const hackType = 'grow';
    const batchThreads = batch.growThreads;
    const delayUntil = Math.ceil((batch.deadline - batch.target.hackData.grTime) - 200);

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
function buildWk2Scripts(batch: IBatch, attacker: IScriptServer, availableThreads: number) {
    if (availableThreads < 1) return availableThreads;
    const batchType = 'wk2';
    const hackType = 'weaken';
    const batchThreads = batch.weakenThreads2;
    const delayUntil = Math.ceil((batch.deadline - batch.target.hackData.wkTime) - 100);

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
    key: string,
    name: string,
    target: IScriptServer,
    hackThreads: number,
    weakenThreads1: number,
    growThreads: number,
    weakenThreads2: number,
    scripts: IBatchScript[],
    deadline: number;
}

interface IBatchScript {
    hostname: string,
    type: 'hk' | 'wk1' | 'gr' | 'wk2',
    scriptArgs: IHackScriptArgs,
    threads: number,
}
class Batch implements IBatch {
    key: string = '';
    name: string = '';
    target: IScriptServer = {} as IScriptServer;
    hackThreads: number = 0;
    weakenThreads1: number = 0;
    growThreads: number = 0;
    weakenThreads2: number = 0;
    scripts: IBatchScript[] = [];
    deadline: number = 0;

    static new(): IBatch {
        return new Batch();
    }

    toDTO(): IBatch {
        return {
            key: this.key,
            name: this.name,
            target: this.target,
            hackThreads: this.hackThreads,
            weakenThreads1: this.weakenThreads1,
            growThreads: this.growThreads,
            weakenThreads2: this.weakenThreads2,
            scripts: this.scripts,
            deadline: this.deadline,
        };
    }
}

function debugBatches(ns: NS, batches: IBatch[]) {
    ns.tprint("Date.now():", Date.now());
    ns.tprint("Batch count:", batches.length);
    for (const batch of batches) {
        ns.tprint("Batch name:", batch.name);
        ns.tprint("  Target hostname:", batch.target.hostname);
        ns.tprint("    hk:", batch.hackThreads);
        ns.tprint("    wk1:", batch.weakenThreads1);
        ns.tprint("    gr:", batch.growThreads);
        ns.tprint("    wk2:", batch.weakenThreads2);
        ns.tprint("  Scripts:");
        for (const script of batch.scripts) {
            ns.tprint("    Hostname:", script.hostname);
            ns.tprint("      Type:", script.type);
            ns.tprint("      Script Args:", script.scriptArgs);
            ns.tprint("      Threads:", script.threads);
        }
        ns.tprint("  Deadline:", new Date(batch.deadline).toLocaleString());
        ns.tprint("--------------------");
    }
}
