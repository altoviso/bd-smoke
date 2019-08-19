import {isNode} from './environment.js';
import testTypes from './testTypes.js';

function checkTest(test, logger) {
    //     ensure legal structure
    //     return a clone of cleaned (as required) test

    let error = false;
    const context = [];

    function logError(test, reason) {
        if (!reason) {
            reason = test;
            test = false;
        }
        logger.log('smoke:bad-test-spec', 0, [logger.getName(context, test), reason]);
        error = true;
    }

    function traverse(node) {
        context.push(node);
        const result = { id: node.id };
        if (typeof node.id !== 'string' || !node.id) {
            logError('each test must have a non-empty identifier');
        }
        ['before', 'beforeEach', 'after', 'afterEach', 'finally'].forEach(name => {
            if (node[name]) {
                if (typeof node[name] !== 'function') {
                    logError(`scaffold ${name} must be a function`);
                } else {
                    result[name] = node[name];
                }
            }
        });
        if (!node.test && !node.tests) {
            logError(node, 'test or tests must be specified for each node in the test tree');
        }
        if (node.test && node.tests) {
            logError(node, 'one of test or tests (not both) allowed for each node in the test tree.');
        }
        if (node.test) {
            if (typeof node.test === 'function') {
                result.test = node.test;
            } else if (node.test instanceof Object) {
                result.test = traverse(node.test);
            } else {
                logError(node, 'test must be either a test object or a function');
            }
        }
        if (node.tests) {
            result.tests = node.tests.map((test, i) => {
                let result;
                if (typeof test === 'function') {
                    // implied testId of the index
                    result = { id: test.name, test };
                } else if (Array.isArray(test)) {
                    // [id, test]
                    if (typeof test[0] === 'function') {
                        logError(node, `[${i}]each test must have an identifier`);
                    } else if (typeof test[1] !== 'function') {
                        logError(node, `[${test[0]}]test is not a function`);
                    } else {
                        result = { id: test[0], test: test[1] };
                    }
                } else if (test instanceof Object) {
                    result = traverse(test);
                } else {
                    logError(node, `[${i}]don't know what test is; should be a [id, test (a function)] pair, a test (a function) or a test object (an object)`);
                }
                return result;
            });
        }
        context.pop();
        return result;
    }

    try {
        return [traverse(test), error];
    } catch (e) {
        logger.log('smoke:unexpected', 0, [test.id, 'test specification was malformed', e]);
        return [false, true];
    }
}

function defTest(type, logger, tests, ...args) {
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        let [test, error] = checkTest(arg, logger);
        if (!error) {
            if (type === testTypes.browser && isNode) {
                // never going to run this test here, simplify it for use as a reference to a test that may be run remotely
                test = { id: test.id, test: _ => _, type: testTypes.browser };
            }
            if (isNode || type === testTypes.both || type === testTypes.browser) {
                test.type = type;
                tests.push(test);
            }
        }
    }
}

function orderTests(tests) {
    // order the tests as specified by the test.order or by order in which they were defined
    // explicitly ordered tests always come first
    const orderedTests = [];
    const unorderedTests = [];
    tests.forEach(test => {
        if ('order' in test) {
            orderedTests.push(test);
        } else {
            unorderedTests.push(test);
        }
    });
    orderedTests.sort((lhs, rhs) => {
        return lhs.order - rhs.order;
    });
    return orderedTests.concat(unorderedTests);
}

export {testTypes, defTest, orderTests};
