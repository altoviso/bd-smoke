// this example will work in either the browser or node, but only when an AMD loader is present
//
// for the browser, navigate your browser to browser-runner-amd.html in the bd-smoke root directory with a query
// string that looks like:
//      ?p=./test/trivial-amd.js
//
// the complete URL will look something like this:
//      http://localhost:8080/altoviso/bd-smoke/browser-runner-amd.html?p=./test/trivial-amd.js
//
// for node, the command line needs to inform node of the following:
//      1. the AMD loader to use via the --loader command line switch
//      2. a package configuration for the loader via the --package command line switch
//      3. the profile to load vai the --profile command line switch
//
// the AMD module specified causes tests to be defined. Of course since it is AMD, it could specify tests directly or
// include any number of other modules via the dependency array argument in the AMD define() application. Here is an
// example that loads this resource:
//      $ node node-runner.js -package=test;./test --profile=test/trivial-amd -loader=./node_modules/bd-load/load.js
//
// See also:
//      * ./trivial-browser: how to express and load tests for the browser only without an AMD loader
//      * ./trivial-node: how to express and load tests for node only without an AMD loader
//      * ./trivial-UMD: how to express tests that can be loaded in node or the browser, with or without AMD

define(["smoke"], function(smoke){
	const assert = smoke.assert;

	smoke.defTest({
		id: "trivial",
		tests: [
			["example-pass", function(){
				assert(true);
			}]
		]
	});
});

