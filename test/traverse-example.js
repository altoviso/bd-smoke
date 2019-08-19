(function (factory) {
    if (typeof window !== 'undefined') {
        if (window.smoke) {
            // smoke defined as a global variable
            factory(window.smoke);
            return;
        }
        if (window.define) {
            // using an AMD loader; smoke must be a module in that loaders module space
            define(['smoke'], factory);
            return;
        }
    }

    // the only alternative left is nodejs
    factory(require('../smoke-umd.js'));
}(smoke => {
    const assert = smoke.assert;
    let trace;
    smoke.defTest({
        // this is a node in the hierarchy of tests defined by this file
        id: 'root',
        before() {
            trace = ['root-before'];
        },
        beforeEach() {
            trace.push('root-beforeEach');
        },
        afterEach() {
            trace.push('root-afterEach');
        },
        after() {
            trace.push('root-after');
            const expected = ['root-before', 'root-beforeEach', 'level-1-1st', 'root-afterEach', 'level-1-2nd-before', 'root-beforeEach', 'level-1-2nd-beforeEach', 'a', 'level-1-2nd-afterEach', 'level-1-2nd-beforeEach', 'b', 'level-1-2nd-afterEach', 'level-1-2nd-after', 'root-afterEach', 'level-1-3rd-before', 'root-beforeEach', 'level-1-3rd-beforeEach', 'c', 'level-1-3rd-afterEach', 'level-1-3rd-beforeEach', 'd', 'level-1-3rd-afterEach', 'level-1-3rd-after', 'root-afterEach', 'root-beforeEach', 'level-1-4th', 'root-afterEach', 'root-after'];
            // trace.forEach(function(s){ console.log(s); });
            assert(expected.join('-') === trace.join('-'));
        },

        // each node can have a set of children...
        tests: [
            // a child can be a test, which is a pair of [<name>, <function>]
            ['level-1-1st', function () {
                trace.push('level-1-1st');
            }],

            // or another node
            {
                id: 'level-1-2nd',
                before() {
                    trace.push('level-1-2nd-before');
                },
                beforeEach() {
                    trace.push('level-1-2nd-beforeEach');
                },
                afterEach() {
                    trace.push('level-1-2nd-afterEach');
                },
                after() {
                    trace.push('level-1-2nd-after');
                },
                tests: [
                    function a() {
                        trace.push('a');
                    },
                    function b() {
                        trace.push('b');
                    }
                ]
            },

            // etc.
            {
                id: 'level-1-3rd',
                before() {
                    trace.push('level-1-3rd-before');
                },
                beforeEach() {
                    trace.push('level-1-3rd-beforeEach');
                },
                afterEach() {
                    trace.push('level-1-3rd-afterEach');
                },
                after() {
                    trace.push('level-1-3rd-after');
                },
                tests: [
                    function c() {
                        trace.push('c');
                    },
                    function d() {
                        trace.push('d');
                    }
                ]
            },

            // etc.
            ['level-1-4th', function () {
                trace.push('level-1-4th');
            }],
        ]
    });
}));
