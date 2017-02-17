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
			["example-fail", function(logger){
				logger.logNote("example-fail: intentional fail to test fail circuitry");
				assert(false);
			}],
			["example-async-pass", function(){
				return new Promise(function(resolve, reject){
					setTimeout(function(){
						smoke.contAsync(resolve, reject, function(){
							assert(true);
						});
					}, 30);
				})
			}],
			["example-async-fail", function(logger){
				logger.logNote("example-async-fail: intentional fail to test fail circuitry");
				return new Promise(function(resolve, reject){
					setTimeout(function(){
						smoke.contAsync(resolve, reject, function(){
							assert(false);
						});
					}, 30);
				});
			}]
		]
	});

});
