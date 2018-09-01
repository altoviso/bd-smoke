let assertCount = 0;

function resetAssertCount(){
	assertCount = 0;
}

function getAssertCount(){
	return assertCount;
}

function assert(value, message){
	// trivial assert; any function that throws upon a detected error will work
	++assertCount;
	if(!value){
		throw new Error(message || "fail");
	}
}

export {resetAssertCount, getAssertCount, assert};