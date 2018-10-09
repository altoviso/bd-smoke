let assertCount = 0;

function resetAssertCount(){
	assertCount = 0;
}

function bumpAssertCount(){
	++assertCount;
}

function getAssertCount(){
	return assertCount;
}

function assert(value, message){
	// trivial assert; any function that throws upon a detected error will work
	bumpAssertCount();
	if(!value){
		throw new Error(message || "fail");
	}
}

export {resetAssertCount, bumpAssertCount, getAssertCount, assert};