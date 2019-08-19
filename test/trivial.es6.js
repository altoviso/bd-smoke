// a trivial test when smoke is loaded from '../smoke.es6.js'
import smoke from '../smoke.es6.js';

const assert = smoke.assert;

smoke.defTest({
    id: 'trivial',
    tests: [
        ['example-pass', function () {
            assert(true);
        }]
    ]
});
