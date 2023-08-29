/* eslint-disable */
module.exports = {
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: ["react-refresh"],
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
                destructuredArrayIgnorePattern: "^_",
            },
        ],
        "react-refresh/only-export-components": "warn",
        // https://mui.com/material-ui/guides/minimizing-bundle-size/#option-one-use-path-imports
        "no-restricted-imports": [
            "error",
            {
                patterns: ["@mui/*/*/*"],
            },
        ],
    },
};
