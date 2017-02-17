// this example will work in either the browser or node, with or without and AMD loader present.
//
// to load in the browser without AMD, use a URL that looks something like this:
//      http://localhost:8080/altoviso/bd-smoke/browser-runner.html?p=./test/trivial-umd.js
//
// to load in node without AMD, use a command line that looks something like this:
//      $ node node-runner.js -p=./test/trivial-umd.js
//
// to load in the browser with AMD, use a URL that looks something like this:
//      http://localhost:8080/altoviso/bd-smoke/browser-runner-amd.html?p=./test/trivial-umd.js
//
// to load in node with AMD, use a command line that looks something like this:
//      $ node node-runner.js -package=test;./test --profile=test/trivial-umd -loader=./node_modules/bd-load/load.js
//
// For further explaination, see
//      * ./trivial-browser: how to express and load tests for the browser only without an AMD loader
//      * ./trivial-node: how to express and load tests for node only without an AMD loader
//      * ./trivial-amd: how to express and load tests for either the browser or node, but in both cases with an AMD loader
(function(factory){
	if(typeof define != "undefined"){
		define(["smoke"], factory);
	}else if(typeof module != "undefined"){
		factory(require("../smoke"));
	}else{
		factory(smoke);
	}
})(function(smoke){
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

