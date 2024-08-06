import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'SolveContracts') => new ScriptTask(
    { name: taskName, priority: 80, lastRun: 0, interval: 5000, enabled: false },
    new DynamicScript(taskName, `
        // update contracts
        await new DynamicScript('SolveContracts_Update', \`
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
        \`, ['import { DynamicScript } from "/lib/system";']).run(ns, true);

        // update contracts data
        await new DynamicScript('SolveContracts_UpdateData', \`
            const contracts = await database.getAll("contracts");
            contracts.filter(contract => ns.ls(contract.hostname, ".cct").includes(contract.file))
                .map(contract => ({ 
                    ...contract, 
                    data:  JSON.stringify(ns.codingcontract.getData(contract.file, contract.hostname)) 
                })) 
                .forEach(contract => database.saveRecord("contracts", contract));
        \`, ['import { DynamicScript } from "/lib/system";']).run(ns, true);

        // update contracts data
        await new DynamicScript('SolveContracts_Solve', \`
            const contracts = (await database.getAll('contracts'))
                .filter(contract => contract.type in solvers &&contract.data !== undefined && ns.ls(contract.hostname, '.cct').includes(contract.file));

            for (const contract of contracts) {
                const data = JSON.parse(contract.data);
                const solveFn = solvers[contract.type];
                if (solveFn !== undefined) {
                    const answer = solvers[contract.type](data);
                    const reward = ns.codingcontract.attempt(answer, contract.file, contract.hostname);
                    if (reward) {
                        ns.toast('Contract rewarded: ' + reward);
                        const solvedContract = await database.get('contracts', contract.id);
                        solvedContract.solved = true;
                        await database.saveRecord('contracts', solvedContract);
                    }
                }
            }
        \`, ['import solvers from "/lib/contracts";', 'import { DynamicScript } from "/lib/system";'])
        .run(ns, true);

        // delete contract records that are no longer valid
        (await database.getAll("contracts"))
            .filter(contract => ns.ls(contract.hostname, ".cct")
            .includes(contract.file) === false)
            .forEach(contract => database.deleteRecord("contracts", contract.id));
    `, ['import { DynamicScript } from "/lib/system";'])
)
