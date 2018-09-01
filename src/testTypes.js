const browser = {
	toString(){
		return "browser";
	}
};
const node = {
	toString(){
		return "node";
	}
};
const both = {
	toString(){
		return "both";
	}
};
const remote = {
	toString(){
		return "remote";
	}
};

const testTypes = {
	browser:browser,
	node:node,
	both:both,
	remote:remote
};

export default testTypes;
