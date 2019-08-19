const smoke = typeof window !== 'undefined' ? window.smoke : require('../smoke-umd.js');

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
