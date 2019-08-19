((function () {
    const smoke = typeof window !== 'undefined' ? window.smoke : require('./smoke-umd.js');

    const config = {
        load: [
            './test/minimal-example.js',
            './test/traverse-example.js'
        ],

        remoteUrl: 'http://localhost:8080/altoviso/bd-smoke/browser-runner.html?remotelyControlled&root=./',

        capabilities: smoke.isNode ? require('./test/capabilities') : [],
    };
    smoke.configure(config);
})());
