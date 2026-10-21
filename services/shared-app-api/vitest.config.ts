import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^\.\.\/shared\/(.*)\.js$/,
                replacement: fileURLToPath(
                    new URL("../shared/src/$1.ts", import.meta.url),
                ),
            },
        ],
        dedupe: ["sanitize-html", "html-to-text"],
    },
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
    },
});
