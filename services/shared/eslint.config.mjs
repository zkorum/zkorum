// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: [],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: ["src/**"],
        rules: {
            "linebreak-style": ["error", "unix"],
        },
    },
    {
        ignores: ["**/dist/", "eslint.config.mjs", "jest.config.js", "val.js"],
    },
);
