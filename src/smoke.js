import {isBrowser, isNode} from './environment.js';
import Timer from './Timer.js';
import Logger from './Logger.js';
import getLoadControlClass from './LoadControl.js';
import Action from './Action.js';
import stringify from './stringify.js';
import {resetAssertCount, bumpAssertCount, getAssertCount, assert} from './assert.js';
import {getUrlArgs, argsToOptions, processOptions} from './config.js';
import testTypes from './testTypes.js';
import {defTest, orderTests} from './defTests.js';
import {queueActions, getQueuedActions, run, runDefault, getCapabilities} from './runners.js';

const defaultOptions = {
    nameSeparator: '/',
    quitOnFirstFail: false,
    include: [],
    logExcludes: true,
    concurrent: false,
    autoRun: false,
    load: [],
    provider: false,
    capabilities: isNode ? require(`${__dirname}/src/capabilities.js`) : {},
    cap: [],
    capPreset: [],
    user: {}
};

// the test stack which is populated with defTest, defBrowserTest, defBrowserTestRef, defNodeTest, and defRemoteTest
let smokeTests = [];

const LoadControl = getLoadControlClass(
    // log
    // eslint-disable-next-line no-use-before-define
    (...args) => (smoke.logger.log('smoke:load', 0, args)),

    // onResourceLoadComplete
    control => {
        smokeTests.forEach(test => {
            if (!('order' in test)) {
                test.order = 10000 + control.order;
            }
        });
    },

    // onLoadingComplete
    () => (smokeTests = orderTests(smokeTests)),
);

function pause(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function loaderIdle() {
    while (!LoadControl.loadingError) {
        const loadingPromise = LoadControl.loadingPromise;
        // eslint-disable-next-line no-await-in-loop
        await loadingPromise;
        // eslint-disable-next-line no-await-in-loop
        await pause(20);
        if (loadingPromise === LoadControl.loadingPromise) {
            break;
        }
    }
    return LoadControl.loadingError;
}

function processArgs(defaults, args) {
    const options = smoke.argsToOptions(args);
    Object.keys(defaults).forEach(k => {
        if (options[k] === undefined) {
            options[k] = defaults[k];
        }
    });
    return options;
}

const smoke = {
    get oem() {
        return 'altoviso';
    },
    get version() {
        return '1.5.0';
    },
    isBrowser,
    isNode,

    // eslint-disable-next-line no-undef
    isAmd: isBrowser && typeof define !== 'undefined' && define.amd,

    options: defaultOptions,

    Timer,
    Logger,
    logger: new Logger(defaultOptions),

    testTypes,
    get tests() {
        return smokeTests;
    },

    resetAssertCount,
    bumpAssertCount,
    getAssertCount,
    assert,

    pause,

    stringify,

    Action,

    injectScript: LoadControl.injectScript,
    injectCss: LoadControl.injectCss,
    loadNodeModule: LoadControl.loadNodeModule,
    loadAmdModule: LoadControl.loadAmdModule,

    get loadingPromise() {
        return LoadControl.loadingPromise.proxy;
    },

    get loaderIdle() {
        return loaderIdle();
    },

    get loadedResources() {
        const result = [];
        for (const control of LoadControl.injections.values()) {
            result.push({
                resource: control.resourceName,
                loadedName: control.loadedName,
                status: control.status,
                promise: control.promise.proxy,
                errorInfo: control.errorInfo
            });
        }
        return result;
    },

    get loadedResourcesCount() {
        return LoadControl.injections.size;
    },

    getLoadedResource(resourceName) {
        let control = LoadControl.injections.get(resourceName);
        if (control) {
            control = {
                resource: control.resourceName,
                loadedName: control.loadedName,
                status: control.status,
                promise: control.promise.proxy,
                errorInfo: control.errorInfo
            };
        }
        return control;
    },

    get loadingComplete() {
        return LoadControl.loadingPromise.resolved;
    },

    get loadingError() {
        return LoadControl.loadingError;
    },

    argsToOptions,

    getUrlArgs,
    processOptions,

    configureBrowser(defaults) {
        defaults = defaults || {};
        if (!defaults.root && /\/node_modules\/bd-smoke\/$/.test(window.location.pathname)) {
            // set the root directory to the project root if running from node_modules
            defaults.root = window.location.pathname.replace(/^(.+)\/node_modules\/bd-smoke\/(.+)$/, '$1/');
        }
        return smoke.configure(processArgs(defaults, smoke.getUrlArgs()));
    },

    configureNode(defaults) {
        defaults = defaults || {};
        const smokeFilespec = process.argv[1];
        if (!defaults.root) {
            if (/\/node_modules\/bd-smoke\/$/.test(smokeFilespec)) {
                // set the root directory to the project root if running from node_modules
                defaults.root = smokeFilespec.replace(/^(.+)\/node_modules\/bd-smoke\/(.+)$/, '$1/');
            } else {
                defaults.root = process.cwd();
            }
        }
        return smoke.configure(processArgs(defaults, process.argv.slice(2)));
    },

    configure(options, dest) {
        dest = dest || smoke.options;
        if (options.root) {
            const root = options.root;
            LoadControl.injectRelativePrefix = /\/$/.test(root) ? root : `${root}/`;
        }
        smoke.processOptions(options, dest);
        if (dest === smoke.options) {
            if (smoke.options.remotelyControlled) {
                delete smoke.options.concurrent;
            }
            smoke.logger.updateOptions(dest);
        }
        (dest.load || []).slice().forEach(resource => {
            if (/\.css/i.test(resource)) {
                if (isNode) {
                    smoke.logger.log('smoke:info', 0, ['CSS resource ignored on node']);
                } else {
                    smoke.injectCss(resource);
                }
            } else if (smoke.isAmd && !/\.js$/.test(resource)) {
                // assume resource is an AMD module if an AMD loader is present and resource does not have a .js file type
                smoke.loadAmdModule(resource);
            } else if (isNode) {
                if (/\.es6\.js$/.test(resource)) {
                    smoke.logger.log('smoke:info', 0, ['es6 resource ignored on node']);
                } else {
                    smoke.loadNodeModule(resource);
                }
            } else {
                smoke.injectScript(resource);
            }
        });

        return smoke.loadingPromise;
    },

    checkConfig(options) {
        options = { ...options || smoke.options };
        options.capabilities =
            getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, smoke.logger)[0];
        options.load = [];
        for (const control of LoadControl.injections.values()) {
            options.load.push(
                `${control.resourceName}:${
                    control.status === false ? 'failed' : (control.status === true ? 'loaded' : control.status)}`
            );
        }
        options.tests = smoke.tests.map(test => test.id);
        // eslint-disable-next-line no-console
        console.log(isNode ? smoke.stringify(options) : options);
    },

    defTest(...args) {
        // add a test definition that works on both the browser and node
        defTest(testTypes.both, smoke.logger, smokeTests, ...args);
    },

    defBrowserTest(...args) {
        defTest(testTypes.browser, smoke.logger, smokeTests, ...args);
    },

    defBrowserTestRef(...args) {
        // define test ids that can be run remotely without having to load those tests locally
        // this is important because some tests use JS6 import/export which node cannot consume
        args.forEach(test => {
            if (typeof test !== 'string') {
                smoke.logger.log('smoke:bad-test-spec', 0, ['arguments to defBrowserTestRef must be strings']);
            } else {
                defTest(testTypes.browser, smoke.logger, smokeTests, { id: test, test: _ => _ });
            }
        });
    },

    defNodeTest(...args) {
        // add a test definition that can _only_ run in node
        defTest(testTypes.node, smoke.logger, smokeTests, ...args);
    },

    defRemoteTest(...args) {
        // add a test definition controls a remote browser
        defTest(testTypes.remote, smoke.logger, smokeTests, ...args);
    },

    queueActions,
    getQueuedActions,

    run(testInstruction, logger, options, remote, resetLog) {
        // autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
        smoke.options.autoRun = false;
        return run(
            smokeTests,
            testInstruction,
            logger || options.logger || smoke.logger,
            options || smoke.options,
            remote, resetLog
        );
    },

    runDefault() {
        // autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
        if (smoke.options.checkConfig) {
            smoke.checkConfig();
            smoke.options.autoRun = false;
            return Promise.resolve(smoke.logger);
        } else {
            smoke.options.autoRun = false;
            return runDefault(smokeTests, smoke.options, smoke.options.logger || smoke.logger);
        }
    },

    async defaultStart(configPromise) {
        if (configPromise) {
            await configPromise;
        }
        if (!smoke.loadedResourcesCount) {
            await smoke.configure({ load: './smoke.config.js' });
        }

        const loadError = await loaderIdle();
        if (!loadError) {
            if (!smoke.loadingError && smoke.options.autoRun && !smoke.options.remotelyControlled) {
                const result = await smoke.runDefault();
                if (smoke.options.checkConfig) {
                    smoke.logger.log('smoke:exitCode', 0, ['only printed configuration, no tests ran', 0]);
                    isNode && process.exit(0);
                } else if (result.ranRemote) {
                    const exitCode = result.remoteLogs.failCount +
                        result.remoteLogs.scaffoldFailCount +
                        result.localLog.failCount +
                        result.localLog.scaffoldFailCount;
                    smoke.logger.log('smoke:exitCode', 0, ['default tests run on remote browser(s) completed', exitCode]);
                    isNode && process.exit(exitCode);
                } else {
                    const exitCode = result.localLog.failCount + result.localLog.scaffoldFailCount;
                    smoke.logger.log('smoke:exitCode', 0, ['default tests run locally completed', exitCode]);
                    isNode && process.exit(exitCode);
                }
            }
        } else {
            isNode && process.exit(-1);
        }
    }
};

export {smoke};
