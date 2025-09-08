// resetTaskLastRun.ts
// Resets the lastRun field for all tasks in the database to 0
import { Database, DatabaseStoreName } from "lib/database";

/** @param {NS} ns */
export async function main(ns: any) {
    ns.tprint("[resetTaskLastRun] Starting task lastRun reset...");
    const db = await Database.getInstance();
    await db.open();
    const tasks = await db.getAll<any>(DatabaseStoreName.Tasks);
    let updated = 0;
    for (const task of tasks) {
        if (task.lastRun !== 0) {
            task.lastRun = 0;
            await db.saveRecord(DatabaseStoreName.Tasks, task);
            updated++;
        }
    }
    ns.tprint(`[resetTaskLastRun] Updated lastRun for ${updated} tasks.`);
    ns.tprint("[resetTaskLastRun] Done.");
}
