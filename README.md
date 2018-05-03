# bd-smoke
### The Backdraft test harness by [ALTOVISO](http://www.altoviso.com/).

[![Build status][travis-image]][travis-url]
[![Dependencies][deps-image]][deps-url]
[![devDependencies][dev-deps-image]][dev-deps-url]

## Simple, powerful javascript test framework for node.js and the browser with NO dependencies.

# Features

* **No dependencies**

* Executes on node.js and in the browser--*with or without* AMD

* Executes an arbitrarily deep and wide hierarchy of code fragments

* Executes synchronous and asynchronous code fragments/tests

* Optional before/before-each/after-each/after scaffolding as the hierarchy is traversed

* High-precision timer for performance testing

* Simple command-line/URL switches that cause a subset of fragments to be executed

* Simple, extendable, and replaceable logging machinery

* *Un*opinionated assert requirements: anything that throws an exception can be used to show failure

* Exit status for CI support 

* All this power yet simple and easy to hack: the complete code stack is less than 650 lines in one file

## Installation

With `npm`:

```
npm install -D bd-smoke
```

With `yarn`:

```
yarn add bd-smoke
```

With `bower`:

```
bower install --save bd-smoke
```


## Getting Started on Node

Assuming you have a `test` subdirectory in the root of your project, create the file`trivial-node.js` in that directory
that looks like this:

```
let smoke = require("bd-smoke");
const assert = smoke.assert;

smoke.defTest({
	id: "trivial",
	tests: [
		["example-pass", function(){
			assert(true);
		}]
	]
});

```

Now run the test, from your project root directory, execute
```
$ node ./node_modules/bd-smoke/node-runner.js -p=../../test/trivial-node.js
```
*warning* the -p argument is relative to ./node_modules/bd-smoke/node-runner.js

## Getting Started in the Browser without AMD

Assuming you have a `test` directory in the root of your project, create the file`trivial-nonAMD.js` in that directory
that looks like this:

```
const assert = smoke.assert;

smoke.defTest({
	id: "trivial",
	tests: [
		["example-pass", function(){
			assert(true);
		}]
	]
});

```

Now run the test: in the browser, navigate to...
```
<as required for your environment><your project directory>/node_modules/bd-smoke/browser-runner.html?p=../../test/trivial-nonAMD.js
```

*warning* the -p argument is relative to <as required for your environment><your project directory>/node_modules/bd-smoke/browser-runner.html

## Getting Started in the Browser with AMD

Assuming you have a `test` directory in the root of your project, create the file`trivial-AMD.js` in that directory
that looks like this:

```
define(["smoke"], function(smoke){
	const assert = smoke.assert;

	smoke.defTest({
		id: "trivial",
		tests: [
			["example-pass", function(){
				assert(true);
			}]
		]
	});
});
```

Now run the test: in the browser, navigate to...
```
<as required for your environment><your project directory>/node_modules/bd-smoke/browser-runner-amd.html?p=test/trivial-AMD&package=test:../../test
```
*warning* the package path argument is relative to <as required for your environment><your project directory>/node_modules/bd-smoke/browser-runner.html

## Getting Started with UMD

The three examples above can be combined into one example that will work in all three environments by defining the test
in the file `trivial.js` using UMD like this:

```
(function(factory){
	if(typeof define != "undefined"){
		define(["smoke"], factory);
	}else if(typeof module != "undefined"){
		factory(require("bd-smoke"));
	}else{
		factory(smoke);
	}
})(function(smoke){
	const assert = smoke.assert;

	smoke.defTest({
		id: "trivial",
		tests: [
			["example-pass", function(){
				assert(true);
			}]
		]
	});

});

```
Run it on Node
```
$ node ./node_modules/bd-smoke/node-runner.js -p=../../test/trivial.js
```
*warning* the -p argument is relative to ./node_modules/bd-smoke/node-runner.js

Run it in the browser without AMD
```
<as-required-for-your-environment>/node_modules/smoke/browser-runner.html?p=../../test/trivial.js"
```
Run it in the browser with AMD
```
<as-required-for-your-environment>/node_modules/smoke/browser-runner-amd.html?p=test/trivial&package=test:../../test
```
## Command-line / URL switches
bd-smoke is controlled by switches passed to it from the command line, when running in node.js, or from the URL query
string, when running in the browser. Each switch has the form
```
--<long-switch-name>=<value>
```
or
```
-<short-switch-name>=<value>
```
We've already seen the `-p` switch, which is the short name for the `--profile` switch. The profile switch says which
files to load and execute. Multiple profiles may be specified within a single command line.

For large tests, a file loaded by the profile switch will itself go on to load several other files. Take a look at `all.js `
in the test directory for an example.

If an AMD loader is present, profile arguments without a file type are assumed to be AMD modules. If the profile argument
has a file type, then it is loaded outside the context of the AMD loader.

The `--package=<package name>:<package location>:<package main>` causes the implied package config to be sent to the AMD
loader *before* any AMD modules are attempted to be loaded. `:<package main>` is optional.

## Test Hierarchies
A test is a hierarchy (a tree) of nodes. Each node in the tree can contain either a single test of an ordered
list of tests and other nodes. When a node specifies a single test, is has an `id` property that names the test and a
`test` property that defines the test. Here is an example of a tree with one node that contains one test:
```
smoke.defTest({
	id: "trivial",
	test: function(){
		assert(true);
	}
});
```
When a node contains several children, it has a `tests` property that is an array of several other nodes. Here is an 
example of a tree that has a root node with two children, each nodes with one test:
```
smoke.defTest({
	id: "root",
	tests: [{
		id: "test1",
		test: function(){
			assert(true);
		}
	}, {
		id: "test2",
		test: function(){
			assert(true);
		}
	}]
});
```
Of course a node can contain any combination of tests and child nodes. When a test is contained in a node that has multiple
children like this, it is specified by providing a pair of `[<test-name, string>,<test, function>]`. Here is an example
of a tree that has a root node that contains both tests and children nodes.
```
smoke.defTest({
	id: "root",
	tests: [["root-test1",
		function(){
			assert(true);
		}
	], {
		id: "test1",
		test: function(){
			assert(true);
		}
	}, {
		id: "test2",
		test: function(){
			assert(true);
		}
	}, ["root-test2",
		function(){
			assert(true);
		}
	]]
})
```
Each node can provide a `before`, `beforeEach`, `afterEach`, and `after` scaffold function. At the tree is traversed,
tests and scaffolds are executed as follows:

```
function traverse(node){
    // for simple nodes that contain a single test...
    if(node.test){
        node.test();
        return;
    }
    
    // for nodes that contain a list of tests and/or children nodes
    if(node.before){
        node.before();
    }
    node.tests.forEach(function(child){
        if(node.beforeEach){
            node.beforeEach();
        }
        if(Array.isArray(child)){
            child[1]();
        }else{
            traverse(child);
        }
        if(node.afterEach){
            node.afterEach();
        }
    });
    if(node.after){
      node.after();
    }  
}
```
## Executing Subsets of Tests
Notice that each test is addressable by a name as given by the path to the test. This feature can be used to execute
subsets of tests with the `include` command line parameter. `include` is a `;`-separated list of paths. Each path may
optionally terminate with a `:` followed by a `,`-separated list of test to execute at the path end-point. For example:
```
--include="path\to\test1"
```
Executes the child node with the `id` or test name `"test1"` of the child node with the `id` `"to"` of the root node with the `id` `"path"`.
Here is an example with several tests:
```
--include="path\to\test-foo;another-root\to\test-bar"
```
Notice how you can pull any test out of the hierarchy. Of course the address included in include *need not* be a test, but rather it can be
any node. If it is a node that contains several tests and/or children, then all of those tests and/or children will be executed.

Terminating a path with a colon is just a shorthand; the following two include directives are equivalent:
```
--include="path\to\test-foo;path\to\test-bar"
--include="path\to:test-foo,test-bar"
```

# Requirements

Smoke was written because I was dissatisfied with other generally-available/popular solutions. Here are the requirements
I attempted to fulfill when writing smoke.

1. The fundamental function of bd-smoke is to execute any subset of a hierarchy of code 
fragments (including an entire hierarchy) and report success and failure in a manner that
is easily consumable by both a human user and a software system. 

2. bd-smoke executes in either the browser or node.js.

3. A test is comprised of a hierarchy of code fragments that assert behavior of the code
expressed in those fragments.

4. The hierarchy may be loaded by (1) a `<script>` element in an HTML document, (2) an AMD
module loader, or (3) the the node.js module loader.

5. The code fragments may execute synchronously or asynchronously.

6. Before, before-each, after-each, and after scaffolds may be provided for each code fragment
in the hierarchy.

7. The code fragments in the hierarchy are named.

8. The hierarchy may be spread across multiple files.

9. bd-smoke may be switched to continue or halt upon an assertion failure.

10. bd-smoke assumes an ES6 environment.

11. bd-smoke has no dependencies.

12. bd-smoke is as simple as possible, yet leaves hooks for fancy extensions like loggers.


[deps-image]:     https://img.shields.io/david/altoviso/bd-smoke.svg
[deps-url]:       https://david-dm.org/altoviso/bd-smoke
[dev-deps-image]: https://img.shields.io/david/dev/altoviso/bd-smoke.svg
[dev-deps-url]:   https://david-dm.org/altoviso/bd-smoke#info=devDependencies
[travis-image]:   https://img.shields.io/travis/altoviso/bd-smoke.svg
[travis-url]:     https://travis-ci.org/altoviso/bd-smoke