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
                'global-require': 'off',
                'func-names': 'off'
            }
        }, {
            'files': ['test/**'],
            'rules': {
                'no-console': 'off',
                'global-require': 'off',
            }
        }
    ]
};
