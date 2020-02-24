import {smoke} from './smoke.js';

smoke.configure({
    load: [
        './test/minimal-example.js',
        './test/traverse-example.js'
    ]
});
