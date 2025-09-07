import { AutocompleteData, NS, ScriptArg, ProcessInfo, RunningScript } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptServer } from "/models/ScriptServer";
import { IHackScriptArgs } from "./models/IRemoteScriptArgs";
import PrettyTable from "./lib/prettytable";

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['verbose', false],
    ['target', ''],
    ['last', '60s'],
    ['live', false],
]

let options: {
    [key: string]: string[] | ScriptArg;
};

const database = await Database.getInstance();
await database.open();

// Helper function to output - always use tprint for full visibility
function output(ns: NS, message: string): void {
    ns.tprint(message);
}

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);
    return [];
}

interface ProcessDetails {
    process: ProcessInfo;
    details: RunningScript | null;
    args: IHackScriptArgs | null;
    server: IScriptServer | null;
}

interface BatchGroup {
    target: string;
    batchType: string;
    deadline: number;
    processes: ProcessDetails[];
    expectedOperations: string[];
    actualOperations: string[];
    status: 'complete' | 'partial' | 'failed' | 'running';
}

export async function main(ns: NS): Promise<void> {
    options = ns.flags(argsSchema);

    if (options.live) {
        await liveMonitoring(ns);
    } else {
        await staticAnalysis(ns);
    }
}

async function staticAnalysis(ns: NS): Promise<void> {
    const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
    const processDetails = await gatherProcessDetails(ns, servers);
    const batchGroups = reconstructBatches(processDetails);

    // Filter by target if specified
    const filteredBatches = options.target ?
        batchGroups.filter(b => b.target === options.target) :
        batchGroups;

    // Display results
    await displayBatchSummary(ns, filteredBatches);

    if (options.verbose) {
        await displayDetailedAnalysis(ns, filteredBatches, processDetails);
    }

    await displayProcessSummary(ns, processDetails);
}

async function liveMonitoring(ns: NS): Promise<void> {
    output(ns, "Starting live monitoring... Press Ctrl+C to stop");

    while (true) {
        await staticAnalysis(ns);
        await ns.sleep(1000);
    }
}

async function gatherProcessDetails(ns: NS, servers: IScriptServer[]): Promise<ProcessDetails[]> {
    const processDetails: ProcessDetails[] = [];

    for (const server of servers) {
        const processes = ns.ps(server.hostname).filter(p => p.filename === 'remote/hwg.js');

        for (const process of processes) {
            const details = ns.getRunningScript(process.pid);
            let args: IHackScriptArgs | null = null;

            try {
                if (process.args.length > 0) {
                    args = JSON.parse(process.args[0] as string) as IHackScriptArgs;
                }
            } catch (e) {
                // Invalid args, will be marked as null
            }

            processDetails.push({
                process,
                details,
                args,
                server
            });
        }
    }

    return processDetails;
}

function reconstructBatches(processDetails: ProcessDetails[]): BatchGroup[] {
    const batchMap = new Map<string, ProcessDetails[]>();

    // Group processes by target and approximate timing
    for (const pd of processDetails) {
        if (!pd.args) continue;

        const target = pd.args.hostname;
        const batchType = pd.args.batchType || 'unknown';
        const delayUntil = pd.args.delayUntil || 0;

        // Group by target and round timing to nearest 10 seconds for batch grouping
        const timeBucket = Math.floor(delayUntil / 10000) * 10000;
        const key = `${target}-${timeBucket}`;

        if (!batchMap.has(key)) {
            batchMap.set(key, []);
        }
        batchMap.get(key)!.push(pd);
    }

    // Convert to batch groups
    const batchGroups: BatchGroup[] = [];

    for (const [key, processes] of batchMap.entries()) {
        const [target] = key.split('-');
        const operations = processes.map(p => p.args?.batchType || 'unknown' as any);
        const uniqueOperations = [...new Set(operations)];

        // Determine expected operations based on what we see
        const hasHack = operations.indexOf('hk') !== -1;
        const expectedOps: string[] = hasHack ? ['hk', 'wk1', 'gr', 'wk2'] : ['wk1', 'gr', 'wk2'];

        // Calculate batch status
        let status: BatchGroup['status'] = 'running';
        if (uniqueOperations.length === expectedOps.length &&
            expectedOps.every((op: string) => uniqueOperations.indexOf(op) !== -1)) {
            status = 'complete';
        } else if (uniqueOperations.length > 0) {
            status = 'partial';
        } else {
            status = 'failed';
        }

        // Get earliest deadline for the batch
        const deadlines = processes
            .map(p => p.args?.delayUntil || 0)
            .filter(d => d > 0);
        const deadline = deadlines.length > 0 ? Math.min(...deadlines) : 0;

        batchGroups.push({
            target,
            batchType: hasHack ? 'hack' : 'prep',
            deadline,
            processes,
            expectedOperations: expectedOps,
            actualOperations: uniqueOperations,
            status
        });
    }

    return batchGroups.sort((a, b) => a.deadline - b.deadline);
}

async function displayBatchSummary(ns: NS, batches: BatchGroup[]): Promise<void> {
    if (batches.length === 0) {
        output(ns, "No hwg.js batches found");
        return;
    }

    const rows = batches.map(batch => [
        batch.target,
        batch.batchType.toUpperCase(),
        batch.status.toUpperCase(),
        `${batch.actualOperations.length}/${batch.expectedOperations.length}`,
        batch.processes.length.toString(),
        batch.deadline > Date.now() ? ns.tFormat(batch.deadline - Date.now()) : 'Past'
    ]);

    const pt = new PrettyTable();
    const headers = ["TARGET", "TYPE", "STATUS", "OPS", "PROCS", "TIME"];
    pt.create(headers, rows);
    output(ns, "=== BATCH SUMMARY ===");
    output(ns, pt.print());
    output(ns, "");
}

async function displayDetailedAnalysis(ns: NS, batches: BatchGroup[], allProcesses: ProcessDetails[]): Promise<void> {
    output(ns, "=== DETAILED BATCH ANALYSIS ===");

    for (const batch of batches) {
        output(ns, `Batch: ${batch.target} (${batch.batchType})`);
        output(ns, `  Status: ${batch.status} | Expected: [${batch.expectedOperations.join(', ')}] | Actual: [${batch.actualOperations.join(', ')}]`);
        output(ns, `  Deadline: ${new Date(batch.deadline).toLocaleString()}`);

        const processRows = batch.processes.map(pd => [
            pd.process.pid.toString(),
            pd.args?.batchType || 'unknown',
            pd.args?.type || 'unknown',
            pd.process.threads.toString(),
            pd.details?.server || 'unknown',
            pd.args?.delayUntil ? new Date(pd.args.delayUntil).toLocaleTimeString() : 'no delay'
        ]);

        if (processRows.length > 0) {
            const pt = new PrettyTable();
            const headers = ["PID", "BATCH_TYPE", "OP_TYPE", "THREADS", "SERVER", "START_TIME"];
            pt.create(headers, processRows);
            output(ns, pt.print());
        }

        // Show missing operations
        const missing = batch.expectedOperations.filter(op => batch.actualOperations.indexOf(op) === -1);
        if (missing.length > 0) {
            output(ns, `  Missing operations: ${missing.join(', ')}`);
        }

        // Show timing analysis
        const delays = batch.processes
            .map(p => p.args?.delayUntil || 0)
            .filter(d => d > 0)
            .sort((a, b) => a - b);

        if (delays.length > 1) {
            const span = delays[delays.length - 1] - delays[0];
            output(ns, `  Timing span: ${ns.tFormat(span)}`);
        }

        output(ns, "");
    }
}

async function displayProcessSummary(ns: NS, processDetails: ProcessDetails[]): Promise<void> {
    const totalProcesses = processDetails.length;
    const validArgs = processDetails.filter(p => p.args !== null).length;
    const runningNow = processDetails.filter(p => p.details !== null).length;

    const serverCounts = processDetails.reduce((acc, pd) => {
        const server = pd.details?.server || 'unknown';
        acc[server] = (acc[server] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    output(ns, "=== PROCESS SUMMARY ===");
    output(ns, `Total hwg.js processes: ${totalProcesses}`);
    output(ns, `Valid arguments: ${validArgs}/${totalProcesses}`);
    output(ns, `Currently running: ${runningNow}/${totalProcesses}`);

    if (Object.keys(serverCounts).length > 0) {
        output(ns, "Process distribution:");
        for (const [server, count] of Object.entries(serverCounts)) {
            output(ns, `  ${server}: ${count}`);
        }
    }

    // Show failed/problematic processes
    const problematicProcesses = processDetails.filter(p =>
        p.args === null || p.details === null
    );

    if (problematicProcesses.length > 0) {
        output(ns, `Problematic processes: ${problematicProcesses.length}`);
        for (const pp of problematicProcesses.slice(0, 5)) { // Show first 5
            const issue = pp.args === null ? "invalid args" : "not running";
            output(ns, `  PID ${pp.process.pid} on ${pp.details?.server || 'unknown'}: ${issue}`);
        }
        if (problematicProcesses.length > 5) {
            output(ns, `  ... and ${problematicProcesses.length - 5} more`);
        }
    }
}