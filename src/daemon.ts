import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptTask, ScriptTask } from "/lib/models";

import UpdatePlayerTask from "./tasks/updatePlayerTask";
import UpdateServersTask from "./tasks/updateServersTask";
import UpdateResetInfoTask from "./tasks/updateResetInfoTask";
import SolveContractsTask from "./tasks/solveContractsTask";
import RootServersTask from "./tasks/rootServersTask";
import purchasedServersTask from "./tasks/purchasedServersTask";

const sleepInterval = 100;

export enum TaskNames {
    UpdatePlayer = 'UpdatePlayer',
    UpdateServers = 'UpdateServers',
    UpdateResetInfo = 'UpdateResetInfo',
    SolveContracts = 'SolveContracts',
    RootServers = 'RootServers',
    PurchasedServers = 'PurchasedServers',
};

const Tasks: Record<string, ScriptTask> = {
    [TaskNames.UpdatePlayer]: UpdatePlayerTask(TaskNames.UpdatePlayer),
    [TaskNames.UpdateServers]: UpdateServersTask(TaskNames.UpdateServers),
    [TaskNames.UpdateResetInfo]: UpdateResetInfoTask(TaskNames.UpdateResetInfo),
    [TaskNames.SolveContracts]: SolveContractsTask(TaskNames.SolveContracts),
    [TaskNames.RootServers]: RootServersTask(TaskNames.RootServers),
    // [TaskNames.PurchasedServers]: purchasedServersTask(TaskNames.PurchasedServers),
};

export async function main(ns: NS): Promise<void> {
    ns.clearLog();
    ns.disableLog('sleep');
    ns.disableLog('getServerMaxRam');
    ns.disableLog('getServerUsedRam');
    if (ns.ps().find(p => p.filename === ns.getScriptName() && p.pid !== ns.getRunningScript()?.pid)) return;

    const database = await Database.getInstance();
    await database.open();
    await initializeTaskDatabase(ns, database);

    while (true) {
        const tasks = await database.getAll<IScriptTask>(DatabaseStoreName.Tasks);
        tasks.sort((a, b) => b.priority - a.priority);
        for (const task of tasks.filter(task => task.enabled && task.lastRun + task.interval < Date.now())) {
            await Tasks[task.name].run(ns, false);
            await database.saveRecord(DatabaseStoreName.Tasks, { ...task, lastRun: Date.now() });
        }

        await ns.sleep(sleepInterval);
    }
}


async function initializeTaskDatabase(ns: NS, database: Database) {
    for (const taskName in Tasks) {
        if (await database.get<IScriptTask>(DatabaseStoreName.Tasks, taskName)) continue;
        ns.print('\tCreating task database record: ' + taskName);
        const taskRecord: IScriptTask = {
            name: taskName,
            priority: Tasks[taskName].priority,
            lastRun: Tasks[taskName].lastRun,
            interval: Tasks[taskName].interval,
            enabled: Tasks[taskName].enabled
        };
        database.saveRecord(DatabaseStoreName.Tasks, taskRecord);
    }
}
