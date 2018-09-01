// a trivial test when smoke is loaded from "../src/smoke.es6.js"
import smoke from "../src/smoke.js"

const assert = smoke.assert;

smoke.defTest({
	id: "trivial",
	tests: [
		["example-pass", function(){
			assert(true);
		}]
	]
});
