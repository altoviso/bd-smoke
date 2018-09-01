export default [{
	input: "src/smoke.js",
	output: {
		format: "es",
		name: "smoke",
		file: "./smoke.es6.js"
	}
}, {
	input: "src/smoke-umd.js",
	output: {
		format: "umd",
		name: "smoke",
		file: "./smoke.js"
	}
}];
