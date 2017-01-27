let smoke = require("./smoke.js");
smoke.configure(process.argv.slice(2), require).then(function(){
	smoke.runDefault();
});
