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

	let trace;

	smoke.defTest({
		// this is a node in the hierarchy of tests defined by this file
		id: "root",
		before: function(){
			trace = ["root-before"];
		},
		beforeEach: function(){
			trace.push("root-beforeEach");
		},
		afterEach: function(){
			trace.push("root-afterEach");
		},
		after: function(){
			trace.push("root-after");
			let expected = ["root-before", "root-beforeEach", "level-1-1st", "root-afterEach", "level-1-2nd-before", "root-beforeEach", "level-1-2nd-beforeEach", "a", "level-1-2nd-afterEach", "level-1-2nd-beforeEach", "b", "level-1-2nd-afterEach", "level-1-2nd-after", "root-afterEach", "level-1-3rd-before", "root-beforeEach", "level-1-3rd-beforeEach", "c", "level-1-3rd-afterEach", "level-1-3rd-beforeEach", "d", "level-1-3rd-afterEach", "level-1-3rd-after", "root-afterEach", "root-beforeEach", "level-1-4th", "root-afterEach", "root-after"];
			//trace.forEach(function(s){ console.log(s); });
			assert(expected.join("-")==trace.join("-"));
		},

		// each node can have a set of children...
		tests: [
			// a child can be a test, which is a pair of [<name>, <function>]
			["level-1-1st", function(){
				trace.push("level-1-1st");
			}],

			// or another node
			{
				id: "level-1-2nd",
				before: function(){
					trace.push("level-1-2nd-before");
				},
				beforeEach: function(){
					trace.push("level-1-2nd-beforeEach");
				},
				afterEach: function(){
					trace.push("level-1-2nd-afterEach");
				},
				after: function(){
					trace.push("level-1-2nd-after");
				},
				tests: [
					["a", function(){
						trace.push("a");
					}],
					["b", function(){
						trace.push("b");
					}]
				]
			},

			// etc.
			{
				id: "level-1-3rd",
				before: function(){
					trace.push("level-1-3rd-before");
				},
				beforeEach: function(){
					trace.push("level-1-3rd-beforeEach");
				},
				afterEach: function(){
					trace.push("level-1-3rd-afterEach");
				},
				after: function(){
					trace.push("level-1-3rd-after");
				},
				tests: [
					["c", function(){
						trace.push("c");
					}],
					["d", function(){
						trace.push("d");
					}]
				]
			},

			// etc.
			["level-1-4th", function(){
				trace.push("level-1-4th");
			}],
		]
	});

});
