// this example will only work with node
// run it from the root directory with from the command like something like this:
// $ node node-runner.js -p=./test/trivial-node.js

// See also:
//      * ./trivial-browser: how to express and load tests for the browser only without an AMD loader
//      * ./trivial-amd: how to express and load tests for either the browser or node, but in both cases with an AMD loader
//      * ./trivial-UMD: how to express tests that can be loaded in node or the browser, with or without AMD
let smoke = require("../smoke");
const assert = smoke.assert;

smoke.defTest({
	id: "trivial",
	tests: [
		["example-pass", function(){
			assert(true);
		}]
	]
});
