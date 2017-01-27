// to run this test: in the directory that contains node-runner.js (the parent of this directory), execute
// node node-runner -p=./test/minimal-example.js

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
		id: "minimal-example",
		tests: [
			["example-pass", function(){
				assert(true);
			}],
			["example-fail", function(){
				try{
					assert(false);
				}catch(e){
					assert(true);
				}
			}],
			["example-async-pass", function(){
				return new Promise(function(resolve, reject){
					setTimeout(function(){
						resolve(true);
					}, 100);
				})
			}],
			["example-async-fail", function(){
				let testPromise = new Promise(function(resolve, reject){
					setTimeout(function(){
						reject("fail");
					}, 100);
				});
				return testPromise.then(result =>{
					assert(false);
				}).catch(error =>{
					assert(error + "" == "fail");
				});
			}]
		]
	});

});

