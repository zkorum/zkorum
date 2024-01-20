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
import { Dto } from "@/shared/types/dto.js";
import * as ucans from "@ucans/ucans";
import {
    httpMethodToAbility,
    httpUrlToResourcePointer,
} from "./shared/ucan/ucan.js";
import {
    initializeWasm,
    BBSPlusSecretKey as SecretKey,
    Presentation,
    BBS_PLUS_SIGNATURE_PARAMS_LABEL_BYTES as SIGNATURE_PARAMS_LABEL_BYTES,
    BBSPlusSignatureParamsG1 as SignatureParams,
    SUBJECT_STR,
    PseudonymBases,
} from "@docknetwork/crypto-wasm-ts";
import { config, Environment, server } from "./app.js";
import {
    drizzle,
    type PostgresJsDatabase as PostgresDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
    addActiveEmailCredential as addActiveEmailOrFormCredential,
    hasActiveCredential as hasActiveEmailOrFormCredential,
    revealedAttributesToPostAs,
    type PostAs,
    getWebDomainType,
} from "./service/credential.js";
import {
    type FormCredentialsPerEmail,
    type SecretCredentialType,
    type WebDomainType,
    type UniversityType,
} from "./shared/types/zod.js";
import { toCID, decodeCID } from "./shared/common/cid.js";
import isEqual from "lodash/isEqual.js";
import { stringToBytes } from "./shared/common/arrbufs.js";
import { scopeWith } from "./shared/common/util.js";
import {
    buildCreateCommentContextFromPayload,
    buildCreatePostContextFromPayload,
    buildResponseToPollFromPayload,
    domainFromEmail,
} from "./shared/shared.js";

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
        security: [
            {
                BearerAuth: [],
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
            },
        },
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
    const skAsHex = fs.readFileSync(config.PRIVATE_KEY_FILEPATH, {
        encoding: "utf8",
        flag: "r",
    });
    return new SecretKey(SecretKey.fromHex(skAsHex).bytes);
}
const params = SignatureParams.generate(100, SIGNATURE_PARAMS_LABEL_BYTES);
const pk = sk.generatePublicKeyG2(params);

interface ExpectedDeviceStatus {
    userId?: string;
    isSyncing?: boolean;
    isLoggedIn?: boolean;
}

interface OptionsVerifyUcan {
    expectedDeviceStatus?: ExpectedDeviceStatus;
}

const SERVER_URL =
    config.NODE_ENV === Environment.Production
        ? config.SERVER_URL_PROD
        : config.SERVER_URL_DEV;

const SERVER_DID =
    config.NODE_ENV === Environment.Production
        ? config.SERVER_DID_PROD
        : config.SERVER_DID_DEV;

// auth for account profile interaction
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
        console.log("no header");
        throw server.httpErrors.unauthorized();
    } else {
        const { scheme, hierPart } = httpUrlToResourcePointer(
            new URL(request.originalUrl, SERVER_URL)
        );
        const encodedUcan = authHeader.substring(7, authHeader.length);
        const rootIssuerDid = ucans.parse(encodedUcan).payload.iss;
        const result = await ucans.verify(encodedUcan, {
            audience: SERVER_DID,
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

interface VerifyPresentationProps {
    pres: unknown;
    content: object;
    expectedSecretCredentialType: SecretCredentialType;
}

function basesFromRevealedAttributes(revealedAttributes?: any): string[] {
    let scope = "base";
    if (revealedAttributes === undefined) {
        const basesForAttributes = PseudonymBases.generateBasesForAttributes(
            2, // communityId ( == email here) + secret value = 2 attributes
            stringToBytes(scope)
        );
        return PseudonymBases.decodeBasesForAttributes(basesForAttributes);
    }
    const typeSpecificStr = "typeSpecific";
    if (typeSpecificStr in revealedAttributes) {
        const typeSpecificAttribute = revealedAttributes[typeSpecificStr];
        const typeStr = "type";
        if (typeStr in typeSpecificAttribute) {
            const universityType = typeSpecificAttribute[
                typeStr
            ] as UniversityType; // TODO this can throw errors
            scope = scopeWith(scope, universityType);
        }
        const campusStr = "campus";
        if (campusStr in typeSpecificAttribute) {
            scope = scopeWith(scope, campusStr);
        }
        const programStr = "program";
        if (programStr in typeSpecificAttribute) {
            scope = scopeWith(scope, programStr);
        }
        const admissionYearStr = "admissionYear";
        if (admissionYearStr in typeSpecificAttribute) {
            scope = scopeWith(scope, admissionYearStr);
        }
        const countriesStr = "countries";
        if (countriesStr in typeSpecificAttribute) {
            scope = scopeWith(scope, countriesStr);
        }
    }
    const basesForAttributes = PseudonymBases.generateBasesForAttributes(
        2, // communityId ( == email here) + secret value = 2 attributes
        stringToBytes(scope)
    );
    return PseudonymBases.decodeBasesForAttributes(basesForAttributes);
}

interface VerifyPresentationResult {
    postAs: PostAs;
    pseudonym: string;
    presentation: Presentation;
}

// auth for anonymous posting
// !important replay attacks are checked on the database level
async function verifyPresentation({
    pres,
    content,
    expectedSecretCredentialType,
}: VerifyPresentationProps): Promise<VerifyPresentationResult> {
    if (pres === undefined || pres === null || typeof pres !== "object") {
        throw server.httpErrors.unauthorized();
    } else {
        try {
            // check that pres parses to presentation (note: pres cannot be bearer token because it is 36kB and exceeds HTTP header limit...)
            const presentation = Presentation.fromJSON(pres);

            // check that presentation verifies
            const verifyResult = presentation.verify(
                Array(presentation.spec.credentials.length).fill(pk) // in the future we have to add did resolution as some credentials will not be expected to be signed by zkorum
            );
            if (!verifyResult.verified) {
                throw server.httpErrors.createError(
                    401,
                    "Unauthorized",
                    new Error(
                        `Presentation does not verify: ${verifyResult.error}`
                    )
                );
            }

            const expectedPresentationVersion = "0.1.0";
            if (presentation.version !== expectedPresentationVersion) {
                throw server.httpErrors.unauthorized(
                    `Version of Presentation must be ${expectedPresentationVersion} but was ${presentation.version}`
                );
            }

            // check that request body's CID === presentation's context
            if (presentation.context === undefined) {
                throw server.httpErrors.unauthorized("Context is missing");
            }
            const contextCID = decodeCID(presentation.context);
            if (contextCID === null) {
                throw server.httpErrors.unauthorized(
                    "Presentation context is not a valid CID"
                );
            }
            const expectedCID = await toCID(JSON.stringify(content));
            if (!contextCID.equals(expectedCID)) {
                throw server.httpErrors.unauthorized(
                    "Body CID and context CID do not match"
                );
            }

            // check that there are two or three credentials, the first one being secret credential, the second one being a email credential, and the eventual third one being the form credential
            if (
                presentation.spec.credentials.length !== 2 &&
                presentation.spec.credentials.length !== 3
            ) {
                throw server.httpErrors.unauthorized(
                    "The Presentation is expected to be created by two or three credentials"
                );
            }

            const expectedCredentialVersion = "0.1.0";
            for (const [
                credIdx,
                credential,
            ] of presentation.spec.credentials.entries()) {
                if (credential.version !== expectedCredentialVersion) {
                    throw server.httpErrors.unauthorized(
                        `Version of Credential ${credIdx} must be ${expectedPresentationVersion} but was ${credential.version}`
                    );
                }
            }

            // check that there is ONE pseudonym associated with the right attributeNames and with the basesForAttributes expected from the attributes shared
            if (presentation.spec.boundedPseudonyms === undefined) {
                throw server.httpErrors.unauthorized(
                    "The Presentation contains no anonymous pseudonym"
                );
            }
            if (
                presentation.spec.unboundedPseudonyms !== undefined &&
                Object.keys(presentation.spec.unboundedPseudonyms).length > 0
            ) {
                throw server.httpErrors.unauthorized(
                    `The Presentation must not contain any unbounded pseudonym`
                );
            }
            const entries = Object.entries(presentation.spec.boundedPseudonyms);
            if (entries.length != 1) {
                throw server.httpErrors.unauthorized(
                    `The Presentation must contain one and only one (bounded) anonymous pseudonym but has ${entries.length}`
                );
            }
            const [pseudonym, { attributes, commitKey }] = entries[0];
            const { basesForAttributes } = commitKey;
            const attributesEntries = Object.entries(attributes);
            if (attributesEntries.length !== 2) {
                throw server.httpErrors.unauthorized(
                    `The pseudonym must be created from attributes from two credentials, but was created from ${attributesEntries.length} credentials`
                );
            }
            // TODO used shared function to make sure the same thing is used in front and back
            if (!isEqual(attributes[0], [`${SUBJECT_STR}.secret`])) {
                throw server.httpErrors.unauthorized(
                    `The attribute from the first credential used to generate the pseudonym must be secret`
                );
            }
            // TODO used shared function clean this up to make sure the same thing is used in front and back
            if (!isEqual(attributes[1], [`${SUBJECT_STR}.email`])) {
                throw server.httpErrors.unauthorized(
                    `The attribute from the second credential used to generate the pseudonym must be email`
                );
            }
            const emailCredentialRevealedAttributes =
                presentation.spec.credentials[1].revealedAttributes;
            if (!(SUBJECT_STR in emailCredentialRevealedAttributes)) {
                throw server.httpErrors.unauthorized(
                    `Attribute '${SUBJECT_STR}' is not revealed in email credential`
                );
            }
            const emailSubjectRevealedAttrs = emailCredentialRevealedAttributes[
                SUBJECT_STR
            ] as object;
            if (
                !("type" in emailSubjectRevealedAttrs) ||
                typeof emailSubjectRevealedAttrs["type"] != "string" ||
                getWebDomainType(emailSubjectRevealedAttrs["type"]) ===
                    undefined
            ) {
                throw server.httpErrors.unauthorized(
                    `Attribute 'type' is not revealed in email credential or it is not a valid WebDomainType`
                );
            }
            if (
                !("domain" in emailSubjectRevealedAttrs) ||
                typeof emailSubjectRevealedAttrs["domain"] !== "string"
            ) {
                throw server.httpErrors.unauthorized(
                    `Attribute 'domain' is not revealed in email credential or it is not a valid string`
                );
            }

            if (emailSubjectRevealedAttrs["domain"] !== "essec.edu") {
                throw server.httpErrors.unauthorized(
                    `Only members of ESSEC can create content right now`
                );
            }

            let formSubjectRevealedAttrs: object | undefined = undefined;
            if (presentation.spec.credentials.length === 3) {
                const formCredentialRevealedAttributes =
                    presentation.spec.credentials[2].revealedAttributes;
                if (!(SUBJECT_STR in formCredentialRevealedAttributes)) {
                    throw server.httpErrors.unauthorized(
                        `Attribute '${SUBJECT_STR}' is not revealed in form credential`
                    );
                }
                formSubjectRevealedAttrs = formCredentialRevealedAttributes[
                    SUBJECT_STR
                ] as object;
            }

            const expectedBasesForAttributes = basesFromRevealedAttributes(
                formSubjectRevealedAttrs
            );
            if (!isEqual(basesForAttributes, expectedBasesForAttributes)) {
                throw server.httpErrors.unauthorized(
                    `The bases for attributes used to generate the anonymous pseudonym does not match with the revealed attributes`
                );
            }
            const secretCredentialRevealedAttributes =
                presentation.spec.credentials[0].revealedAttributes;
            if (
                !(SUBJECT_STR in secretCredentialRevealedAttributes) ||
                !(
                    "type" in
                    (secretCredentialRevealedAttributes[SUBJECT_STR] as object)
                ) ||
                (secretCredentialRevealedAttributes as any)[SUBJECT_STR][
                    "type"
                ] !== expectedSecretCredentialType
            ) {
                throw server.httpErrors.unauthorized(
                    `Second credential must reveal attribute '${SUBJECT_STR}.type' and be equal to '${expectedSecretCredentialType}'`
                );
            }

            // meta equality proofs
            if (presentation.spec.attributeEqualities === undefined) {
                throw server.httpErrors.unauthorized(
                    `The presentation attributeEqualities must not be undefined`
                );
            }
            if (
                presentation.spec.credentials.length === 2 &&
                presentation.spec.attributeEqualities.length !== 1
            ) {
                throw server.httpErrors.unauthorized(
                    `There must be exactly one attribute equality proof if Form Credential does not partiticipate in the proof`
                );
            }
            if (
                presentation.spec.credentials.length === 3 &&
                presentation.spec.attributeEqualities.length !== 2
            ) {
                throw server.httpErrors.unauthorized(
                    `There must be exactly two attribute equality proofs if Form Credential partiticipate in the proof`
                );
            }
            // first attribute equality must be based on uid
            const uidAttributeEquality =
                presentation.spec.attributeEqualities[0];
            if (
                uidAttributeEquality.length !==
                presentation.spec.credentials.length
            ) {
                throw server.httpErrors.unauthorized(
                    `The presentation's Uid Attribute Equality must contain the same number of meta equalities as the number of credentials involved in creating the proofs`
                );
            }
            const attributeUidStr = "credentialSubject.uid";
            const attributeRefSecretCred = uidAttributeEquality[0];
            if (attributeRefSecretCred[0] !== 0) {
                throw server.httpErrors.unauthorized(
                    `The first attribute ref of the Uid Attribute Equality must be related to the first credential - the Secret Credential`
                );
            }
            if (attributeRefSecretCred[1] !== attributeUidStr) {
                throw server.httpErrors.unauthorized(
                    `The first attribute ref's name of the Uid Attribute Equality must be 'uid' `
                );
            }
            const attributeRefEmailCred = uidAttributeEquality[1];
            if (attributeRefEmailCred[0] !== 1) {
                throw server.httpErrors.unauthorized(
                    `The second attribute ref of the Uid Attribute Equality must be related to the second credential - the Email Credential`
                );
            }
            if (attributeRefEmailCred[1] !== attributeUidStr) {
                throw server.httpErrors.unauthorized(
                    `The second attribute ref's name of the Uid Attribute Equality must be 'uid' `
                );
            }
            if (presentation.spec.attributeEqualities[0].length === 3) {
                const attributeRefFormCred = uidAttributeEquality[2];
                if (attributeRefFormCred[0] !== 2) {
                    throw server.httpErrors.unauthorized(
                        `The third attribute ref of the Uid Attribute Equality must be related to the third credential - the Form Credential`
                    );
                }
                if (attributeRefFormCred[1] !== attributeUidStr) {
                    throw server.httpErrors.unauthorized(
                        `The third attribute ref's name of the Uid Attribute Equality must be 'uid' `
                    );
                }
            }
            // second attribute equality must be based on email - only exists if Form Credential is shared
            if (presentation.spec.credentials.length === 3) {
                const emailAttributeEquality =
                    presentation.spec.attributeEqualities[1];
                if (emailAttributeEquality.length !== 2) {
                    throw server.httpErrors.unauthorized(
                        `The presentation's Email Attribute Equality must contain 2 meta equalities`
                    );
                }
                const attributeEmailStr = "credentialSubject.email";
                const attributeRefEmailCred = emailAttributeEquality[0];
                if (attributeRefEmailCred[0] !== 1) {
                    throw server.httpErrors.unauthorized(
                        `The first attribute ref of the Email Attribute Equality must be related to the second credential - the Email Credential`
                    );
                }
                if (attributeRefEmailCred[1] !== attributeEmailStr) {
                    throw server.httpErrors.unauthorized(
                        `The first attribute ref's name of the Email Attribute Equality must be 'email' `
                    );
                }
                const attributeRefFormCred = emailAttributeEquality[1];
                if (attributeRefFormCred[0] !== 2) {
                    throw server.httpErrors.unauthorized(
                        `The second attribute ref of the Email Attribute Equality must be related to the third credential - the Form Credential`
                    );
                }
                if (attributeRefFormCred[1] !== attributeEmailStr) {
                    throw server.httpErrors.unauthorized(
                        `The second attribute ref's name of the Email Attribute Equality must be 'email' `
                    );
                }
            }

            return {
                postAs: revealedAttributesToPostAs({
                    domain: emailSubjectRevealedAttrs["domain"] as string, // we would have thrown already if was not there or not the right type
                    type: emailSubjectRevealedAttrs["type"] as WebDomainType, // we would have thrown already if was not there or not the right type
                    revealedFormAttributes: formSubjectRevealedAttrs,
                }),
                pseudonym: pseudonym,
                presentation: presentation,
            };
        } catch (e: unknown) {
            if (typeof e === "string") {
                throw server.httpErrors.unauthorized(e);
            } else if (e instanceof Error) {
                throw server.httpErrors.createError(401, "Unauthorized", e);
            } else {
                throw server.httpErrors.createError(
                    401,
                    "Unauthorized",
                    new AggregateError(
                        [e],
                        `'pres' generic object cannot parse to Presentation object`
                    )
                );
            }
        }
    }
}

const apiVersion = "v1";

const awsMailConf = {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
};

server.after(() => {
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/auth/authenticate`, {
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
                return await Service.authenticateAttempt({
                    db,
                    type,
                    authenticateRequestBody: request.body,
                    userId,
                    minutesBeforeCodeExpiry:
                        config.MINUTES_BEFORE_EMAIL_OTP_EXPIRY,
                    didWrite,
                    throttleMinutesInterval:
                        config.THROTTLE_EMAIL_MINUTES_INTERVAL,
                    httpErrors: server.httpErrors,
                    env: config.NODE_ENV,
                    awsMailConf: awsMailConf,
                }).then(({ codeExpiry, nextCodeSoonestTime }) => {
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
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/auth/verifyOtp`, {
            schema: {
                body: Dto.verifyOtpReqBody,
                response: { 200: Dto.verifyOtp200, 409: Dto.auth409 },
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: undefined,
                });
                return await Service.verifyOtp({
                    db,
                    maxAttempt: config.EMAIL_OTP_MAX_ATTEMPT_AMOUNT,
                    didWrite,
                    code: request.body.code,
                    encryptedSymmKey: request.body.encryptedSymmKey,
                    sk,
                    pkVersion: config.PK_VERSION,
                    httpErrors: server.httpErrors,
                    unboundSecretCredentialRequest:
                        request.body.unboundSecretCredentialRequest,
                    timeboundSecretCredentialRequest:
                        request.body.timeboundSecretCredentialRequest,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/auth/logout`, {
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
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/auth/sync`, {
            schema: {
                // body: Dto.createOrGetEmailCredentialsReq,
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
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/credential/get`, {
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
                return await Service.getUserCredentials(db, didWrite);
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/credential/email/renew`, {
            schema: {
                body: Dto.renewEmailCredential,
                description:
                    "Renew an active email credential - fails if already exists. Used when rotating issuer public key.",
                response: {
                    200: Dto.renewEmailCredential200,
                },
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                        isSyncing: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin) {
                    throw server.httpErrors.forbidden(
                        "Admin cannot renew credentials"
                    );
                }
                const email = request.body.email;
                const isEmailAssociatedWithDevice =
                    await Service.isEmailAssociatedWithDevice(
                        db,
                        didWrite,
                        email
                    );
                if (!isEmailAssociatedWithDevice) {
                    throw server.httpErrors.forbidden(
                        `Email ${email} is not associated with this didWrite ${didWrite}`
                    );
                }
                const uid = await Service.getUidFromDevice(db, didWrite);
                const emailCredential =
                    await Service.createAndStoreEmailCredential({
                        db,
                        email,
                        pkVersion: config.PK_VERSION,
                        uid,
                        sk,
                        httpErrors: server.httpErrors,
                    });
                return { emailCredential };
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/credential/form/renew`, {
            schema: {
                body: Dto.renewFormCredential,
                description:
                    "Renew an active form credential - fails if already exists. Used when rotating issuer public key.",
                response: {
                    200: Dto.renewFormCredential200,
                },
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                        isSyncing: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin) {
                    throw server.httpErrors.forbidden(
                        "Admin cannot renew credentials"
                    );
                }
                const email = request.body.email;
                const isEmailAssociatedWithDevice =
                    await Service.isEmailAssociatedWithDevice(
                        db,
                        didWrite,
                        email
                    );
                if (!isEmailAssociatedWithDevice) {
                    throw server.httpErrors.forbidden(
                        `Email ${email} is not associated with this didWrite ${didWrite}`
                    );
                }
                const uid = await Service.getUidFromDevice(db, didWrite);
                const formCredentialRequest =
                    await Service.getLatestFormCredentialRequest({
                        db,
                        email,
                        httpErrors: server.httpErrors,
                    });
                const formCredential =
                    await Service.createAndStoreFormCredential({
                        db,
                        email,
                        pkVersion: config.PK_VERSION,
                        formCredentialRequest,
                        uid,
                        sk,
                        httpErrors: server.httpErrors,
                    });
                return { formCredential };
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/credential/secret/renew`, {
            schema: {
                body: Dto.renewSecretCredential,
                description:
                    "Renew an active secret credential - fails if already exists. Used when rotating issuer public key.",
                response: {
                    200: Dto.renewSecretCredential200,
                },
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                        isSyncing: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin) {
                    throw server.httpErrors.forbidden(
                        "Admin cannot renew credentials"
                    );
                }
                const userId = await Service.getUserIdFromDevice(db, didWrite);
                const uid = await Service.getUidFromDevice(db, didWrite);
                const secretCredential =
                    await Service.createAndStoreSecretCredential({
                        db,
                        userId,
                        uid,
                        pkVersion: config.PK_VERSION,
                        secretCredentialRequest:
                            request.body.secretCredentialRequest,
                        httpErrors: server.httpErrors,
                        sk,
                        type: request.body.type,
                    });
                return { signedBlindedCredential: secretCredential };
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/credential/form/request`, {
            schema: {
                body: Dto.requestFormCredential,
                response: {
                    200: Dto.requestFormCredential200,
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
                const domain = domainFromEmail(email);
                if (domain === undefined || domain === "zkorum.com") {
                    throw server.httpErrors.forbidden(
                        "Admin cannot request credentials"
                    );
                }
                const isEmailAssociatedWithDevice =
                    await Service.isEmailAssociatedWithDevice(
                        db,
                        didWrite,
                        email
                    );
                if (!isEmailAssociatedWithDevice) {
                    throw server.httpErrors.forbidden(
                        `Email ${email} is not associated with this didWrite ${didWrite}`
                    );
                }

                const existingFormCredentialsPerEmail: FormCredentialsPerEmail =
                    await Service.getFormCredentialsPerEmailFromDidWrite(
                        db,
                        didWrite
                    );
                if (
                    hasActiveEmailOrFormCredential(
                        email,
                        existingFormCredentialsPerEmail
                    )
                ) {
                    server.log.warn(
                        "Form credentials requested but already exist"
                    );
                    return {
                        formCredentialsPerEmail:
                            existingFormCredentialsPerEmail,
                    };
                } else {
                    const uid = await Service.getUidFromDevice(db, didWrite);
                    const encodedFormCredential =
                        await Service.createAndStoreFormCredential({
                            db,
                            email,
                            formCredentialRequest:
                                request.body.formCredentialRequest,
                            pkVersion: config.PK_VERSION,
                            uid,
                            sk,
                            httpErrors: server.httpErrors,
                        });
                    const formCredentialsPerEmail =
                        addActiveEmailOrFormCredential(
                            email,
                            encodedFormCredential,
                            existingFormCredentialsPerEmail
                        );
                    return {
                        formCredentialsPerEmail,
                    };
                }
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/post/create`, {
            schema: {
                body: Dto.createPostRequest,
                // response: {
                //     200: Dto.createPollRequest,
                // },
            },
            handler: async (request, _reply) => {
                const { pseudonym, postAs, presentation } =
                    await verifyPresentation({
                        pres: request.body.pres,
                        content: buildCreatePostContextFromPayload(
                            request.body.post
                        ),
                        expectedSecretCredentialType: "unbound",
                    });
                await Service.createPost({
                    db: db,
                    presentation: presentation,
                    post: request.body.post,
                    pseudonym: pseudonym,
                    postAs: postAs,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/poll/respond`, {
            schema: {
                body: Dto.respondPollRequest,
                response: {
                    200: Dto.pollRespond200,
                },
            },
            handler: async (request, _reply) => {
                const { pseudonym, postAs, presentation } =
                    await verifyPresentation({
                        pres: request.body.pres,
                        content: buildResponseToPollFromPayload(
                            request.body.responseToPoll
                        ),
                        expectedSecretCredentialType: "timebound",
                    });
                return await Service.respondToPoll({
                    db: db,
                    presentation: presentation,
                    response: request.body.responseToPoll,
                    pseudonym: pseudonym,
                    postAs: postAs,
                    httpErrors: server.httpErrors,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/feed/fetchMore`, {
            schema: {
                body: Dto.fetchFeedRequest,
                response: {
                    200: Dto.fetchFeed200,
                },
            },
            handler: async (request, _reply) => {
                return await Service.fetchFeed({
                    db: db,
                    order: "more",
                    showHidden: request.body.showHidden,
                    lastReactedAt:
                        request.body.lastReactedAt !== undefined
                            ? new Date(request.body.lastReactedAt)
                            : undefined,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/feed/fetchRecent`, {
            schema: {
                body: Dto.fetchFeedRequest,
                response: {
                    200: Dto.fetchFeed200,
                },
            },
            handler: async (request, _reply) => {
                return await Service.fetchFeed({
                    db: db,
                    order: "recent",
                    showHidden: request.body.showHidden,
                    lastReactedAt:
                        request.body.lastReactedAt !== undefined
                            ? new Date(request.body.lastReactedAt)
                            : undefined,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/moderation/hidePost`, {
            schema: {
                body: Dto.moderatePostRequest,
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin !== true) {
                    throw server.httpErrors.forbidden(
                        "Only admin can moderate content"
                    );
                }
                await Service.hidePost({
                    db: db,
                    pollUid: request.body.pollUid,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/moderation/unhidePost`, {
            schema: {
                body: Dto.moderatePostRequest,
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin !== true) {
                    throw server.httpErrors.forbidden(
                        "Only admin can moderate content"
                    );
                }
                await Service.unhidePost({
                    db: db,
                    pollUid: request.body.pollUid,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/moderation/hideComment`, {
            schema: {
                body: Dto.moderateCommentRequest,
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin !== true) {
                    throw server.httpErrors.forbidden(
                        "Only admin can moderate content"
                    );
                }
                await Service.hideComment({
                    db: db,
                    commentSlugId: request.body.commentSlugId,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/moderation/unhideComment`, {
            schema: {
                body: Dto.moderateCommentRequest,
            },
            handler: async (request, _reply) => {
                const didWrite = await verifyUCAN(db, request, {
                    expectedDeviceStatus: {
                        isLoggedIn: true,
                    },
                });
                const isAdmin = await Service.isAdmin(db, didWrite);
                if (isAdmin !== true) {
                    throw server.httpErrors.forbidden(
                        "Only admin can moderate content"
                    );
                }
                await Service.unhideComment({
                    db: db,
                    commentSlugId: request.body.commentSlugId,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/comment/create`, {
            schema: {
                body: Dto.commentRequest,
            },
            handler: async (request, _reply) => {
                const { pseudonym, postAs, presentation } =
                    await verifyPresentation({
                        pres: request.body.pres,
                        content: buildCreateCommentContextFromPayload(
                            request.body.payload
                        ),
                        expectedSecretCredentialType: "unbound",
                    });
                await Service.createComment({
                    db: db,
                    pseudonym: pseudonym,
                    postAs: postAs,
                    presentation: presentation,
                    payload: request.body.payload,
                    httpErrors: server.httpErrors,
                });
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/post/fetch`, {
            schema: {
                body: Dto.postFetchRequest,
                response: {
                    200: Dto.postFetch200,
                },
            },
            handler: async (request, _reply) => {
                // anonymous request, no auth
                const { post, postId } = await Service.fetchPostByUidOrSlugId({
                    db: db,
                    postUidOrSlugId: request.body.postSlugId,
                    type: "slugId",
                    httpErrors: server.httpErrors,
                });
                const comments = await Service.fetchCommentsByPostId({
                    db: db,
                    postId: postId,
                    order: "more",
                    showHidden: true,
                    updatedAt: undefined,
                });
                return { post, comments };
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/comment/fetchMore`, {
            schema: {
                body: Dto.commentFetchFeedRequest,
                response: {
                    200: Dto.commentFetchFeed200,
                },
            },
            handler: async (request, _reply) => {
                // anonymous request, no auth
                const postId = await Service.getPostIdFromSlugId({
                    db,
                    slugId: request.body.postSlugId,
                    httpErrors: server.httpErrors,
                });
                const comments = await Service.fetchCommentsByPostId({
                    db: db,
                    postId: postId,
                    order: "more",
                    showHidden: true,
                    updatedAt:
                        request.body.updatedAt !== undefined
                            ? new Date(request.body.updatedAt)
                            : undefined,
                });
                return { comments };
            },
        });
    server
        .withTypeProvider<ZodTypeProvider>()
        .post(`/api/${apiVersion}/comment/fetchRecent`, {
            schema: {
                body: Dto.commentFetchFeedRequest,
                response: {
                    200: Dto.commentFetchFeed200,
                },
            },
            handler: async (request, _reply) => {
                // anonymous request, no auth
                const postId = await Service.getPostIdFromSlugId({
                    db,
                    slugId: request.body.postSlugId,
                    httpErrors: server.httpErrors,
                });
                const comments = await Service.fetchCommentsByPostId({
                    db: db,
                    postId: postId,
                    order: "recent",
                    showHidden: true,
                    updatedAt:
                        request.body.updatedAt !== undefined
                            ? new Date(request.body.updatedAt)
                            : undefined,
                });
                return { comments };
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

const host =
    config.NODE_ENV === Environment.Development ? "127.0.0.1" : "0.0.0.0";

server.listen({ port: config.PORT, host: host }, (err) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
});
