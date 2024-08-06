import { Database, DatabaseStoreName } from "/lib/database";

export interface IScriptConfiguration {
    key: string;
    value: unknown;
}

export class Configuration {
    private static instance: Configuration;
    private static database: Database;

    private constructor() { }
    public static async getInstance(): Promise<Configuration> {
        if (!Configuration.instance) {
            Configuration.instance = new Configuration();
            Configuration.database = await Database.getInstance();

            await Configuration.database.open();
        }
        return Configuration.instance;
    }

    public async get<T>(key: string): Promise<T> {
        return (await Configuration.database.get<IScriptConfiguration>(DatabaseStoreName.Configuration, key)).value as T;
    }

    public async set(value: IScriptConfiguration) {
        await Configuration.database.saveRecord(DatabaseStoreName.Configuration, value);
    }

    public async remove(key: string) {
        await Configuration.database.deleteRecord(DatabaseStoreName.Configuration, key);
    }

    public async clear() {
        await Configuration.database.clear(DatabaseStoreName.Configuration);
    }
}