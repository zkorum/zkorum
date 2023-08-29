import { defineConfig } from "@julr/vite-plugin-validate-env";
import { z } from "zod";

const configSchema = {
    VITE_BACK_BASE_URL: z
        .string()
        .url()
        .nonempty()
        .default("http://localhost:8080"),
    VITE_BACK_DID: z
        .string()
        .describe("Decentralized Identifier with did:web method")
        .max(254)
        .nonempty()
        .refine(
            (val) => {
                return val.startsWith("did:web:");
            },
            {
                message: "Please use did:web such as `did:web:api.example.com`",
            }
        )
        .default("did:web:localhost%3A8080"),
};

export default defineConfig({
    validator: "zod",
    schema: configSchema,
});
