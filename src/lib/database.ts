export enum DatabaseStoreName {
    Servers = 'servers',
    NS_Data = 'ns_data',
    Contracts = 'contracts',
    Tasks = 'tasks',
    Configuration = 'config',
}

export class Database {
    private static instance: Database;
    public static readonly DatabaseStoreNames = DatabaseStoreName;

    private IndxDb: IDBFactory = eval('window.indexedDB');
    private db: IDBDatabase | undefined;

    private constructor(public name: string, public version: number) { }

    public static async getInstance(name: string = 'ScriptDb', version = 1): Promise<Database> {
        if (!Database.instance) {
            Database.instance = new Database(name, version);
        }
        return Database.instance;
    }

    public tableDefinitions: ITableDefinition[] = [
        { name: DatabaseStoreName.Servers, key: "hostname" },
        { name: DatabaseStoreName.NS_Data, key: "command" },
        { name: DatabaseStoreName.Contracts, key: "id", options: { autoIncrement: true } },
        { name: DatabaseStoreName.Tasks, key: "name" },
        { name: DatabaseStoreName.Configuration, key: "key" },
    ];

    open() {
        return new Promise((resolve, reject) => {
            const request = this.IndxDb.open(this.name, this.version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                this.db = request.result;

                // Create tables here if needed
                for (const table of this.tableDefinitions) {
                    const objectStore = this.db.createObjectStore(table.name, { keyPath: table.key, ...table.options });

                    if (!table.indexes || table.indexes.length === 0) continue;
                    for (const index of table.indexes) {
                        objectStore.createIndex(index.name, index.key, index.options);
                    }
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = request.result;
                resolve("Database initialized successfully.");
            };

            request.onerror = (event: Event) => {
                reject("Failed to initialized the database.");
            };
        });
    }

    deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = this.IndxDb.deleteDatabase(this.name);

            request.onsuccess = (event: Event) => {
                this.db = request.result;
                // Database opened successfully
                resolve("Database deleted successfully.");
            };

            request.onerror = (event: Event) => {
                reject("Failed to delete the database.");
            };
        });
    }

    saveRecord(storeName: string, value: any) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(value);

            request.onsuccess = (event: Event) => {
                resolve("Record saved successfully.");
            };

            request.onerror = (event: Event) => {
                reject("Failed to save record.");
            };
        });
    }

    deleteRecord(storeName: string, key: any) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = (event: Event) => {
                resolve("Record deleted successfully.");
            };

            request.onerror = (event: Event) => {
                reject("Failed to delete record.");
            };
        });
    }

    clear(storeName: string) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = (event: Event) => {
                resolve("Records cleared successfully.");
            };

            request.onerror = (event: Event) => {
                reject("Failed to clear record.");
            };
        });
    }

    get<T>(storeName: string, key: any): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = (event: Event) => {
                resolve(request.result?.result ?? request.result as T);
            };

            request.onerror = (event: Event) => {
                reject("Failed to get record.");
            };
        });
    }

    getAll<T>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = (event: Event) => {
                resolve(request.result as T[]);
            };

            request.onerror = (event: Event) => {
                reject("Failed to get record.");
            };
        });
    }
}

interface ITableDefinition {
    name: string
    key: string
    options?: IDBObjectStoreParameters
    indexes?: ITableIndex[]
}

interface ITableIndex {
    name: string
    key: string
    options?: IDBIndexParameters
}
