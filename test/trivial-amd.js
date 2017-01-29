require(["smoke"], function(smoke){
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

