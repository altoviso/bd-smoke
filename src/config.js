function normalizeOptionName(name){
	// strip the leading dashes...
	name = name.trim();
	name = name && name.match(/^-*(.+)/)[1];

	switch(name){
		case "p":
		case "profile":
		case "l":
		case "load":
			return "load";
		case "i":
		case "include":
			return "include";
		default:
			return name;
	}
}

function getUrlArgs(){
	let urlParams = [];
	let qString = decodeURIComponent(window.location.search.substring(1));
	((qString && qString.split("#")[0]) || "").split("&").forEach(arg => urlParams.push(arg.trim()));
	urlParams.push("cwd=" + (location.origin + location.pathname).match(/(.+)\/[^/]+$/)[1]);
	return urlParams;
}

function argsToOptions(args, _normalizeOptionName){
	// args is an array of strings...usually either the command line args (node) or a lightly processed query string (browser)
	// transform options into key-> value | [values] for options of the form "key=value" and key->true for options of the form "key"
	// for any value of the form "<value>" or '<value>', remove the surrounding quotes
	// make sure everything is trimmed up

	let normalizeName = _normalizeOptionName ? (name) => (normalizeOptionName(_normalizeOptionName(name))) : normalizeOptionName;

	let options = {};
	args.forEach(arg => {
		arg = arg.trim();
		if(/.+=.+/.test(arg)){
			let match = arg.match(/([^=]+)=(.+)/),
				name = normalizeName(match[1]),
				value = match[2];
			value = (/\s*((^".+"$)|(^'.+'$))\s*/.test(value) ? value.match(/^['"](.+)['"]$/)[1] : value).trim();
			if(name in options){
				if(!Array.isArray(options[name])){
					options[name] = [options[name], value];
				}else{
					options[name].push(value);
				}
			}else{
				options[name] = value;
			}
		}else if(arg){
			arg = normalizeName(arg);
			if(/^!(.+)/.test(arg)){
				options[arg.substring(1)] = false;
			}else{
				options[arg] = true;
			}
		}// else ignore an empty string
	});
	return options;
}

function processOptions(options, dest){
	// process everything except the profiles into dest; this allows modules loaded via profiles to use the options

	// toArray also filters out falsey values
	let toArray = (src) => (Array.isArray(src) ? src : [src]).filter(_ => _);
	let processInclude = (dest, value) => {
		value.split(/[;,]/).forEach(item => {
			item = item.split(/[./]/).map(x => x.trim()).filter(x => !!x);
			item.length && dest.push(item);
		});
		return dest;
	};
	let processCommaList = (dest, src) => {
		return dest.concat(src.split(/[,;]/).map(s => s.trim()).filter(s => !!s));
	};

	Object.keys(options).forEach(name => {
		let value = options[name];
		switch(name){
			// notice that include is cumulative when multiple configurations are processed
			case "include":
				dest.include = toArray(value).reduce(processInclude, dest.include || []);
				break;
			case "package":
				toArray(value).forEach(value => {
					value.split(/[,;]/).map(s => s.trim()).filter(s => !!s).forEach(p => {
						let split = p.split(":").map(item => item.trim());
						require.config({packages: [{name: split[0], location: split[1], main: split[2]}]});
					});
				});
				break;
			case "load":
				dest.load = toArray(value).reduce(processCommaList, dest.load || []);
				break;
			case "remoteTests":
				dest.remoteTests = toArray(value).reduce(processCommaList, dest.remoteTests || []);
				break;
			case "cap":
				dest.cap = toArray(value).reduce(processCommaList, dest.cap || []);
				break;
			case "capPreset":
				dest.capPreset = toArray(value).reduce(processCommaList, dest.capPreset || []);
				break;
			case "css":
				dest.css = toArray(value).reduce(processCommaList, dest.css || []);
				break;
			case "remotelyControlled":
				dest.remotelyControlled = true;
				dest.autoRun = false;
				break;
			default:
				dest[name] = value;
		}
	});
}

export {getUrlArgs, argsToOptions, processOptions};