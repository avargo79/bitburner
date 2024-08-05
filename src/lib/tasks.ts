import { NS } from "@ns";
import { DynamicScript, getDynamicScriptContent } from "/lib/system";
import { Database } from "/lib/database";

export interface IScriptTask {
    name: string;
    priority: number;
    lastRun: number;
    interval: number;
    enabled: boolean;
}

export class ScriptTask implements IScriptTask {
    constructor(public scriptTask: Partial<IScriptTask>, public script: DynamicScript) { }

    public get name() { return this.scriptTask.name ?? ''; }
    public get priority() { return this.scriptTask.priority ?? 0; }
    public get lastRun() { return this.scriptTask.lastRun ?? 0; }
    public get interval() { return this.scriptTask.interval ?? 1000; }
    public get enabled() { return this.scriptTask.enabled ?? false; }

    public async run(ns: NS, waitForCompleted: boolean = true) {
        return await this.script.run(ns, waitForCompleted);
    };
}

export enum TaskNames {
    RootServers = 'RootServers',
    UpdatePlayer = 'UpdatePlayer',
    UpdateServers = 'UpdateServers',
    UpdateResetInfo = 'UpdateResetInfo',
    UpdateContracts = 'UpdateContracts',
    UpdateContractsData = 'UpdateContractsData',
    UpdateContractsAttempts = 'UpdateContractsAttempts',
    SolveContracts = 'SolveContracts',
    CleanContracts = 'CleanContracts',
    PurchasedServers = 'PurchasedServers',
};

export async function initializeTaskDatabase(database: Database) {
    const dbTasks = await database.getAll<IScriptTask>('tasks');
    const tasks = Object.values(TaskNames);

    if (dbTasks.length === tasks.length) return;

    const missingTasks = Object.values(TaskNames).filter(taskName => !dbTasks.some(t => t.name === taskName))
    for (const taskName of missingTasks) {
        const task = Tasks[taskName];
        const taskRecord: IScriptTask = {
            name: taskName,
            priority: task.priority,
            lastRun: task.lastRun,
            interval: task.interval,
            enabled: task.enabled
        };
        database.saveRecord('tasks', taskRecord);
    }
}

const Tasks: Record<string, ScriptTask> = {};

Tasks[TaskNames.UpdatePlayer] = new ScriptTask(
    { name: TaskNames.UpdatePlayer, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(TaskNames.UpdatePlayer, getDynamicScriptContent('ns.getPlayer', '{...ns.getPlayer(), hasTorRouter: ns.hasTorRouter()}', 'ns_data'))
)

Tasks[TaskNames.UpdateServers] = new ScriptTask(
    { name: TaskNames.UpdateServers, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(TaskNames.UpdateServers,
        'getServerList(ns).map(server => ({ ...ns.getServer(server), files: ns.ls(server), pids: ns.ps(server), hack: { wkTime: ns.getWeakenTime(server.hostname), grTime: ns.getGrowTime(server.hostname), hkTime: ns.getHackTime(server.hostname) }})).forEach(server => database.saveRecord("servers", server))',
        ['import { getServerList } from "/lib/network";']
    )
)

Tasks[TaskNames.UpdateResetInfo] = new ScriptTask(
    { name: TaskNames.UpdateResetInfo, priority: 100, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(TaskNames.UpdateResetInfo, getDynamicScriptContent('ns.getResetInfo', 'ns.getResetInfo()', 'ns_data'))
)

Tasks[TaskNames.UpdateContracts] = new ScriptTask(
    { name: TaskNames.UpdateContracts, priority: 80, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(TaskNames.UpdateContracts,
        '(await database.getAll("servers")).filter(s => s.files.some(f => f.endsWith(".cct"))).forEach(async server => { const contracts = server.files.filter(f => f.endsWith(".cct")).forEach(async file => { const contractId = server.hostname + "-" + file; if(ns.ls(server.hostname, ".cct").includes(file)) { const contract = { id: contractId, solved: false, file: file, hostname: server.hostname, type: ns.codingcontract.getContractType(file, server.hostname) }; await database.saveRecord("contracts", contract); } }); });'
    )
)

Tasks[TaskNames.UpdateContractsData] = new ScriptTask(
    { name: TaskNames.UpdateContractsData, priority: 75, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(TaskNames.UpdateContractsData,
        '(await database.getAll("contracts")).filter(contract => ns.ls(contract.hostname, ".cct").includes(contract.file)).map(contract => ({ ...contract, data:  JSON.stringify(ns.codingcontract.getData(contract.file, contract.hostname)) })) .forEach(contract => database.saveRecord("contracts", contract));'
    )
)

Tasks[TaskNames.UpdateContractsAttempts] = new ScriptTask(
    { name: TaskNames.UpdateContractsAttempts, priority: 70, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(TaskNames.UpdateContractsAttempts,
        '(await database.getAll("contracts")).filter(contract => ns.ls(contract.hostname, ".cct").includes(contract.file)).map(contract => ({ ...contract, numTriesRemaining:  ns.codingcontract.getNumTriesRemaining(contract.file, contract.hostname) })).forEach(contract => database.saveRecord("contracts", contract));'
    )
)

Tasks[TaskNames.RootServers] = new ScriptTask(
    { name: TaskNames.RootServers, priority: 20, lastRun: 0, interval: 2000, enabled: true },
    new DynamicScript(TaskNames.RootServers, '(await database.getAll("servers")).filter(s => !s.hasAdminRights).map(s => s.hostname).forEach(s => { try{ ns.brutessh(s); ns.ftpcrack(s); ns.relaysmtp(s); ns.httpworm(s); ns.sqlinject(s); } catch(e){} try{ ns.nuke(s); } catch(e){} });')
)

Tasks[TaskNames.CleanContracts] = new ScriptTask(
    { name: TaskNames.CleanContracts, priority: 10, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(TaskNames.CleanContracts,
        '(await database.getAll("contracts")).filter(contract => ns.ls(contract.hostname, ".cct").includes(contract.file) === false).forEach(contract => database.deleteRecord("contracts", contract.id));'
    )
)

Tasks[TaskNames.SolveContracts] = new ScriptTask(
    { name: TaskNames.SolveContracts, priority: 10, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(TaskNames.SolveContracts,
        'ns.run("solvecontracts.js");'
    )
)

Tasks[TaskNames.PurchasedServers] = new ScriptTask(
    { name: TaskNames.PurchasedServers, priority: 10, lastRun: 0, interval: 10000, enabled: false },
    new DynamicScript(TaskNames.PurchasedServers,
        'ns.run("purchasedservers.js");'
    )
)

export default Tasks;