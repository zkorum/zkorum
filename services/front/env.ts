import { defineConfig } from "@julr/vite-plugin-validate-env";
import { z } from "zod";

const configSchema = {
    VITE_BACK_BASE_URL_DEV: z
        .string()
        .url()
        .nonempty()
        .default("http://localhost:8080"),
    VITE_BACK_BASE_URL_STAGING1: z
        .string()
        .url()
        .nonempty()
        .default("https://staging1.zkorum.com"),
    VITE_BACK_BASE_URL_PROD: z
        .string()
        .url()
        .nonempty()
        .default("https://zkorum.com"),
    VITE_BACK_DID_DEV: z
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
    VITE_BACK_DID_STAGING1: z
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
        .default("did:web:staging1.zkorum.com"),
    VITE_BACK_DID_PROD: z
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
        .default("did:web:zkorum.com"),
    VITE_BACK_PUBLIC_KEY_DEV: z
        .string()
        .describe("Hex representation of the backend's BBS+ public key (dev)")
        .nonempty()
        .default(
            "a33d87ba094e5fb522459da31ef501eedff2ef6b672ed6668555a90e5d099f2f8ac9b428c6b05479aebd9febe64011d707e3e331a01fd32e7bcca2e90405132014d395dade3aa95f72420567c6d4e75a5c70478691d36aa54030f31d326f9414"
        ),
    VITE_BACK_PUBLIC_KEY_STAGING1: z
        .string()
        .describe(
            "Hex representation of the backend's BBS+ public key (staging1)"
        )
        .nonempty()
        .default(
            "a17f8e504a42e53d53ae5ff92a7ba592f8a290cd2a6ed590a32265189cad76dd970b36582a8faca1697711c2fb8560ed084387bcb367f2d90b69887a51e7f41746678d4fc893a53ee6c7a2427b5bb277c6a35670530fbddfcddd1ce131b34288"
        ),
    VITE_BACK_PUBLIC_KEY_PROD: z
        .string()
        .describe("Hex representation of the backend's BBS+ public key (prod)")
        .nonempty()
        .default(
            "94dbc0cc2cc457d9fc23823d7bbb46f3a59f5ec5062628147c89aabcef565593858ffb4f2897c2b8fc2336de2f84dab00eb1b91675e0e89ca18c37b29fde190f266ab2592caf88276ea8fe0449d91b84a32adc95cd969fe266db462a75147352"
        ),
};

export default defineConfig({
    validator: "zod",
    schema: configSchema,
});
