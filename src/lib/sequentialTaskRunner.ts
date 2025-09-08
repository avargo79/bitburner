import { NS } from "@ns";

export interface TaskDefinition {
  name: string;
  scriptPath: string;
  args?: (string | number)[];
  enabled?: boolean;
  timeout?: number;
}

export class SequentialTaskRunner {
  private ns: NS;
  private tasks: TaskDefinition[] = [];
  private debug: boolean = false;
  
  constructor(ns: NS, tasks: TaskDefinition[], debug: boolean = false) {
    this.ns = ns;
    this.tasks = tasks;
    this.debug = debug;
  }

  async runSequentially() {
    for (const task of this.tasks) {
      if (task.enabled === false) continue;
      if (this.debug) this.ns.tprint(`[daemon] Starting task: ${task.name}`);
      const pid = this.ns.run(task.scriptPath, 1, ...(task.args || []));
      if (pid === 0) {
        this.ns.tprint(`[daemon] Failed to start ${task.name} (not enough RAM?)`);
        continue;
      }
      const completed = await this.waitForTaskCompletion(pid, task.timeout || 60000);
      if (completed) {
        if (this.debug) this.ns.tprint(`[daemon] Task ${task.name} completed.`);
      } else {
        this.ns.tprint(`[daemon] Task ${task.name} timed out and was killed.`);
      }
    }
    if (this.debug) this.ns.tprint("[daemon] All tasks complete.");
  }

  private async waitForTaskCompletion(pid: number, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    while (this.ns.isRunning(pid)) {
      if (Date.now() - startTime > timeout) {
        this.ns.kill(pid);
        return false;
      }
      await this.ns.sleep(100);
    }
    return true;
  }
}
