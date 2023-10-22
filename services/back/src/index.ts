import fs from "fs";
import { type FastifyRequest } from "fastify";
import fastifyAuth from "@fastify/auth";
import fastifySensible from "@fastify/sensible";
import fastifySwagger from "@fastify/swagger";
import fastifyCors from "@fastify/cors";
import { Service } from "./service/service.js";
import {
    serializerCompiler,
    validatorCompiler,
    jsonSchemaTransform,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { DrizzleFastifyLogger } from "./logger.js";
import { Dto, type UserCredentials } from "./dto.js";
import * as ucans from "@ucans/ucans";
import {
    httpMethodToAbility,
    httpUrlToResourcePointer,
} from "./shared/ucan/ucan.js";
import {
    initializeWasm,
    BBSPlusSecretKey as SecretKey,
} from "@docknetwork/crypto-wasm-ts";
import { config, Environment, server } from "./app.js";
import {
    drizzle,
    type PostgresJsDatabase as PostgresDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
    addActiveEmailCredential,
    addActiveSecretCredential,
    hasActiveEmailCredential,
    hasActiveSecretCredential,
} from "./service/credential.js";
import type { SecretCredential } from "./shared/types/zod.js";

server.register(fastifySensible);
server.register(fastifyAuth);
server.register(fastifyCors, {
    // put your options here
});

// Add schema validator and serializer
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(fastifySwagger, {
    openapi: {
        info: {
            title: "ZKorum",
            description: "ZKorum backend",
            version: "1.0.0",
        },
        servers: [],
    },
    transform: jsonSchemaTransform,
    // You can also create transform with custom skiplist of endpoints that should not be included in the specification:
    //
    // transform: createJsonSchemaTransform({
    //   skipList: [ '/documentation/static/*' ]
    // })
});

// Custom error handler
server.setErrorHandler((error, _request, reply) => {
    // Check if the error has a status code of 500
    if (error.statusCode === undefined || error.statusCode >= 500) {
        // Modify the response message for status code 500
        // ... by wrapping the original error with a generic error
        // For security sake, we don't want the frontend to know the exact nature of the internal errors
        const genericError = server.httpErrors.internalServerError();
        genericError.cause = error;
        reply.send(genericError);
    } else if (error.statusCode !== undefined && error.statusCode === 401) {
        const genericError = server.httpErrors.unauthorized();
        genericError.cause = error;
        reply.send(genericError);
    } else if (error.statusCode !== undefined && error.statusCode === 403) {
        const genericError = server.httpErrors.forbidden();
        genericError.cause = error;
        reply.send(genericError);
    } else {
        // For other status codes, forward the original error
        reply.send(error);
    }
});

// const client = postgres(config.CONNECTION_STRING);
const client = postgres(config.CONNECTION_STRING);
const db = drizzle(client, {
    logger: new DrizzleFastifyLogger(server.log),
});

// This is necessary for crypto-wasm-ts to work
await initializeWasm();
const sk: SecretKey = getSecretKey(config.NODE_ENV);
function getSecretKey(env: Environment): SecretKey {
    if (env === Environment.Development) {
        const skAsHex = fs.readFileSync("./private.dev.key", {
            encoding: "utf8",
            flag: "r",
        });
        return new SecretKey(SecretKey.fromHex(skAsHex).bytes);
    } else {
        // TODO modify that to load it from an encrypted S3 value.
        // Not very safe, but no KMS supports BBSPlus secret key at this time: WIP
        const skAsHex = fs.readFileSync("./private.dev.key", {
            encoding: "utf8",
            flag: "r",
        });
        return new SecretKey(SecretKey.fromHex(skAsHex).bytes);
    }
}

interface ExpectedDeviceStatus {
    userId?: string;
    isSyncing?: boolean;
    isLoggedIn?: boolean;
}

interface OptionsVerifyUcan {
    expectedDeviceStatus?: ExpectedDeviceStatus;
}

// auth functions
// TODO: store UCAN in ucan table at the end and check whether UCAN has already been seen in the ucan table on the first place - if yes, throw unauthorized error and log the potential replay attack attempt.
// ! WARNING: will not work if there are queryParams. We only use POST requests and JSON body requests (JSON-RPC style).
async function verifyUCAN(
    db: PostgresDatabase,
    request: FastifyRequest,
    options: OptionsVerifyUcan = {
        expectedDeviceStatus: {
            isLoggedIn: true,
            isSyncing: true,
        },
    }
): Promise<string> {
    const authHeader = request.headers.authorization;
    if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
        throw server.httpErrors.unauthorized();
    } else {
        const { scheme, hierPart } = httpUrlToResourcePointer(
            new URL(request.originalUrl, config.SERVER_URL)
        );
        const encodedUcan = authHeader.substring(7, authHeader.length);
        const rootIssuerDid = ucans.parse(encodedUcan).payload.iss;
        const result = await ucans.verify(encodedUcan, {
            audience: config.SERVER_DID,
            isRevoked: async (_ucan) => false, // users' generated UCANs are short-lived action-specific one-time token so the revocation feature is unnecessary
            requiredCapabilities: [
                {
                    capability: {
                        with: { scheme, hierPart },
                        can: httpMethodToAbility(request.method),
                    },
                    rootIssuer: rootIssuerDid,
                },
            ],
        });
        if (!result.ok) {
            throw server.httpErrors.createError(
                401,
                "Unauthorized",
                new AggregateError(result.error)
            );
        }
        if (options.expectedDeviceStatus !== undefined) {
            const deviceStatus = await Service.getDeviceStatus(
                db,
                rootIssuerDid
            );
            if (deviceStatus === undefined) {
                if (options.expectedDeviceStatus.isLoggedIn !== undefined) {
                    throw server.httpErrors.unauthorized(
                        `[${rootIssuerDid}}] has not been registered but is expected to have a log in status`
                    );
                } else if (options.expectedDeviceStatus.userId !== undefined) {
                    throw server.httpErrors.forbidden(
                        `[${rootIssuerDid}}] has not been registered but is expected to have a specific userId`
                    );
                } else if (
                    options.expectedDeviceStatus.isSyncing !== undefined
                ) {
                    throw server.httpErrors.forbidden(
                        `[${rootIssuerDid}}] has not been registered but is expected to have a syncing status`
                    );
                }
            } else {
                const { userId, isLoggedIn, isSyncing } = deviceStatus;
                if (
                    options.expectedDeviceStatus.isLoggedIn !== undefined &&
                    options.expectedDeviceStatus.isLoggedIn !== isLoggedIn
                ) {
                    throw server.httpErrors.unauthorized(
                        `[${rootIssuerDid}}] is expected to have 'isLoggedIn=${options.expectedDeviceStatus.isLoggedIn}' but has 'isLoggedIn=${isLoggedIn}'`
                    );
                } else if (
                    options.expectedDeviceStatus.userId !== undefined &&
                    options.expectedDeviceStatus.userId !== userId
                ) {
                    throw server.httpErrors.forbidden(
                        `[${rootIssuerDid}}] is expected to have 'userId=${options.expectedDeviceStatus.userId}' but has 'userId=${userId}'`
                    );
                } else if (
                    options.expectedDeviceStatus.isSyncing !== undefined &&
                    options.expectedDeviceStatus.isSyncing !== isSyncing
                ) {
                    throw server.httpErrors.forbidden(
                        `[${rootIssuerDid}}] is expected to have 'isSyncing=${options.expectedDeviceStatus.isSyncing}' but has 'isSyncing=${isSyncing}'`
                    );
                }
            }
        }
        return rootIssuerDid;
    }
}

server.after(() => {
    server.withTypeProvider<ZodTypeProvider>().post("/auth/authenticate", {
        schema: {
            body: Dto.authenticateRequestBody,
            response: { 200: Dto.authenticateResponse, 409: Dto.auth409 },
        },
        handler: async (request, _reply) => {
            // This endpoint is accessible without being logged in
            // this endpoint could be especially subject to attacks such as DDoS or man-in-the-middle (to associate their own DID instead of the legitimate user's ones for example)
            // => TODO: restrict this endpoint and the "verifyOtp" endpoint to use same IP Address: the correct IP Address must part of the UCAN
            // => TODO: allow email owners to report spam/attacks and to request blocking the IP Addresses that attempted access
            // The web infrastructure is as it is and IP Addresses are the backbone over which our HTTP endpoints function, we can avoid storing/logging IP Addresses as much as possible, but we can't fix it magically
            // As a social network (hopefully) subject to heavy traffic, the whole app will need to be protected via a privacy-preserving alternative to CAPTCHA anyway, such as Turnstile: https://developers.cloudflare.com/turnstile/
            // => TODO: encourage users to use a mixnet such as Tor to preserve their privacy.
            const didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: undefined,
            });
            const { type, userId } = await Service.getAuthenticateType(
                db,
                request.body,
                didWrite,
                server.httpErrors
            );
            return await Service.authenticateAttempt(
                db,
                type,
                request.body,
                userId,
                config.MINUTES_BEFORE_EMAIL_OTP_EXPIRY,
                didWrite,
                config.THROTTLE_EMAIL_MINUTES_INTERVAL,
                server.httpErrors
            ).then(({ codeExpiry, nextCodeSoonestTime }) => {
                // backend intentionally does NOT send whether it is a register or a login, and does not send the address the email is sent to - in order to protect privacy and give no information to potential attackers
                return {
                    codeExpiry: codeExpiry,
                    nextCodeSoonestTime: nextCodeSoonestTime,
                };
            });
        },
    });

    // TODO: for now, there is no 2FA so when this returns true, it means the user has finished logging in/registering - but it will change
    // TODO: for now there is no way to communicate "isTrusted", it's set to true automatically - but it will change
    server.withTypeProvider<ZodTypeProvider>().post("/auth/verifyOtp", {
        schema: {
            body: Dto.verifyOtpReqBody,
            response: { 200: Dto.verifyOtp200, 409: Dto.auth409 },
        },
        handler: async (request, _reply) => {
            const didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: undefined,
            });
            return await Service.verifyOtp(
                db,
                config.EMAIL_OTP_MAX_ATTEMPT_AMOUNT,
                didWrite,
                request.body.code,
                request.body.encryptedSymmKey,
                server.httpErrors
            );
        },
    });
    server.withTypeProvider<ZodTypeProvider>().post("/auth/logout", {
        handler: async (request, _reply) => {
            const didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: {
                    isLoggedIn: true,
                },
            });
            await Service.logout(db, didWrite);
        },
    });
    // TODO
    server.withTypeProvider<ZodTypeProvider>().post("/auth/sync", {
        schema: {
            body: Dto.createOrGetEmailCredentialsReq,
            response: {
                // TODO 200: Dto.createOrGetEmailCredentialsRes,
                409: Dto.sync409,
            },
        },
        handler: async (request, _reply) => {
            const _didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: {
                    isLoggedIn: true,
                    isSyncing: false,
                },
            });
            // TODO
            // return await AuthService.syncAttempt(db, didWrite);
        },
    });
    server.withTypeProvider<ZodTypeProvider>().post("/credential/get", {
        schema: {
            response: {
                200: Dto.userCredentials,
            },
        },
        handler: async (request, _reply) => {
            const didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: {
                    isLoggedIn: true,
                    isSyncing: true,
                },
            });
            return await Service.getCredentials(db, didWrite);
        },
    });
    server.withTypeProvider<ZodTypeProvider>().post("/credential/request", {
        schema: {
            body: Dto.requestCredentials,
            response: {
                200: Dto.userCredentials,
            },
        },
        handler: async (request, _reply) => {
            const didWrite = await verifyUCAN(db, request, {
                expectedDeviceStatus: {
                    isLoggedIn: true,
                    isSyncing: true,
                },
            });
            const email = request.body.email;
            const isEmailAssociatedWithDevice =
                await Service.isEmailAssociatedWithDevice(db, didWrite, email);
            if (!isEmailAssociatedWithDevice) {
                throw server.httpErrors.forbidden(
                    `Email ${email} is not associated with this didWrite ${didWrite}`
                );
            }

            const {
                emailCredentialsPerEmail: existingEmailCredentialsPerEmail,
                secretCredentialsPerType: existingSecretCredentialsPerType,
            } = await Service.getCredentials(db, didWrite);
            const type = "global";
            if (
                hasActiveEmailCredential(
                    email,
                    existingEmailCredentialsPerEmail
                )
            ) {
                if (
                    hasActiveSecretCredential(
                        type,
                        existingSecretCredentialsPerType
                    )
                ) {
                    server.log.warn("Credentials requested but already exist");
                    const userCredentials: UserCredentials = {
                        emailCredentialsPerEmail:
                            existingEmailCredentialsPerEmail,
                        secretCredentialsPerType:
                            existingSecretCredentialsPerType,
                    };
                    return userCredentials;
                } else {
                    server.log.warn(
                        "Credentials requested but only email credential existed"
                    );
                    const encodedBlindedCredential =
                        await Service.createAndStoreSecretCredential(
                            db,
                            didWrite,
                            request.body.secretCredentialRequest,
                            type,
                            server.httpErrors,
                            sk
                        );
                    const secretCredential: SecretCredential = {
                        encodedBlindedCredential: encodedBlindedCredential,
                        encryptedBlinding:
                            request.body.secretCredentialRequest
                                .encryptedEncodedBlinding,
                        encryptedBlindedSubject:
                            request.body.secretCredentialRequest
                                .encryptedEncodedBlindedSubject,
                    };
                    const secretCredentialsPerType = addActiveSecretCredential(
                        type,
                        secretCredential,
                        existingSecretCredentialsPerType
                    );
                    const userCredentials: UserCredentials = {
                        emailCredentialsPerEmail:
                            existingEmailCredentialsPerEmail,
                        secretCredentialsPerType,
                    };
                    return userCredentials;
                }
            } else {
                if (
                    hasActiveSecretCredential(
                        type,
                        existingSecretCredentialsPerType
                    )
                ) {
                    server.log.warn(
                        "Credentials requested but only secret credential existed"
                    );
                    const encodedEmailCredential =
                        await Service.createAndStoreEmailCredential(
                            db,
                            email,
                            request.body.emailCredentialRequest,
                            sk
                        );
                    const emailCredentialsPerEmail = addActiveEmailCredential(
                        email,
                        encodedEmailCredential,
                        existingEmailCredentialsPerEmail
                    );
                    const userCredentials: UserCredentials = {
                        emailCredentialsPerEmail,
                        secretCredentialsPerType:
                            existingSecretCredentialsPerType,
                    };
                    return userCredentials;
                } else {
                    server.log.info(
                        "Creating both email and secret credentials"
                    );
                    const { encodedEmailCredential, encodedBlindedCredential } =
                        await Service.createAndStoreCredentials({
                            db: db,
                            didWrite: didWrite,
                            secretCredentialRequest:
                                request.body.secretCredentialRequest,
                            type: type,
                            httpErrors: server.httpErrors,
                            sk: sk,
                            email: email,
                            emailCredentialRequest:
                                request.body.emailCredentialRequest,
                        });
                    const emailCredentialsPerEmail = addActiveEmailCredential(
                        email,
                        encodedEmailCredential,
                        existingEmailCredentialsPerEmail
                    );
                    const secretCredential: SecretCredential = {
                        encodedBlindedCredential: encodedBlindedCredential,
                        encryptedBlinding:
                            request.body.secretCredentialRequest
                                .encryptedEncodedBlinding,
                        encryptedBlindedSubject:
                            request.body.secretCredentialRequest
                                .encryptedEncodedBlindedSubject,
                    };
                    const secretCredentialsPerType = addActiveSecretCredential(
                        type,
                        secretCredential,
                        existingSecretCredentialsPerType
                    );
                    const userCredentials: UserCredentials = {
                        emailCredentialsPerEmail,
                        secretCredentialsPerType,
                    };
                    return userCredentials;
                }
            }
        },
    });
});

server.ready((e) => {
    if (e) {
        server.log.error(e);
        process.exit(1);
    }
    if (config.NODE_ENV === Environment.Development) {
        const swaggerJson = JSON.stringify(
            server.swagger({ yaml: false }),
            null,
            2
        );
        fs.writeFileSync("./openapi-zkorum.json", swaggerJson);
    }
});

server.listen({ port: config.PORT }, (err) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
