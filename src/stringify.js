

function getStringify(indentFactor, newLine, typeFilter){
	let
		nameStack,
		_seen,
		spaces = "      ",

		indent = function(n){
			n = n * indentFactor;
			while(spaces.length < n){
				spaces += spaces;
			}
			return spaces.substring(0, n);
		},

		propName = function(name){
			return /[^a-zA-Z0-9_$]/.test(name) ? ("'" + name + "':") : (name + ":");
		},

		seen = function(it){
			if(_seen.has(it)){
				return _seen.get(it);
			}else{
				_seen.set(it, nameStack.join("."));
				return false;
			}
		},

		stringify = function(it, level, name){
			let text;
			if(!level){
				_seen = new Map();
				nameStack = [];
				level = 1;
			}else{
				level++;
				nameStack.push(name);
			}
			let seenName;
			let typeofIt = typeof it;
			switch(typeofIt){
				case "undefined":
					text = "undefined";
					break;

				case "boolean":
					text = (it ? "true" : "false");
					break;

				case "number":
					text = it.toString();
					break;

				case "string":
					text = JSON.stringify(it);
					break;

				case "object":
					if(it === null){
						text = "null";
					}else if(it instanceof RegExp){
						text = it.toString();
					}else if((seenName = seen(it))){
						text = "[circular --> " + seenName + "]";
					}else if(it instanceof Array){
						let stringifiedContent = it.map((value, i) => {
							let valueText = stringify(value, level, "[" + i + "]");
							return valueText ? (indent(level) + valueText) : false;
						}).filter(x => x);
						if(stringifiedContent.length){
							text = (
								"[" + newLine +
								stringifiedContent.join("," + newLine) +
								newLine + indent(level - 1) + "]"
							);
						}else{
							text = "[]";
						}
					}else{
						let stringifiedContent = Object.keys(it).sort().map(key => {
							let valueText = stringify(it[key], level, key);
							return valueText ? (indent(level) + propName(key) + valueText) : false;
						}).filter(x => x);
						if(stringifiedContent.length){
							text = (
								"{" + newLine + stringifiedContent.join("," + newLine) +
								newLine + indent(level - 1) + "}"
							);
						}else{
							text = "{}";
						}
					}
					break;

				default:
					text = typeFilter && typeFilter(typeofIt) ? "[" + typeof it + "]" : false;
			}
			nameStack.pop();
			return text;
		};

	return stringify;
}

let stringify = getStringify(4, "\n", (type) => (!(/function|symbol/.test(type))));
stringify.makeStringify = getStringify;
export default stringify;

