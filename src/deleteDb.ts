import { NS } from "@ns";
import { Database } from "lib/database";

export async function main(ns: NS) {
  ns.tprint("[deleteDb] Deleting ScriptDb...");
  try {
    const db = await Database.getInstance("ScriptDb", 2); // Use the new version you plan to use
    await db.deleteDatabase();
    ns.tprint("[deleteDb] Database deleted. Reload the game or restart scripts to recreate tables.");
  } catch (err) {
    ns.tprint("[deleteDb] ERROR: " + (typeof err === 'object' && err && 'message' in err ? (err as any).message : err));
    if (typeof err === 'object' && err && 'stack' in err) ns.tprint("[deleteDb] STACK: " + (err as any).stack);
  }
}
