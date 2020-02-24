// eslint-disable-next-line no-undef
const smoke = require('./smoke-umd.js');

smoke.configure({
    load: [
        './test/minimal-example-node.js'
    ]
});
