import { DynamicScript } from "/lib/system";
import { ScriptTask } from "/models/ScriptTask";

export default (taskName: string = 'UpdatePlayer') => new ScriptTask(
    { name: taskName, priority: 100, lastRun: 0, interval: 500, enabled: true },
    new DynamicScript(taskName, `
        const player = ns.getPlayer();
        const excludeProperties = ['playtimeSinceLastAug', 'playtimeSinceLastBitnode', 'bitNodeN'];
        const result = Object.keys(player).reduce((pCopy, key) => {
            if (!excludeProperties.includes(key))
                pCopy[key] = player[key];
            return pCopy;
        }, {});
        await database.saveRecord(DatabaseStoreName.NS_Data, {command: 'ns.getPlayer', result});
        `, []),
)
