import { NS } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptServer } from "/models/ScriptServer";

export class DynamicScript {
    public get filePath() {
        return `/temp/${this.scriptName}.js`;
    }

    public get commandToWrite() {
        return this.command;
    }

    constructor(public scriptName: string, public command: string, public includes: string[] = []) { }

    public static new(scriptName: string, command: string, includes: string[] = []): DynamicScript {
        return new DynamicScript(scriptName, command, includes);
    }

    async write(ns: NS) {
        const cmdToFile = `
                import { Database, DatabaseStoreName } from "/lib/database";
                ${this.includes.join('\n')}

                const database = await Database.getInstance();
                await database.open();
                
                /** @param {NS} ns */
                export async function main(ns) {
                    ${this.commandToWrite}
                }
            `;
        ns.write(this.filePath, cmdToFile, 'w');
    }

    async run(ns: NS, waitForComplete: boolean = true): Promise<boolean> {
        await this.write(ns);

        return new Promise(async (resolve, reject) => {
            const database = await Database.getInstance();
            await database.open();

            const pid = ns.run(this.filePath, 1);
            await ns.sleep(50);
            let running = waitForComplete;
            while (running) {
                const servers = await database.getAll<IScriptServer>(DatabaseStoreName.Servers);
                running = servers.flatMap(a => a.pids.map(p => p.pid)).includes(pid);
                await ns.sleep(10);
            }
            resolve(true);
        });
    }

    // canRunScript = (ns: NS, hostName: string): boolean => {
    //     return ns.getScriptRam(this.filePath) <= ns.getServerMaxRam(hostName) - ns.getServerUsedRam(hostName)
    // };
}

export function getDynamicScriptContent(commandName: string, scriptContent: string, storeName = DatabaseStoreName.NS_Data) {
    return `const result = ${scriptContent};await database.saveRecord('${storeName}', { command: '${commandName}', result });`
}

export function disableLogs(ns: NS, logs: string[]) {
    logs.forEach(log => ns.disableLog(log));
}