import { NS } from "@ns";
import { Database } from "/lib/database";
import Tasks, { initializeTaskDatabase, IScriptTask } from "/lib/tasks";

const sleepInterval = 100;

export async function main(ns: NS): Promise<void> {
    ns.disableLog('sleep');
    ns.disableLog('getServerMaxRam');
    ns.disableLog('getServerUsedRam');
    if (ns.ps().find(p => p.filename === 'datamanager.js' && p.pid !== ns.getRunningScript()?.pid)) return;

    const database = new Database();
    await database.open();
    await initializeTaskDatabase(database);
    
    while (true) {
        const tasks = await database.getAll<IScriptTask>('tasks');
        tasks.sort((a, b) => b.priority - a.priority);
        for (const task of tasks.filter(task => task.enabled && task.lastRun + task.interval < Date.now())) {
            await Tasks[task.name].run(ns, false);
            await database.saveRecord('tasks', {...task, lastRun: Date.now()});
        }

        await ns.sleep(sleepInterval);
    }
}

function runTask() { }
