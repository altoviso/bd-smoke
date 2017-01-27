# bd-smoke

## Simple, powerful javascript test framework for node.js and the browser with NO dependencies.

# Requrements

1. The fundamental function of bd-smoke is to execute any subset of a hierarchy of code fragments (including an entire hierarchy) and report success and failure in a manner that is easily consumable by both a human user and other software systems. 

2. The bd-smoke executes in either the browser or node.js.

3. A test is comprised of a hierarchy of code fragments that assert behavior of the code expressed in those fragments.

4. The hierarchy may be loaded (1) explicitly by a <script> element in an HTML document, (2) by an AMD module loader, or (3) by the the node.js module loader.

5. The code fragments may be synchronous or asynchronous.

6. Before, before-each, after-each, and after scaffolds may be provided for each code fragment in the hierarchy.

7. The code fragments in the hierarchy are named.

8. The hierarchy may be spread across multiple files.

9. The bd-smoke requires an ES6 environment.

10. The bd-smoke has no external dependencies.

11. The bd-smoke may be switched to continue or halt exercising asserts upon an assertion failure.

12. The bd-smoke may be switched to slice the hierarchy and execute the resulting slices in multiple, spawned processes.

