import { NS } from "@ns";
import { Database } from "/lib/database";
import { IScriptContract } from "/lib/models";
import { DynamicScript } from "/lib/system";
import solvers from "/lib/contracts";

export async function main(ns: NS): Promise<void> {
    const database = new Database();
    await database.open();

    const contracts = (await database.getAll<IScriptContract>('contracts'))
        .filter(contract => ns.ls(contract.hostname, '.cct').includes(contract.file));
    for (const contract of contracts.filter(c => c.type in solvers && c.data !== undefined)) {
        const data = JSON.parse(contract.data);
        const solveFn = solvers[contract.type];
        if (solveFn !== undefined) {
            const answer = solvers[contract.type](data);
            
            await new DynamicScript(
                `ns.contract.solve-${contract.id}`,`
                const reward = ns.codingcontract.attempt('${answer}', '${contract.file}', '${contract.hostname}');
                if (reward) {
                    ns.toast('Contract rewarded: ' + reward);
                    const solvedContract = await database.get('contracts', '${contract.id}');
                    solvedContract.solved = true;
                    await database.saveRecord('contracts', solvedContract);
                }`,
            ).run(ns, true);
        }
    }
}





