// to see this work, run
//     node smoke-runner-node load=smoke.config-example-node.js
// from this directory

const smoke = require('./smoke-umd.js');

smoke.defaultStart(smoke.configureNode({ autoRun: true }));
