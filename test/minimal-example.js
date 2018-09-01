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
				this.logger.logNote("example-fail: intentional fail to test fail circuitry");
				assert(false);
			}],
			["example-async-pass", function(){
				return new Promise(function(resolve, reject){
					setTimeout(resolve, 30);
				}).then(()=>{
					assert(true);
				})
			}],
			["example-async-fail", function(){
				return new Promise(function(resolve, reject){
					setTimeout(resolve, 30);
				}).then(()=>{
					this.logger.logNote("example-async-fail: intentional fail to test fail circuitry");
					assert(false);
				})
			}],
			["clean-up-the-log", function(){
				this.logger._passCount += 2;
				this.logger._failCount -= 2;
			}]
		]
	});

});
