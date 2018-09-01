import {isBrowser, isNode} from "./environment.js";
import testTypes from "./testTypes.js";
import Action from "./Action.js";
import stringify from "./stringify.js";
import {execute} from "./execute.js"

let noTestsHint = "check for typos in URL query/command line args, test ids, defBrowserTestRef args, the \"include\" option, and/or include options that don't include anything that is loaded";

let testUid = 0;

function getTestUid(){
	return (new Date()).getTime() + ":" + (++testUid);
}

function getTestList(testInstruction, tests, remoteTests){
	testInstruction = /^\//.test(testInstruction) ? new RegExp(testInstruction) : testInstruction;
	let testList;
	if(testInstruction === "*"){
		// run everything in tests
		testList = tests.slice();
	}else if(testInstruction instanceof RegExp){
		// run anything in tests where test.id matches the reg exp given by testInstruction
		testList = tests.filter(test => {
			return testInstruction.test(test.id);
		});
	}else if(typeof testInstruction === "string"){
		// run only the test where test.id===testInstruction
		testList = tests.filter(test => {
			return test.id === testInstruction;
		});
	}else{
		// testInstruction must be a test object
		testList = Array.isArray(testInstruction) ? testInstruction : [testInstruction];
	}

	function filter(test){
		if(remoteTests){
			return test.type === testTypes.both || test.type === testTypes.browser || test.type === testTypes.remote;
		}else{
			return test.type === testTypes.both || (isBrowser && test.type === testTypes.browser) || (isNode && test.type === testTypes.node)
		}
	}

	return testList.filter(filter);
}

function getCapabilities(capabilities, provider, caps, capPresets, logger){
	let result = {};
	let error = false;

	let log = (msg) => {
		logger.log("info", "capabilities", [msg]);
		error = true;
	};

	if(!capabilities){
		log("no capabilities configured");
		return [[], false];
	}

	// get all the capabilities
	if(caps && caps.length){
		if(caps.some(cap => cap === "*")){
			Object.keys(capabilities).forEach(cap => (result[cap] = capabilities[cap]));
		}else{
			caps.forEach(cap => {
				if(capabilities[cap]){
					result[cap] = capabilities[cap];
				}else{
					log('capability "' + cap + '" does not exist in capabilities');
				}
			});
		}
	}

	// now the presets
	if(capPresets && capPresets.length){
		if(!capabilities.presets){
			log('capPreset given but no presets in capabilities');
		}else{
			capPresets.forEach(_preset => {
				let preset = capabilities.presets[_preset];
				if(!preset){
					log('capPreset "' + _preset + '" given that does not exist in capabilites presets');
				}else if(!Array.isArray(preset)){
					log('capPreset "' + _preset + '" must be an array in capabilites presets');
				}else{
					preset.forEach(cap => {
						if(capabilities[cap]){
							result[cap] = capabilities[cap];
						}else{
							log('capability "' + cap + '" given in presets does not exist in capabilities');
						}
					});
				}
			});
		}
	}

	if(!error && !Object.keys(result).length && capabilities.presets && capabilities.presets.default && Array.isArray(capabilities.presets.default)){
		capabilities.presets.default.forEach(cap => {
			if(capabilities[cap]){
				result[cap] = capabilities[cap];
			}else{
				log('capability "' + cap + '" given in presets does not exist in capabilities');
			}
		});
	}

	// now results back into an array, filter for provider, and sort...
	let _results = [];
	Object.keys(result).map(key => {
		let cap = result[key];
		if(!provider || (cap.provider && cap.provider.name === provider)){
			_results.push([key, cap]);
		}
	});
	_results.sort((lhs, rhs) => {
		return lhs[1].smokeOrder < rhs[1].smokeOrder ? -1 : (lhs[1].smokeOrder > rhs[1].smokeOrder ? 1 : 0);
	});

	return [error ? [] : _results, error];
}

let pendingActions = [];

function queueActions(action, args){
	let dest = pendingActions;
	if(Array.isArray(action)){
		// an array of [action, args] pairs
		action.forEach(arg => dest.push(
			[arg[0].id, arg[1]]
		));
	}else{
		dest.push([action.id, args])
	}
	console.log('queueActions:', pendingActions);
}

function getQueuedActions(){
	let _pendingActions = [];

	function get(){
		if(pendingActions.length){
			_pendingActions = pendingActions;
			pendingActions = [];
			console.log('getQueuedActions:', pendingActions);
			return true;
		}else{
			return false;
		}
	}

	let tryCount = 20;
	return new Promise(function(resolve){
		(function check(){
			if(get() || tryCount < 0){
				resolve(_pendingActions);
			}else{
				tryCount--;
				setTimeout(check, 50);
			}
		})();
	})
}

function waitForLoaderIdle(callback){
	smoke.loaderIdle.then(loadError => callback(loadError));
}

function exec(testId, options, callback){
	return smoke.run(testId, 0, options, false, true).testUid;
}

function resetLog(){
	return smoke.logger.reset();
}

function _getQueuedActions(callback){
	smoke.getQueuedActions().then(instructions => callback(instructions));
}

function executeActions(driver){
	return new Promise(function(resolve, reject){
		(function getAndExecute(){
			driver.executeAsyncScript(_getQueuedActions).then(actions => {
				return Action.execute(actions, driver).then(
					remoteLog => {
						if(remoteLog){
							resolve(remoteLog);
						}else{
							getAndExecute();
						}
					}
				);
			}).catch(e => {
				reject(e);
			})
		})();
	});
}

function doBrowser(builder, capabilityName, testList, logger, options, remoteLogs){
	// TODO: make the URL an option
	//let URL = 'http://localhost:3002/node_modules/bd-smoke/browser-runner.html?remotelyControlled';
	let URL = 'http://localhost:8080/altoviso/bd-smoke/browser-runner.html?remotelyControlled&root=./';

	let driver;
	return builder.build().then(_driver => {
		driver = _driver;
	}).then(_ => {
		return driver.get(URL);
	}).then(_ => {
		return driver.executeAsyncScript(waitForLoaderIdle);
	}).then(loadingError => {
		if(loadingError){
			logger.log("smoke:error", 0, ["remote encountered an error loading test resources"]);
			throw new Error("error loading test resources on remote browser");
		}
	}).then(_ => {
		return driver.executeScript(resetLog)
	}).then(startupLog => {
		startupLog.id = "startup-log";
		remoteLogs.push(startupLog);
	}).then(_ => {
		let testList_ = testList.slice();
		return new Promise(function(resolve, reject){
			(function executeTestList(){
				if(!testList_.length){
					resolve();
				}else{
					let test = testList_.shift();
					if(test.type === testTypes.remote){
						execute(test, logger, options, driver).then(_ => {
							executeTestList();
						});
					}else{
						let testId = capabilityName + ":" + test.id;
						logger.log("smoke:progress", 0, [testId + ": started"]);
						driver.executeScript(exec, test.id, options.remoteOptions || 0).then(testUid => {
							return executeActions(driver).then(log => {
								log.id = testId;
								remoteLogs.push(log);
								if(log.passCount + log.failCount + log.scaffoldFailCount === 0){
									logger.log("smoke:warning", 0, ["remote test [" + test.id + "] did not cause any tests to run", noTestsHint]);
								}
								let msg = `[${testId}] pass: ${log.passCount}, fail: ${log.failCount}, scaffold fail: ${log.scaffoldFailCount}`;
								logger.log("smoke:progress", 0, [msg]);
								logger.log("smoke:remote-log", 0, [log], true);
							});
						}).then(_ => {
							executeTestList();
						}).catch(e => {
							reject(e)
						})
					}
				}
			})();
		});
	}).then(_ => {
		return driver.quit().then(_ => true);
	}).catch(e => {
		try{
			logger.log("smoke:error", 0, ["remote crashed, capability aborted", e]);
			return driver.quit().then(_ => true);
		}catch(e){
			logger.log("smoke:error", 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
			return Promise.resolve(false);
		}
	}).catch(e => {
		logger.log("smoke:error", 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
		return false;
	})
}

function runLocal(_testList, logger, options){
	// execute each test in the testList
	let testList = _testList.slice();
	if(options.concurrent){
		return Promise.all(testList.map(test => execute(test, logger, options))).then(_ => logger);
	}else{
		return new Promise((resolve) => {
			(function finish(){
				if(testList.length && !logger.unexpected){
					execute(testList.shift(), logger, options).then(_ => {
						finish();
					});
				}else{
					queueActions(Action.action(Action.action.testComplete, logger.getResults()));
					resolve(logger);
				}
			})();
		});
	}
}

function runRemote(testList, logger, options, capabilities){
	// for each capability...
	//     configure a driver
	//     for each test
	//         if test.type===testTypes.both || browser
	//              then use the driver to call smoke.runRemote for test.id
	//         if test.type===remote
	//              call smoke.run, pass driver to test
	let remoteLogs = [];
	const {Builder} = require('selenium-webdriver');


	function doNextCapability(){
		let [capName, caps] = capabilities.pop();
		logger.log(["smoke:progress"], 0, ["starting capability:" + capName]);
		caps = Object.assign({}, caps);
		let provider = caps.provider;
		delete caps.provider;
		let builder = (new Builder()).withCapabilities(caps);
		if(provider){
			builder.usingServer(options.provider.url || provider.url);
		}
		return doBrowser(builder, capName, testList, logger, options, remoteLogs).then(
			_ => (capabilities.length ? doNextCapability() : remoteLogs)
		);
	}

	return doNextCapability().then(_ => {
		// compute the totals across all remote logs
		let totals = {totalCount: 0, passCount: 0, failCount: 0, scaffoldFailCount: 0};
		let keys = Object.keys(totals);
		remoteLogs.forEach(log => (keys.forEach(k => (totals[k] += (k in log ? log[k] : 0)))));
		Object.assign(remoteLogs, totals);
		return remoteLogs;
	});
}

function run(tests, testInstruction, logger, options, remote, resetLog){
	// run the test(s) given by testInstruction that are appropriate for the platform (node or browser) and
	// the location (remote or local). Log the output to logger, and control parts of the process by options
	// Note that the test functions can use options since it is at this.options when a test function is called
	if(resetLog){
		logger.reset();

	}
	let testList = getTestList(testInstruction, tests, remote);
	if(!testList.length){
		logger.log("smoke:info", 0, ["run: no tests run", noTestsHint]);
		return Promise.resolve(false)
	}
	let testUid = getTestUid();
	let theRunPromise;
	if(remote){
		let [capabilities, capabilitiesError] = getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, logger)
		if(!capabilities.length){
			logger.log("smoke:info", 0, ["run: running remote tests, but no capabilities to test"]);
			return Promise.resolve(false)
		}
		theRunPromise = runRemote(testList, logger, options, capabilities);
	}else{
		theRunPromise = runLocal(testList, logger, options);
	}
	theRunPromise.testUid = testUid;
	return theRunPromise;
}

function runDefault(tests, options, logger){
	let messages = [];

	function log(title, batch){

		messages.push(title);
		messages.push("        tests:" + batch.totalCount);
		messages.push("         pass:" + batch.passCount);
		messages.push("         fail:" + batch.failCount);
		messages.push("scaffold fail:" + batch.scaffoldFailCount);
	}

	function print(){
		if(!options.noDefaultPrint){
			let html = "";
			messages.forEach(msg => {
				console.log(msg);
				html += "<p>" + msg + "</p>"
			});
			if(typeof document !== "undefined"){
				let node = document.getElementById("bd-smoke-results");
				node && (node.innerHTML = html);
			}
		}
	}

	let remote;
	if(isNode){
		if(options.remote){
			logger.log("smoke:info", 0, ['"remote" config option is true, therefore running remote tests']);
			remote = true;
		}else if(options.cap && options.cap.length){
			logger.log("smoke:info", 0, ['"cap" config option(s) given, therefore running remote tests']);
			remote = true;
		}else if(options.capPreset && options.capPreset.length){
			logger.log("smoke:info", 0, ['"capPreset" config option(s) given, therefore running remote tests']);
			remote = true;
		}else if(tests.some(test => test.type === testTypes.node || test.type === testTypes.both)){
			logger.log("smoke:info", 0, ['running native node tests on node']);
			remote = false;
		}else if(tests.some(test => test.type !== testTypes.node)){
			logger.log("smoke:info", 0, ['no native node tests, but browser and/or remote tests found, therefore running remote tests'])
			remote = true;
		}else{
			logger.log("smoke:info", 0, ['no tests found that can run on node']);
			return Promise.resolve(logger)
		}
	}else if(tests.some(test => test.type === testTypes.browser || test.type === testTypes.both)){
		logger.log("smoke:info", 0, ['running browser tests']);
		remote = false;
	}else{
		logger.log("smoke:info", 0, ['no tests found that can run on the browser'])
		return Promise.resolve(logger)
	}

	if(remote){
		return run(tests, "*", logger, options, true, false).then(remoteLogs => {
			if(remoteLogs){
				!options.noDefaultPrint && console.log(stringify(remoteLogs));
				log("Cummulative Remote Results:", remoteLogs);
				log("Local Results:", logger);
				print();
			}else{
				logger.log("smoke:unexpected", 0, ['remote tests did not complete normally']);
			}
			return {ranRemote: true, localLog: logger, remoteLogs: remoteLogs};
		});
	}else{
		return run(tests, "*", logger, options, false, false).then(logger => {
			log("Results:", logger);
			print();
			return {ranRemote: false, localLog: logger};
		});
	}
}

export {queueActions, getQueuedActions, run, runDefault, getCapabilities};
