let amdRequire = 0;
process.argv.slice(2).some(arg=>{
	let pair = arg.split("=");
	if(/loader/.test(pair[0])){
		amdRequire = require(pair[1]);
		amdRequire.nodeRequire = require;
	}
	return amdRequire;
});

if(amdRequire){
	amdRequire(["smoke"], function(smoke){
		smoke.configure(process.argv.slice(2)).then(function(smoke){
			smoke.runDefault();
		});
	});
}else{
	require("./smoke.js").configure(process.argv.slice(2)).then(smoke =>{
		smoke.runDefault();
	});
}


