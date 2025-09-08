import { NS } from "@ns";
import { SequentialTaskRunner, TaskDefinition } from "/lib/sequentialTaskRunner";
import { Database, DatabaseStoreName } from "/lib/database";

/**
 * Daemon: Runs each task in order, waits for completion, then starts the next.
 * This is now the canonical entry point for sequential task automation.
 * 
 * NOTE: Stock trading has been moved to a standalone stocks.js script for better performance.
 */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  
  // Check if another daemon instance is already running
  const runningScripts = ns.ps();
  for (const script of runningScripts) {
    if (script.filename === 'daemon.js' && script.pid !== ns.getRunningScript()?.pid) {
      ns.tprint(`[daemon] Another daemon instance is already running (PID: ${script.pid}). Exiting.`);
      return; // Exit gracefully, let the existing instance continue
    }
  }
  
  // Check for daemon debug flag
  const db = await Database.getInstance();
  await db.open();
  const daemonTask = await db.get(DatabaseStoreName.Tasks, 'daemon') as { debug?: boolean } | undefined;
  const debug = daemonTask?.debug ?? false; // Default to false (quiet mode)
  
  if (debug) ns.tprint("[daemon] Starting sequential task runner...");

  // TODO: Add other non-stock tasks here as they are implemented
  const tasks: TaskDefinition[] = [
    // Stock trading tasks have been moved to standalone stocks.js script
    // Add server management, contract solving, and other discrete tasks here
  ];

  const runner = new SequentialTaskRunner(ns, tasks, debug);

  while (true) {
    await runner.runSequentially();
    if (debug) ns.tprint("[daemon] All tasks complete. Sleeping before next cycle...");
    await ns.sleep(5000); // Sleep 5 seconds between cycles (adjust as needed)
  }
}

