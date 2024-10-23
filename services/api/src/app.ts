import "dotenv/config"; // this loads .env values in process.env
import { z } from "zod";
import Fastify from "fastify";
import { zodDidWeb } from "./shared/types/zod.js";

export type Environment = "development" | "production" | "staging1";

const defaultPort = 8080;

const configSchema = z.object({
    CORS_ORIGIN_LIST: z.string().transform(value => value.split(",").map((item) => {
        return item.trim();
    }))
        .pipe(z.string().array()),
    CONNECTION_STRING: z.string(),
    PORT: z.coerce.number().int().nonnegative().default(defaultPort),
    NODE_ENV: z
        .enum(["development", "staging1", "production"])
        .default("development"),
    MODE: z
        .enum(["web", "capacitor"])
        .default("web"),
    SERVER_URL_DEV: z.string().url().default(`http://localhost:${defaultPort.toString()}`),
    SERVER_URL_STAGING1: z
        .string()
        .url()
        .default(`https://staging1.zkorum.com`),
    SERVER_URL_PROD: z.string().url().default(`https://zkorum.com`),
    SERVER_DID_DEV: zodDidWeb.default(`did:web:localhost%3A${defaultPort.toString() }`),
    SERVER_DID_STAGING1: zodDidWeb.default(`did:web:staging1.zkorum.com`),
    SERVER_DID_PROD: zodDidWeb.default(`did:web:zkorum.com`),
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
    PK_VERSION: z.coerce.number().int().min(1),
    EMAIL_CREDENTIAL_VERSION: z.string().default("0.2.0"),
    SECRET_CREDENTIAL_VERSION: z.string().default("0.2.0"),
    PRESENTATION_VERSION: z.string().default("0.1.0"),
    PRIVATE_KEY_FILEPATH: z.string(),
    TEST_CODE: z.coerce.number().int().min(0).max(999999).default(0),
    SPECIALLY_AUTHORIZED_EMAILS: z.string().optional(),
    NLP_BASE_URL: z.string().default("http://localhost:8081"),
});

export const config = configSchema.parse(process.env);

function envToLogger(env: Environment) {
    switch (env) {
    case "development":
        return {
            transport: {
                target: "pino-pretty",
                options: {
                    translateTime: "HH:MM:ss Z",
                    ignore: "pid,hostname",
                },
            },
        };
    case "production":
    case "staging1":
        return true;
    }
}

export const server = Fastify({
    logger: envToLogger(config.NODE_ENV),
});

export const log = server.log;
