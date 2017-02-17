// this example will only work with a browser runner
// navigate your browser to browser-runner.html in the bd-smoke root directory with a query string that looks like
//      ?p=./test/trivial-browser.js
//
// the complete URL will look something like this:
//      http://localhost:8080/altoviso/bd-smoke/browser-runner.html?p=./test/trivial-browser.js
//
// See also:
//      * ./trivial-node: how to express and load tests for node only without an AMD loader
//      * ./trivial-amd: how to express and load tests for either the browser or node, but in both cases with an AMD loader
//      * ./trivial-UMD: how to express tests that can be loaded in node or the browser, with or without AMD

const assert = smoke.assert;

smoke.defTest({
	id: "trivial",
	tests: [
		["example-pass", function(){
			assert(true);
		}]
	]
});
