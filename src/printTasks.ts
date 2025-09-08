import { NS } from "@ns";
import { Database, DatabaseStoreName } from "lib/database";

export async function main(ns: NS) {
    const db = await Database.getInstance();
    await db.open();
    const tasks = await db.getAll(DatabaseStoreName.Tasks);
    ns.tprint("=== Registered Tasks ===");
    for (const task of tasks) {
        ns.tprint(JSON.stringify(task, null, 2));
    }
}
