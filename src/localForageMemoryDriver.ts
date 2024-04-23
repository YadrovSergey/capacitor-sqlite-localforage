class MemoryStore {
    public readonly options: LocalForageOptions;

    public static drop(config: LocalForageOptions) {
        MemoryStore.memoryInstances.delete(MemoryStore.getKeyOfInstance(config));
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
    ): MemoryStore {
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
        const key = MemoryStore.getKeyOfInstance(config);
        if (MemoryStore.memoryInstances.has(key)) {
            return MemoryStore.memoryInstances.get(key);
        }

        MemoryStore.memoryInstances.set(key, new MemoryStore(config));
        return MemoryStore.memoryInstances.get(key);
    }
    private static memoryInstances = new Map<string, MemoryStore>();

    private data = new Map<string, unknown>();

    constructor(options: LocalForageOptions) {
        this.options = options;
    }

    public init(): Promise<void> {
        return Promise.resolve();
    }
    clear(callback?: (err: any) => void): Promise<void> {
        this.data.clear();
        return returnValue(null, callback);
    }

    getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null> {
        key = normalizeKey(key);

        let value: T;
        if (!this.data.has(key)) {
            value = null;
        } else {
            value = this.data.get(key) as unknown as T;
        }
        return returnValue(value, callback);
    }
    key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string> {
        const keys = this.getKeys();
        let key = keys[keyIndex];
        if (key == undefined) {
            key = null;
        }
        return returnValue(key, callback);
    }
    setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T> {
        key = normalizeKey(key);
        if (value === undefined) {
            value = null;
        }
        this.data.set(key, value);
        return returnValue(value, callback);
    }
    keys(callback?: (err: any, keys: string[]) => void): Promise<string[]> {
        return returnValue(this.getKeys(), callback);
    }
    length(callback?: (err: any, numberOfKeys: number) => void): Promise<number> {
        return returnValue(this.getKeys().length, callback);
    }

    private getKeys() {
        return Array.from(this.data.keys());
    }

    iterate<T, U>(
        iteratee: (value: T, key: string, iterationNumber: number) => U,
        callback?: (err: any, result: U) => void,
    ): Promise<U> {
        let index = 0;

        const keys = this.getKeys();

        let breakResult: U;

        for (const key of keys) {
            const value = this.data.get(key) as unknown as T;

            breakResult = iteratee(value, key, index + 1);
            index += 1;
            // if (breakResult != undefined) {
            // void(0) prevents problems with redefinition
            // of `undefined`.
            if (breakResult !== void 0) {
                // Exit the iteration early:
                break;
            }
        }
        return returnValue(breakResult, callback);
    }
    removeItem(key: string, callback?: (err: any) => void): Promise<void> {
        this.data.delete(normalizeKey(key));
        return returnValue(null, callback);
    }
}

export const localForageMemoryDriver: LocalForageDriver = {
    _driver: "memoryDriver",
    _initStorage(options: LocalForageOptions) {
        return MemoryStore.factory(options).init();
    },
    clear(callback?: (err: any) => void): Promise<void> {
        return MemoryStore.factory(this).clear(callback);
    },
    getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null> {
        return MemoryStore.factory(this).getItem(key, callback);
    },
    key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string> {
        return MemoryStore.factory(this).key(keyIndex, callback);
    },
    setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T> {
        return MemoryStore.factory(this).setItem(key, value, callback);
    },
    keys(callback?: (err: any, keys: string[]) => void): Promise<string[]> {
        return MemoryStore.factory(this).keys(callback);
    },
    length(callback?: (err: any, numberOfKeys: number) => void): Promise<number> {
        return MemoryStore.factory(this).length(callback);
    },
    iterate<T, U>(
        iteratee: (value: T, key: string, iterationNumber: number) => U,
        callback?: (err: any, result: U) => void,
    ): Promise<U> {
        return MemoryStore.factory(this).iterate(iteratee, callback);
    },
    removeItem(key: string, callback?: (err: any) => void): Promise<void> {
        return MemoryStore.factory(this).removeItem(key, callback);
    },
    _support: function () {
        return Promise.resolve(true);
    },
    dropInstance(dbInstanceOptions?: LocalForageDbInstanceOptions, callback?: (err: any) => void): Promise<void> {
        MemoryStore.drop(MemoryStore.factory(this).options);
        return returnValue(null, callback);
    },
};

function returnValue<T>(value: T, callback?: (err: any, value: T) => void) {
    const promise = Promise.resolve<T>(value);

    executeCallback(promise, callback);
    return promise;
}

function executeCallback<T>(promise: Promise<T>, callback: (error: any, result?: T) => void) {
    if (callback) {
        promise.then(
            function (result) {
                callback(null, result);
            },
            function (error) {
                callback(error);
            },
        );
    }
}

export default function normalizeKey(key: any): string {
    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== "string") {
        console.warn(`${key} used as a key, but it is not a string.`);
        key = String(key);
    }

    return key;
}
