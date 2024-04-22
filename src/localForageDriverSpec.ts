import {
    createInstance,
    clear,
    defineDriver,
    setDriver,
    getItem,
    setItem,
    removeItem,
    key,
    length,
    supports,
    driver,
    iterate,
    dropInstance,
    getSerializer,
    getDriver,
    config,
    keys,
    WEBSQL,
    INDEXEDDB,
    LOCALSTORAGE,
    ready,
} from "localforage";
import { localForageMemoryDriver } from "./localForageMemoryDriver";
const driverApiMethods = ["getItem", "setItem", "clear", "length", "removeItem", "key", "keys"];
// import cordovaSQLiteDriver from "./localForageSqliteDriver";

describe("localForageSqliteDriver", function () {
    beforeAll(async () => {
        await defineDriver(localForageMemoryDriver);
    });
    // it("should work", async function () {
    //     const x = createInstance({
    //         name: "test",
    //         driver: localForageMemoryDriver._driver,
    //     });
    //
    //     const x2 = createInstance({
    //         name: "test1",
    //         driver: localForageMemoryDriver._driver,
    //     });
    //
    //     await x.setItem("test", "test222");
    //     await x2.setItem("test", "test222");
    //     //
    //     expect(await x.getItem("test")).toBe("test222");
    // });
    //https://github.com/localForage/localForage/blob/master/test/test.api.js
    [localForageMemoryDriver._driver].forEach((driverName) => {
        describe(`driver ${driverName}`, () => {
            beforeAll(async () => {
                await setDriver(driverName);
            });

            beforeEach(async () => {
                // await clear();
                await ready();
                await clear();
            });

            it("has a localStorage API", function () {
                expect(getItem).toBeDefined();
                expect(setItem).toBeDefined();
                expect(clear).toBeDefined();
                expect(length).toBeDefined();
                expect(removeItem).toBeDefined();
                expect(key).toBeDefined();
            });

            it("has the localForage API", function () {
                //expect(_initStorage).toBe.a('function');
                expect(config).toBeDefined();
                expect(defineDriver).toBeDefined();
                expect(driver).toBeDefined();
                expect(supports).toBeDefined();
                expect(iterate).toBeDefined();
                expect(getItem).toBeDefined();
                expect(setItem).toBeDefined();
                expect(clear).toBeDefined();
                expect(length).toBeDefined();
                expect(removeItem).toBeDefined();
                expect(key).toBeDefined();
                expect(getDriver).toBeDefined();
                expect(setDriver).toBeDefined();
                expect(ready).toBeDefined();
                expect(createInstance).toBeDefined();
                expect(getSerializer).toBeDefined();
                expect(dropInstance).toBeDefined();
            });

            // Make sure we don't support bogus drivers.
            it("supports " + driverName + " database driver", () => {
                expect(supports(driverName)).toBeTrue();
                expect(supports("I am not a driver")).toBeFalse();
            });

            it("sets the right database driver", function () {
                expect(driver()).toBe(driverName);
            });

            it("has an empty length by default", async () => {
                expect(await length()).toBe(0);
            });

            it("setItem and getItem should work", async () => {
                const testKey: string = `test-${new Date().getTime()}`;
                const testValue = 1;
                expect(await setItem(testKey, testValue)).toBe(testValue);
                expect(await getItem(testKey)).toBe(testValue);
            });

            it("should iterate [callback]", function (done) {
                setItem("officeX", "InitechX", function (err, setValue) {
                    expect(setValue).toBe("InitechX");

                    getItem("officeX", function (err, value) {
                        expect(value).toBe(setValue);

                        setItem("officeY", "InitechY", function (err, setValue) {
                            expect(setValue).toBe("InitechY");

                            getItem("officeY", function (err, value) {
                                expect(value).toBe(setValue);

                                const accumulator: Record<string, any> = {};
                                const iterationNumbers: any[] = [];

                                iterate(
                                    function (value, key, iterationNumber) {
                                        accumulator[key] = value;
                                        iterationNumbers.push(iterationNumber);
                                    },
                                    function () {
                                        try {
                                            expect(accumulator.officeX).toBe("InitechX");
                                            expect(accumulator.officeY).toBe("InitechY");
                                            expect(iterationNumbers).toEqual([1, 2]);
                                            done();
                                        } catch (e) {
                                            done();
                                        }
                                    },
                                );
                            });
                        });
                    });
                });
            });

            it("should iterate [promise]", function () {
                const accumulator: Record<string, unknown> = {};
                const iterationNumbers: number[] = [];

                return setItem("officeX", "InitechX")
                    .then(function (setValue) {
                        expect(setValue).toBe("InitechX");
                        return getItem("officeX");
                    })
                    .then(function (value) {
                        expect(value).toBe("InitechX");
                        return setItem("officeY", "InitechY");
                    })
                    .then(function (setValue) {
                        expect(setValue).toBe("InitechY");
                        return getItem("officeY");
                    })
                    .then(function (value) {
                        expect(value).toBe("InitechY");

                        return iterate(function (value, key, iterationNumber) {
                            accumulator[key] = value;
                            iterationNumbers.push(iterationNumber);
                        });
                    })
                    .then(function () {
                        expect(accumulator.officeX).toBe("InitechX");
                        expect(accumulator.officeY).toBe("InitechY");
                        expect(iterationNumbers).toEqual([1, 2]);
                        return;
                    });
            });

            it("should break iteration with defined return value [callback]", function (done) {
                const breakCondition = "Some value!";

                setItem("officeX", "InitechX", function (err, setValue) {
                    expect(setValue).toBe("InitechX");

                    getItem("officeX", function (err, value) {
                        expect(value).toBe(setValue);

                        setItem("officeY", "InitechY", function (err, setValue) {
                            expect(setValue).toBe("InitechY");

                            getItem("officeY", function (err, value) {
                                expect(value).toBe(setValue);

                                // Loop is broken within first iteration.
                                iterate(
                                    function () {
                                        // Returning defined value will break the cycle.
                                        return breakCondition;
                                    },
                                    function (err, loopResult) {
                                        // The value that broken the cycle is returned
                                        // as a result.
                                        expect(loopResult).toBe(breakCondition);

                                        done();
                                    },
                                );
                            });
                        });
                    });
                });
            });

            it("should break iteration with defined return value [promise]", function (done) {
                const breakCondition = "Some value!";

                setItem("officeX", "InitechX")
                    .then(function (setValue) {
                        expect(setValue).toBe("InitechX");
                        return getItem("officeX");
                    })
                    .then(function (value) {
                        expect(value).toBe("InitechX");
                        return setItem("officeY", "InitechY");
                    })
                    .then(function (setValue) {
                        expect(setValue).toBe("InitechY");
                        return getItem("officeY");
                    })
                    .then(function (value) {
                        expect(value).toBe("InitechY");
                        return iterate(function () {
                            return breakCondition;
                        });
                    })
                    .then(function (result) {
                        expect(result).toBe(breakCondition);
                        done();
                    });
            });

            it("should iterate() through only its own keys/values", function (done) {
                localStorage.setItem("local", "forage");
                setItem("office", "Initech")
                    .then(function () {
                        return setItem("name", "Bob");
                    })
                    .then(function () {
                        // Loop through all key/value pairs; {local: 'forage'} set
                        // manually should not be returned.
                        let numberOfItems = 0;
                        let iterationNumberConcat = "";

                        localStorage.setItem("locals", "forages");

                        iterate(
                            function (value, key, iterationNumber) {
                                expect(key).not.toBe("local");
                                expect(value).not.toBe("forage");
                                numberOfItems++;
                                iterationNumberConcat += iterationNumber;
                            },
                            function (err) {
                                if (!err) {
                                    // While there are 4 items in localStorage,
                                    // only 2 items were set using
                                    expect(numberOfItems).toBe(2);

                                    // Only 2 items were set using localForage,
                                    // so we should get '12' and not '1234'
                                    expect(iterationNumberConcat).toBe("12");

                                    done();
                                }
                            },
                        );
                    });
            });

            // Test for https://github.com/mozilla/localForage/issues/175
            it("nested getItem inside clear works [callback]", function (done) {
                setItem("hello", "Hello World !", function () {
                    clear(function () {
                        getItem("hello", function (secondValue) {
                            expect(secondValue).toBe(null);
                            done();
                        });
                    });
                });
            });

            it("nested getItem inside clear works [promise]", function (done) {
                setItem("hello", "Hello World !")
                    .then(function () {
                        return clear();
                    })
                    .then(function () {
                        return getItem("hello");
                    })
                    .then(function (secondValue) {
                        expect(secondValue).toBe(null);
                        done();
                    });
            });

            // Because localStorage doesn't support saving the `undefined` type, we
            // always return `null` so that localForage is consistent across
            // browsers.
            // https://github.com/mozilla/localForage/pull/42
            it("returns null for undefined key [callback]", function (done) {
                getItem("key", function (err, value) {
                    expect(value).toBe(null);
                    done();
                });
            });

            it("returns null for undefined key [promise]", function (done) {
                getItem("key").then(function (value) {
                    expect(value).toBe(null);
                    done();
                });
            });

            it("saves an item [callback]", function (done) {
                setItem("office", "Initech", function (err, setValue) {
                    expect(setValue).toBe("Initech");

                    getItem("office", function (err, value) {
                        expect(value).toBe(setValue);
                        done();
                    });
                });
            });

            it("saves an item [promise]", function (done) {
                setItem("office", "Initech")
                    .then(function (setValue) {
                        expect(setValue).toBe("Initech");

                        return getItem("office");
                    })
                    .then(function (value) {
                        expect(value).toBe("Initech");
                        done();
                    });
            });

            it("saves an item over an existing key [callback]", function (done) {
                setItem("4th floor", "Mozilla", function (err, setValue) {
                    expect(setValue).toBe("Mozilla");

                    setItem("4th floor", "Quora", function (err, newValue) {
                        expect(newValue).not.toBe(setValue);
                        expect(newValue).toBe("Quora");

                        getItem("4th floor", function (err, value) {
                            expect(value).not.toBe(setValue);
                            expect(value).toBe(newValue);
                            done();
                        });
                    });
                });
            });
            it("saves an item over an existing key [promise]", function (done) {
                setItem("4e", "Mozilla")
                    .then(function (setValue) {
                        expect(setValue).toBe("Mozilla");

                        return setItem("4e", "Quora");
                    })
                    .then(function (newValue) {
                        expect(newValue).not.toBe("Mozilla");
                        expect(newValue).toBe("Quora");

                        return getItem("4e");
                    })
                    .then(function (value) {
                        expect(value).not.toBe("Mozilla");
                        expect(value).toBe("Quora");
                        done();
                    });
            });

            it("returns null when saving undefined [callback]", function (done) {
                setItem("undef", undefined, function (err, setValue) {
                    expect(setValue).toBe(null);

                    done();
                });
            });
            it("returns null when saving undefined [promise]", function (done) {
                setItem("undef", undefined).then(function (setValue) {
                    expect(setValue).toBe(null);

                    done();
                });
            });

            it("returns null when saving null [callback]", function (done) {
                setItem("null", null, function (err, setValue) {
                    expect(setValue).toBe(null);

                    done();
                });
            });
            it("returns null when saving null [promise]", function (done) {
                setItem("null", null).then(function (setValue) {
                    expect(setValue).toBe(null);

                    done();
                });
            });

            it("returns null for a non-existant key [callback]", function (done) {
                getItem("undef", function (err, value) {
                    expect(value).toBe(null);

                    done();
                });
            });
            it("returns null for a non-existant key [promise]", function (done) {
                getItem("undef").then(function (value) {
                    expect(value).toBe(null);

                    done();
                });
            });

            // github.com/mozilla/localforage/pull/24#discussion-diff-9389662R158
            // localStorage's method API (`localStorage.getItem('foo')`) returns
            // `null` for undefined keys, even though its getter/setter API
            // (`localStorage.foo`) returns `undefined` for the same key. Gaia's
            // asyncStorage API, which is based on localStorage and upon which
            // localforage is based, ALSO returns `null`. BLARG! So for now, we
            // just return null, because there's no way to know from localStorage
            // if the key is ACTUALLY `null` or undefined but returning `null`.
            // And returning `undefined` here would break compatibility with
            // localStorage fallback. Maybe in the future we won't care...
            it("returns null from an undefined key [callback]", function (done) {
                key(0, function (err, key) {
                    expect(key).toBe(null);

                    done();
                });
            });
            it("returns null from an undefined key [promise]", function (done) {
                key(0).then(function (key) {
                    expect(key).toBe(null);

                    done();
                });
            });

            it("returns key name [callback]", function (done) {
                setItem("office", "Initech").then(function () {
                    key(0, function (err, key) {
                        expect(key).toBe("office");

                        done();
                    });
                });
            });
            it("returns key name [promise]", function (done) {
                setItem("office", "Initech")
                    .then(function () {
                        return key(0);
                    })
                    .then(function (key) {
                        expect(key).toBe("office");

                        done();
                    });
            });

            it("removes an item [callback]", function (done) {
                setItem("office", "Initech", function () {
                    setItem("otherOffice", "Initrode", function () {
                        removeItem("office", function () {
                            getItem("office", function (err, emptyValue) {
                                expect(emptyValue).toBe(null);

                                getItem("otherOffice", function (err, value) {
                                    expect(value).toBe("Initrode");

                                    done();
                                });
                            });
                        });
                    });
                });
            });
            it("removes an item [promise]", function (done) {
                setItem("office", "Initech")
                    .then(function () {
                        return setItem("otherOffice", "Initrode");
                    })
                    .then(function () {
                        return removeItem("office");
                    })
                    .then(function () {
                        return getItem("office");
                    })
                    .then(function (emptyValue) {
                        expect(emptyValue).toBe(null);

                        return getItem("otherOffice");
                    })
                    .then(function (value) {
                        expect(value).toBe("Initrode");

                        done();
                    });
            });

            it("removes all items [callback]", function (done) {
                setItem("office", "Initech", function () {
                    setItem("otherOffice", "Initrode", function () {
                        length(function (err, expectedLength) {
                            expect(expectedLength).toBe(2);

                            clear(function () {
                                getItem("office", function (err, value) {
                                    expect(value).toBe(null);

                                    length(function (err, expectedLength) {
                                        expect(expectedLength).toBe(0);

                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it("removes all items [promise]", function (done) {
                setItem("office", "Initech")
                    .then(function () {
                        return setItem("otherOffice", "Initrode");
                    })
                    .then(function () {
                        return length();
                    })
                    .then(function (length) {
                        expect(length).toBe(2);

                        return clear();
                    })
                    .then(function () {
                        return getItem("office");
                    })
                    .then(function (value) {
                        expect(value).toBe(null);

                        return length();
                    })
                    .then(function (length) {
                        expect(length).toBe(0);

                        done();
                    });
            });

            it("has a length after saving an item [callback]", function (done) {
                length(function (err, resultLength) {
                    expect(resultLength).toBe(0);
                    setItem("rapper", "Black Thought", function () {
                        length(function (err, resultLength) {
                            expect(resultLength).toBe(1);

                            done();
                        });
                    });
                });
            });
            it("has a length after saving an item [promise]", function (done) {
                length()
                    .then(function (length) {
                        expect(length).toBe(0);

                        return setItem("lame rapper", "Vanilla Ice");
                    })
                    .then(function () {
                        return length();
                    })
                    .then(function (length) {
                        expect(length).toBe(1);

                        done();
                    });
            });

            // Deal with non-string keys, see issue #250
            // https://github.com/mozilla/localForage/issues/250
            it("casts an undefined key to a String", function (done) {
                setItem(undefined, "goodness!")
                    .then(function (value) {
                        expect(value).toBe("goodness!");

                        return getItem(undefined);
                    })
                    .then(function (value) {
                        expect(value).toBe("goodness!");

                        return removeItem(undefined);
                    })
                    .then(function () {
                        return length();
                    })
                    .then(function (lengthResult) {
                        expect(lengthResult).toBe(0);
                        done();
                    });
            });

            it("casts a null key to a String", function (done) {
                setItem(null, "goodness!")
                    .then(function (value) {
                        expect(value).toBe("goodness!");

                        return getItem(null);
                    })
                    .then(function (value) {
                        expect(value).toBe("goodness!");

                        return removeItem(null);
                    })
                    .then(function () {
                        return length();
                    })
                    .then(function (length) {
                        expect(length).toBe(0);
                        done();
                    });
            });

            it("casts a float key to a String", function (done) {
                //@ts-ignore
                setItem(537.35737, "goodness!")
                    .then(function (value) {
                        expect(value).toBe("goodness!");
                        //@ts-ignore
                        return getItem(537.35737);
                    })
                    .then(function (value) {
                        expect(value).toBe("goodness!");
                        //@ts-ignore
                        return removeItem(537.35737);
                    })
                    .then(function () {
                        return length();
                    })
                    .then(function (length) {
                        expect(length).toBe(0);
                        done();
                    });
            });

            it("is retrieved by getDriver [callback]", function (done) {
                // @ts-ignore
                getDriver(driverName, function (driver) {
                    expect(typeof driver).toBe("object");
                    driverApiMethods.concat("_initStorage").forEach(function (methodName) {
                        expect(typeof driver[methodName]).toBe("function");
                    });
                    expect(driver._driver).toBe(driverName);
                    done();
                });
            });

            it("is retrieved by getDriver [promise]", function (done) {
                getDriver(driverName).then(function (driver) {
                    expect(typeof driver).toBe("object");
                    driverApiMethods.concat("_initStorage").forEach(function (methodName) {
                        expect(typeof driver[methodName]).toBe("function");
                    });
                    expect(driver._driver).toBe(driverName);
                    done();
                });
            });

            //todo
            // if (driverName === localforage.WEBSQL || driverName === localforage.LOCALSTORAGE) {
            //     it("exposes the serializer on the dbInfo object", function (done) {
            //         localforage.ready().then(function () {
            //             expect(localforage._dbInfo.serializer).toBe.an("object");
            //             done();
            //         });
            //     });
            // }

            function prepareStorage(storageName) {
                // Delete IndexedDB storages (start from scratch)
                // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
                if (driverName === INDEXEDDB) {
                    return new Promise(function (resolve) {
                        indexedDB.deleteDatabase(storageName).onsuccess = resolve;
                    });
                }

                // Otherwise, do nothing
                return Promise.resolve();
            }

            describe(driverName + " driver multiple instances", function () {
                //this.timeout(30000);

                let localforage2: LocalForage = null;
                let localforage3: LocalForage = null;

                beforeAll(function (done) {
                    prepareStorage("storage2").then(function () {
                        localforage2 = createInstance({
                            name: "storage2",
                            // We need a small value here
                            // otherwise local PhantomJS test
                            // will fail with SECURITY_ERR.
                            // TravisCI seem to work fine though.
                            size: 1024,
                            storeName: "storagename2",
                        });

                        // Same name, but different storeName since this has been
                        // malfunctioning before w/ IndexedDB.
                        localforage3 = createInstance({
                            name: "storage2",
                            // We need a small value here
                            // otherwise local PhantomJS test
                            // will fail with SECURITY_ERR.
                            // TravisCI seem to work fine though.
                            size: 1024,
                            storeName: "storagename3",
                        });

                        localforage3.setDriver(driverName);

                        Promise.all([
                            setDriver(driverName),
                            localforage2.setDriver(driverName),
                            localforage3.setDriver(driverName),
                        ]).then(function () {
                            done();
                        });
                    });
                });

                beforeEach(function (done) {
                    Promise.all([clear(), localforage2.clear(), localforage3.clear()]).then(function () {
                        done();
                    });
                });

                it("is not be able to access values of other instances", function (done) {
                    Promise.all([
                        setItem("key1", "value1a"),
                        localforage2.setItem("key2", "value2a"),
                        localforage3.setItem("key3", "value3a"),
                    ])
                        .then(function () {
                            localforage2.getItem("key1").then(function (value) {
                                expect(value).toBe(null);
                            });

                            return Promise.all([
                                getItem("key2").then(function (value) {
                                    expect(value).toBe(null);
                                }),
                                localforage2.getItem("key1").then(function (value) {
                                    expect(value).toBe(null);
                                }),
                                localforage2.getItem("key3").then(function (value) {
                                    expect(value).toBe(null);
                                }),
                                localforage3.getItem("key2").then(function (value) {
                                    expect(value).toBe(null);
                                }),
                            ]);
                        })
                        .then(
                            function () {
                                done();
                            },
                            function (errors) {
                                //  done(new Error(errors));
                            },
                        );
                });

                it("retrieves the proper value when using the same key with other instances", function (done) {
                    Promise.all([
                        setItem("key", "value1"),
                        localforage2.setItem("key", "value2"),
                        localforage3.setItem("key", "value3"),
                    ])
                        .then(function () {
                            return Promise.all([
                                getItem("key").then(function (value) {
                                    expect(value).toBe("value1");
                                }),
                                localforage2.getItem("key").then(function (value) {
                                    expect(value).toBe("value2");
                                }),
                                localforage3.getItem("key").then(function (value) {
                                    expect(value).toBe("value3");
                                }),
                            ]);
                        })
                        .then(
                            function () {
                                done();
                            },
                            // function (errors) {
                            //     done(new Error(errors));
                            // },
                        );
                });
            });

            // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
            describe(driverName + " driver multiple instances (concurrent on same database)", function () {
                beforeAll(function () {
                    return Promise.all([
                        prepareStorage("storage3"),
                        prepareStorage("commonStorage"),
                        prepareStorage("commonStorage2"),
                        prepareStorage("commonStorage3"),
                    ]);
                });

                it("chains operation on multiple stores", function () {
                    const localforage1 = createInstance({
                        name: "storage3",
                        storeName: "store1",
                        size: 1024,
                    });

                    const localforage2 = createInstance({
                        name: "storage3",
                        storeName: "store2",
                        size: 1024,
                    });

                    const localforage3 = createInstance({
                        name: "storage3",
                        storeName: "store3",
                        size: 1024,
                    });

                    const promise1 = localforage1
                        .setItem("key", "value1")
                        .then(function () {
                            return localforage1.getItem("key");
                        })
                        .then(function (value) {
                            expect(value).toBe("value1");
                        });

                    const promise2 = localforage2
                        .setItem("key", "value2")
                        .then(function () {
                            return localforage2.getItem("key");
                        })
                        .then(function (value) {
                            expect(value).toBe("value2");
                        });

                    const promise3 = localforage3
                        .setItem("key", "value3")
                        .then(function () {
                            return localforage3.getItem("key");
                        })
                        .then(function (value) {
                            expect(value).toBe("value3");
                        });

                    return Promise.all([promise1, promise2, promise3]);
                });

                it("can create multiple instances of the same store", function () {
                    let localforage1: LocalForage;
                    let localforage2: LocalForage;
                    let localforage3: LocalForage;

                    Promise.resolve()
                        .then(function () {
                            localforage1 = createInstance({
                                name: "commonStorage",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage1.ready();
                        })
                        .then(function () {
                            localforage2 = createInstance({
                                name: "commonStorage",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage2.ready();
                        })
                        .then(function () {
                            localforage3 = createInstance({
                                name: "commonStorage",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage3.ready();
                        })
                        .then(function () {
                            return Promise.resolve()
                                .then(function () {
                                    return localforage1
                                        .setItem("key1", "value1")
                                        .then(function () {
                                            return localforage1.getItem("key1");
                                        })
                                        .then(function (value) {
                                            expect(value).toBe("value1");
                                        });
                                })
                                .then(function () {
                                    return localforage2
                                        .setItem("key2", "value2")
                                        .then(function () {
                                            return localforage2.getItem("key2");
                                        })
                                        .then(function (value) {
                                            expect(value).toBe("value2");
                                        });
                                })
                                .then(function () {
                                    return localforage3
                                        .setItem("key3", "value3")
                                        .then(function () {
                                            return localforage3.getItem("key3");
                                        })
                                        .then(function (value) {
                                            expect(value).toBe("value3");
                                        });
                                });
                        });
                });

                it("can create multiple instances of the same store and do concurrent operations", function () {
                    let localforage1: LocalForage;
                    let localforage2: LocalForage;
                    let localforage3: LocalForage;
                    let localforage3b: LocalForage;

                    Promise.resolve()
                        .then(function () {
                            localforage1 = createInstance({
                                name: "commonStorage2",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage1.ready();
                        })
                        .then(function () {
                            localforage2 = createInstance({
                                name: "commonStorage2",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage2.ready();
                        })
                        .then(function () {
                            localforage3 = createInstance({
                                name: "commonStorage2",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage3.ready();
                        })
                        .then(function () {
                            localforage3b = createInstance({
                                name: "commonStorage2",
                                storeName: "commonStore",
                                size: 1024,
                            });
                            return localforage3b.ready();
                        })
                        .then(function () {
                            const promise1 = localforage1
                                .setItem("key1", "value1")
                                .then(function () {
                                    return localforage1.getItem("key1");
                                })
                                .then(function (value) {
                                    expect(value).toBe("value1");
                                });

                            const promise2 = localforage2
                                .setItem("key2", "value2")
                                .then(function () {
                                    return localforage2.getItem("key2");
                                })
                                .then(function (value) {
                                    expect(value).toBe("value2");
                                });

                            const promise3 = localforage3
                                .setItem("key3", "value3")
                                .then(function () {
                                    return localforage3.getItem("key3");
                                })
                                .then(function (value) {
                                    expect(value).toBe("value3");
                                });

                            const promise4 = localforage3b
                                .setItem("key3", "value3")
                                .then(function () {
                                    return localforage3.getItem("key3");
                                })
                                .then(function (value) {
                                    expect(value).toBe("value3");
                                });

                            return Promise.all([promise1, promise2, promise3, promise4]);
                        });
                });

                it("can create multiple instances of the same store concurrently", function () {
                    const localforage1 = createInstance({
                        name: "commonStorage3",
                        storeName: "commonStore",
                        size: 1024,
                    });

                    const localforage2 = createInstance({
                        name: "commonStorage3",
                        storeName: "commonStore",
                        size: 1024,
                    });

                    const localforage3 = createInstance({
                        name: "commonStorage3",
                        storeName: "commonStore",
                        size: 1024,
                    });

                    const localforage3b = createInstance({
                        name: "commonStorage3",
                        storeName: "commonStore",
                        size: 1024,
                    });

                    const promise1 = localforage1
                        .setItem("key1", "value1")
                        .then(function () {
                            return localforage1.getItem("key1");
                        })
                        .then(function (value) {
                            expect(value).toBe("value1");
                        });

                    const promise2 = localforage2
                        .setItem("key2", "value2")
                        .then(function () {
                            return localforage2.getItem("key2");
                        })
                        .then(function (value) {
                            expect(value).toBe("value2");
                        });

                    const promise3 = localforage3
                        .setItem("key3", "value3")
                        .then(function () {
                            return localforage3.getItem("key3");
                        })
                        .then(function (value) {
                            expect(value).toBe("value3");
                        });

                    const promise4 = localforage3b
                        .setItem("key3", "value3")
                        .then(function () {
                            return localforage3.getItem("key3");
                        })
                        .then(function (value) {
                            expect(value).toBe("value3");
                        });

                    return Promise.all([promise1, promise2, promise3, promise4]);
                });
            });

            describe(driverName + " driver", function () {
                let driverPreferedOrder;

                beforeAll(function () {
                    // add some unsupported drivers before
                    // and after the target driver
                    driverPreferedOrder = ["I am a not supported driver"];

                    if (!supports(WEBSQL)) {
                        driverPreferedOrder.push(WEBSQL);
                    }
                    if (!supports(INDEXEDDB)) {
                        driverPreferedOrder.push(INDEXEDDB);
                    }
                    if (!supports(LOCALSTORAGE)) {
                        driverPreferedOrder.push(localStorage);
                    }

                    driverPreferedOrder.push(driverName);

                    driverPreferedOrder.push("I am another not supported driver");
                });

                it("is used according to setDriver preference order", function (done) {
                    setDriver(driverPreferedOrder).then(function () {
                        expect(driver()).toBe(driverName);
                        done();
                    });
                });
            });

            xdescribe(driverName + " driver when the callback throws an Error", function () {
                const testObj = {
                    throwFunc: function () {
                        testObj.throwFuncCalls++;
                        throw new Error("Thrown test error");
                    },
                    throwFuncCalls: 0,
                };

                beforeEach(function (done) {
                    testObj.throwFuncCalls = 0;
                    done();
                });

                it("resolves the promise of getItem()", function (done) {
                    getItem("key", testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of setItem()", function (done) {
                    setItem("key", "test", testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of clear()", function (done) {
                    clear(testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of length()", function (done) {
                    length(testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of removeItem()", function (done) {
                    removeItem("key", testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of key()", function (done) {
                    key("key" as unknown as any, testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });

                it("resolves the promise of keys()", function (done) {
                    keys(testObj.throwFunc).then(function () {
                        expect(testObj.throwFuncCalls).toBe(1);
                        done();
                    });
                });
            });

            //todo
            // describe(driverName + " driver when ready() gets rejected", function () {
            //     "use strict";
            //
            //     this.timeout(30000);
            //
            //     let _oldReady;
            //
            //     beforeEach(function (done) {
            //         _oldReady = ready;
            //         ready = function () {
            //             return Promise.reject();
            //         };
            //         done();
            //     });
            //
            //     afterEach(function (done) {
            //         ready = _oldReady;
            //         _oldReady = null;
            //         done();
            //     });
            //
            //     driverApiMethods.forEach(function (methodName) {
            //         it("rejects " + methodName + "() promise", function (done) {
            //             localforage[methodName]().then(null, function (/*err*/) {
            //                 done();
            //             });
            //         });
            //     });
            // });
        });
    });
});
