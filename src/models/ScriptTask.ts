import { NS } from "@ns";
import { DynamicScript } from "lib/system";

export interface IScriptTask {
    name: string;
    priority: number;
    lastRun: number;
    interval: number;
    enabled: boolean;
    debug?: boolean;
}

export class ScriptTask implements IScriptTask {
    constructor(public scriptTask: Partial<IScriptTask>, public script: DynamicScript) { }

    public get name() { return this.scriptTask.name ?? ''; }
    public get priority() { return this.scriptTask.priority ?? 0; }
    public get lastRun() { return this.scriptTask.lastRun ?? 0; }
    public get interval() { return this.scriptTask.interval ?? 1000; }
    public get enabled() { return this.scriptTask.enabled ?? false; }
    public get debug() { return this.scriptTask.debug ?? false; }

    public async run(ns: NS, waitForCompleted: boolean = true) {
        return await this.script.run(ns, waitForCompleted);
    };
}
