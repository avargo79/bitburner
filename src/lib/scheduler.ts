import { NS } from "@ns";
import { Database, DatabaseStoreName } from "lib/database";
import { IScriptTask, ScriptTask } from "models/ScriptTask";

export interface SchedulerTask extends IScriptTask {
    run: (ns: NS) => Promise<void>;
}

interface TaskState extends IScriptTask {
    run: (ns: NS) => Promise<void>;
    nextRun: number;
    errorCount: number;
    lastError?: string;
}

export class TaskScheduler {
    private tasks: Map<string, TaskState> = new Map();
    private db: Database;
    private persistInterval: number = 30000; // 30s
    private lastPersist: number = 0;
    private running: boolean = false;
    private ns: NS;
    private debug: boolean;

    constructor(ns: NS, db: Database, debug: boolean = false) {
        this.ns = ns;
        this.db = db;
        this.debug = debug;
    }

    async registerTask(task: SchedulerTask) {
        this.tasks.set(task.name, {
            ...task,
            nextRun: Date.now() + task.interval,
            errorCount: 0,
            run: task.run,
        });
    }

    async loadTasksFromDB() {
        const dbTasks = await this.db.getAll<IScriptTask>(DatabaseStoreName.Tasks);
        for (const t of dbTasks) {
            if (this.tasks.has(t.name)) {
                const state = this.tasks.get(t.name)!;
                state.lastRun = t.lastRun;
                state.enabled = t.enabled;
                state.interval = t.interval;
                state.priority = t.priority;
                state.nextRun = t.lastRun + t.interval;
            } else {
                // Placeholder: you can extend to auto-register DB-only tasks
            }
        }
    }

    async persistTasksToDB() {
        for (const state of this.tasks.values()) {
            await this.db.saveRecord(DatabaseStoreName.Tasks, {
                name: state.name,
                priority: state.priority,
                lastRun: state.lastRun,
                interval: state.interval,
                enabled: state.enabled,
            });
        }
    }

    async run() {
        this.running = true;
        await this.loadTasksFromDB();
        while (this.running) {
            const now = Date.now();
            // Find all due tasks, sorted by priority
            const dueTasks = Array.from(this.tasks.values())
                .filter(t => t.enabled && t.nextRun <= now)
                .sort((a, b) => b.priority - a.priority);
            for (const task of dueTasks) {
                if (this.debug) this.ns.tprint(`[Scheduler] Running task: ${task.name} (interval: ${task.interval}ms, priority: ${task.priority})`);
                try {
                    await task.run(this.ns);
                    task.lastRun = Date.now();
                    task.nextRun = task.lastRun + task.interval;
                    task.errorCount = 0;
                    task.lastError = undefined;
                    if (this.debug) this.ns.tprint(`[Scheduler] Completed task: ${task.name} (next run: ${new Date(task.nextRun).toLocaleTimeString()})`);
                } catch (err: any) {
                    task.errorCount++;
                    task.lastError = err?.message || String(err);
                    // Exponential backoff for failed tasks
                    task.nextRun = Date.now() + Math.min(60000, task.interval * Math.pow(2, task.errorCount));
                    this.ns.tprint(`[Scheduler] ERROR in task ${task.name}: ${task.lastError}`);
                }
            }
            // Print a summary every persistence interval
            if (this.debug && now - this.lastPersist > this.persistInterval) {
                this.ns.tprint(`[Scheduler] Task summary: ` + Array.from(this.tasks.values()).map(t => `${t.name}: nextRun=${new Date(t.nextRun).toLocaleTimeString()}, enabled=${t.enabled}, lastError=${t.lastError || 'none'}`).join(' | '));
            }
            // Periodic DB persistence
            if (now - this.lastPersist > this.persistInterval) {
                await this.persistTasksToDB();
                this.lastPersist = now;
            }
            // Sleep until next due task or 100ms
            const nextDue = Array.from(this.tasks.values())
                .filter(t => t.enabled)
                .map(t => t.nextRun)
                .reduce((min, n) => Math.min(min, n), now + 1000);
            const sleepMs = Math.max(50, Math.min(nextDue - Date.now(), 500));
            await this.ns.sleep(sleepMs);
        }
    }

    stop() {
        this.running = false;
    }
}
