let isBrowser = typeof window !== "undefined";
let isNode = !isBrowser;

let Timer = (function(){
	if(typeof window !== "undefined"){
		if(window.performance){
			return class {
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
		}else{
			return class {
				constructor(){
					this.startMark = new Date();
				}

				start(){
					this.startMark = new Date();
				}

				get time(){
					// return elapsed time in ms since the last call of start or construction
					return (new Date()).getTime() - this.startMark.getTime();
				}

				get startTime(){
					return this.startMark;
				}
			};
		}
	}else{
		return class {
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
		};
	}
})();

/* eslint-disable no-console */

const Logger = class {
	constructor(options){
		this.options = {
			nameSeparator: "/",
			console: true,
			consoleErrorPrinter: function(e){
				console.log(e);
			}
		};
		this.reset(options);
	}

	reset(options){
		let result = this.getResults();
		this.options = Object.assign({}, this.options, options);
		this._console = !!this.options.console;
		this._idSeed = 0;
		this._unexpected = false;
		this._totalCount = 0;
		this._passCount = 0;
		this._failCount = 0;
		this._scaffoldFailCount = 0;
		this._results = [];
		this._logs = {};
		return result;
	}

	updateOptions(options){
		this.options = Object.assign({}, this.options, options);
		this._console = !!this.options.console;
	}

	getResults(){
		return {
			unexpected: this._unexpected,
			totalCount: this._totalCount,
			passCount: this._passCount,
			failCount: this._failCount,
			scaffoldFailCount: this._scaffoldFailCount,
			results: this._results,
			logs: this._logs
		};
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

	get results(){
		return this._results;
	}

	get logs(){
		return this._logs;
	}

	getLog(id){
		return this._logs[id];
	}

	getName(context, node, testId){
		return context.map(node => node.id).join(this.options.nameSeparator) +
			(node ? this.options.nameSeparator + node.id : "") +
			(testId ? this.options.nameSeparator + testId : "");
	}

	getNameById(loggerId){
		return this._results[loggerId][0];
	}

	getScaffoldName(context, node){
		let name = [];
		for(let i = 0, end = context.length; i < end; i++){
			name.push(context[i].id);
			if(context[i] === node) break;
		}
		return name.join(this.options.nameSeparator);
	}

	startTest(context){
		this._totalCount++;
		let id = ++(this._idSeed);
		this._results[id] = [this.getName(context), (new Date()).getTime(), new Timer()];
		return id;
	}

	passTest(id){
		this._passCount++;
		let result = this._results[id];
		result[2] = result[2].time;
		if(this._console){
			console.log("PASS[" + result[0] + "]");
		}
	}

	failTest(id, error){
		this._failCount++;
		let result = this._results[id];
		result[2] = false;
		result[3] = error;
		if(this._console){
			console.log("FAIL[" + result[0] + "]");
			this.options.consoleErrorPrinter(error);
		}
	}

	excludeTest(context){
		if(this.options.logExcludes){
			let name = this.getName(context);
			this.log("EXCLUDED", 0, [name]);
		}
	}

	failScaffold(context, node, phaseText, error){
		this._scaffoldFailCount++;
		let scaffoldName = this.getScaffoldName(context, node);
		this.log("SCAFFOLD FAIL", 0, [scaffoldName + ":" + phaseText, error], true);
		if(this._console){
			console.log("SCAFFOLD FAIL[" + scaffoldName + ":" + phaseText + "]");
			this.options.consoleErrorPrinter(error);
		}
	}

	logNote(note, noConsole){
		this.log("note", 0, [note], true);
		if(this._console && !noConsole){
			console.log("NOTE: " + note);
		}
	}

	log(id, testId, entry, noConsole){
		// if you want to say noConsole==true, then you _must_ provide a testId
		if(arguments.length === 2){
			noConsole = entry;
			entry = testId;
			testId = 0;
			// noConsole is undefined
		}
		if(testId){
			id = id + ":" + testId;
		}
		let errorObject = 0;
		if(Array.isArray(entry)){
			let lastEntry = entry[entry.length - 1];
			if(lastEntry instanceof Error){
				errorObject = entry.pop();
			}else{
				if(entry.length === 1){
					entry = entry[0];
				}
			}
		}else if(entry instanceof Error){
			errorObject = entry;
			entry = [];
		}
		if(errorObject){
			entry.push(errorObject + "");
			!isNode && entry.push(errorObject.stack);
			!isNode && entry.push(errorObject);
		}
		if(/unexpected$/.test(id)){
			this._unexpected = true;
		}
		if(/error/.test(id)){
			this._failCount++;
		}
		(this._logs[id] || (this._logs[id] = [])).push(entry);
		if(this._console && !noConsole){
			if(Array.isArray(entry)){
				console.log("LOG[" + id + "]");
				entry.forEach(item => console.log(item));
				console.log(".");
			}else{
				console.log("LOG[" + id + "]", entry);
			}
		}
		return id;
	}
};

function getPromise(resolver, rejecter){
	// provide a new Promise with addition capabilities...
	//   methods resolve and reject
	//   properties resolved, rejected, proxy, and promise

	let resolve = 0;
	let reject = 0;
	let queuedSettlementValue;
	let queuedSettlement = false; //  | "resolve" | "reject"
	let p = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
		if(queuedSettlement){
			p[queuedSettlement](queuedSettlementValue);
		}
	});

	// the underlying promise
	p.promise = p;

	// resolve/reject the promise
	// add the read-only properties resolved/rejected accordingly
	p.resolve = (value) => {
		if(!resolve){
			queuedSettlementValue = value;
			queuedSettlement = "resolve";
			return;
		}
		value = resolver ? resolver(value) : value;
		Object.defineProperties(p, {
			resolved: {value: true, enumerable: true},
			rejected: {value: false, enumerable: true},
		});
		resolve(value);
	};
	p.reject = (value) => {
		if(!reject){
			queuedSettlementValue = value;
			queuedSettlement = "reject";
			return;
		}
		value = rejecter ? rejecter(value) : value;
		Object.defineProperties(p, {
			resolved: {value: false, enumerable: true},
			rejected: {value: true, enumerable: true},
		});
		reject(value);
	};

	// proxy hands out an interface to p that cannot resolve or reject p
	p.proxy = Object.seal({
		get resolved(){
			return !!p.resolved;
		},
		get rejected(){
			return !!p.rejected;
		},
		get promise(){
			return p;
		},
		then(onFulfilled, onRejected){
			return p.then(onFulfilled, onRejected);
		},
		catch(onRejected){
			return p.catch(onRejected);
		},
		finally(onFinally){
			return p.finally(onFinally);
		}
	});
	return p;
}

function getLoadControlClass(log, onResourceLoadComplete, onLoadingComplete){
	class LoadControl {
		constructor(resourceName, status, resolution, errorInfo){
			let promise = getPromise();
			if(!status){
				status = "started";
			}else{
				if(resolution !== undefined){
					promise.resolve(resolution);
				}

			}
			Object.defineProperties(this, {
				order: {value: ++LoadControl.counter},
				resourceName: {value: resourceName},
				loadedName: {value: resolution !== undefined ? resourceName : false, writable: true},
				status: {value: status, writable: true},
				promise: {value: promise},
				errorInfo: {value: errorInfo || false, writable: true},
			});

			// make sure we have a live loading promise so that check done can work...
			if(!LoadControl.loadingPromise || LoadControl.loadingPromise.resolved){
				LoadControl.loadingError = undefined;
				LoadControl.loadingPromise = getPromise();
			}
			promise.then(LoadControl.checkDone);
		}

		get isRequested(){
			return !!this.loadedName;
		}

		resolve(resolution, errorInfo){
			if(this.promise.resolved){
				// eslint-disable-next-line no-console
				console.warn("unexpected");
				return;
			}
			this.status = resolution;
			if(resolution === false){
				let logEntry = [this.resourceName, "failed to load"];
				if(this.loadedName !== this.resourceName){
					logEntry.push("(loaded as " + this.loadedName + ")");
				}

				if(errorInfo){
					this.errorInfo = errorInfo;
					logEntry.push(errorInfo);
				}
				log(...logEntry);
			}else if(resolution !== true){
				this.loadedValue = resolution;
				this.status = true;
			}
			onResourceLoadComplete(this);
			this.promise.resolve(resolution);
		}

		static isLegalResourceName(name, type){
			if(typeof name !== "string"){
				log("a resource name was given to load a " + type + " resource that is not a string");
				return false;
			}
			if(type === "AMD" && /^\./.test(name)){
				log("illegal to AMD require a relative module name (" + name + ")");
				return false;
			}
			return true;
		}

		static getControl(resourceName, type){
			// false if (resourceName, type) is illegal; otherwise the control record for resourceName
			if(!LoadControl.isLegalResourceName(resourceName, type)){
				return false;
			}
			if(LoadControl.injections.has(resourceName)){
				return LoadControl.injections.get(resourceName);
			}else{
				let control;
				if(type === "CSS" && isNode){
					control = new LoadControl(resourceName, "ignored", true, "CSS resources are ignored when running on node");
				}else if(/.+\.es6\.js$/.test(resourceName) && isNode){
					// .js6 types indicate the resource may include import or export directives
					// what about when node does support import/export ?
					control = new LoadControl(resourceName, "ignored", true, "js6 resources are ignored when running on node");
				}else{
					control = new LoadControl(resourceName);
				}
				LoadControl.injections.set(resourceName, control);
				return control;
			}
		}

		static checkDone(){
			let done = true;
			let error = false;
			for(const control of LoadControl.injections.values()){
				if(!done || !control.promise.resolved){
					done = false;
				}
				error = error || control.status === false;
			}
			if(done){
				onLoadingComplete();
				LoadControl.loadingError = error;
				LoadControl.loadingPromise.resolve(error);
			}
		}


		static load(resourceName, type, proc){
			let control = LoadControl.getControl(resourceName, type);
			if(!control){
				return false;
			}
			if(control.isRequested){
				return control.promise.proxy;
			}
			let name = resourceName;
			if(/^\./.test(name)){
				// if resourceName is relative, then it"s relative to the project directory
				// TODO: make this an option?
				name = LoadControl.injectRelativePrefix + name;
			}
			proc(control, name);
			return control.promise.proxy;
		}

		static browserInject(control, tag, props){
			let node;
			let handler = (e) => {
				control.loadedName = node.src;
				if(e.type === "load"){
					// TODO: make sure this kind of failure is detected on node also
					control.resolve(!LoadControl.windowErrors[node.src]);
				}else{
					control.resolve(false, e);
				}
			};
			try{
				node = document.createElement(tag);
				node.addEventListener("load", handler, false);
				node.addEventListener("error", handler, false);
				Object.keys(props).forEach(p => (node[p] = props[p]));
				document.getElementsByTagName("script")[0].parentNode.appendChild(node);
			}catch(e){
				control.resolve(false, e);
			}
		}

		static injectScript(resourceName, type){
			return LoadControl.load(resourceName, "script", function(control, src){
				if(/\.es6\.js$/.test(src)){
					type = "module";
				}
				LoadControl.browserInject(control, "script", {src: control.loadedName = src, type: type || ""});
			});
		}

		static injectCss(resourceName){
			return LoadControl.load(resourceName, "CSS", function(control, href){
				LoadControl.browserInject(control, "link", {
					href: control.loadedName = href,
					type: "text/css",
					rel: "stylesheet"
				});
			});
		}

		static loadNodeModule(moduleName){
			return LoadControl.load(moduleName, "node module", function(control, fileName){
				try{
					require((control.loadedName = fileName));
					control.resolve(true);
				}catch(e){
					control.resolve(false, e);
				}
			});
		}

		static loadAmdModule(moduleName){
			return LoadControl.load(moduleName, "script", function(control, module){
				try{
					require([module], function(){
						control.resolve(true);
					});
				}catch(e){
					control.resolve(false, e);
				}
			});
		}
	}

	LoadControl.counter = 0;
	LoadControl.injections = new Map();
	LoadControl.loadingPromise = getPromise();
	LoadControl.loadingPromise.resolve(true);
	LoadControl.loadingError = false;
	LoadControl.injectRelativePrefix = "";
	LoadControl.windowErrors = {};

	if(isBrowser){
		window.addEventListener("error", (e) => {
			if(e.filename){
				LoadControl.windowErrors[e.filename] = true;
			}
		});
	}


	return LoadControl;
}

class Action {
	constructor(name, id, proc){
		this.name = name;
		this.id = id;
		this.proc = proc || function(){
		};
	}

	static getNewActionUid(){
		return ++Action.uidSeed;
	}

	static get(key){
		return Action.actionCatalog[key];
	}

	static add(name, proc){
		let id = Action.getNewActionUid();
		return Action.actionCatalog[name] = Action.actionCatalog[id] = Action.action[name] = new Action(name, id, proc);
	}

	static execute(list, driver){
		// list is always an array of a pairs of [action-id, args]
		let driverActions = driver.actions({bridge: true});
		//let driverActions = driver.actions();
		let scratch = {};
		while(list.length){
			let instruction = list.shift();
			let action = Action.get(instruction[0]);
			if(action === Action.actionTestComplete){
				// the test has completed or been aborted
				if(list.length){
					// eslint-disable-next-line no-console
					console.warn("unexpected");
				}
				return driverActions.perform().then(() => instruction[1][0]);
			}else{
				action.proc(driver, driverActions, scratch, ...instruction[1]);
			}
		}
		return driverActions.perform().then(() => false);
	}

	static action(...list){
		let result = [];
		let i = 0, end = list.length;
		if(typeof list[i] === "string"){
			result.prompt = list[i++];
		}
		while(i < end){
			let args = [];
			result.push([list[i++], args]);
			while(i < end && !(list[i] instanceof Action)) args.push(list[i++]);
		}
		return result;
	}

}

Action.uidSeed = 0;
Action.actionCatalog = {};
Action.actionTestComplete = 0;

Action.actionTestComplete = Action.add("testComplete");

Action.add("sendKeys", (driver, action, scratch, ...args) => {
	action.sendKeys(...args);
});

Action.add("keyDown", (driver, action, scratch, ...args) => {
	args.forEach(k => {
		action.keyDown(k);
	});
});

Action.add("keyUp", (driver, action, scratch, ...args) => {
	args.forEach(k => {
		action.keyUp(k);
	});
});

Action.add("click", (driver, action, scratch, id) => {
	action.click(driver.findElement({id: id}));
});

// these are take verbatim from selenium-webdriver
Action.action.keys = {
	null: "\uE000",
	cancel: "\uE001",
	help: "\uE002",
	back_space: "\uE003",
	tab: "\uE004",
	clear: "\uE005",
	return: "\uE006",
	enter: "\uE007",
	shift: "\uE008",
	control: "\uE009",
	alt: "\uE00A",
	pause: "\uE00B",
	escape: "\uE00C",
	space: "\uE00D",
	pageUp: "\uE00E",
	pageDown: "\uE00F",
	end: "\uE010",
	home: "\uE011",
	arrowLeft: "\uE012",
	left: "\uE012",
	arrowUp: "\uE013",
	up: "\uE013",
	arrowRight: "\uE014",
	right: "\uE014",
	arrowDown: "\uE015",
	down: "\uE015",
	insert: "\uE016",
	delete: "\uE017",
	semicolon: "\uE018",
	equals: "\uE019",
	numpad0: "\uE01A",
	numpad1: "\uE01B",
	numpad2: "\uE01C",
	numpad3: "\uE01D",
	numpad4: "\uE01E",
	numpad5: "\uE01F",
	numpad6: "\uE020",
	numpad7: "\uE021",
	numpad8: "\uE022",
	numpad9: "\uE023",
	multiply: "\uE024",
	add: "\uE025",
	separator: "\uE026",
	subtract: "\uE027",
	decimal: "\uE028",
	divide: "\uE029",
	f1: "\uE031",
	f2: "\uE032",
	f3: "\uE033",
	f4: "\uE034",
	f5: "\uE035",
	f6: "\uE036",
	f7: "\uE037",
	f8: "\uE038",
	f9: "\uE039",
	f10: "\uE03A",
	f11: "\uE03B",
	f12: "\uE03C",
	command: "\uE03D",
	meta: "\uE03D",
	zenkakuHankaku: "\uE040"
};

function getStringify(indentFactor, newLine, typeFilter){
	let
		nameStack,
		_seen,
		spaces = "      ",

		indent = function(n){
			n = n * indentFactor;
			while(spaces.length < n){
				spaces += spaces;
			}
			return spaces.substring(0, n);
		},

		propName = function(name){
			return /[^a-zA-Z0-9_$]/.test(name) ? ("'" + name + "':") : (name + ":");
		},

		seen = function(it){
			if(_seen.has(it)){
				return _seen.get(it);
			}else{
				_seen.set(it, nameStack.join("."));
				return false;
			}
		},

		stringify = function(it, level, name){
			let text;
			if(!level){
				_seen = new Map();
				nameStack = [];
				level = 1;
			}else{
				level++;
				nameStack.push(name);
			}
			let seenName;
			let typeofIt = typeof it;
			switch(typeofIt){
				case "undefined":
					text = "undefined";
					break;

				case "boolean":
					text = (it ? "true" : "false");
					break;

				case "number":
					text = it.toString();
					break;

				case "string":
					text = JSON.stringify(it);
					break;

				case "object":
					if(it === null){
						text = "null";
					}else if(it instanceof RegExp){
						text = it.toString();
					}else if((seenName = seen(it))){
						text = "[circular --> " + seenName + "]";
					}else if(it instanceof Array){
						let stringifiedContent = it.map((value, i) => {
							let valueText = stringify(value, level, "[" + i + "]");
							return valueText ? (indent(level) + valueText) : false;
						}).filter(x => x);
						if(stringifiedContent.length){
							text = (
								"[" + newLine +
								stringifiedContent.join("," + newLine) +
								newLine + indent(level - 1) + "]"
							);
						}else{
							text = "[]";
						}
					}else{
						let stringifiedContent = Object.keys(it).sort().map(key => {
							let valueText = stringify(it[key], level, key);
							return valueText ? (indent(level) + propName(key) + valueText) : false;
						}).filter(x => x);
						if(stringifiedContent.length){
							text = (
								"{" + newLine + stringifiedContent.join("," + newLine) +
								newLine + indent(level - 1) + "}"
							);
						}else{
							text = "{}";
						}
					}
					break;

				default:
					text = typeFilter && typeFilter(typeofIt) ? "[" + typeof it + "]" : false;
			}
			nameStack.pop();
			return text;
		};

	return stringify;
}

let stringify = getStringify(4, "\n", (type) => (!(/function|symbol/.test(type))));
stringify.makeStringify = getStringify;

let assertCount = 0;

function resetAssertCount(){
	assertCount = 0;
}

function bumpAssertCount(){
	++assertCount;
}

function getAssertCount(){
	return assertCount;
}

function assert(value, message){
	// trivial assert; any function that throws upon a detected error will work
	bumpAssertCount();
	if(!value){
		throw new Error(message || "fail");
	}
}

function normalizeOptionName(name){
	// strip the leading dashes...
	name = name.trim();
	name = name && name.match(/^-*(.+)/)[1];

	switch(name){
		case "p":
		case "profile":
		case "l":
		case "load":
			return "load";
		case "i":
		case "include":
			return "include";
		default:
			return name;
	}
}

function getUrlArgs(){
	let urlParams = [];
	let qString = decodeURIComponent(window.location.search.substring(1));
	((qString && qString.split("#")[0]) || "").split("&").forEach(arg => urlParams.push(arg.trim()));
	urlParams.push("cwd=" + (location.origin + location.pathname).match(/(.+)\/[^/]+$/)[1]);
	return urlParams;
}

function argsToOptions(args, _normalizeOptionName){
	// args is an array of strings...usually either the command line args (node) or a lightly processed query string (browser)
	// transform options into key-> value | [values] for options of the form "key=value" and key->true for options of the form "key"
	// for any value of the form "<value>" or '<value>', remove the surrounding quotes
	// make sure everything is trimmed up

	let normalizeName = _normalizeOptionName ? (name) => (normalizeOptionName(_normalizeOptionName(name))) : normalizeOptionName;

	let options = {};
	args.forEach(arg => {
		arg = arg.trim();
		if(/.+=.+/.test(arg)){
			let match = arg.match(/([^=]+)=(.+)/),
				name = normalizeName(match[1]),
				value = match[2];
			value = (/\s*((^".+"$)|(^'.+'$))\s*/.test(value) ? value.match(/^['"](.+)['"]$/)[1] : value).trim();
			if(name in options){
				if(!Array.isArray(options[name])){
					options[name] = [options[name], value];
				}else{
					options[name].push(value);
				}
			}else{
				options[name] = value;
			}
		}else if(arg){
			arg = normalizeName(arg);
			if(/^!(.+)/.test(arg)){
				options[arg.substring(1)] = false;
			}else{
				options[arg] = true;
			}
		}// else ignore an empty string
	});
	return options;
}

function processOptions(options, dest){
	// process everything except the profiles into dest; this allows modules loaded via profiles to use the options

	// toArray also filters out falsey values
	let toArray = (src) => (Array.isArray(src) ? src : [src]).filter(_ => _);
	let processInclude = (dest, value) => {
		value.split(/[;,]/).forEach(item => {
			item = item.split(/[./]/).map(x => x.trim()).filter(x => !!x);
			item.length && dest.push(item);
		});
		return dest;
	};
	let processCommaList = (dest, src) => {
		return dest.concat(src.split(/[,;]/).map(s => s.trim()).filter(s => !!s));
	};

	Object.keys(options).forEach(name => {
		let value = options[name];
		switch(name){
			// notice that include is cumulative when multiple configurations are processed
			case "include":
				dest.include = toArray(value).reduce(processInclude, dest.include || []);
				break;
			case "package":
				toArray(value).forEach(value => {
					value.split(/[,;]/).map(s => s.trim()).filter(s => !!s).forEach(p => {
						let split = p.split(":").map(item => item.trim());
						require.config({packages: [{name: split[0], location: split[1], main: split[2]}]});
					});
				});
				break;
			case "load":
				dest.load = toArray(value).reduce(processCommaList, dest.load || []);
				break;
			case "remoteTests":
				dest.remoteTests = toArray(value).reduce(processCommaList, dest.remoteTests || []);
				break;
			case "cap":
				dest.cap = toArray(value).reduce(processCommaList, dest.cap || []);
				break;
			case "capPreset":
				dest.capPreset = toArray(value).reduce(processCommaList, dest.capPreset || []);
				break;
			case "css":
				dest.css = toArray(value).reduce(processCommaList, dest.css || []);
				break;
			case "remotelyControlled":
				dest.remotelyControlled = true;
				dest.autoRun = false;
				break;
			default:
				dest[name] = value;
		}
	});
}

const browser = Object.freeze({
	toString(){
		return "browser";
	}
});
const node = Object.freeze({
	toString(){
		return "node";
	}
});
const both = Object.freeze({
	toString(){
		return "both";
	}
});
const remote = Object.freeze({
	toString(){
		return "remote";
	}
});

const testTypes = Object.freeze({
	browser:browser,
	node:node,
	both:both,
	remote:remote
});

function checkTest(test, logger){
	//     ensure legal structure
	//     return a clone of cleaned (as required) test

	let error = false;
	let context = [];

	function logError(test, reason){
		if(!reason){
			reason = test;
			test = false;
		}
		logger.log("smoke:bad-test-spec", 0, [logger.getName(context, test), reason]);
		error = true;
	}

	function traverse(node){
		context.push(node);
		let result = {id: node.id};
		if(typeof node.id !== "string" || !node.id){
			logError("each test must have a non-empty identifier");
		}
		["before", "beforeEach", "after", "afterEach", "finally"].forEach(name => {
			if(node[name]){
				if(typeof node[name] !== "function"){
					logError("scaffold " + name + " must be a function");
				}else{
					result[name] = node[name];
				}
			}
		});
		if(!node.test && !node.tests){
			logError(node, "test or tests must be specified for each node in the test tree");
		}
		if(node.test && node.tests){
			logError(node, "one of test or tests (not both) allowed for each node in the test tree.");
		}
		if(node.test){
			if(typeof node.test === "function"){
				result.test = node.test;
			}else if(node.test instanceof Object){
				result.test = traverse(node.test);
			}else{
				logError(node, "test must be either a test object or a function");
			}
		}
		if(node.tests){
			result.tests = node.tests.map((test, i) => {
				let result;
				if(typeof test === "function"){
					// implied testId of the index
					result = {id: i, test: test};
				}else if(Array.isArray(test)){
					// [id, test]
					if(typeof test[0] === "function"){
						logError(node, "[" + i + "]each test must have an identifier");
					}else if(typeof test[1] !== "function"){
						logError(node, "[" + test[0] + "]test is not a function");
					}else{
						result = {id: test[0], test: test[1]};
					}
				}else if(test instanceof Object){
					result = traverse(test);
				}else{
					logError(node, "[" + i + "]don't know what test is; should be a [id, test (a function)] pair, a test (a function) or a test object (an object)");
				}
				return result;
			});
		}
		context.pop();
		return result;
	}

	try{
		return [traverse(test), error];
	}catch(e){
		logger.log("smoke:unexpected", 0, [test.id, "test specification was malformed", e]);
		return [false, true];
	}
}

function defTest(type, logger, tests, ...args){
	for(const arg of args){
		let [test, error] = checkTest(arg, logger);
		if(!error){
			if(type === testTypes.browser && isNode){
				// never going to run this test here, simplify it for use as a reference to a test that may be run remotely
				test = {id: test.id, test: _ => _, type: testTypes.browser};
			}
			if(isNode || type === testTypes.both || type === testTypes.browser){
				test.type = type;
				tests.push(test);
			}
		}
	}
}

function orderTests(tests){
	// order the tests as specified by the test.order or by order in which they were defined
	// explicitly ordered tests always come first
	let orderedTests = [];
	let unorderedTests = [];
	tests.forEach((test) => {
		if("order" in test){
			orderedTests.push(test);
		}else{
			unorderedTests.push(test);
		}
	});
	orderedTests.sort(function(lhs, rhs){
		return lhs.order - rhs.order;
	});
	return orderedTests.concat(unorderedTests);
}

function failScaffold(context, node, phase, e, quitOnFirstFail, logger){
	if(quitOnFirstFail){
		context.forEach(node => (node.abort = true));
	}else{
		for(let i = context.indexOf(node), end = context.length; i < end; i++){
			context[i].abort = true;
		}
		logger.failScaffold(context, node, phaseToText[phase], e);
	}
}

function getTestTree(test, logger, include){
	//     clone testTree; if includes, then mark all tests not included as EXCLUDED

	// matchedPaths[i] => include[i] matches the current path up to level include[i][matchedPaths[i]]
	// e.g., for current path = "A.B.C"
	// include = [["A", "D"], ["A", "B"]]
	// level = 2
	// then...
	// matchedPaths = [0, 1]..that is, path[0] matches to level 0, path[1] matches to level 1
	let matchedPaths = include && include.map(() => -1);

	function calcIncluded(id, level){
		let result = false;
		let prevLevel = level - 1;
		let nextLevel = level + 1;
		include.forEach((path, i) => {
			if(path.length > level && matchedPaths[i] === prevLevel && path[level] === id){
				matchedPaths[i] = level;
				// noinspection JSValidateTypes
				result = result === EXACT || path.length === nextLevel ? EXACT : true;
			}
		});
		return result;
	}

	function traverse(node, level, parent, checkIncluded){
		let included = !checkIncluded || calcIncluded(node.id, level);
		let result = {id: node.id, parent: parent};
		if(!included){
			result.test = EXCLUDED;
		}else{
			// included can ONLY be true or EXACT at this point
			node.before && (result.before = node.before);
			node.after && (result.after = node.after);
			node.finally && (result.finally = node.finally);
			node.beforeEach && (result.beforeEach = node.beforeEach);
			node.afterEach && (result.afterEach = node.afterEach);
			if(node.test){
				if(typeof node.test === "function"){
					// if not to the end of the include path, exclude this test
					// noinspection JSValidateTypes
					result.test = !checkIncluded || included === EXACT ? node.test : EXCLUDED;
				}else{
					//included can only be true or EXACT; if it's exact, then stop checking
					// noinspection JSValidateTypes
					result.test = traverse(node.test, level + 1, result, checkIncluded && included !== EXACT);
				}
			}else{
				result.tests = node.tests.map((test) => {
					//included can only be true or EXACT; if it's exact, then stop checking
					// noinspection JSValidateTypes
					return traverse(test, level + 1, result, checkIncluded && included !== EXACT);
				});
			}
		}
		if(checkIncluded){
			// calcIncluded may have bumped up the levels in matchedPaths by this level; bump those back down
			matchedPaths.map(_level => (_level === level ? _level - 1 : _level));
		}
		return result;
	}

	try{
		return [traverse(test, 0, null, include.length), false];
	}catch(e){
		logger.log("smoke:unexpected", test.id, ["failed to filter tests for includes", e]);
		return [{id: test.id, test: EXCLUDED}, true];
	}
}

const
	BEFORE = Symbol("before"),
	BEFORE_EACH = Symbol("beforeEach"),
	TEST = Symbol("test"),
	AFTER_EACH = Symbol("afterEach"),
	AFTER = Symbol("after"),
	FINALLY = Symbol("finally"),
	EXCLUDED = Symbol("excluded"),
	EXACT = Symbol("smoke-prepareTest-exact"),
	phaseToMethodName = {
		[BEFORE]: "before",
		[BEFORE_EACH]: "beforeEach",
		[AFTER_EACH]: "afterEach",
		[AFTER]: "after",
		[FINALLY]: "finally"
	},
	phaseToText = {
		[BEFORE]: "before",
		[BEFORE_EACH]: "before-each",
		[TEST]: "test",
		[AFTER_EACH]: "after-each",
		[AFTER]: "after",
		[FINALLY]: "finally"
	};

function execute(test, logger, options, driver){
	let theExecutePromise = getPromise();
	let context = [];
	let callContext = {
		context: context,
		logger: logger,
		options: options,
		driver: driver,
		testName(){
			return logger.getName(this.context);
		}
	};
	let userScratch = {};

	function* getWorkStream(node){
		context.push(node);
		if(node.tests){
			let atLeastOneExecuted = false;
			for(const test of node.tests){
				// force executing beforeEach (if any) for each test
				node[BEFORE_EACH] = false;
				node.executed = false;
				yield* getWorkStream(test);
				atLeastOneExecuted = atLeastOneExecuted || node.executed;
				if(node.afterEach && node.executed && !node.abort){
					yield [AFTER_EACH, context, node];
				}
				if(node.abort){
					break;
				}
			}
			if(node.after && atLeastOneExecuted && !node.abort){
				yield [AFTER, context, node];
			}
			if(node.finally){
				yield [FINALLY, context, node];
			}
		}else if(node.test !== EXCLUDED){
			for(const n of context){
				n.executed = true;
				if(n.before && !n[BEFORE] && !n.abort){
					yield [BEFORE, context, n];
				}
			}
			for(const n of context){
				if(n.beforeEach && !n[BEFORE_EACH] && !n.abort){
					yield [BEFORE_EACH, context, n];
				}
			}
			if(!node.abort){
				yield [TEST, context, node];
			}
			if(node.afterEach && !node.abort){
				yield [AFTER_EACH, context, node];
			}
			if(node.after && !node.abort){
				yield [AFTER, context, node];
			}
			if(node.finally){
				yield [FINALLY, context, node];
			}
		}else{ // node.test===EXCLUDED
			logger.excludeTest(context);
		}
		context.pop();
	}

	try{
		// the only options execute consumes itself are include and quitOnFirstFail; all are optional
		let [testTree, prepareError] = getTestTree(test, logger, options.include);
		if(prepareError){
			logger.log("smoke:bad-test-spec", test.id, ["test not run because of errors in test specification"]);
			theExecutePromise.resolve();
			return theExecutePromise.proxy;
		}else if(!testTree){
			logger.log("smoke:info", test.id, ["either no tests or includes did not match any tests"]);
			theExecutePromise.resolve();
			return theExecutePromise.proxy;
		}// else testTree is a good tree with some tests to run
		let workStream = getWorkStream(testTree);
		(function doWork(){
			// eslint-disable-next-line no-constant-condition
			while(true){
				let work = workStream.next();
				if(work.done){
					theExecutePromise.resolve();
					return;
				}
				const [phase, context, node] = work.value;
				if(phase === TEST){
					let testUid = callContext.testUid = logger.startTest(context);
					try{
						let result = node.test.call(callContext, userScratch);
						if(result instanceof Promise){
							result.then(
								function(){
									logger.passTest(testUid);
									doWork();
								}
							).catch(
								function(e){
									logger.failTest(testUid, e);
									options.quitOnFirstFail && context.forEach(node => (node.abort = true));
									doWork();
								}
							);
							return;
						}else{
							// synchronous result, continue to consume the work stream
							logger.passTest(testUid);
						}
					}catch(e){
						// synchronous error, continue to consume the work stream, which will terminate immediately
						logger.failTest(testUid, e);
						options.quitOnFirstFail && context.forEach(node => (node.abort = true));
					}
				}else{
					try{
						delete callContext.testUid;
						const methodName = phaseToMethodName[phase];
						let result = node[methodName].call(callContext, userScratch);
						if(result instanceof Promise){
							result.then(
								function(){
									(phase === BEFORE || phase === BEFORE_EACH) && (node[phase] = true);
									doWork();
								}
							).catch(
								function(e){
									failScaffold(context, node, phase, e, options.quitOnFirstFail, logger);
									doWork();
								}
							);
							return;
						}else{
							// synchronous result, continue to consume the work stream
							(phase === BEFORE || phase === BEFORE_EACH) && (node[phase] = true);
						}
					}catch(e){
						// synchronous error, continue to consume the work stream, which will terminate immediately
						failScaffold(context, node, phase, e, options.quitOnFirstFail, logger);
					}
				}
			}
		})();
	}catch(e){
		logger.log("smoke:unexpected", test.id, ["failed to execute test", e]);
		theExecutePromise.resolve();
	}
	return theExecutePromise.proxy;
}

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
			return test.type === testTypes.both || (isBrowser && test.type === testTypes.browser) || (isNode && test.type === testTypes.node);
		}
	}

	return testList.filter(filter);
}

function getCapabilities(capabilities, provider, caps, capPresets, logger){
	let result = {};
	let error = false;

	let log = (msg) => {
		logger.log("info", 0, ["capabilities: " + msg]);
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
					log("capability \"" + cap + "\" does not exist in capabilities");
				}
			});
		}
	}

	// now the presets
	if(capPresets && capPresets.length){
		if(!capabilities.presets){
			log("capPreset given but no presets in capabilities");
		}else{
			capPresets.forEach(_preset => {
				let preset = capabilities.presets[_preset];
				if(!preset){
					log("capPreset \"" + _preset + "\" given that does not exist in capabilities presets");
				}else if(!Array.isArray(preset)){
					log("capPreset \"" + _preset + "\" must be an array in capabilities presets");
				}else{
					preset.forEach(cap => {
						if(capabilities[cap]){
							result[cap] = capabilities[cap];
						}else{
							log("capability \"" + cap + "\" given in presets does not exist in capabilities");
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
				log("capability \"" + cap + "\" given in presets does not exist in capabilities");
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
		dest.push([action.id, args]);
	}
}

function getQueuedActions(){
	let _pendingActions = [];

	function get(){
		if(pendingActions.length){
			_pendingActions = pendingActions;
			pendingActions = [];
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
	});
}

function waitForLoaderIdle(callback){
	// eslint-disable-next-line no-undef
	smoke.loaderIdle.then(loadError => callback(loadError));
}

function exec(testId, options){
	// eslint-disable-next-line no-undef
	return smoke.run(testId, 0, options, false, true).testUid;
}

function resetLog(){
	// eslint-disable-next-line no-undef
	return smoke.logger.reset();
}

function _getQueuedActions(callback){
	// eslint-disable-next-line no-undef
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
			});
		})();
	});
}

function doBrowser(builder, capabilityName, testList, logger, options, remoteLogs){
	let driver;
	return builder.build().then(_driver => {
		driver = _driver;
	}).then(() => {
		let remoteUrl = options.remoteUrl;
		if(/\?/.test(remoteUrl)){
			// got a query string; make sure it has the remotelyControlled parameter
			if(!/(\?|\s+)remotelyControlled(\$|\s+)/.test(remoteUrl)){
				remoteUrl+= "&remotelyControlled";
			}
		}else{
			// no query string; add one
			remoteUrl+= "?remotelyControlled";
		}
		return driver.get(remoteUrl);
	}).then(() => {
		return driver.executeAsyncScript(waitForLoaderIdle);
	}).then(loadingError => {
		if(loadingError){
			logger.log("smoke:error", 0, ["remote encountered an error loading test resources"]);
			throw new Error("error loading test resources on remote browser");
		}
	}).then(() => {
		return driver.executeScript(resetLog);
	}).then(startupLog => {
		startupLog.id = "startup-log";
		remoteLogs.push(startupLog);
	}).then(() => {
		let testList_ = testList.slice();
		return new Promise(function(resolve, reject){
			(function executeTestList(){
				if(!testList_.length){
					resolve();
				}else{
					let test = testList_.shift();
					if(test.type === testTypes.remote){
						execute(test, logger, options, driver).then(() => {
							executeTestList();
						});
					}else{
						let testId = capabilityName + ":" + test.id;
						logger.log("smoke:progress", 0, [testId + ": started"]);
						driver.executeScript(exec, test.id, options.remoteOptions || 0).then(testId => {
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
						}).then(() => {
							executeTestList();
						}).catch(e => {
							reject(e);
						});
					}
				}
			})();
		});
	}).then(() => {
		return driver.quit().then(() => true);
	}).catch(e => {
		try{
			logger.log("smoke:error", 0, ["remote crashed, capability aborted", e]);
			return driver.quit().then(() => true);
		}catch(e){
			logger.log("smoke:error", 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
			return Promise.resolve(false);
		}
	}).catch(e => {
		logger.log("smoke:error", 0, ["webdriver crashed; it's likely the remote browser has not been shut down", e]);
		return false;
	});
}

function runLocal(_testList, logger, options){
	// execute each test in the testList
	let testList = _testList.slice();
	if(options.concurrent){
		return Promise.all(testList.map(test => execute(test, logger, options).promise)).then(() => logger);
	}else{
		return new Promise((resolve) => {
			(function finish(){
				if(testList.length && !logger.unexpected){
					execute(testList.shift(), logger, options).then(() => {
						finish();
					});
				}else{
					if(options.remotelyControlled){
						queueActions(Action.action(Action.action.testComplete, logger.getResults()));
						logger.reset();
					}
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
	const {Builder} = require("selenium-webdriver");


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
			() => (capabilities.length ? doNextCapability() : remoteLogs)
		);
	}

	return doNextCapability().then(() => {
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
		return Promise.resolve(false);
	}
	let testUid = getTestUid();
	let theRunPromise;
	if(remote){
		let [capabilities] = getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, logger);
		if(!capabilities.length){
			logger.log("smoke:info", 0, ["run: running remote tests, but no capabilities to test"]);
			return Promise.resolve(false);
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
				// eslint-disable-next-line no-console
				console.log(msg);
				html += "<p>" + msg + "</p>";
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
			logger.log("smoke:info", 0, ["\"remote\" config option is true, therefore running remote tests"]);
			remote = true;
		}else if(options.cap && options.cap.length){
			logger.log("smoke:info", 0, ["\"cap\" config option(s) given, therefore running remote tests"]);
			remote = true;
		}else if(options.capPreset && options.capPreset.length){
			logger.log("smoke:info", 0, ["\"capPreset\" config option(s) given, therefore running remote tests"]);
			remote = true;
		}else if(tests.some(test => test.type === testTypes.node || test.type === testTypes.both)){
			logger.log("smoke:info", 0, ["running native node tests on node"]);
			remote = false;
		}else if(tests.some(test => test.type !== testTypes.node)){
			logger.log("smoke:info", 0, ["no native node tests, but browser and/or remote tests found, therefore running remote tests"]);
			remote = true;
		}else{
			logger.log("smoke:info", 0, ["no tests found that can run on node"]);
			return Promise.resolve({ranRemote: false, localLog: logger});
		}
	}else if(tests.some(test => test.type === testTypes.browser || test.type === testTypes.both)){
		logger.log("smoke:info", 0, ["running browser tests"]);
		remote = false;
	}else{
		logger.log("smoke:info", 0, ["no tests found that can run on the browser"]);
		return Promise.resolve({ranRemote: false, localLog: logger});
	}

	if(remote){
		return run(tests, "*", logger, options, true, false).then(remoteLogs => {
			if(remoteLogs){
				// eslint-disable-next-line no-console
				!options.noDefaultPrint && console.log(stringify(remoteLogs));
				log("Cumulative Remote Results:", remoteLogs);
				log("Local Results:", logger);
				print();
			}else{
				logger.log("smoke:unexpected", 0, ["remote tests did not complete normally"]);
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
	(...args) => (smoke$1.logger.log("smoke:load", 0, args)),

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


let smoke$1 = {
	get oem(){
		return "altoviso";
	},
	get version(){
		return "1.0.0";
	},
	isBrowser: isBrowser,
	isNode: isNode,

	// eslint-disable-next-line no-undef
	isAmd: isBrowser && typeof define !== "undefined" && define.amd,

	options: defaultOptions,

	Timer: Timer,
	Logger: Logger,
	logger: new Logger(defaultOptions),

	testTypes: testTypes,
	get tests(){
		return smokeTests;
	},

	resetAssertCount: resetAssertCount,
	bumpAssertCount: bumpAssertCount,
	getAssertCount: getAssertCount,
	assert: assert,

	pause: pause,

	stringify: stringify,

	Action: Action,

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

	argsToOptions: argsToOptions,

	getUrlArgs: getUrlArgs,
	processOptions: processOptions,

	configureBrowser(){
		return smoke$1.configure(smoke$1.getUrlArgs());
	},

	configure(argsOrOptions, dest){
		let options = Array.isArray(argsOrOptions) ? smoke$1.argsToOptions(argsOrOptions) : argsOrOptions;
		dest = dest || smoke$1.options;
		smoke$1.processOptions(options, dest);
		if(dest === smoke$1.options){
			if(smoke$1.options.remotelyControlled){
				delete smoke$1.options.concurrent;
			}
			smoke$1.logger.updateOptions(dest);
		}
		(dest.load || []).slice().forEach(resource => {
			if(/\.css/i.test(resource)){
				if(isNode){
					smoke$1.logger.log("smoke:info", 0, ["CSS resource ignored on node"]);
				}else{
					smoke$1.injectCss(resource);
				}
			}else if(smoke$1.isAmd && !/\.[^./]+$/.test(resource)){
				// assume resource is an AMD module if an AMD loader is present and resource does not have a file type
				smoke$1.loadAmdModule(resource);
			}else if(isNode){
				if(/\.es6\.js$/.test(resource)){
					smoke$1.logger.log("smoke:info", 0, ["es6 resource ignored on node"]);
				}else{
					smoke$1.loadNodeModule(resource);
				}
			}else{
				smoke$1.injectScript(resource);
			}
		});

		return smoke$1.loadingPromise;
	},

	checkConfig(options){
		options = Object.assign({}, options || smoke$1.options);
		options.capabilities = getCapabilities(options.capabilities, options.provider, options.cap, options.capPreset, smoke$1.logger)[0];
		options.load = [];
		for(const control of LoadControl.injections.values()){
			options.load.push(
				control.resourceName + ":" +
				(control.status === false ? "failed" : (control.status === true ? "loaded" : control.status))
			);
		}
		options.tests = smoke$1.tests.map(test => test.id);
		// eslint-disable-next-line no-console
		console.log(isNode ? smoke$1.stringify(options) : options);
	},

	defTest(...args){
		// add a test definition that works on both the browser and node
		defTest(testTypes.both, smoke$1.logger, smokeTests, ...args);
	},

	defBrowserTest(...args){
		defTest(testTypes.browser, smoke$1.logger, smokeTests, ...args);
	},

	defBrowserTestRef(...args){
		// define test ids that can be run remotely without having to load those tests locally
		// this is important because some tests use JS6 import/export which node cannot consume
		args.forEach(test => {
			if(typeof test !== "string"){
				smoke$1.logger.log("smoke:bad-test-spec", 0, ["arguments to defBrowserTestRef must be strings"]);
			}else{
				defTest(testTypes.browser, smoke$1.logger, smokeTests, {id: test, test: _ => _});
			}
		});
	},

	defNodeTest(...args){
		// add a test definition that can _only_ run in node
		defTest(testTypes.node, smoke$1.logger, smokeTests, ...args);
	},

	defRemoteTest(...args){
		// add a test definition controls a remote browser
		defTest(testTypes.remote, smoke$1.logger, smokeTests, ...args);
	},

	queueActions: queueActions,
	getQueuedActions: getQueuedActions,

	run(testInstruction, logger, options, remote, resetLog){
		// autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
		smoke$1.options.autoRun = false;
		return run(smokeTests, testInstruction, logger || options.logger || smoke$1.logger, options || smoke$1.options, remote, resetLog);

	},

	runDefault(){
		// autoRun is canceled after the first run (prevents running twice when user configs call runDefault explicitly)
		if(smoke$1.options.checkConfig){
			smoke$1.checkConfig();
			smoke$1.options.autoRun = false;
			return Promise.resolve(smoke$1.logger);
		}else{
			smoke$1.options.autoRun = false;
			return runDefault(smokeTests, smoke$1.options, smoke$1.options.logger || smoke$1.logger);
		}
	}

};

async function defaultStart(){
	if(!smoke$1.options.autoRun){
		return;
	}

	let options = smoke$1.argsToOptions(isNode ? process.argv.slice(2) : smoke$1.getUrlArgs());
	if(options.root){
		let root = options.root;
		LoadControl.injectRelativePrefix = /\/$/.test(root) ? root : root + "/";
	}else if(isBrowser){
		if(/\/node_modules\/bd-smoke\/browser-runner\.html$/.test(window.location.pathname)){
			LoadControl.injectRelativePrefix = options.root = "../../";
		}else{
			smoke$1.logger.log("smoke:info", 0, ["smoke not being run by the default runner; therefore no idea how to set root; suggest you set it explicitly"]);
		}
	}else{
		LoadControl.injectRelativePrefix = options.root = process.cwd() + "/";
	}

	await smoke$1.configure(options);
	if(!smoke$1.loadedResourcesCount){
		await smoke$1.configure({load: "./smoke.config." + (smoke$1.isUMD || smoke$1.isGlobal ? "js" : "es6.js")});
	}

	// wait until nothing was loaded for 20ms; this gives loaded files a chance to use autoRun
	// as they see fit...for example, loading "A" may cause loading "B" if autoRun is true (as so forth)
	// loaded files can set autoRun to false to prevent the behavior below
	let loadError = await loaderIdle();
	if(!loadError){
		if(!smoke$1.loadingError && smoke$1.options.autoRun && !smoke$1.options.remotelyControlled){
			let result = await smoke$1.runDefault();
			if(smoke$1.options.checkConfig){
				smoke$1.logger.log("smoke:exitCode", 0, ["only printed configuration, no tests ran", 0]);
				isNode && process.exit(0);
			}else if(result.ranRemote){
				let exitCode = result.remoteLogs.failCount + result.remoteLogs.scaffoldFailCount + result.localLog.failCount + result.localLog.scaffoldFailCount;
				smoke$1.logger.log("smoke:exitCode", 0, ["default tests run on remote browser(s) completed", exitCode]);
				isNode && process.exit(exitCode);
			}else{
				let exitCode = result.localLog.failCount + result.localLog.scaffoldFailCount;
				smoke$1.logger.log("smoke:exitCode", 0, ["default tests run locally completed", exitCode]);
				isNode && process.exit(exitCode);
			}
		}
	}else{
		isNode && process.exit(-1);
	}
}

// let another process that loaded smoke take over and set autoRun to false to prevent the default behavior
smoke$1.pause(20).then(defaultStart);

export default smoke$1;
