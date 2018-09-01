// this config just tests the startup path when loading ./smoke.es6.js; all remaining tests are in smoke.config.js

import smoke from "./smoke.es6.js";

let config = {
	load: [
		"./test/trivial.es6.js"
	]
};
smoke.configure(config);