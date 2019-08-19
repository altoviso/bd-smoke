export default [{
    input: 'src/smoke.js',
    output: {
        format: 'es',
        name: 'smoke',
        file: './smoke.js'
    }
}, {
    input: 'src/smoke-umd.js',
    output: {
        format: 'umd',
        name: 'smoke',
        file: './smoke-umd.js'
    }
}];
