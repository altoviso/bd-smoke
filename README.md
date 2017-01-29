# bd-smoke

[![Build status][travis-image]][travis-url]
[![Dependencies][deps-image]][deps-url]
[![devDependencies][dev-deps-image]][dev-deps-url]

## Simple, powerful javascript test framework for node.js and the browser with NO dependencies.

# Requirements

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

12. bd-smoke has no dependencies.


[deps-image]:     https://img.shields.io/david/altoviso/bd-smoke.svg
[deps-url]:       https://david-dm.org/altoviso/bd-smoke
[dev-deps-image]: https://img.shields.io/david/dev/altoviso/bd-smoke.svg
[dev-deps-url]:   https://david-dm.org/altoviso/bd-smoke#info=devDependencies
[travis-image]:   https://img.shields.io/travis/altoviso/bd-smoke.svg
[travis-url]:     https://travis-ci.org/altoviso/bd-smoke