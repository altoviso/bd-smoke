(function(factory){
	let modules = [
		"minimal-example",
		"traverse-example"
	];
	if(typeof define != "undefined"){
		define(["smoke"].concat(modules.map(m =>{
			return "smoke/test/" + m;
		})), factory);
	}else if(typeof module != "undefined"){
		modules.forEach(m =>{
			require("./" + m)
		});
	}else{
		let profile = smoke.options.profile || (smoke.options.profile = []);
		modules.forEach(m =>{
			profile.push("./test/" + m + ".js");
		});
	}
})(function(){
});