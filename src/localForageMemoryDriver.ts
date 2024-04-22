type Name = string;
type StorName = string;

const memoryData = new Map<
    Name,
    Map<
        StorName,
        {
            options: LocalForageOptions;
            data: Record<string, unknown>;
        }
    >
>();

function getStore(self) {
    const config = self._config as unknown as LocalForageOptions;
    if (!memoryData.has(config.name)) {
        memoryData.set(config.name, new Map());
    }
    if (!memoryData.get(config.name).has(config.storeName)) {
        memoryData.get(config.name).set(config.storeName, {
            options: config,
            data: {},
        });
    }

    return memoryData.get(config.name).get(config.storeName);
}

export const localForageMemoryDriver: LocalForageDriver = {
    _driver: "memoryDriver",
    _initStorage(options: LocalForageOptions) {
        return Promise.resolve();
    },
    clear(callback?: (err: any) => void): Promise<void> {
        getStore(this).data = {};
        return returnValue(null, callback);
    },
    getItem<T>(key: string, callback?: (err: any, value: T | null) => void): Promise<T | null> {
        key = castKeyToString(key);
        const data = getStore(this).data;
        let value: T;
        if (typeof data[key] == "undefined") {
            value = null;
        } else {
            value = data[key] as unknown as T;
        }
        return returnValue(value, callback);
    },
    key(keyIndex: number, callback?: (err: any, key: string) => void): Promise<string> {
        const keys = Object.keys(getStore(this).data);
        let key = keys[keyIndex];
        if (key == undefined) {
            key = null;
        }
        return returnValue(key, callback);
    },
    setItem<T>(key: string, value: T, callback?: (err: any, value: T) => void): Promise<T> {
        key = castKeyToString(key);
        if (value === undefined) {
            value = null;
        }
        getStore(this).data[key] = value;
        return returnValue(value, callback);
    },
    keys(callback?: (err: any, keys: string[]) => void): Promise<string[]> {
        return returnValue(Object.keys(getStore(this).data), callback);
    },
    length(callback?: (err: any, numberOfKeys: number) => void): Promise<number> {
        return returnValue(Object.keys(getStore(this).data).length, callback);
    },
    iterate<T, U>(
        iteratee: (value: T, key: string, iterationNumber: number) => U,
        callback?: (err: any, result: U) => void,
    ): Promise<U> {
        let index = 0;
        const data = getStore(this).data;
        const keys = Object.keys(data);

        let breakResult: U;

        // let lastPair: [string, T];
        for (const key of keys) {
            const value = data[key] as unknown as T;
            if (value === null) {
                return;
            }
            // lastPair = [key, value];
            breakResult = iteratee(value, key, index + 1);
            index += 1;
            if (breakResult != undefined) {
                // Exit the iteration early:
                break;
            }
        }
        return returnValue(breakResult, callback);
    },
    removeItem(key: string, callback?: (err: any) => void): Promise<void> {
        delete getStore(this).data[key];
        return returnValue(null, callback);
    },
    _support: function () {
        return Promise.resolve(true);
    },
    dropInstance(dbInstanceOptions?: LocalForageDbInstanceOptions, callback?: (err: any) => void): Promise<void> {
        memoryData.delete(getStore(this).options.name);
        return returnValue(null, callback);
    },
};

function castKeyToString(key: string) {
    return "" + key;
}

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
