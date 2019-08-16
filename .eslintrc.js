module.exports = {
    'env': {
        'browser': true,
        'es6': true,
        'node': true
    },

    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },

    extends: [
        'backdraft'
    ],

    'rules': {
        'no-return-assign': 'off'
    },

    'overrides': [
        {
            'files': ['smoke.config.js'],
            'rules': {
                'global-require': 'off'
            }
        }, {
            'files': ['test/**', '*-test.es6.js', '*-test.js'],
            'rules': {
                'no-console': 'off'
            }
        }
    ]
};
