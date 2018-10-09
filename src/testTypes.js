const browser = Object.freeze({
	toString(){
		return "browser";
	}
});
const node = Object.freeze({
	toString(){
		return "node";
	}
});
const both = Object.freeze({
	toString(){
		return "both";
	}
});
const remote = Object.freeze({
	toString(){
		return "remote";
	}
});

const testTypes = Object.freeze({
	browser:browser,
	node:node,
	both:both,
	remote:remote
});

export default testTypes;
