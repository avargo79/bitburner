import { NS } from "@ns";
import { Database } from "/lib/database";
import { IScriptServer } from "/lib/models";
import Tasks, { IScriptTask, TaskNames } from "/lib/tasks";

export async function main(ns: NS): Promise<void> {
    const database = new Database();
    await database.open();

    for(const taskName of Object.values(TaskNames)){
        const task = Tasks[taskName];
        const taskRecord: IScriptTask = {
            name: taskName,
            priority: 0,
            lastRun: 0,
            interval: 0,
            enabled: true
        };
        await database.saveRecord('tasks', taskRecord);
    }

    const servers = await database.getAll<IScriptServer>('servers');
    const targets = servers.filter(s => s.hasAdminRights);
    for (const target of targets) {
        ns.tprint(`Attacking ${target.hostname}`);
    }
}