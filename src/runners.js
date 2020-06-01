import {isBrowser, isNode} from './environment.js';
import testTypes from './testTypes.js';
import Action from './Action.js';
import stringify from './stringify.js';
import {execute} from './execute.js';

const noTestsHint = "check for typos in URL query/command line args, test ids, defBrowserTestRef args, the \"include\" option, and/or include options that don't include anything that is loaded";

let testUid = 0;

function getTestUid() {
    return `${(new Date()).getTime()}:${++testUid}`;
}

function getTestList(testInstruction, tests, remoteTests) {
    testInstruction = /^\//.test(testInstruction) ? new RegExp(testInstruction) : testInstruction;
    let testList;
    if (testInstruction === '*') {
        // run everything in tests
        testList = tests.slice();
    } else if (testInstruction instanceof RegExp) {
        // run anything in tests where test.id matches the reg exp given by testInstruction
        testList = tests.filter(test => {
            return testInstruction.test(test.id);
        });
    } else if (typeof testInstruction === 'string') {
        // run only the test where test.id===testInstruction
        testList = tests.filter(test => {
            return test.id === testInstruction;
        });
    } else {
        // testInstruction must be a test object
        testList = Array.isArray(testInstruction) ? testInstruction : [testInstruction];
    }

    function filter(test) {
        if (remoteTests) {
            return test.type === testTypes.both ||
                test.type === testTypes.browser ||
                test.type === testTypes.remote;
        } else {
            return test.type === testTypes.both ||
                (isBrowser && test.type === testTypes.browser) ||
                (isNode && test.type === testTypes.node);
        }
    }

    return testList.filter(filter);
}

function getCapabilities(capabilities, provider, caps, capPresets, logger) {
    const result = {};
    let error = false;

    const log = msg => {
        logger.log('info', 0, [`capabilities: ${msg}`]);
        error = true;
    };

    if (!capabilities) {
        log('no capabilities configured');
        return [[], false];
    }

    // get all the capabilities
    if (caps && caps.length) {
        if (caps.some(cap => cap === '*')) {
            Object.keys(capabilities).forEach(cap => cap !== 'presets' && (result[cap] = capabilities[cap]));
        } else {
            caps.forEach(cap => {
                if (capabilities[cap]) {
                    result[cap] = capabilities[cap];
                } else {
                    log(`capability "${cap}" does not exist in capabilities`);
                }
            });
        }
    }

    // now the presets
    if (capPresets && capPresets.length) {
        if (!capabilities.presets) {
            log('capPreset given but no presets in capabilities');
        } else {
            capPresets.forEach(_preset => {
                const preset = capabilities.presets[_preset];
                if (!preset) {
                    log(`capPreset "${_preset}" given that does not exist in capabilities presets`);
                } else if (!Array.isArray(preset)) {
                    log(`capPreset "${_preset}" must be an array in capabilities presets`);
                } else {
                    preset.forEach(cap => {
                        if (capabilities[cap]) {
                            result[cap] = capabilities[cap];
                        } else {
                            log(`capability "${cap}" given in presets does not exist in capabilities`);
                        }
                    });
                }
            });
        }
    }

    if (!error && !Object.keys(result).length && capabilities.presets && capabilities.presets.default && Array.isArray(capabilities.presets.default)) {
        capabilities.presets.default.forEach(cap => {
            if (capabilities[cap]) {
                result[cap] = capabilities[cap];
            } else {
                log(`capability "${cap}" given in presets does not exist in capabilities`);
            }
        });
    }

    // now results back into an array, filter for provider, and sort...
    const _results = [];
    Object.keys(result).forEach(key => {
        const cap = result[key];
        if (!provider || (cap.provider && cap.provider.name === provider)) {
            _results.push([key, cap]);
        }
    });
    _results.sort((lhs, rhs) => {
        return lhs[1].smokeOrder < rhs[1].smokeOrder ? -1 : (lhs[1].smokeOrder > rhs[1].smokeOrder ? 1 : 0);
    });

    return [error ? [] : _results, error];
}

let pendingActions = [];

function queueActions(action, args) {
    const dest = pendingActions;
    if (Array.isArray(action)) {
        // an array of [action, args] pairs
        action.forEach(arg => dest.push(
            [arg[0].id, arg[1]]
        ));
    } else {
        dest.push([action.id, args]);
    }
}

function getQueuedActions() {
    let _pendingActions = [];

    function get() {
        if (pendingActions.length) {
            _pendingActions = pendingActions;
            pendingActions = [];
            return true;
        } else {
            return false;
        }
    }

    let tryCount = 20;
    return new Promise((resolve => {
        (function check() {
            if (get() || tryCount < 0) {
                resolve(_pendingActions);
            } else {
                tryCount--;
                setTimeout(check, 50);
            }
        }());
    }));
}

function waitForLoaderIdle(callback) {
    // eslint-disable-next-line no-undef
    smoke.loaderIdle.then(loadError => callback(loadError));
}

function exec(testId, options) {
    // eslint-disable-next-line no-undef
    return smoke.run(testId, 0, options, false, true).testUid;
}

function resetLog() {
    // eslint-disable-next-line no-undef
    return smoke.logger.reset();
}

function _getQueuedActions(callback) {
    // eslint-disable-next-line no-undef
    smoke.getQueuedActions().then(instructions => callback(instructions));
}

function executeActions(driver) {
    return new Promise(((resolve, reject) => {
        (function getAndExecute() {
            driver.executeAsyncScript(_getQueuedActions).then(actions => {
                return Action.execute(actions, driver).then(
                    remoteLog => {
                        if (remoteLog) {
                            resolve(remoteLog);
                        } else {
                            getAndExecute();
                        }
                    }
                );
            }).catch(e => {
                reject(e);
            });
        }());
    }));
}

async function executeTestList(testList, driver, capabilityName, logger, options, remoteLogs) {
    // eslint-disable-next-line no-restricted-syntax
    for (const test of testList) {
        if (test.type === testTypes.remote) {
            // eslint-disable-next-line no-await-in-loop
            await execute(test, logger, options, driver);
        } else {
            const testId = `${capabilityName}:${test.id}`;
            logger.log('smoke:progress', 0, [`${testId}: started`]);
            // eslint-disable-next-line no-await-in-loop
            await driver.executeScript(exec, test.id, options.remoteOptions || 0).then(testId => {
                return executeActions(driver).then(log => {
                    log.id = testId;
                    remoteLogs.push(log);
                    if (log.passCount + log.failCount + log.scaffoldFailCount === 0) {
                        logger.log('smoke:warning', 0, [`remote test [${test.id}] did not cause any tests to run`, noTestsHint]);
                    }
                    const msg = `[${testId}] pass: ${log.passCount}, fail: ${log.failCount}, scaffold fail: ${log.scaffoldFailCount}`;
                    logger.log('smoke:progress', 0, [msg]);
                    logger.log('smoke:remote-log', 0, [log], true);
                });
            });
        }
    }
    return true;
}

function doBrowser(builder, capabilityName, testList, logger, options, remoteLogs) {
    let driver;
    return builder.build()
        .then(_driver => {
            driver = _driver;
        })
        .then(() => {
            return driver.get(testList[0].remoteUrl || options.remoteUrl);
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                // it is possible that smoke is not defined on the remote browser yet; give it a chance (2s) to load...
                let retryCount = 50;
                (function checkRemoteReady() {
                    driver.executeAsyncScript(waitForLoaderIdle)
                        .then(
                            resolve
                        )
                        .catch(() => {
                            if (--retryCount) {
                                (new Promise(resolve => {
                                    setTimeout(resolve, 20);
                                })).then(checkRemoteReady);
                            } else {
                                reject();
                            }
                        });
                }());
            });
        })
        .then(loadingError => {
            if (loadingError) {
                logger.log('smoke:error', 0, ['remote encountered an error loading test resources']);
                throw new Error('error loading test resources on remote browser');
            }
        })
        .then(() => {
            return driver.executeScript(resetLog);
        })
        .then(startupLog => {
            startupLog.id = 'startup-log';
            remoteLogs.push(startupLog);
        })
        .then(() => {
            return executeTestList(testList.slice(), driver, capabilityName, logger, options, remoteLogs);
        })
        .then(() => {
            return driver.quit().then(() => true);
        })
        .catch(e => {
            try {
                logger.log('smoke:error', 0, ['remote crashed, capability aborted', e]);
                return driver.quit().then(() => true);
            } catch (e) {
                logger.log('smoke:error', 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
                return Promise.resolve(false);
            }
        })
        .catch(e => {
            logger.log('smoke:error', 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
            return false;
        });
}

async function runLocal(_testList, logger, options) {
    // execute each test in the testList
    const testList = _testList.slice();
    if (options.concurrent) {
        return Promise.all(testList.map(test => execute(test, logger, options).promise)).then(() => logger);
    } else {
        for (const test of testList) {
            if (logger.unexpected) {
                break;
            }
            // eslint-disable-next-line no-await-in-loop
            await execute(test, logger, options);
        }
        if (options.remotelyControlled) {
            queueActions(Action.action(Action.action.testComplete, logger.getResults()));
            logger.reset();
        }
        return (logger);
    }
}

async function runRemote(testList, logger, options, capabilities) {
    // for each capability...
    //     configure a driver
    //     for each test
    //         if test.type===testTypes.both || browser
    //              then use the driver to call smoke.runRemote for test.id
    //         if test.type===remote
    //              call smoke.run, pass driver to test
    const remoteLogs = [];
    // eslint-disable-next-line global-require,import/no-unresolved
    const { Builder } = require('selenium-webdriver');
    while (capabilities.length) {
        let [capName, caps] = capabilities.pop();
        logger.log(['smoke:progress'], 0, [`starting capability:${capName}`]);
        caps = { ...caps };
        const provider = caps.provider;
        delete caps.provider;
        const builder = (new Builder()).withCapabilities(caps);

        // this is necessary for, at least, firefox, since firefox complains about self-signed certs
        if (/firefox/.test(capName)) {
            builder.getCapabilities().setAcceptInsecureCerts(true);
        }

        if (provider) {
            builder.usingServer(options.provider.url || provider.url);
        }
        // eslint-disable-next-line no-await-in-loop
        await doBrowser(builder, capName, testList, logger, options, remoteLogs);
    }

    // compute the totals across all remote logs
    const totals = { totalCount: 0, passCount: 0, failCount: 0, scaffoldFailCount: 0 };
    const keys = Object.keys(totals);
    remoteLogs.forEach(log => (keys.forEach(k => (totals[k] += (k in log ? log[k] : 0)))));
    Object.assign(remoteLogs, totals);
    return remoteLogs;
}

function run(tests, testInstruction, logger, options, remote, resetLog) {
    // run the test(s) given by testInstruction that are appropriate for the platform (node or browser) and
    // the location (remote or local). Log the output to logger, and control parts of the process by options
    // Note that the test functions can use options since it is at this.options when a test function is called
    if (resetLog) {
        logger.reset();
    }
    const testList = getTestList(testInstruction, tests, remote);
    if (!testList.length) {
        logger.log('smoke:info', 0, ['run: no tests run', noTestsHint]);
        return Promise.resolve(false);
    }
    const testUid = getTestUid();
    let theRunPromise;
    if (remote) {
        const [capabilities] = getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, logger);
        if (!capabilities.length) {
            logger.log('smoke:info', 0, ['run: running remote tests, but no capabilities to test']);
            return Promise.resolve(false);
        }
        theRunPromise = runRemote(testList, logger, options, capabilities);
    } else {
        theRunPromise = runLocal(testList, logger, options);
    }
    theRunPromise.testUid = testUid;
    return theRunPromise;
}

function runDefault(tests, options, logger) {
    const messages = [];

    function log(title, batch) {
        messages.push(title);
        messages.push(`        tests:${batch.totalCount}`);
        messages.push(`         pass:${batch.passCount}`);
        messages.push(`         fail:${batch.failCount}`);
        messages.push(`scaffold fail:${batch.scaffoldFailCount}`);
    }

    function print() {
        if (!options.noDefaultPrint) {
            let html = '';
            messages.forEach(msg => {
                // eslint-disable-next-line no-console
                console.log(msg);
                html += `<p>${msg}</p>`;
            });
            if (typeof document !== 'undefined') {
                const node = document.getElementById('bd-smoke-results');
                node && (node.innerHTML = html);
            }
        }
    }

    let remote;
    if (isNode) {
        if (options.remote) {
            logger.log('smoke:info', 0, ['"remote" config option is true, therefore running remote tests']);
            remote = true;
        } else if (options.cap && options.cap.length) {
            logger.log('smoke:info', 0, ['"cap" config option(s) given, therefore running remote tests']);
            remote = true;
        } else if (options.capPreset && options.capPreset.length) {
            logger.log('smoke:info', 0, ['"capPreset" config option(s) given, therefore running remote tests']);
            remote = true;
        } else if (tests.some(test => test.type === testTypes.node || test.type === testTypes.both)) {
            logger.log('smoke:info', 0, ['running native node tests on node']);
            remote = false;
        } else if (tests.some(test => test.type !== testTypes.node)) {
            logger.log('smoke:info', 0, ['no native node tests, but browser and/or remote tests found, therefore running remote tests']);
            remote = true;
        } else {
            logger.log('smoke:info', 0, ['no tests found that can run on node']);
            return Promise.resolve({ ranRemote: false, localLog: logger });
        }
    } else if (tests.some(test => test.type === testTypes.browser || test.type === testTypes.both)) {
        logger.log('smoke:info', 0, ['running browser tests']);
        remote = false;
    } else {
        logger.log('smoke:info', 0, ['no tests found that can run on the browser']);
        return Promise.resolve({ ranRemote: false, localLog: logger });
    }

    if (remote) {
        return run(tests, '*', logger, options, true, false).then(remoteLogs => {
            if (remoteLogs) {
                // eslint-disable-next-line no-console
                !options.noDefaultPrint && console.log(stringify(remoteLogs));
                log('Cumulative Remote Results:', remoteLogs);
                log('Local Results:', logger);
                print();
            } else {
                logger.log('smoke:unexpected', 0, ['remote tests did not complete normally']);
            }
            return { ranRemote: true, localLog: logger, remoteLogs };
        });
    } else {
        return run(tests, '*', logger, options, false, false).then(logger => {
            log('Results:', logger);
            print();
            return { ranRemote: false, localLog: logger };
        });
    }
}

export {queueActions, getQueuedActions, run, runDefault, getCapabilities};
