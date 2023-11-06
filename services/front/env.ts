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
    VITE_BACK_PUBLIC_KEY: z
        .string()
        .describe("Hex representation of the backend's BBS+ public key")
        .nonempty()
        .default(
            "a1b252a3f41899c8952216bf1290a7cc4015137f9f8016b70212b50de46403b6ace5dbb63a9b5934e1b5fbae54f1fdd70a655ef40ccce142d9364217fc70fd2204a3469412ad970ee43972f24280e8804ddac29033a8ddaae236ff1ca19f95f8"
        ),
};

export default defineConfig({
    validator: "zod",
    schema: configSchema,
});
