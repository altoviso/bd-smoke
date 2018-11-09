import {isBrowser, isNode} from "./environment.js";
import Timer from "./Timer.js";
import Logger from "./Logger.js";
import getLoadControlClass from "./LoadControl.js";
import Action from "./Action.js";
import stringify from "./stringify.js";
import {resetAssertCount, bumpAssertCount, getAssertCount, assert} from "./assert.js";
import {getUrlArgs, argsToOptions, processOptions} from "./config.js";
import testTypes from "./testTypes.js";
import {defTest, orderTests} from "./defTests.js";
import {queueActions, getQueuedActions, run, runDefault, getCapabilities} from "./runners.js";

let defaultOptions = {
	nameSeparator: "/",
	quitOnFirstFail: false,
	include: [],
	logExcludes: true,
	concurrent: false,
	autoRun: true,
	load: [],
	provider: false,
	cap: [],
	capPreset: [],
	user: {}
};

// the test stack which is populated with defTest, defBrowserTest, defBrowserTestRef, defNodeTest, and defRemoteTest
let smokeTests = [];

let LoadControl = getLoadControlClass(
	// log
	(...args) => (smoke.logger.log("smoke:load", 0, args)),

	// onResourceLoadComplete
	(control) => {
		smokeTests.forEach(test => {
			if(!("order" in test)){
				test.order = 10000 + control.order;
			}
		});
	},

	// onLoadingComplete
	() => (smokeTests = orderTests(smokeTests)),
);

function pause(ms){
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

async function loaderIdle(){
	while(!LoadControl.loadingError){
		let loadingPromise = LoadControl.loadingPromise;
		await loadingPromise;
		await pause(20);
		if(loadingPromise === LoadControl.loadingPromise){
			break;
		}
	}
	return LoadControl.loadingError;
}


let smoke = {
	get oem(){
		return "altoviso";
	},
	get version(){
		return "1.0.1";
	},
	isBrowser: isBrowser,
	isNode: isNode,

	// eslint-disable-next-line no-undef
	isAmd: isBrowser && typeof define !== "undefined" && define.amd,

	options: defaultOptions,

	Timer,
	Logger,
	logger: new Logger(defaultOptions),

	testTypes,
	get tests(){
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

	get loadingPromise(){
		return LoadControl.loadingPromise.proxy;
	},

	get loaderIdle(){
		return loaderIdle();
	},

	get loadedResources(){
		let result = [];
		for(const control of LoadControl.injections.values()){
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

	get loadedResourcesCount(){
		return LoadControl.injections.size;
	},

	getLoadedResource(resourceName){
		let control = LoadControl.injections.get(resourceName);
		if(control){
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

	get loadingComplete(){
		return LoadControl.loadingPromise.resolved;
	},

	get loadingError(){
		return LoadControl.loadingError;
	},

	argsToOptions,

	getUrlArgs,
	processOptions,

	configureBrowser(){
		return smoke.configure(smoke.getUrlArgs());
	},

	configure(argsOrOptions, dest){
		let options = Array.isArray(argsOrOptions) ? smoke.argsToOptions(argsOrOptions) : argsOrOptions;
		dest = dest || smoke.options;
		smoke.processOptions(options, dest);
		if(dest === smoke.options){
			if(smoke.options.remotelyControlled){
				delete smoke.options.concurrent;
			}
			smoke.logger.updateOptions(dest);
		}
		(dest.load || []).slice().forEach(resource => {
			if(/\.css/i.test(resource)){
				if(isNode){
					smoke.logger.log("smoke:info", 0, ["CSS resource ignored on node"]);
				}else{
					smoke.injectCss(resource);
				}
			}else if(smoke.isAmd && !/\.[^./]+$/.test(resource)){
				// assume resource is an AMD module if an AMD loader is present and resource does not have a file type
				smoke.loadAmdModule(resource);
			}else if(isNode){
				if(/\.es6\.js$/.test(resource)){
					smoke.logger.log("smoke:info", 0, ["es6 resource ignored on node"]);
				}else{
					smoke.loadNodeModule(resource);
				}
			}else{
				smoke.injectScript(resource);
			}
		});

		return smoke.loadingPromise;
	},

	checkConfig(options){
		options = Object.assign({}, options || smoke.options);
		options.capabilities = getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, smoke.logger)[0];
		options.load = [];
		for(const control of LoadControl.injections.values()){
			options.load.push(
				control.resourceName + ":" +
				(control.status === false ? "failed" : (control.status === true ? "loaded" : control.status))
			);
		}
		options.tests = smoke.tests.map(test => test.id);
		// eslint-disable-next-line no-console
		console.log(isNode ? smoke.stringify(options) : options);
	},

	defTest(...args){
		// add a test definition that works on both the browser and node
		defTest(testTypes.both, smoke.logger, smokeTests, ...args);
	},

	defBrowserTest(...args){
		defTest(testTypes.browser, smoke.logger, smokeTests, ...args);
	},

	defBrowserTestRef(...args){
		// define test ids that can be run remotely without having to load those tests locally
		// this is important because some tests use JS6 import/export which node cannot consume
		args.forEach(test => {
			if(typeof test !== "string"){
				smoke.logger.log("smoke:bad-test-spec", 0, ["arguments to defBrowserTestRef must be strings"]);
			}else{
				defTest(testTypes.browser, smoke.logger, smokeTests, {id: test, test: _ => _});
			}
		});
	},

	defNodeTest(...args){
		// add a test definition that can _only_ run in node
		defTest(testTypes.node, smoke.logger, smokeTests, ...args);
	},

	defRemoteTest(...args){
		// add a test definition controls a remote browser
		defTest(testTypes.remote, smoke.logger, smokeTests, ...args);
	},

	queueActions: queueActions,
	getQueuedActions: getQueuedActions,

	run(testInstruction, logger, options, remote, resetLog){
		// autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
		smoke.options.autoRun = false;
		return run(smokeTests, testInstruction, logger || options.logger || smoke.logger, options || smoke.options, remote, resetLog);

	},

	runDefault(){
		// autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
		if(smoke.options.checkConfig){
			smoke.checkConfig();
			smoke.options.autoRun = false;
			return Promise.resolve(smoke.logger);
		}else{
			smoke.options.autoRun = false;
			return runDefault(smokeTests, smoke.options, smoke.options.logger || smoke.logger);
		}
	}

};

async function defaultStart(){
	if(!smoke.options.autoRun){
		return;
	}

	let options = smoke.argsToOptions(isNode ? process.argv.slice(2) : smoke.getUrlArgs());

	// set LoadControl.injectRelativePrefix...
	if(options.root){
		let root = options.root;
		LoadControl.injectRelativePrefix = /\/$/.test(root) ? root : root + "/";
	}else if(isBrowser){
		if(/\/node_modules\/bd-smoke\/browser-runner(-amd)?\.html$/.test(window.location.pathname)){
			LoadControl.injectRelativePrefix = options.root = "../../";
		}else{
			smoke.logger.log("smoke:info", 0, ["smoke not being run by the default runner; therefore no idea how to set root; suggest you set it explicitly"]);
		}
	}else{
		LoadControl.injectRelativePrefix = options.root = process.cwd() + "/";
	}
	smoke.logger.log("smoke:info", 0, ["root directory for relative injection paths:" + LoadControl.injectRelativePrefix]);

	await smoke.configure(options);
	if(!smoke.loadedResourcesCount){
		await smoke.configure({load: "./smoke.config." + (smoke.isUMD || smoke.isGlobal ? "js" : "es6.js")});
	}

	// wait until nothing was loaded for 20ms; this gives loaded files a chance to use autoRun
	// as they see fit...for example, loading "A" may cause loading "B" if autoRun is true (as so forth)
	// loaded files can set autoRun to false to prevent the behavior below
	let loadError = await loaderIdle();
	if(!loadError){
		if(!smoke.loadingError && smoke.options.autoRun && !smoke.options.remotelyControlled){
			let result = await smoke.runDefault();
			if(smoke.options.checkConfig){
				smoke.logger.log("smoke:exitCode", 0, ["only printed configuration, no tests ran", 0]);
				isNode && process.exit(0);
			}else if(result.ranRemote){
				let exitCode = result.remoteLogs.failCount + result.remoteLogs.scaffoldFailCount + result.localLog.failCount + result.localLog.scaffoldFailCount;
				smoke.logger.log("smoke:exitCode", 0, ["default tests run on remote browser(s) completed", exitCode]);
				isNode && process.exit(exitCode);
			}else{
				let exitCode = result.localLog.failCount + result.localLog.scaffoldFailCount;
				smoke.logger.log("smoke:exitCode", 0, ["default tests run locally completed", exitCode]);
				isNode && process.exit(exitCode);
			}
		}
	}else{
		isNode && process.exit(-1);
	}
}

// let another process that loaded smoke take over and set autoRun to false to prevent the default behavior
// TODO: this might not work in AMD since smoke could be loaded as a dependent of the module that sets autoRun to false
// and other modules may have to be loaded before that module
smoke.pause(10).then(defaultStart);

export default smoke;
