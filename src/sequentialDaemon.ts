import { NS } from "@ns";
import { SequentialTaskRunner, TaskDefinition } from "/lib/sequentialTaskRunner";

/**
 * Sequential Daemon: Runs each task in order, waits for completion, then starts the next.
 * Add or remove tasks as needed.
 * 
 * NOTE: Stock trading has been moved to a standalone stocks.js script for better performance.
 */

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tprint("[sequentialDaemon] Starting sequential task runner...");

  // TODO: Add other non-stock tasks here as they are implemented
  const tasks: TaskDefinition[] = [
    // Stock trading tasks have been moved to standalone stocks.js script
    // Add server management, contract solving, and other discrete tasks here
  ];

  const runner = new SequentialTaskRunner(ns, tasks);
  await runner.runSequentially();
  ns.tprint("[sequentialDaemon] All tasks complete.");
}
