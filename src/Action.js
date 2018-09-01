export default class Action {
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
					console.warn(unexpected);
				}
				return driverActions.perform().then(_ => instruction[1][0]);
			}else{
				action.proc(driver, driverActions, scratch, ...instruction[1]);
			}
		}
		return driverActions.perform().then(_ => false);
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
		Object.keys(KEYS).forEach(key => KEYS[key] === k ? console.log("keyDown:" + key) : 0);
		action.keyDown(k);
	});
});

Action.add("keyUp", (driver, action, scratch, ...args) => {
	args.forEach(k => {
		Object.keys(KEYS).forEach(key => KEYS[key] === k ? console.log("keyUp:" + key) : 0);
		action.keyUp(k);
	});
});

Action.add("click", (driver, action, scratch, id) => {
	action.click(driver.findElement({id: id}))
});

Action.action.keys = {
	null: '\uE000',
	cancel: '\uE001',
	help: '\uE002',
	back_space: '\uE003',
	tab: '\uE004',
	clear: '\uE005',
	return: '\uE006',
	enter: '\uE007',
	shift: '\uE008',
	control: '\uE009',
	alt: '\uE00A',
	pause: '\uE00B',
	escape: '\uE00C',
	space: '\uE00D',
	pageUp: '\uE00E',
	pageDown: '\uE00F',
	end: '\uE010',
	home: '\uE011',
	arrowLeft: '\uE012',
	left: '\uE012',
	arrowUp: '\uE013',
	up: '\uE013',
	arrowRight: '\uE014',
	right: '\uE014',
	arrowDown: '\uE015',
	down: '\uE015',
	insert: '\uE016',
	delete: '\uE017',
	semicolon: '\uE018',
	equals: '\uE019',
	numpad0: '\uE01A',
	numpad1: '\uE01B',
	numpad2: '\uE01C',
	numpad3: '\uE01D',
	numpad4: '\uE01E',
	numpad5: '\uE01F',
	numpad6: '\uE020',
	numpad7: '\uE021',
	numpad8: '\uE022',
	numpad9: '\uE023',
	multiply: '\uE024',
	add: '\uE025',
	separator: '\uE026',
	subtract: '\uE027',
	decimal: '\uE028',
	divide: '\uE029',
	f1: '\uE031',
	f2: '\uE032',
	f3: '\uE033',
	f4: '\uE034',
	f5: '\uE035',
	f6: '\uE036',
	f7: '\uE037',
	f8: '\uE038',
	f9: '\uE039',
	f10: '\uE03A',
	f11: '\uE03B',
	f12: '\uE03C',
	command: '\uE03D',
	meta: '\uE03D',
	zenkakuHankaku: '\uE040'
};