// this smoke.config.js works in node and the browser, with or without and AMD loader present
// if AMD is present AND window.smoke is defined, then AMD is NOT used, but rather the global smoke is assumed
//
// NOTE:
// normally this is not required because the user knows what kind of environment the test target is operating in

(function(){
	let smoke = typeof exports === "object" && typeof module !== "undefined" ? require("./smoke.js") :
		typeof window !== "undefined" && window.smoke && window.smoke.oem === "altoviso" ? window.smoke : require("smoke");

	let config = {
		load: [
			"./test/trivial-umd.js",
			"./test/minimal-example.js",
			"./test/traverse-example.js"
		],

		remoteUrl:"http://localhost:8080/altoviso/bd-smoke/browser-runner.html?remotelyControlled&root=./",

		capabilities: smoke.isNode ? require("./test/capabilities") : [],
	};
	smoke.configure(config);
})();
