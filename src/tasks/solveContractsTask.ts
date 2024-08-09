import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/lib/models";

export default (taskName: string = 'SolveContracts') => new ScriptTask(
    { name: taskName, priority: 80, lastRun: 0, interval: 5000, enabled: false },
    new DynamicScript(taskName, `
        //Require at least 32GB of RAM
        const requiredRam = 32;
        if((await database.get("servers", "home")).maxRam < requiredRam) {
            ns.toast("Server does not have enough RAM(" + requiredRam + ") to run the contract task.");
            return;
        }

        const servers = await database.getAll("servers");
        const contracts = [];
        const contractFiles = servers.flatMap(s => s.files.filter(f => f.endsWith(".cct")).map(file => ({ hostname: s.hostname, file })));
        ns.print("Found " + contractFiles.length + " contracts");
        for (const contractFile of contractFiles) {
            ns.print("Processing contract: " + contractFile.file);

            // Get Contract Type
            await (new DynamicScript(
                contractFile.file + "-Type",
                getDynamicScriptContent(
                    "ns.codingcontract.getContractType",
                    "ns.codingcontract.getContractType('" + contractFile.file + "', '" + contractFile.hostname + "')",
                    DatabaseStoreName.NS_Data
                )
            )).run(ns, true);
            const contractType = await database.get(DatabaseStoreName.NS_Data, "ns.codingcontract.getContractType");
            
            // Get Contract Data
            await (new DynamicScript(
                contractFile.file + "-Data",
                getDynamicScriptContent(
                    "ns.codingcontract.getData",
                    "JSON.stringify(ns.codingcontract.getData('" + contractFile.file + "', '" + contractFile.hostname + "'))",
                    DatabaseStoreName.NS_Data
                )
            )).run(ns, true);
            const contractData = await database.get(DatabaseStoreName.NS_Data, "ns.codingcontract.getData");


            const contract = {
                id: contractFile.hostname + "-" + contractFile.file,
                hostname: contractFile.hostname,
                file: contractFile.file,
                type: contractType,
                data: contractData,
                solved: false
            }
            await database.saveRecord("contracts", contract);
            contracts.push(contract);
        }

        for (const contract of contracts) {
            const data = JSON.parse(contract.data);
            const solveFn = solvers[contract.type];
            if (solveFn !== undefined) {
                const answer = solvers[contract.type](data);
                await (new DynamicScript(
                    contract.file + "-Solve",
                    getDynamicScriptContent(
                        "ns.codingcontract.attempt",
                        "ns.codingcontract.attempt('" + answer +"', '" + contract.file + "', '" + contract.hostname + "')",
                        DatabaseStoreName.NS_Data
                    )
                )).run(ns, true);
                const reward = await database.get(DatabaseStoreName.NS_Data, "ns.codingcontract.attempt");
                if (reward) {
                    ns.toast("Contract rewarded: " + reward);
                    await database.deleteRecord("contracts", contract.id);
                }
            }
        }
    `, ['import { DynamicScript, getDynamicScriptContent } from "/lib/system";', 'import solvers from "/lib/contracts";']
    ));
