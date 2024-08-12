import { AutocompleteData, NS, ScriptArg } from "@ns";
import { Database, DatabaseStoreName } from "/lib/database";
import { IScriptConfiguration } from "./lib/configuration";

const argsSchema: [string, string | number | boolean | string[]][] = [
    ['maxPower', 13],
    ['list', false],
]

let options: {
    [key: string]: string[] | ScriptArg;
};

const database = await Database.getInstance();
await database.open();

export function autocomplete(data: AutocompleteData, args: any) {
    data.flags(argsSchema);

    return [];
}

export async function main(ns: NS): Promise<void> {
    options = ns.flags(argsSchema);

    let config = await database.get<IScriptConfiguration>(DatabaseStoreName.Configuration, "purchasedServersTask.js");
    if (!config) {
        config = { key: "purchasedServersTask.js", value: { maxPower: 13 } };
        await database.saveRecord(DatabaseStoreName.Configuration, config);
    }

    const configValue = config.value as IConfig;
    if (options.list) {
        ns.tprint('Configuration:');
        ns.tprint(JSON.stringify(config, null, 2));
    } else if (options.maxPower !== configValue.maxPower) {
        configValue.maxPower = options.maxPower as number;
        await database.saveRecord(DatabaseStoreName.Configuration, { key: "purchasedServersTask.js", value: configValue });
    }
}

interface IConfig {
    maxPower: number;
}
