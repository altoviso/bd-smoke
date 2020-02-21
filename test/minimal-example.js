/* globals define */

(function (factory) {
    if (typeof window !== 'undefined') {
        if (window.smoke) {
            // smoke defined as a global variable
            factory(window.smoke);
            return;
        }
        if (window.define && window.define.amd) {
            // using an AMD loader; smoke must be a module in that loaders module space
            // eslint-disable-next-line no-undef
            define(['smoke'], factory);
            return;
        }
    }

    // the only alternative left is nodejs
    factory(require('../smoke-umd.js'));
}(smoke => {
    const assert = smoke.assert;
    smoke.defTest({
        id: 'minimal-example',
        tests: [
            function examplePass() {
                assert(true);
            },
            function exampleFail() {
                this.logger.logNote('example-fail: intentional fail to test fail circuitry');
                assert(false);
            },
            function exampleAsyncPass() {
                return new Promise(resolve => {
                    setTimeout(resolve, 30);
                }).then(() => {
                    assert(true);
                });
            },
            function exampleAsyncFail() {
                return new Promise(resolve => {
                    setTimeout(resolve, 30);
                }).then(() => {
                    this.logger.logNote('example-async-fail: intentional fail to test fail circuitry');
                    assert(false);
                });
            },
            function cleanUpLog() {
                this.logger._passCount += 2;
                this.logger._failCount -= 2;
            }
        ]
    });
}));
