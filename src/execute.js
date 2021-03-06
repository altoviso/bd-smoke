import getPromise from './getPromise.js';

const
    BEFORE = Symbol('before'),
    BEFORE_EACH = Symbol('beforeEach'),
    TEST = Symbol('test'),
    AFTER_EACH = Symbol('afterEach'),
    AFTER = Symbol('after'),
    FINALLY = Symbol('finally'),
    EXCLUDED = Symbol('excluded'),
    EXACT = Symbol('smoke-prepareTest-exact'),
    phaseToMethodName = {
        [BEFORE]: 'before',
        [BEFORE_EACH]: 'beforeEach',
        [AFTER_EACH]: 'afterEach',
        [AFTER]: 'after',
        [FINALLY]: 'finally'
    },
    phaseToText = {
        [BEFORE]: 'before',
        [BEFORE_EACH]: 'before-each',
        [TEST]: 'test',
        [AFTER_EACH]: 'after-each',
        [AFTER]: 'after',
        [FINALLY]: 'finally'
    };

function failScaffold(context, node, phase, e, quitOnFirstFail, logger) {
    if (quitOnFirstFail) {
        // eslint-disable-next-line no-shadow
        context.forEach(node => (node.abort = true));
    } else {
        for (let i = context.indexOf(node), end = context.length; i < end; i++) {
            context[i].abort = true;
        }
        logger.failScaffold(context, node, phaseToText[phase], e);
    }
}

function getTestTree(test, logger, include) {
    //     clone testTree; if includes, then mark all tests not included as EXCLUDED

    // matchedPaths[i] => include[i] matches the current path up to level include[i][matchedPaths[i]]
    // e.g., for current path = "A.B.C"
    // include = [["A", "D"], ["A", "B"]]
    // level = 2
    // then...
    // matchedPaths = [0, 1]..that is, path[0] matches to level 0, path[1] matches to level 1
    const matchedPaths = include && include.map(() => -1);

    function calcIncluded(id, level) {
        let result = false;
        const prevLevel = level - 1;
        const nextLevel = level + 1;
        include.forEach((path, i) => {
            if (path.length > level && matchedPaths[i] === prevLevel && path[level] === id) {
                matchedPaths[i] = level;
                // noinspection JSValidateTypes
                result = result === EXACT || path.length === nextLevel ? EXACT : true;
            }
        });
        return result;
    }

    function traverse(node, level, parent, checkIncluded) {
        const included = !checkIncluded || calcIncluded(node.id, level);
        const result = { id: node.id, parent };
        if (!included) {
            result.test = EXCLUDED;
        } else {
            // included can ONLY be true or EXACT at this point
            node.before && (result.before = node.before);
            node.after && (result.after = node.after);
            node.finally && (result.finally = node.finally);
            node.beforeEach && (result.beforeEach = node.beforeEach);
            node.afterEach && (result.afterEach = node.afterEach);
            if (node.test) {
                if (typeof node.test === 'function') {
                    // if not to the end of the include path, exclude this test
                    // noinspection JSValidateTypes
                    result.test = !checkIncluded || included === EXACT ? node.test : EXCLUDED;
                } else {
                    // included can only be true or EXACT; if it's exact, then stop checking
                    // noinspection JSValidateTypes
                    result.test = traverse(node.test, level + 1, result, checkIncluded && included !== EXACT);
                }
            } else {
                // eslint-disable-next-line no-shadow
                result.tests = node.tests.map(test => {
                    // included can only be true or EXACT; if it's exact, then stop checking
                    // noinspection JSValidateTypes
                    return traverse(test, level + 1, result, checkIncluded && included !== EXACT);
                });
            }
        }
        if (checkIncluded) {
            // calcIncluded may have bumped up the levels in matchedPaths by this level; bump those back down
            matchedPaths.map(_level => (_level === level ? _level - 1 : _level));
        }
        return result;
    }

    try {
        return [traverse(test, 0, null, include.length), false];
    } catch (e) {
        logger.log('smoke:unexpected', test.id, ['failed to filter tests for includes', e]);
        return [{ id: test.id, test: EXCLUDED }, true];
    }
}

function execute(test, logger, options, driver) {
    const theExecutePromise = getPromise();
    const context = [];
    const callContext = {
        context,
        logger,
        options,
        driver,
        testName() {
            return logger.getName(this.context);
        }
    };
    const userScratch = {};

    function* getWorkStream(node) {
        context.push(node);
        if (node.tests) {
            let atLeastOneExecuted = false;
            // eslint-disable-next-line no-restricted-syntax,no-shadow
            for (const test of node.tests) {
                // force executing beforeEach (if any) for each test
                node[BEFORE_EACH] = false;
                node.executed = false;
                yield* getWorkStream(test);
                atLeastOneExecuted = atLeastOneExecuted || node.executed;
                if (node.afterEach && node.executed && !node.abort) {
                    yield [AFTER_EACH, context, node];
                }
                if (node.abort) {
                    break;
                }
            }
            if (node.after && atLeastOneExecuted && !node.abort) {
                yield [AFTER, context, node];
            }
            if (node.finally) {
                yield [FINALLY, context, node];
            }
        } else if (node.test !== EXCLUDED) {
            // eslint-disable-next-line no-restricted-syntax
            for (const n of context) {
                n.executed = true;
                if (n.before && !n[BEFORE] && !n.abort) {
                    yield [BEFORE, context, n];
                }
            }
            // eslint-disable-next-line no-restricted-syntax
            for (const n of context) {
                if (n.beforeEach && !n[BEFORE_EACH] && !n.abort) {
                    yield [BEFORE_EACH, context, n];
                }
            }
            if (!node.abort) {
                yield [TEST, context, node];
            }
            if (node.afterEach && !node.abort) {
                yield [AFTER_EACH, context, node];
            }
            if (node.after && !node.abort) {
                yield [AFTER, context, node];
            }
            if (node.finally) {
                yield [FINALLY, context, node];
            }
        } else { // node.test===EXCLUDED
            logger.excludeTest(context);
        }
        context.pop();
    }

    try {
        // the only options execute consumes itself are include and quitOnFirstFail; both are optional
        const [testTree, prepareError] = getTestTree(test, logger, options.include);
        if (prepareError) {
            logger.log('smoke:bad-test-spec', test.id, ['test not run because of errors in test specification']);
            theExecutePromise.resolve();
            return theExecutePromise.proxy;
        } else if (!testTree) {
            logger.log('smoke:info', test.id, ['either no tests or includes did not match any tests']);
            theExecutePromise.resolve();
            return theExecutePromise.proxy;
        }// else testTree is a good tree with some tests to run
        const workStream = getWorkStream(testTree);
        (function doWork() {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const work = workStream.next();
                if (work.done) {
                    theExecutePromise.resolve();
                    return;
                }
                // eslint-disable-next-line no-shadow
                const [phase, context, node] = work.value;
                if (phase === TEST) {
                    const testUid = callContext.testUid = logger.startTest(context);
                    try {
                        const result = node.test.call(callContext, userScratch);
                        if (result instanceof Promise) {
                            result.then(
                                () => {
                                    logger.passTest(testUid);
                                    doWork();
                                }
                            ).catch(
                                e => {
                                    logger.failTest(testUid, e);
                                    // eslint-disable-next-line no-shadow
                                    options.quitOnFirstFail && context.forEach(node => (node.abort = true));
                                    doWork();
                                }
                            );
                            return;
                        } else {
                            // synchronous result, continue to consume the work stream
                            logger.passTest(testUid);
                        }
                    } catch (e) {
                        // synchronous error, continue to consume the work stream, which will terminate immediately
                        logger.failTest(testUid, e);
                        // eslint-disable-next-line no-shadow
                        options.quitOnFirstFail && context.forEach(node => (node.abort = true));
                    }
                } else {
                    try {
                        delete callContext.testUid;
                        const methodName = phaseToMethodName[phase];
                        const result = node[methodName].call(callContext, userScratch);
                        if (result instanceof Promise) {
                            result.then(
                                () => {
                                    (phase === BEFORE || phase === BEFORE_EACH) && (node[phase] = true);
                                    doWork();
                                }
                            ).catch(
                                e => {
                                    failScaffold(context, node, phase, e, options.quitOnFirstFail, logger);
                                    doWork();
                                }
                            );
                            return;
                        } else {
                            // synchronous result, continue to consume the work stream
                            (phase === BEFORE || phase === BEFORE_EACH) && (node[phase] = true);
                        }
                    } catch (e) {
                        // synchronous error, continue to consume the work stream, which will terminate immediately
                        failScaffold(context, node, phase, e, options.quitOnFirstFail, logger);
                    }
                }
            }
        }());
    } catch (e) {
        logger.log('smoke:unexpected', test.id, ['failed to execute test', e]);
        theExecutePromise.resolve();
    }
    return theExecutePromise.proxy;
}

export {execute};
