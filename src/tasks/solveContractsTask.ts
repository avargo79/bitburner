import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/tasks";

export default (taskName: string = 'SolveContracts') => new ScriptTask(
    { name: taskName, priority: 80, lastRun: 0, interval: 5000, enabled: true },
    new DynamicScript(taskName, `
        // update contracts
        new DynamicScript('updateContracts', \`
            const servers = await database.getAll("servers");
            servers.filter(s => s.files.some(f => f.endsWith(".cct")))
                .forEach(async server => {
                    server.files.filter(f => f.endsWith(".cct"))
                        .forEach(async file => {
                            const contractId = server.hostname + "-" + file;
                            if (ns.ls(server.hostname, ".cct").includes(file)) {
                                const contract = {
                                    id: contractId,
                                    solved: false,
                                    file: file,
                                    hostname: server.hostname,
                                    type: ns.codingcontract.getContractType(file, server.hostname)
                                };
                                await database.saveRecord("contracts", contract);
                            }
                        });
                });
        \`).run(ns, true);

        // update contracts data
        new DynamicScript('updateContractData', \`
            const contracts = await database.getAll<IScriptContract>("contracts");
            contracts.filter(contract => ns.ls(contract.hostname, ".cct").includes(contract.file))
                .map(contract => ({ 
                    ...contract, 
                    data:  JSON.stringify(ns.codingcontract.getData(contract.file, contract.hostname)) 
                })) 
                .forEach(contract => database.saveRecord("contracts", contract));
        \`).run(ns, true);

        // update contracts data
        new DynamicScript('solveContracts', \`
            const contracts = (await database.getAll<IScriptContract>('contracts'))
                .filter(contract => contract.type in solvers &&contract.data !== undefined && ns.ls(contract.hostname, '.cct').includes(contract.file));

            for (const contract of contracts) {
                const data = JSON.parse(contract.data);
                const solveFn = solvers[contract.type];
                if (solveFn !== undefined) {
                    const answer = solvers[contract.type](data);
                    const reward = ns.codingcontract.attempt(answer, contract.file, contract.hostname);
                    if (reward) {
                        ns.toast('Contract rewarded: ' + reward);
                        const solvedContract = await database.get<IScriptContract>('contracts', contract.id);
                        solvedContract.solved = true;
                        await database.saveRecord('contracts', solvedContract);
                    }
                }
            }
        \`, ['import solvers from "/lib/contracts";'])
        .run(ns, true);

        // delete contract records that are no longer valid
        (await database.getAll("contracts"))
            .filter(contract => ns.ls(contract.hostname, ".cct")
            .includes(contract.file) === false)
            .forEach(contract => database.deleteRecord("contracts", contract.id));
    `, ['import { DynamicScript } from "./lib/system";'])
)
