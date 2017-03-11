module.exports = {
    "env": {
        "browser": true,
        "commonjs": true
    },
    "globals": {
        "jquery": 1,
        "$": 1
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "warn",
            2,
            {SwitchCase: 1}
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single",
            'avoid-escape'
        ],
        "semi": [
            "error",
            "always"
        ],
        "eqeqeq": [
            2,
            'allow-null'
        ],
        "space-before-blocks": [
            2
        ],
        'space-before-blocks': 2,
    }
};
