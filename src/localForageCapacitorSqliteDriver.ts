import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { getSerializer } from "localforage";
import type { capSQLiteValues } from "@capacitor-community/sqlite/src/definitions";

type StrategyCreateDatabase =
    | {
          type: "default";
      }
    | {
          type: "inOneDatabase";
          databaseName: string;
      };
class CapacitorSqlStore {
    public readonly options: LocalForageOptions;
    private serialise: LocalForageSerializer;
    private strategyCreate: StrategyCreateDatabase;

    public async drop(callback?: (err: any) => void) {
        try {
            await this.clear();
            await CapacitorSQLite.close({
                database: this.databaseName,
            });
            CapacitorSqlStore.instances.delete(CapacitorSqlStore.getKeyOfInstance(this.options));

            this.callCallback(callback, null);
        } catch (error) {
            console.error(error);
            this.callCallbackError(callback, null);
        }
    }

    private static getKeyOfInstance(config: LocalForageOptions) {
        return `${config.name}-${config.storeName}`;
    }
    public static factory(
        options:
            | LocalForageOptions
            | {
                  _config: LocalForageOptions;
              }
            | any,
        strategyCreateDataBase: StrategyCreateDatabase,
    ): CapacitorSqlStore {
        let config: LocalForageOptions;
        if (options.hasOwnProperty("_config")) {
            config = (
                options as unknown as {
                    _config: LocalForageOptions;
                }
            )._config;
        } else {
            config = options as unknown as LocalForageOptions;
        }
        const key = CapacitorSqlStore.getKeyOfInstance(config);
        if (CapacitorSqlStore.instances.has(key)) {
            return CapacitorSqlStore.instances.get(key);
        }

        CapacitorSqlStore.instances.set(key, new CapacitorSqlStore(config, strategyCreateDataBase));
        // CapacitorSqlStore.instances.set(key, new CapacitorSqlStore(config, { type: "default" }));
        return CapacitorSqlStore.instances.get(key);
    }
    private static instances = new Map<string, CapacitorSqlStore>();

    /**
     * У данного плагина есть ограничение на работу одновременно с несколькими базами
     * @see https://github.com/capacitor-community/sqlite/issues/1
     * Поэтому есть флаг создания всех таблиц в одной базе
     */
    private constructor(options: LocalForageOptions, strategyCreate: StrategyCreateDatabase) {
        this.options = options;
        this.strategyCreate = strategyCreate;
    }

    private get databaseName() {
        if (this.strategyCreate.type == "inOneDatabase") {
            return this.strategyCreate.databaseName;
        }
        return this.options.name;
    }

    private get tableName() {
        if (this.strategyCreate.type == "inOneDatabase") {
            return this.options.name + "" + this.options.storeName;
        }

        return this.options.storeName;
    }

    private serializeValue<T>(value: T): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.serialise.serialize(value, function (value, error) {
                if (error) {
                    reject(error);
                }

                resolve(value);
            });
        });
    }

    private async openConnectionToDatabase() {
        try {
            await CapacitorSQLite.createConnection({
                database: this.databaseName,
            });
            console.log(`sqlite: create connection ${this.databaseName}`);
        } catch (error) {
            if (error && error.message.indexOf(`Connection ${this.databaseName} already exists`) > 0) {
                console.log(error);
            } else {
                console.error(error);
            }
        }

        try {
            if (
                !(
                    await CapacitorSQLite.isDBOpen({
                        database: this.databaseName,
                    })
                ).result
            ) {
                await CapacitorSQLite.open({
                    database: this.databaseName,
                });

                console.log(`sqlite: on ${this.databaseName} open table ${this.tableName}`);
            }
        } catch (error) {
            console.error(error);
        }
    }

    public async init(): Promise<void> {
        try {
            this.serialise = await getSerializer();

            await this.openConnectionToDatabase();

            const tableExist = await CapacitorSQLite.isTableExists({
                database: this.databaseName,
                table: this.tableName,
            });

            if (!tableExist.result) {
                await CapacitorSQLite.execute({
                    database: this.databaseName,
                    statements: `CREATE TABLE IF NOT EXISTS ${this.tableName} (id INTEGER PRIMARY KEY, key unique, value);`,
                });
            }
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }
    public async clear(callback?: (err: any) => void): Promise<void> {
        try {
            /**
             * execute не очищало таблицу на ios
             */
            // const resultOfClear = await CapacitorSQLite.execute({
            //     database: this.databaseName,
            //     statements: `DELETE FROM ${this.tableName}`,
            //     transaction: false,
            // });
            //

            await this.sqliteRun(`DELETE FROM ${this.tableName}`);

            this.callCallback(callback, null);
        } catch (e) {
            return this.callCallbackError(callback, e);
        }
    }

    private callCallback<T>(callback?: (err: any, value: T | null) => void, value?: T) {
        if (callback) {
            callback(null, value);
        }
    }

    private callCallbackError<T>(callback: (err: any, value: T | null) => void, error: any) {
        if (callback) {
            callback(error, null);
        }

        return Promise.reject(error);
    }

    public async getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null> {
        key = normalizeKey(key);

        let value: T = null;
        try {
            const foundKey = await this.sqliteQuery<{
                id: number;
                key: string;
                value: string;
            }>(`SELECT * FROM ${this.tableName} WHERE key = ? LIMIT 1`, [key]);

            if (foundKey.length > 0) {
                const valueAsString = foundKey[0].value;
                value = this.serialise.deserialize<T>(valueAsString) as unknown as T;
            }

            this.callCallback(callback, value);

            return value;
        } catch (error) {
            return this.callCallbackError(callback, error);
        }
    }

    // Return the key located at key index X; essentially gets the key from a
    // `WHERE id = ?`. This is the most efficient way I can think to implement
    // this rarely-used (in my experience) part of the API, but it can seem
    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
    // the ID of each key will change every time it's updated. Perhaps a stored
    // procedure for the `setItem()` SQL would solve this problem?
    // TODO: Don't change ID on `setItem()`.
    public async key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string> {
        let value: string = null;
        try {
            const foundKey = await this.sqliteQuery<{
                key: string;
            }>(`SELECT key FROM ${this.tableName} WHERE id = ? LIMIT 1`, [keyIndex + 1]);

            if (foundKey && foundKey.length > 0) {
                value = foundKey[0].key;
            }

            this.callCallback(callback, value);

            return value;
        } catch (error) {
            return this.callCallbackError(callback, error);
        }
    }

    public async setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T> {
        key = normalizeKey(key);

        try {
            // The localStorage API doesn't return undefined values in an
            // "expected" way, so undefined is always cast to null in all
            // drivers. See: https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            const serialiseValue = await this.serializeValue(value);

            await this.sqliteRun(`INSERT OR REPLACE INTO ${this.tableName} (key, value) VALUES (?, ?)`, [
                key,
                serialiseValue,
            ]);

            this.callCallback(callback, value);

            return value;
        } catch (e) {
            this.callCallbackError(callback, e);
        }
    }

    private async sqliteRun(query: string, values: any[] = [], tryReconnect = true) {
        try {
            /**
             * need for work test driver multiple instances
             * Если не открывать соединение, то появляется ошибка
             * Unhandled Promise Rejection: Error: Run: Connection to localforage not available
             */

            const result = await CapacitorSQLite.run({
                database: this.databaseName,
                statement: query,
                values: values,
                transaction: false,
            });

            return result;
        } catch (error) {
            if (tryReconnect && this.isConnectionNotAvailableError(error)) {
                console.log(error, "try reconnect");
                await this.openConnectionToDatabase();
                return this.sqliteRun(query, values, false);
            } else {
                console.error(error, { query, values, databaseName: this.databaseName });
                return Promise.reject(error);
            }
        }
    }

    private async sqliteQuery<T>(query: string, values: any[] = [], tryReconnect = true): Promise<T[]> {
        try {
            const queryResult = await CapacitorSQLite.query({
                database: this.databaseName,
                statement: query,
                values: values,
            });

            return this.getValues<T>(queryResult);
        } catch (error) {
            if (tryReconnect && this.isConnectionNotAvailableError(error)) {
                console.log(error, "try reconnect");
                await this.openConnectionToDatabase();
                return this.sqliteQuery(query, values, false);
            } else {
                console.error(error, { query, values, databaseName: this.databaseName });
                return Promise.reject(error);
            }
        }
    }
    private isConnectionNotAvailableError(error: Error) {
        //Query: Connection to storage2 not available
        //Run: Connection to storage2 not available
        if (error && error.message.indexOf(`Connection to ${this.databaseName} not available`) > 0) {
            return true;
        }

        return false;
    }

    public async keys(callback?: (err: any, keys: string[]) => void): Promise<string[]> {
        const keys: string[] = [];
        try {
            const foundKeys = await this.sqliteQuery<{
                key: string;
            }>(`SELECT key FROM ${this.tableName}`);

            if (foundKeys && foundKeys.length > 0) {
                foundKeys.forEach((item) => {
                    keys.push(item.key);
                });
            }

            this.callCallback(callback, keys);

            return keys;
        } catch (error) {
            return this.callCallbackError(callback, error);
        }
    }
    public async length(callback?: (err: any, numberOfKeys: number) => void): Promise<number> {
        let length = 0;
        try {
            const foundKeys = await this.sqliteQuery<{
                c: number;
            }>(`SELECT COUNT(key) as c FROM ${this.tableName}`);

            if (foundKeys.length > 0) {
                length = foundKeys[0].c;
            }

            this.callCallback(callback, length);

            return length;
        } catch (error) {
            return this.callCallbackError(callback, error);
        }
    }

    private getValues<T>(resultFormQuery: capSQLiteValues): T[] {
        const result: T[] = [];
        if (resultFormQuery && resultFormQuery.values && resultFormQuery.values.length > 0) {
            const foundData = resultFormQuery.values as unknown as Array<T | { ios_columns: string[] }>;

            foundData.forEach((item) => {
                if (item.hasOwnProperty("ios_columns")) {
                    return;
                }

                result.push(item as unknown as T);
            });
        }

        return result;
    }

    public async iterate<T, U>(
        iteratee: (value: T, key: string, iterationNumber: number) => U,
        callback?: (err: any, result: U) => void,
    ): Promise<U> {
        let breakResult: U;
        try {
            const foundKey = await this.sqliteQuery<{
                id: number;
                key: string;
                value: string;
            }>(`SELECT * FROM ${this.tableName}`);

            if (foundKey && foundKey.length > 0) {
                for (let i = 0; i < foundKey.length; i++) {
                    const item = foundKey[i];
                    const resultAsString = item.value;
                    let result: T = null;
                    // Check to see if this is serialized content
                    // we need to unpack.
                    if (resultAsString) {
                        result = this.serialise.deserialize<T>(resultAsString) as unknown as T;
                    }

                    breakResult = iteratee(result, item.key, i + 1);

                    // void(0) prevents problems with redefinition
                    // of `undefined`.
                    if (breakResult !== void 0) {
                        break;
                    }
                }
            }

            this.callCallback(callback, breakResult);

            return breakResult;
        } catch (error) {
            return this.callCallbackError(callback, error);
        }
    }
    public async removeItem(key: string, callback?: (err: any) => void): Promise<void> {
        try {
            key = normalizeKey(key);

            await this.sqliteRun(`DELETE FROM ${this.tableName} WHERE key = ?`, [key]);

            this.callCallback(callback, null);
        } catch (e) {
            return this.callCallbackError(callback, e);
        }
    }
}

export const localForageCapacitorSqliteDriver = (strategyCreateDataBase: StrategyCreateDatabase): LocalForageDriver => {
    return {
        _driver: "capacitorSqliteDriver" + "_" + strategyCreateDataBase.type,
        _initStorage(options: LocalForageOptions) {
            return CapacitorSqlStore.factory(options, strategyCreateDataBase).init();
        },
        clear(callback?: (err: any) => void): Promise<void> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).clear(callback);
        },
        getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).getItem(key, callback);
        },
        key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).key(keyIndex, callback);
        },
        setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).setItem(key, value, callback);
        },
        keys(callback?: (err: any, keys: string[]) => void): Promise<string[]> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).keys(callback);
        },
        length(callback?: (err: any, numberOfKeys: number) => void): Promise<number> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).length(callback);
        },
        iterate<T, U>(
            iteratee: (value: T, key: string, iterationNumber: number) => U,
            callback?: (err: any, result: U) => void,
        ): Promise<U> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).iterate(iteratee, callback);
        },
        removeItem(key: string, callback?: (err: any) => void): Promise<void> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).removeItem(key, callback);
        },
        _support: function () {
            return Promise.resolve(true);
        },
        dropInstance(dbInstanceOptions?: LocalForageDbInstanceOptions, callback?: (err: any) => void): Promise<void> {
            return CapacitorSqlStore.factory(this, strategyCreateDataBase).drop(callback);
        },
    };
};

export default function normalizeKey(key: any): string {
    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== "string") {
        console.warn(`${key} used as a key, but it is not a string.`);
        key = String(key);
    }

    return key;
}
