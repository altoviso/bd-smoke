(function(factory){
	if(typeof define != "undefined" && define.amd){
		define([], factory.bind(null, "AMD"));
	}else if(typeof module != "undefined"){
		module.exports = factory();
	}else{
		smoke = factory();
	}
})(function(environment){
	"use strict";

	const
		isBrowser = typeof window !== "undefined",
		isNode = !isBrowser,
		isAmd = environment === "AMD",
		STARTUP = Symbol("startup"),
		SPECIFICATION = Symbol("specification"),
		BEFORE = Symbol('before'),
		BEFORE_EACH = Symbol('beforeEach'),
		TEST = Symbol('test'),
		AFTER_EACH = Symbol('afterEach'),
		AFTER = Symbol('after'),
		RUN = Symbol("run"),
		UNEXPECTED = Symbol("unexpected"),
		phaseToMethodName = {
			[BEFORE]: "before",
			[BEFORE_EACH]: "beforeEach",
			[AFTER_EACH]: "afterEach",
			[AFTER]: "after"
		},
		phaseToText = {
			[STARTUP]: "start-up",
			[SPECIFICATION]: "specification",
			[BEFORE]: "before",
			[BEFORE_EACH]: "before-each",
			[TEST]: "test",
			[AFTER_EACH]: "after-each",
			[AFTER]: "after",
			[RUN]: "run",
			[UNEXPECTED]: "unexpected"
		};

	const Timer = isNode ?
		class {
			constructor(){
				this.startMark = process.hrtime();
			}

			start(){
				return (this.startMark = process.hrtime());
			}

			get time(){
				// return elapsed time in ms since the last call of start or construction
				let diff = process.hrtime(this.startMark);
				return (diff[0] * 1000) + (diff[1] / 1000000);
			}

			get startTime(){
				return this.startMark;
			}
		} :
		class {
			constructor(){
				this.startMark = performance.now();
			}

			start(){
				this.startMark = performance.now();
			}

			get time(){
				// return elapsed time in ms since the last call of start or construction
				return (performance.now() - this.startMark) * 1000;
			}

			get startTime(){
				return this.startMark;
			}
		};

	const Logger = class {
		constructor(options){
			this.options = options;
			this._unexpected = false;
			this._totalCount = 0;
			this._passCount = 0;
			this._failCount = 0;
			this._scaffoldFailCount = 0;
		}

		get totalCount(){
			return this._totalCount;
		}

		get passCount(){
			return this._passCount;
		}

		get failCount(){
			return this._failCount;
		}

		get scaffoldFailCount(){
			return this._scaffoldFailCount;
		}

		get unexpected(){
			return this._unexpected;
		}

		getName(context, node){
			return context.map(node =>{
					return node.id;
				}).join(this.options.nameSeparator) + (node && node[0] ? this.options.nameSeparator + node[0] : "");
		}

		startTest(context, node){
			this._totalCount++;
		}

		passTest(context, node){
			this._passCount++;
			console.log("PASS[test] " + this.getName(context, node));
		}

		failTest(context, node, error){
			this._failCount++;
			console.log("FAIL[test] " + this.getName(context, node));
			if(!isNode) console.log(error);
		}

		failScaffold(context, node, phaseText, error){
			this._scaffoldFailCount++;
			let name = [];
			for(let i = 0, end = context.length; i < end; i++){
				name.push(context[i].id);
				if(context[i] === node) break;
			}
			console.error("FAIL[" + phaseText + "] " + name.join(this.options.nameSeparator));
			console.log(error.stack);
			console.log(error);
		}

		logExcluded(context, test){
			if(this.options.logExcludes){
				let name = context.map(node =>{
						return node.id;
					}).join(this.options.nameSeparator) + (test && test[0] ? this.options.nameSeparator + test[0] : "");
				console.log("EXCLUDED " + name);
			}
		}

		logNote(note){
			console.log(note);
		}
	};

	function augmentIncludeExclude(dest, value){
		function getObject(path){
			let result = dest;
			path.split("/").forEach(part =>{
				if(result[part] === true || result[part] === false){
					result = result[part] = {}
				}else{
					result = result[part] || (result[part] = {});
				}
			});
			return result;
		}

		value.split(";").forEach(item =>{
			if(/\:/.test(item)){
				let split = item.split(":"),
					node = getObject(split[0]);
				split[1].split(",").forEach(id =>{
					node[id] = true;
				});
			}else{
				let pathParts = item.split("/"),
					id = pathParts.pop(),
					node = pathParts.length ? getObject(pathParts.join("/")) : dest;
				node[id] = true;
			}
		});
		return dest;
	}

	function normalizeOptionName(name){
		// strip the leading dashes...
		name = (name.trim().match(/-*(.+)/)[1]).trim();

		switch(name){
			case "p":
			case "profile":
				return "profile";
			case "i":
			case "include":
				return "include";
			case "e":
			case "exclude":
				return "exclude";
			default:
				return name.match(/-*(.+)/)[1];
		}
	}

	function markPathOnScaffoldFailure(context, node, error, quitOnFirstFail){
		// if this is a scaffolding phase, then fail the context below the current node
		// note that we treat specification phase errors as test errors
		// all test nodes below this node must be aborted
		for(let i = 0, end = context.length; i < end; i++){
			if(context[i] === node){
				i++;
				while(i < end){
					context[i++].abort = {phase: "parentFailure", error: error}
				}
			}else if(quitOnFirstFail){
				// if we quit upon any failure, then mark the entire hierarchy as a fail
				context[i] = {phase: "childFailure", error: error}
			}
		}
	}

	function execute(test, logger, options){
		function failScaffold(context, node, phase, e){
			node.abort = {phase: phase, error: e};
			markPathOnScaffoldFailure(context, node, e, options.quitOnFirstFail);
			logger.failScaffold(context, node, phaseToText[phase], e);
		}

		function* getWorkStream(node, context){
			// a node is an object with id, optional before/after, etc, and test or tests
			node.parent = context ? context[context.length - 1] : null;
			context.push(node);

			let include = true;
			if(node.include){
				include = node.include[node.id];
				if(!include){
					logger.logExcluded(context);
					return;
				}
			}
			let exclude = false;
			if(node.exclude){
				exclude = node.exclude[node.id];
				if(exclude === true){
					logger.logExcluded(context);
					return;
				}
			}

			if(node.test && node.tests){
				failScaffold(context, node, SPECIFICATION, new Error("Only test or test (not both!) allowed in a test object."))
			}else if(node.test || node.tests){
				const tests = node.test ? [[null, node.test]] : node.tests;
				let test, i = 0, end = tests.length;
				while(i < end && !node.abort){
					test = tests[i++];
					if(Array.isArray(test)){
						// test id a pair of [<id>, <test-function>]
						if(include === true || include[test[0]]){
							for(const node of context){
								if(!node.abort && node.before && !node[BEFORE]){
									yield [BEFORE, context, node]
								}
							}
							for(const node of context){
								if(!node.abort && node.beforeEach && !node[BEFORE_EACH]){
									yield [BEFORE_EACH, context, node]
								}
							}
							if(!node.abort && (include || include[test[0]]) && (!exclude || !exclude[test[0]])){
								yield [TEST, context, test];
							}
							node[BEFORE_EACH] = false;
							if(!node.abort && node.afterEach){
								yield [AFTER_EACH, context, node]
							}
						}else{
							logger.logExcluded(context, test);
						}
					}else{
						// test is a test object
						if(include !== true){
							test.include = include;
						}
						if(exclude){
							test.exclude = exclude;
						}
						yield* getWorkStream(test, context, logger);
						let beforeEachExecuted = node[BEFORE_EACH];
						node[BEFORE_EACH] = false;
						if(!node.abort && beforeEachExecuted && node.afterEach){
							yield [AFTER_EACH, context, node]
						}
					}
				}
			}else{
				failScaffold(context, node, SPECIFICATION, new Error("Neither test nor tests specified in a test object; nothing to test."))
			}
			let beforeExecuted = node[BEFORE];
			node[BEFORE] = false;
			if(!node.abort && beforeExecuted && node.after){
				yield [AFTER, context, node];
			}

			context.pop();
		}

		let workStream = getWorkStream(test, []);
		return new Promise(function(resolve){
			function doWork(){
				while(true){
					let work = workStream.next();
					if(work.done){
						resolve();
						return;
					}
					const [phase, context, node] = work.value;
					if(phase === TEST){
						try{
							logger.startTest(context, node);
							let timer = new Timer(),
								result = node[1].call(context[context.length - 1], logger);
							if(result instanceof Promise){
								result.then(
									function(){
										logger.passTest(context, node);
										node[2] = timer.time;
										doWork();
									}
								).catch(
									function(e){
										node[2] = e;
										logger.failTest(context, node, e);
										doWork();
									}
								);
								return;
							}else{
								// synchronous result, continue to consume the work stream
								logger.passTest(context, node);
								node[2] = timer.time;
							}
						}catch(e){
							// synchronous error, continue to consume the work stream, which will terminate immediately
							node[2] = e;
							logger.failTest(context, node, e);
						}
					}else{
						try{
							const methodName = phaseToMethodName[phase];
							let result = node[methodName].call(node, logger);
							if(result instanceof Promise){
								result.then(
									function(){
										(phase == BEFORE || phase == BEFORE_EACH) && (node[phase] = true);
										doWork();
									}
								).catch(
									function(e){
										failScaffold(context, node, phase, e);
										doWork();
									}
								);
								return;
							}else{
								// synchronous result, continue to consume the work stream
								(phase == BEFORE || phase == BEFORE_EACH) && (node[phase] = true);
							}
						}catch(e){
							// synchronous error, continue to consume the work stream, which will terminate immediately
							failScaffold(context, node, phase, e);
						}
					}
				}
			}

			doWork();
		});
	}

	let configLockCount = 0;

	function lockConfig(){
		configLockCount++;
	}

	function releaseConfig(){
		configLockCount--;
	}

	return {
		phases: {
			SPECIFICATION: SPECIFICATION,
			BEFORE: BEFORE,
			BEFORE_EACH: BEFORE_EACH,
			TEST: TEST,
			AFTER_EACH: AFTER_EACH,
			AFTER: AFTER,
			RUN: RUN,
			phaseToMethodName: phaseToMethodName,
			phaseToText: phaseToText,
		},

		Timer: Timer,

		Logger: Logger,

		options: {
			nameSeparator: "/",
			quitOnFirstFail: false,
			include: null,
			exclude: null,
			logExcludes: false,
			concurrent: false
		},

		tests: // default test stack which can be populated by applying defTest to a test object
			[],

		configure: function(args){
			// args is an array or strings...usually either the command line args (node) or a lightly processed the query string (browser)

			let self = this;

			// transform options into key->[values] for options of the form "key=value" and key->true for options of the form "key"
			let commandLineOptions = {};
			args.forEach(option =>{
				if(/.+=.+/.test(option)){
					let split = option.split("="),
						name = normalizeOptionName(split[0]),
						value = split[1];
					if(commandLineOptions[name]){
						commandLineOptions[name].push(value)
					}else{
						commandLineOptions[name] = [value];
					}
				}else if(option){
					commandLineOptions[normalizeOptionName(option)] = true;
				}// else ignore an empty string
			});

			// process everything except the profiles into self.options; self allows modules loaded via profiles to use the options
			let packageConfig = [];
			for(let name in commandLineOptions){
				let value = commandLineOptions[name];
				switch(name){
					case "include":
						self.options.include = value.reduce(augmentIncludeExclude, self.options.include || {});
						break;
					case "exclude":
						self.options.exclude = value.reduce(augmentIncludeExclude, self.options.exclude || {});
						break;
					case "title":
						if(isBrowser){

						}
					case "package":
						value.forEach(value =>{
							let split = value.split(";").map(item =>{
								return item.trim();
							});
							require.config({packages: [{name: split[0], location: split[1], main: split[2]}]});
						})
						break;
					default:
						self.options[name] = value;
				}
			}

			return (new Promise(function(resolve, reject){
				// load all the profiles
				let smokeRequire;
				if(isNode){
					smokeRequire = function(moduleName){
						lockConfig();
						(isAmd ? require.nodeRequire : require)(moduleName);
						releaseConfig();
						loadAllProfiles();
					};
				}else{
					// browser
					let insertPoint = document.getElementsByTagName("script")[0].parentNode;
					smokeRequire = function(url){
						lockConfig();
						let node = document.createElement("script"),
							handler = function(e){
								if(e.type === "load"){
									releaseConfig();
									loadAllProfiles();
								}else{
									reject(e);
								}
							};
						node.addEventListener("load", handler, false);
						node.addEventListener("error", handler, false);
						node.src = url + (/\.js$/.test(url) ? "" : ".js");
						insertPoint.appendChild(node);
						return node;
					};
				}
				let loadAMDModule = isAmd ? function(module){
						lockConfig();
						require([module], function(){
							releaseConfig();
							loadAllProfiles();
						});
					} : 0;

				var loadedProfiles = {};

				function loadAllProfiles(){
					// keep loading profiles until all of them have been loaded; loading a profile may cause more
					// profiles to be added

					// don't re-entry the loading loop until there is no more work to do
					if(configLockCount){
						return;
					}

					// don't re-enter the loading loop while were in the loop
					lockConfig();
					let recheck = false;
					(self.options.profile || []).slice().forEach(p =>{
						if(!loadedProfiles[p]){
							loadedProfiles[p] = true;
							recheck = true;
							if(isAmd && !/\.[^./]*$/.test(p)){
								// if an AMD loader is present and p does not have a file type, then assume it's an AMD module
								loadAMDModule(p);
							}else{
								smokeRequire(p);
							}
						}
					});
					releaseConfig();

					if(recheck){
						loadAllProfiles();
					}else if(configLockCount == 0){
						resolve();
					}
				}

				loadAllProfiles();
			})).then(function(){
				// if a logger was not provided, then provide the trivial console logger
				if(!self.options.logger){
					self.options.logger = new Logger(self.options);
				}

				if(self.options.include){
					self.tests.forEach(test =>{
						test.include = self.options.include
					});
				}

				if(self.options.exclude){
					self.tests.forEach(test =>{
						test.exclude = self.options.exclude
					});
				}

				// order the tests as specified by the test objects or by the load order
				self.tests.forEach((test, index) =>{
					if(!test.order){
						test.order = index;
					}
				});
				self.tests.sort(function(lhs, rhs){
					return lhs.order - rhs.order;
				});
				return self;
			});
		},

		configureBrowser: function(urlParams){
			urlParams = urlParams || [];
			let qString = decodeURIComponent(window.location.search.substring(1));
			((qString && qString.split("#")[0]) || "").split("&").forEach(arg => urlParams.push(arg));
			urlParams.push("cwd=" + (location.origin + location.pathname).match(/(.+)\/[^/]+$/)[1]);
			return this.configure(urlParams);
		},

		contAsync: function(resolve, reject, proc){
			try{
				proc();
				resolve();
			}catch(e){
				reject(e);
			}
		},

		assert: function(value){
			// trivial assert; any function that throws upon a detected error will work
			if(!value){
				throw new Error("fail");
			}
		},

		defTest: function(...args){
			// convenience function to add tests to the global test stack
			for(const arg of args){
				this.tests.push(arg);
			}
		},

		getTest: function(name){
			let segments = name.split("/"),
				tests = this.tests;
			while(segments.length){
				let target = segments.shift();
				if(Array.isArray(tests)){
					if(!tests.some(test =>{
							if(test.id == target){
								return (tests = test);
							}
						})){
						return false;
					}else if(!segments.length){
						return tests;
					}
				}else{
					return segments.length == 0 && target == tests.id && tests;
				}
			}
		},

		run: function(testInstruction, logger, options){
			// run the test given by testInstruction, log the output to logger, and control parts of the process by options

			options = options || this.options;

			let testList;
			if(testInstruction == "*"){
				// run everything in this.tests
				testList = this.tests.slice();
			}else if(testInstruction instanceof RegExp){
				// run anything in this.tests where test.id matches the reg exp given by testInstruction
				testList = this.tests.filter(test =>{
					return testInstruction.test(test.id);
				});
			}else if(typeof testInstruction === "string"){
				// run only the.test where test.id==testInstruction
				testList = this.tests.filter(test =>{
					return test.id == testInstruction;
				});
			}else{
				// testInstruction must be an array of test objects; run them all
				testList = testInstruction.slice();
			}

			// execute each test in the testList; if options is concurrent, then run multiple tests at the same time
			if(options.concurrent){
				return Promise.all(testList.map(test =>{
					return execute(test, logger);
				})).then(
					() =>{
						return logger;
					}
				).catch(
					() =>{
						return logger;
					}
				)
			}else{
				return new Promise(function(resolve){
					function finish(){
						if(testList.length && !logger.unexpected){
							let test = testList.shift();
							execute(test, logger, options).then(
								finish
							).catch(
								function(e){
									logger.failTest([], test, e);
									resolve(logger);
								}
							);
						}else{
							resolve(logger);
						}
					}

					finish();
				});
			}
		},

		runDefault: function(){
			return this.run("*", this.options.logger).then(function(logger){
				console.log("        total:" + logger.totalCount);
				console.log("         pass:" + logger.passCount);
				console.log("         fail:" + logger.failCount);
				console.log("scaffold fail:" + logger.scaffoldFailCount);
				if(typeof process !== "undefined"){
					process.exit(logger.failCount ? 1 : 0);
				}
				return logger;
			});
		},

		private: {
			augmentIncludeExclude: augmentIncludeExclude
		}
	};
});
