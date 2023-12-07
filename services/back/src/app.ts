import "dotenv/config"; // this loads .env values in process.env
import { z } from "zod";
import fastify from "fastify";
import { zoddidWeb } from "./shared/types/zod.js";

export enum Environment {
    Development = "development",
    Production = "production",
    Staging = "staging",
}

const defaultPort = 8080;

const configSchema = z.object({
    CONNECTION_STRING: z.string(),
    PORT: z.number().int().nonnegative().default(defaultPort),
    NODE_ENV: z.nativeEnum(Environment).default(Environment.Development),
    SERVER_URL: z.string().url().default(`http://localhost:${defaultPort}`),
    SERVER_DID: zoddidWeb.default(`did:web:localhost%3A${defaultPort}`),
    EMAIL_OTP_MAX_ATTEMPT_AMOUNT: z.number().int().min(1).max(5).default(3),
    THROTTLE_EMAIL_MINUTES_INTERVAL: z.number().int().min(3).default(3),
    MINUTES_BEFORE_EMAIL_OTP_EXPIRY: z
        .number()
        .int()
        .min(3)
        .max(60)
        .default(10),
    AWS_ACCESS_KEY_ID: z.string().default("CHANGEME"), // only use for prod
    AWS_SECRET_ACCESS_KEY: z.string().default("CHANGEME"),
});

export const config = configSchema.parse(process.env);

function envToLogger(env: Environment) {
    switch (env) {
        case Environment.Development:
            return {
                transport: {
                    target: "pino-pretty",
                    options: {
                        translateTime: "HH:MM:ss Z",
                        ignore: "pid,hostname",
                    },
                },
            };
        case Environment.Production:
        case Environment.Staging:
            return true;
    }
}

export const server = fastify({
    logger: envToLogger(config.NODE_ENV),
});

export const log = server.log;
