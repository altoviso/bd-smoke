(function () {
    let load = [
        './test/minimal-example.js',
        './test/traverse-example.js'
    ];

    function doConfig(smoke) {
        smoke.configure({
            load,
            remoteUrl: 'http://localhost:8080/altoviso/bd-smoke/browser-runner.html?remotelyControlled&root=./',
            capabilities: smoke.isNode ? require('./test/capabilities') : [],
        });
    }

    if (typeof window !== 'undefined') {
        if (window.require) {
            // AMD
            load = load.map(m => m.replace(/^\./, 'smoke').replace(/\.js$/, ''));
            window.require(['smoke'], doConfig);
        } else {
            // global smoke
            doConfig(window.smoke);
        }
    } else {
        // on node
        doConfig(require('./smoke-umd.js'));
    }
}());
