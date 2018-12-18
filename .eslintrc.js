module.exports = {
    'env': {
        'node': true,
        'jest/globals': true,
        'commonjs': true,
        'es6': true
    },
    'plugins': [
        'jest'
    ],
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 2018
    },
    'rules': {
        'react/prop-types': 'off',
        'indent': [
            'error',
            'tab'
        ],
        'linebreak-style': 'off',
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'no-console': 'off',
    }
};