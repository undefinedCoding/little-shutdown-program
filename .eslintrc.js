module.exports = {
    env: {
        browser: true,
        es6: true
    },
    extends: [],
    plugins: [
        "prefer-arrow"
    ],
    rules: {
        "array-bracket-spacing": [ "error", "always", { singleValue: false } ],
        "arrow-spacing": "error",
        "block-spacing": [ "error", "always" ],
        "brace-style": [ "error", "1tbs", { allowSingleLine: true } ],
        "camelcase": "error",
        "comma-dangle": "error",
        "complexity": [ "error", { max: 10 } ],
        "computed-property-spacing": [ "error", "never" ],
        "constructor-super": "error",
        "dot-notation": "error",
        "eqeqeq": [ "error", "smart" ],
        "guard-for-in": "error",
        "id-blacklist": [ "error", "any", "number", "string", "Boolean", "boolean" ],
        "id-match": "error",
        "indent": ["error", 2],
        "keyword-spacing": [ "error", { after: true, before: true } ],
        "linebreak-style": [ "error", "unix" ],
        "max-classes-per-file": [ "error", 1 ],
        "max-len": [ "error", { code: 120 } ],
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": [ "error", { allow: [ "warn", "error", "debug" ] } ],
        "no-debugger": "error",
        "no-duplicate-imports": "error",
        "no-empty": "error",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-irregular-whitespace": "error",
        "no-new-wrappers": "error",
        "no-shadow": [ "error", { hoist: "all" } ],
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "error",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "object-curly-spacing": [ "error", "always" ],
        "object-curly-newline": ["error", { minProperties: 2 }],
        "object-shorthand": "error",
        "one-var": [ "error", "never" ],
        "prefer-arrow/prefer-arrow-functions": "error",
        "radix": "error",
        "rest-spread-spacing": [ "error", "always" ],
        "semi": ["error", "never"],
        "sort-imports": [ "error", { ignoreCase: true } ],
        "sort-keys": "error",
        "space-before-blocks": [ "error", "always" ],
        "space-before-function-paren": [ "error", "always" ],
        "spaced-comment": "error",
        "template-curly-spacing": [ "error", "never" ],
        "use-isnan": "error",
        "valid-typeof": "off"
    },
    settings: {
        jsdoc: {
            mode: "typescript",
            tagNamePreference: {
                arg: "param",
                return: "returns"
            }
        }
    }
};
