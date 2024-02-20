import { toEncodedCID } from "@/shared/common/cid.js";
import { nowZeroMs } from "@/shared/common/util.js";
import { domainFromEmail, toUnionUndefined } from "@/shared/shared.js";
import {
    type AuthenticateRequestBody,
    type EmailSecretCredentials,
    type GetDeviceStatusResp,
    type IsLoggedInResponse,
    type RecoverAccountResp,
    type UserCredentials,
    type VerifyOtp200,
} from "@/shared/types/dto.js";
import sesClientModule from "@aws-sdk/client-ses";
import {
    BBSPlusBlindedCredentialRequest as BlindedCredentialRequest,
    Presentation,
    BBSPlusSecretKey as SecretKey,
} from "@docknetwork/crypto-wasm-ts";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import {
    and,
    asc,
    desc,
    eq,
    gt,
    inArray,
    isNotNull,
    lt,
    ne,
    sql,
    type TablesRelationalConfig,
} from "drizzle-orm";
import type { PgTransaction, QueryResultHKT } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import nodemailer from "nodemailer";
import {
    codeToString,
    generateOneTimeCode,
    generateRandomHex,
    generateRandomSlugId,
    generateUUID,
} from "../crypto.js";
import {
    authAttemptTable,
    commentTable,
    credentialEmailTable,
    credentialSecretTable,
    deviceTable,
    emailTable,
    personaTable,
    pollResponseTable,
    pollTable,
    postTable,
    pseudonymTable,
    userTable,
} from "../schema.js";
import { anyToUint8Array } from "../shared/common/arrbufs.js";
import { base64 } from "../shared/common/index.js";
import {
    type BlindedCredentialType,
    type CreateCommentPayload,
    type Device,
    type Devices,
    type EmailCredential,
    type EmailCredentialsPerEmail,
    type ExtendedPostData,
    type Post,
    type PostComment,
    type PostId,
    type PostSlugId,
    type PostUid,
    type ResponseToPollPayload,
    type SecretCredentialRequest,
    type SecretCredentialType,
    type SecretCredentials,
    type SecretCredentialsPerType,
} from "../shared/types/zod.js";
import {
    buildEmailCredential,
    buildSecretCredential,
    parseSecretCredentialRequest,
    type PostAs,
} from "./credential.js";

export interface AuthenticateOtp {
    codeExpiry: Date;
    nextCodeSoonestTime: Date;
}

// should be up to date with DB value
// TODO: automatically sync them - use one type only
export enum AuthenticateType {
    REGISTER = "register",
    LOGIN_KNOWN_DEVICE = "login_known_device",
    LOGIN_NEW_DEVICE = "login_new_device",
}

interface AuthTypeAndUserId {
    userId: string;
    type: AuthenticateType;
}

interface CreatePostProps {
    db: PostgresDatabase;
    presentation: Presentation;
    post: Post;
    pseudonym: string;
    postAs: PostAs;
}

interface VerifyOtpProps {
    db: PostgresDatabase;
    maxAttempt: number;
    didWrite: string;
    code: number;
    pkVersion: number;
    emailCredentialVersion: string;
    secretCredentialVersion: string;
    encryptedSymmKey?: string;
    sk: SecretKey;
    httpErrors: HttpErrors;
    unboundSecretCredentialRequest?: SecretCredentialRequest;
    timeboundSecretCredentialRequest?: SecretCredentialRequest;
}

interface RegisterProps {
    db: PostgresDatabase;
    didWrite: string;
    encryptedSymmKey: string;
    pkVersion: number;
    emailCredentialVersion: string;
    secretCredentialVersion: string;
    sk: SecretKey;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    httpErrors: HttpErrors;
    now: Date;
    sessionExpiry: Date;
}

interface LoginProps {
    db: PostgresDatabase;
    didWrite: string;
    now: Date;
    sessionExpiry: Date;
}

interface AwaitSyncingNewDeviceProps {
    db: PostgresDatabase;
    didWrite: string;
    now: Date;
    sessionExpiry: Date;
}

interface CreateSecretCredentialsProps {
    db: PostgresDatabase;
    uid: string;
    userId: string;
    pkVersion: number;
    secretCredentialVersion: string;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    httpErrors: HttpErrors;
    sk: SecretKey;
}

interface CreateAndStoreSecretCredentialProps {
    db: PostgresDatabase;
    uid: string;
    userId: string;
    pkVersion: number;
    secretCredentialVersion: string;
    secretCredentialRequest: SecretCredentialRequest;
    type: SecretCredentialType;
    httpErrors: HttpErrors;
    sk: SecretKey;
}

interface GetCredentialsResult {
    email: string;
    credential: object;
    isRevoked: boolean | null;
}

interface CreateAndStoreEmailCredentialsProps {
    db: PostgresDatabase;
    email: string;
    pkVersion: number;
    emailCredentialVersion: string;
    uid: string;
    sk: SecretKey;
    httpErrors: HttpErrors;
}

interface AddCredentialProps {
    results: GetCredentialsResult[];
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
}

interface SelectPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    domain: string;
}

interface FetchFeedProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    lastReactedAt: Date | undefined;
    order: "more" | "recent";
    limit?: number;
    showHidden?: boolean;
}

interface RespondToPollProps {
    db: PostgresDatabase;
    presentation: Presentation;
    response: ResponseToPollPayload;
    pseudonym: string;
    postAs: PostAs;
    httpErrors: HttpErrors;
}

interface CreateCommentProps {
    db: PostgresDatabase;
    pseudonym: string;
    postAs: PostAs;
    presentation: Presentation;
    payload: CreateCommentPayload;
    httpErrors: HttpErrors;
}

interface SelectOrInsertPseudonymProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    tx: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    pseudonym: string;
    postAs: PostAs;
}

interface FetchPostByUidOrSlugIdProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    postUidOrSlugId: PostUid | PostSlugId;
    type: "slugId" | "postUid";
    httpErrors: HttpErrors;
}

interface InsertAuthAttemptCodeProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    now: Date;
    userAgent: string;
    authenticateRequestBody: AuthenticateRequestBody;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    testCode: number;
    doUseTestCode: boolean;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
}

export interface AwsMailConf {
    accessKeyId: string;
    secretAccessKey: string;
}

interface SendOtpEmailProps {
    email: string;
    otp: number;
    awsMailConf: AwsMailConf;
}

interface AuthenticateAttemptProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    authenticateRequestBody: AuthenticateRequestBody;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    userAgent: string;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
    testCode: number;
    doUseTestCode: boolean;
}

interface UpdateAuthAttemptCodeProps {
    db: PostgresDatabase;
    type: AuthenticateType;
    userId: string;
    minutesBeforeCodeExpiry: number;
    didWrite: string;
    now: Date;
    authenticateRequestBody: AuthenticateRequestBody;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    doSendEmail: boolean;
    awsMailConf: AwsMailConf;
    testCode: number;
    doUseTestCode: boolean;
}

interface ModeratePostProps {
    db: PostgresDatabase;
    pollUid: PostUid;
}

interface ModerateCommentProps {
    db: PostgresDatabase;
    commentSlugId: PostSlugId;
}

interface PostAndId {
    post: ExtendedPostData;
    postId: PostId;
}

interface FetchPostByProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
}

interface FetchCommentsByPostIdProps {
    db: PostgresDatabase;
    postId: PostId;
    updatedAt: Date | undefined;
    order: "more" | "recent";
    limit?: number;
    showHidden?: boolean;
}

interface GetPostIdFromSlugIdProps {
    db: PostgresDatabase;
    slugId: PostSlugId;
    httpErrors: HttpErrors;
}

interface RegisterResult extends EmailSecretCredentials {
    device: Device;
}

interface RevokeUserCredentialsProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    email: string;
    userId: string;
    now: Date;
}

interface RecoverAccountProps {
    db: PostgresDatabase;
    didWrite: string;
    pkVersion: number;
    secretCredentialVersion: string;
    emailCredentialVersion: string;
    httpErrors: HttpErrors;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    sk: SecretKey;
    encryptedSymmKey: string;
}

interface LogoutAllDevicesButOneProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    didWrite: string;
    userId: string;
    now: Date;
    sessionExpiry: Date;
}

interface UpdateEncryptedSymmKeyProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    didWrite: string;
    encryptedSymmKey: string;
    now: Date;
}

interface InfoDevice {
    userAgent: string;
    uid: string;
    userId: string;
    sessionExpiry: Date;
}

function addCredentials({
    results,
    emailCredentialsPerEmail: credentialsPerEmail,
}: AddCredentialProps) {
    for (const result of results) {
        const credential = result.credential;
        const isRevoked = result.isRevoked;
        const encodedCredential = base64.encode(anyToUint8Array(credential));
        if (result.email in credentialsPerEmail) {
            if (isRevoked) {
                credentialsPerEmail[result.email].revoked.push(
                    encodedCredential
                );
            } else {
                credentialsPerEmail[result.email].active = encodedCredential;
            }
        } else {
            if (isRevoked) {
                credentialsPerEmail[result.email] = {
                    revoked: [encodedCredential],
                };
            } else {
                credentialsPerEmail[result.email] = {
                    active: encodedCredential,
                    revoked: [],
                };
            }
        }
    }
}

function fetchPostBy({
    db,
}: FetchPostByProps<
    QueryResultHKT,
    Record<string, unknown>,
    TablesRelationalConfig
>) {
    return db
        .selectDistinct({
            // id
            id: postTable.id,
            // poll payload
            title: postTable.title,
            body: postTable.body,
            option1: pollTable.option1,
            option1Response: pollTable.option1Response,
            option2: pollTable.option2,
            option2Response: pollTable.option2Response,
            option3: pollTable.option3,
            option3Response: pollTable.option3Response,
            option4: pollTable.option4,
            option4Response: pollTable.option4Response,
            option5: pollTable.option5,
            option5Response: pollTable.option5Response,
            option6: pollTable.option6,
            option6Response: pollTable.option6Response,
            // post as
            pseudonym: pseudonymTable.pseudonym,
            domain: personaTable.domain,
            // metadata
            pollUid: postTable.timestampedPresentationCID,
            slugId: postTable.slugId,
            isHidden: postTable.isHidden,
            updatedAt: postTable.updatedAt,
            lastReactedAt: postTable.lastReactedAt,
            commentCount: postTable.commentCount,
        })
        .from(postTable)
        .innerJoin(pseudonymTable, eq(pseudonymTable.id, postTable.authorId))
        .innerJoin(personaTable, eq(personaTable.id, pseudonymTable.personaId))
        .leftJoin(pollTable, eq(postTable.id, pollTable.postId));
}

// No need to validate data, it has been done in the controller level
export class Service {
    static async getAuthenticateType(
        db: PostgresDatabase,
        authenticateBody: AuthenticateRequestBody,
        didWrite: string,
        httpErrors: HttpErrors
    ): Promise<AuthTypeAndUserId> {
        const isEmailAvailable = await Service.isEmailAvailable(
            db,
            authenticateBody.email
        );
        const isDidWriteAvailable = await Service.isDidWriteAvailable(
            db,
            didWrite
        );
        const isDidExchangeAvailable = await Service.isDidExchangeAvailable(
            db,
            authenticateBody.didExchange
        );
        if (isDidWriteAvailable !== isDidExchangeAvailable) {
            throw httpErrors.forbidden(
                `[MITM] Either didWrite or didExchange is unavailable: isEmailAvailable=${isEmailAvailable}, isDidWriteAvailable=${isDidWriteAvailable}, isDidExchangeAvailable=${isDidExchangeAvailable}`
            );
            // we can now safely ignore isDidExchangeAvailable in our AND clauses because it is equal to isDidWriteAvailable
        }

        const userId = await Service.getOrGenerateUserId(
            db,
            authenticateBody.email
        );
        if (isEmailAvailable && isDidWriteAvailable) {
            return { type: AuthenticateType.REGISTER, userId: userId };
        } else if (!isEmailAvailable && isDidWriteAvailable) {
            return { type: AuthenticateType.LOGIN_NEW_DEVICE, userId: userId };
        } else if (!isEmailAvailable && !isDidWriteAvailable) {
            await this.throwIfAwaitingSyncingOrLoggedIn(
                db,
                didWrite,
                httpErrors
            );
            return {
                type: AuthenticateType.LOGIN_KNOWN_DEVICE,
                userId: userId,
            };
        } else {
            // if (!isEmailAvailable && isDidWriteAvailable) {
            throw httpErrors.forbidden(
                `DIDs are associated with another email address`
            );
        }
    }

    static async getOrGenerateUserId(
        db: PostgresDatabase,
        email: string
    ): Promise<string> {
        const result = await db
            .select({ userId: userTable.id })
            .from(userTable)
            .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
            .where(eq(emailTable.email, email));
        if (result.length === 0) {
            // The email is not associated with any existing user
            // But maybe it was already used to attempt a register
            const resultAttempt = await db
                .select({ userId: authAttemptTable.userId })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.email, email));
            if (resultAttempt.length === 0) {
                // this email has never been used to attempt a register
                return generateUUID();
            } else {
                // at this point every userId in attempts should be identical, by design
                return resultAttempt[0].userId;
            }
        } else {
            return result[0].userId;
        }
    }

    static async isAdmin(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<boolean | undefined> {
        const result = await db
            .select({ isAdmin: userTable.isAdmin })
            .from(userTable)
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(eq(deviceTable.didWrite, didWrite));
        if (result.length === 0) {
            // user does not exist
            return undefined;
        } else {
            return result[0].isAdmin;
        }
    }

    static async getDeviceStatus(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<GetDeviceStatusResp> {
        const now = nowZeroMs();
        const resultDevice = await db
            .select({
                userId: deviceTable.userId,
                sessionExpiry: deviceTable.sessionExpiry,
                encryptedSymmKey: deviceTable.encryptedSymmKey,
            })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (resultDevice.length === 0) {
            // device has never been registered
            return undefined;
        } else if (resultDevice[0].encryptedSymmKey === null) {
            return {
                userId: resultDevice[0].userId,
                isLoggedIn: resultDevice[0].sessionExpiry > now,
                sessionExpiry: resultDevice[0].sessionExpiry,
                isSyncing: false,
            };
        } else {
            return {
                userId: resultDevice[0].userId,
                isLoggedIn: resultDevice[0].sessionExpiry > now,
                sessionExpiry: resultDevice[0].sessionExpiry,
                isSyncing: true,
                encryptedSymmKey: resultDevice[0].encryptedSymmKey,
            };
        }
    }

    static async throwIfAwaitingSyncingOrLoggedIn(
        db: PostgresDatabase,
        didWrite: string,
        httpErrors: HttpErrors
    ): Promise<GetDeviceStatusResp> {
        const deviceStatus = await Service.getDeviceStatus(db, didWrite);
        if (deviceStatus !== undefined) {
            if (deviceStatus.isLoggedIn) {
                const syncingDevices = await Service.getAllSyncingDevices(
                    db,
                    deviceStatus.userId
                );
                if (!deviceStatus.isSyncing) {
                    throw httpErrors.createError(409, "Conflict", {
                        reason: "awaiting_syncing",
                        userId: deviceStatus.userId,
                        sessionExpiry: deviceStatus.sessionExpiry,
                        syncingDevices: syncingDevices,
                    });
                } else {
                    const {
                        emailCredentialsPerEmail,
                        formCredentialsPerEmail,
                    } = await Service.getEmailCredentialsPerEmailFromUserId(
                        db,
                        deviceStatus.userId
                    );
                    const secretCredentialsPerType =
                        await Service.getSecretCredentialsPerType(
                            db,
                            deviceStatus.userId
                        );
                    throw httpErrors.createError(409, "Conflict", {
                        reason: "already_logged_in",
                        userId: deviceStatus.userId,
                        sessionExpiry: deviceStatus.sessionExpiry,
                        encryptedSymmKey: deviceStatus.encryptedSymmKey,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: emailCredentialsPerEmail,
                        formCredentialsPerEmail: formCredentialsPerEmail,
                        secretCredentialsPerType: secretCredentialsPerType,
                    });
                }
            }
        }
        return deviceStatus;
    }

    static async isLoggedIn(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<IsLoggedInResponse> {
        const now = nowZeroMs();
        const resultDevice = await db
            .select({ userId: deviceTable.userId })
            .from(deviceTable)
            .where(
                and(
                    eq(deviceTable.didWrite, didWrite),
                    gt(deviceTable.sessionExpiry, now)
                )
            );
        if (resultDevice.length === 0) {
            // device has never been registered OR device is logged out
            return { isLoggedIn: false };
        } else {
            return { isLoggedIn: true, userId: resultDevice[0].userId };
        }
    }

    static async isSyncing(db: PostgresDatabase, didWrite: string) {
        const resultDevice = await db
            .select({
                encryptedSymmKey: deviceTable.encryptedSymmKey,
                userId: deviceTable.userId,
            })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (resultDevice.length === 0) {
            // device has never been registered
            return { isSyncing: false };
        } else {
            return {
                isSyncing: resultDevice[0].encryptedSymmKey !== null,
                userId: resultDevice[0].userId,
            };
        }
    }

    static async updateCodeGuessAttemptAmount(
        db: PostgresDatabase,
        didWrite: string,
        attemptAmount: number
    ) {
        const now = nowZeroMs();
        return await db
            .update(authAttemptTable)
            .set({
                guessAttemptAmount: attemptAmount,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
    }

    static async isEmailAssociatedWithDevice(
        db: PostgresDatabase,
        didWrite: string,
        email: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(userTable)
            .leftJoin(emailTable, eq(emailTable.userId, userTable.id))
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(
                and(
                    eq(emailTable.email, email),
                    eq(deviceTable.didWrite, didWrite)
                )
            );
        if (result.length !== 0) {
            return true;
        } else {
            return false;
        }
    }

    static async verifyOtp({
        db,
        maxAttempt,
        didWrite,
        code,
        encryptedSymmKey,
        sk,
        pkVersion,
        emailCredentialVersion,
        secretCredentialVersion,
        httpErrors,
        unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest,
    }: VerifyOtpProps): Promise<VerifyOtp200> {
        // TODO: make cron job to clean up devices awaiting syncing for too long
        await this.throwIfAwaitingSyncingOrLoggedIn(db, didWrite, httpErrors);
        const resultOtp = await db
            .select({
                userId: authAttemptTable.userId,
                email: authAttemptTable.email,
                authType: authAttemptTable.type,
                guessAttemptAmount: authAttemptTable.guessAttemptAmount,
                code: authAttemptTable.code,
                codeExpiry: authAttemptTable.codeExpiry,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.didWrite, didWrite));
        if (resultOtp.length === 0) {
            throw httpErrors.badRequest(
                "Device has never made an authentication attempt"
            );
        }
        const now = nowZeroMs();
        if (resultOtp[0].codeExpiry <= now) {
            return { success: false, reason: "expired_code" };
        } else if (resultOtp[0].code === code) {
            const loginSessionExpiry = new Date(now);
            loginSessionExpiry.setFullYear(
                loginSessionExpiry.getFullYear() + 1000
            );
            const awaitSyncingSessionExpiry = new Date(now);
            awaitSyncingSessionExpiry.setMinutes(
                awaitSyncingSessionExpiry.getMinutes() + 30
            );
            switch (resultOtp[0].authType) {
                case "register": {
                    // we can't register the user without an encrypted symm key
                    if (encryptedSymmKey === undefined) {
                        return {
                            success: false,
                            reason: "encrypted_symm_key_required",
                        };
                    }
                    // we can't register the user without creating secret credentials
                    if (
                        unboundSecretCredentialRequest === undefined &&
                        timeboundSecretCredentialRequest === undefined
                    ) {
                        return {
                            success: false,
                            reason: "secret_credential_requests_required",
                        };
                    }
                    if (unboundSecretCredentialRequest === undefined) {
                        return {
                            success: false,
                            reason: "unbound_secret_credential_request_required",
                        };
                    }
                    if (timeboundSecretCredentialRequest === undefined) {
                        return {
                            success: false,
                            reason: "timebound_secret_credential_request_required",
                        };
                    }
                    const {
                        device,
                        emailCredentialsPerEmail,
                        secretCredentialsPerType,
                    } = await Service.register({
                        db,
                        didWrite,
                        pkVersion,
                        emailCredentialVersion,
                        secretCredentialVersion,
                        encryptedSymmKey,
                        sk,
                        unboundSecretCredentialRequest,
                        timeboundSecretCredentialRequest,
                        httpErrors,
                        now,
                        sessionExpiry: loginSessionExpiry,
                    });
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        sessionExpiry: loginSessionExpiry,
                        encryptedSymmKey: encryptedSymmKey,
                        syncingDevices: [device],
                        emailCredentialsPerEmail: emailCredentialsPerEmail,
                        secretCredentialsPerType: secretCredentialsPerType,
                    };
                }
                case "login_known_device": {
                    const existingEncryptedSymmKey =
                        await Service.getEncryptedSymmKey(db, didWrite);
                    if (existingEncryptedSymmKey !== undefined) {
                        await Service.login({
                            db,
                            didWrite,
                            now,
                            sessionExpiry: loginSessionExpiry,
                        });
                        const syncingDevices =
                            await Service.getAllSyncingDevices(
                                db,
                                resultOtp[0].userId
                            );
                        const emailCredentialsPerEmail =
                            await Service.getEmailCredentialsPerEmailFromUserId(
                                db,
                                resultOtp[0].userId
                            );
                        const secretCredentialsPerType =
                            await Service.getSecretCredentialsPerType(
                                db,
                                resultOtp[0].userId
                            );
                        return {
                            success: true,
                            userId: resultOtp[0].userId,
                            sessionExpiry: loginSessionExpiry,
                            encryptedSymmKey: existingEncryptedSymmKey,
                            syncingDevices: syncingDevices,
                            emailCredentialsPerEmail: emailCredentialsPerEmail,
                            secretCredentialsPerType: secretCredentialsPerType,
                        };
                    } else {
                        await Service.login({
                            db,
                            didWrite,
                            now,
                            sessionExpiry: awaitSyncingSessionExpiry,
                        });
                        const syncingDevices =
                            await Service.getAllSyncingDevices(
                                db,
                                resultOtp[0].userId
                            );
                        return {
                            success: true,
                            userId: resultOtp[0].userId,
                            sessionExpiry: awaitSyncingSessionExpiry,
                            syncingDevices: syncingDevices,
                            emailCredentialsPerEmail: {}, // user already have an email credential, but this will be unused. We don't want to send the credentials before the device has been confirmed
                            secretCredentialsPerType: {}, // TODO: remove them altogether when z.switch will be shipped instead of z.discriminatedUnion (cannot embed z.discriminatedUnion...)
                        };
                    }
                }
                case "login_new_device": {
                    await Service.awaitSyncingNewDevice({
                        db,
                        didWrite,
                        now,
                        sessionExpiry: awaitSyncingSessionExpiry,
                    });
                    const syncingDevices = await Service.getAllSyncingDevices(
                        db,
                        resultOtp[0].userId
                    );
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        sessionExpiry: awaitSyncingSessionExpiry,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: {}, // user already have an email credential, but this will be unused. We don't want to send the credentials before the device has been confirmed
                        secretCredentialsPerType: {}, // TODO: remove them altogether when z.switch will be shipped instead of z.discriminatedUnion (cannot embed z.discriminatedUnion...)
                    };
                }
            }
        } else {
            await Service.updateCodeGuessAttemptAmount(
                db,
                didWrite,
                resultOtp[0].guessAttemptAmount + 1
            );
            if (resultOtp[0].guessAttemptAmount + 1 >= maxAttempt) {
                // code is now considered expired
                await Service.expireCode(db, didWrite);
                return {
                    success: false,
                    reason: "too_many_wrong_guess",
                };
            }
            return {
                success: false,
                reason: "wrong_guess",
            };
        }
    }

    static async expireCode(db: PostgresDatabase, didWrite: string) {
        const now = nowZeroMs();
        await db
            .update(authAttemptTable)
            .set({
                codeExpiry: now,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
    }

    static async getAllSyncingDevices(
        db: PostgresDatabase,
        userId: string
    ): Promise<Devices> {
        const results = await db
            .select({
                didWrite: deviceTable.didWrite,
                userAgent: deviceTable.userAgent,
            })
            .from(deviceTable)
            .where(
                and(
                    eq(deviceTable.userId, userId),
                    isNotNull(deviceTable.encryptedSymmKey)
                )
            );
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => {
                return {
                    didWrite: result.didWrite,
                    userAgent: result.userAgent,
                };
            });
        }
    }

    static async isEmailAvailable(
        db: PostgresDatabase,
        email: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(emailTable)
            .where(eq(emailTable.email, email));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async isDidWriteAvailable(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async isDidExchangeAvailable(
        db: PostgresDatabase,
        didExchange: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(deviceTable)
            .where(eq(deviceTable.didExchange, didExchange));
        if (result.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    static async authenticateAttempt({
        db,
        type,
        authenticateRequestBody,
        userId,
        minutesBeforeCodeExpiry,
        didWrite,
        userAgent,
        throttleMinutesInterval,
        httpErrors,
        testCode,
        doUseTestCode,
        doSendEmail,
        awsMailConf,
    }: AuthenticateAttemptProps): Promise<AuthenticateOtp> {
        const now = nowZeroMs();
        const resultHasAttempted = await db
            .select({
                codeExpiry: authAttemptTable.codeExpiry,
                lastEmailSentAt: authAttemptTable.lastEmailSentAt,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.didWrite, didWrite));
        if (resultHasAttempted.length === 0) {
            // this is a first attempt, generate new code, insert data and send email in one transaction
            return await this.insertAuthAttemptCode({
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                userAgent,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors,
                doSendEmail,
                awsMailConf,
                doUseTestCode,
                testCode,
            });
        } else if (authenticateRequestBody.isRequestingNewCode) {
            // if user wants to regenerate new code, do it (if possible according to throttling rules)
            return await this.updateAuthAttemptCode({
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors,
                doSendEmail,
                awsMailConf,
                doUseTestCode,
                testCode,
            });
        } else if (resultHasAttempted[0].codeExpiry > now) {
            // code hasn't expired
            const nextCodeSoonestTime = resultHasAttempted[0].lastEmailSentAt;
            nextCodeSoonestTime.setMinutes(
                nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
            );
            return {
                codeExpiry: resultHasAttempted[0].codeExpiry,
                nextCodeSoonestTime: nextCodeSoonestTime,
            };
        } else {
            // code has expired, generate a new one if not throttled
            return await this.updateAuthAttemptCode({
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors,
                doSendEmail,
                awsMailConf,
                doUseTestCode,
                testCode,
            });
        }
    }

    static async sendOtpEmail({ email, otp, awsMailConf }: SendOtpEmailProps) {
        // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists

        const ses = new sesClientModule.SESClient({
            region: "eu-north-1",
            credentials: {
                accessKeyId: awsMailConf.accessKeyId,
                secretAccessKey: awsMailConf.secretAccessKey,
            },
        });
        const transporter = nodemailer.createTransport({
            SES: { ses, aws: sesClientModule },
        });

        return new Promise((resolve, reject) => {
            transporter.sendMail(
                {
                    from: "noreply@notify.zkorum.com", // TODO: make this configurable
                    to: email,
                    subject: `ZKorum confirmation code: ${codeToString(otp)}`, // TODO make this configurable
                    text: `Your confirmation code is ${codeToString(otp)}
                    \n\nEnter it shortly in the same browser/device that you used for your authentication request.\n\nIf you didn’t request this email, there’s nothing to worry about — you can safely ignore it.`, // TODO: use a beaauautiful HTML template
                },
                (err, info) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                }
            );
        });
    }

    static async insertAuthAttemptCode({
        db,
        type,
        userId,
        minutesBeforeCodeExpiry,
        didWrite,
        now,
        userAgent,
        authenticateRequestBody,
        throttleMinutesInterval,
        httpErrors,
        testCode,
        doUseTestCode,
        doSendEmail,
        awsMailConf,
    }: InsertAuthAttemptCodeProps): Promise<AuthenticateOtp> {
        if (doUseTestCode && doSendEmail) {
            throw httpErrors.badRequest(
                "Test code shall not be sent via email"
            );
        }
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            minutesBeforeCodeExpiry,
            httpErrors
        );
        const oneTimeCode = doUseTestCode ? testCode : generateOneTimeCode();
        const codeExpiry = new Date(now);
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        if (doSendEmail) {
            // may throw errors and return 500 :)
            await Service.sendOtpEmail({
                email: authenticateRequestBody.email,
                otp: oneTimeCode,
                awsMailConf,
            });
        } else {
            console.log(
                "\n\nCode:",
                codeToString(oneTimeCode),
                codeExpiry,
                "\n\n"
            );
        }
        await db.insert(authAttemptTable).values({
            didWrite: didWrite,
            type: type,
            email: authenticateRequestBody.email,
            userId: userId,
            didExchange: authenticateRequestBody.didExchange,
            userAgent: userAgent,
            code: oneTimeCode,
            codeExpiry: codeExpiry,
            lastEmailSentAt: now,
        });
        const nextCodeSoonestTime = new Date(now);
        nextCodeSoonestTime.setMinutes(
            nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
        );
        return {
            codeExpiry: codeExpiry,
            nextCodeSoonestTime: nextCodeSoonestTime,
        };
    }

    static async updateAuthAttemptCode({
        db,
        type,
        userId,
        minutesBeforeCodeExpiry,
        didWrite,
        now,
        authenticateRequestBody,
        throttleMinutesInterval,
        httpErrors,
        doSendEmail,
        awsMailConf,
        doUseTestCode,
        testCode,
    }: UpdateAuthAttemptCodeProps): Promise<AuthenticateOtp> {
        if (doUseTestCode && doSendEmail) {
            throw httpErrors.badRequest(
                "Test code shall not be sent via email"
            );
        }
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            minutesBeforeCodeExpiry,
            httpErrors
        );
        const oneTimeCode = doUseTestCode ? testCode : generateOneTimeCode();
        const codeExpiry = new Date(now);
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        if (doSendEmail) {
            await Service.sendOtpEmail({
                email: authenticateRequestBody.email,
                otp: oneTimeCode,
                awsMailConf,
            });
        } else {
            console.log(
                "\n\nCode:",
                codeToString(oneTimeCode),
                codeExpiry,
                "\n\n"
            );
        }
        await db
            .update(authAttemptTable)
            .set({
                userId: userId,
                email: authenticateRequestBody.email,
                didExchange: authenticateRequestBody.didExchange,
                type: type,
                code: oneTimeCode,
                codeExpiry: codeExpiry,
                guessAttemptAmount: 0,
                lastEmailSentAt: now,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
        const nextCodeSoonestTime = new Date(now);
        nextCodeSoonestTime.setMinutes(
            nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
        );
        return {
            codeExpiry: codeExpiry,
            nextCodeSoonestTime: nextCodeSoonestTime,
        };
    }

    // ! WARN we assume the OTP was verified for registering at this point
    static async register({
        db,
        didWrite,
        encryptedSymmKey,
        sk,
        pkVersion,
        secretCredentialVersion,
        emailCredentialVersion,
        unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest,
        httpErrors,
        now,
        sessionExpiry,
    }: RegisterProps): Promise<RegisterResult> {
        const uid = generateRandomHex();
        return await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    email: authAttemptTable.email,
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
                    userAgent: authAttemptTable.userAgent,
                })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.didWrite, didWrite));
            if (authAttemptResult.length === 0) {
                throw new Error(
                    "No register attempt was initiated - cannot register the user"
                );
            }
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            const domain = domainFromEmail(authAttemptResult[0].email);
            await tx.insert(userTable).values({
                uid: uid,
                id: authAttemptResult[0].userId,
                isAdmin: domain === "zkorum.com",
            });
            await tx.insert(deviceTable).values({
                userId: authAttemptResult[0].userId,
                didWrite: didWrite,
                didExchange: authAttemptResult[0].didExchange,
                userAgent: authAttemptResult[0].userAgent,
                encryptedSymmKey: encryptedSymmKey,
                sessionExpiry: sessionExpiry,
            });
            await tx.insert(emailTable).values({
                userId: authAttemptResult[0].userId,
                type: "primary",
                email: authAttemptResult[0].email,
            });
            const emailCredential = await Service.createAndStoreEmailCredential(
                {
                    db: tx,
                    email: authAttemptResult[0].email,
                    pkVersion,
                    emailCredentialVersion,
                    sk: sk,
                    uid: uid,
                    httpErrors,
                }
            );
            const emailCredentialsPerEmail: EmailCredentialsPerEmail = {
                [authAttemptResult[0].email]: {
                    active: emailCredential,
                    revoked: [],
                },
            };
            const secretCredentialsPerType: SecretCredentialsPerType =
                await Service.createAndStoreSecretCredentials({
                    db: tx,
                    uid: uid,
                    userId: authAttemptResult[0].userId,
                    pkVersion: pkVersion,
                    secretCredentialVersion,
                    unboundSecretCredentialRequest,
                    timeboundSecretCredentialRequest,
                    httpErrors,
                    sk,
                });
            const device: Device = {
                didWrite: didWrite,
                userAgent: authAttemptResult[0].userAgent,
            };

            return {
                device,
                emailCredentialsPerEmail,
                secretCredentialsPerType,
            };
        });
    }

    // ! WARN we assume the OTP was verified for login new device at this point
    static async awaitSyncingNewDevice({
        db,
        didWrite,
        now,
        sessionExpiry,
    }: AwaitSyncingNewDeviceProps) {
        await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
                    userAgent: authAttemptTable.userAgent,
                })
                .from(authAttemptTable)
                .where(eq(authAttemptTable.didWrite, didWrite));
            if (authAttemptResult.length === 0) {
                throw new Error(
                    "No loginNewDevice attempt was initiated - cannot login the user"
                );
            }
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            await tx.insert(deviceTable).values({
                userId: authAttemptResult[0].userId,
                didWrite: didWrite,
                userAgent: authAttemptResult[0].userAgent,
                // it's a new device - so no encryption key. Users must manually accept syncing from an existing syncing device. This is necessary because symmetric keys are only known client-side, and it is a protection against an attacker that would have access to the user's email address. Even in such situation, the attacker will not be able to get access to the user's credentials and secrets unless the attacker has also access to one of the user's existing syncing device - or unless the attacker successfully phishes the user into accepting syncing with the attacker's device.
                didExchange: authAttemptResult[0].didExchange,
                sessionExpiry: sessionExpiry,
            });
        });
    }

    // ! WARN we assume the OTP was verified and the device is already syncing
    static async login({ db, didWrite, now, sessionExpiry }: LoginProps) {
        await db.transaction(async (tx) => {
            await tx
                .update(authAttemptTable)
                .set({
                    codeExpiry: now, // this is important to forbid further usage of the same code once it has been successfully guessed
                    updatedAt: now,
                })
                .where(eq(authAttemptTable.didWrite, didWrite));
            await tx
                .update(deviceTable)
                .set({
                    sessionExpiry: sessionExpiry,
                    updatedAt: now,
                })
                .where(eq(deviceTable.didWrite, didWrite));
        });
    }

    // minutesInterval: "3" in "we allow one email every 3 minutes"
    static async throttleByEmail(
        db: PostgresDatabase,
        email: string,
        minutesInterval: number,
        minutesBeforeCodeExpiry: number,
        httpErrors: HttpErrors
    ) {
        const now = nowZeroMs();
        // now - 3 minutes if minutesInterval == 3
        const minutesIntervalAgo = new Date(now);
        minutesIntervalAgo.setMinutes(
            minutesIntervalAgo.getMinutes() - minutesInterval
        );

        const results = await db
            .select({
                lastEmailSentAt: authAttemptTable.lastEmailSentAt,
                codeExpiry: authAttemptTable.codeExpiry,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.email, email));
        for (const result of results) {
            const expectedExpiryTime = new Date(result.lastEmailSentAt);
            expectedExpiryTime.setMinutes(
                expectedExpiryTime.getMinutes() + minutesBeforeCodeExpiry
            );
            if (
                result.lastEmailSentAt.getTime() >=
                    minutesIntervalAgo.getTime() &&
                expectedExpiryTime.getTime() === result.codeExpiry.getTime() // code hasn't been guessed, because otherwise it would have been manually expired before the normal expiry time
            ) {
                throw httpErrors.tooManyRequests(
                    "Throttling amount of emails sent"
                );
            }
        }
    }

    // ! WARNING check should already been done that the device exists and is logged in
    static async logout(db: PostgresDatabase, didWrite: string) {
        const now = nowZeroMs();
        return await db
            .update(deviceTable)
            .set({
                sessionExpiry: now,
                updatedAt: now,
            })
            .where(eq(deviceTable.didWrite, didWrite));
    }

    static async getEmailsFromDidWrite(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string[]> {
        const results = await db
            .select({ email: emailTable.email })
            .from(emailTable)
            .leftJoin(userTable, eq(userTable.id, emailTable.userId))
            .leftJoin(deviceTable, eq(deviceTable.userId, emailTable.userId))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => result.email);
        }
    }

    static async getEmailsFromUserId(
        db: PostgresDatabase,
        userId: string
    ): Promise<string[]> {
        const results = await db
            .select({ email: emailTable.email })
            .from(emailTable)
            .leftJoin(userTable, eq(emailTable.userId, userTable.id))
            .where(eq(userTable.id, userId));
        if (results.length === 0) {
            return [];
        } else {
            return results.map((result) => result.email);
        }
    }

    static async getEmailCredentialsPerEmailFromUserId(
        db: PostgresDatabase,
        userId: string
    ): Promise<EmailCredentialsPerEmail> {
        const emails = await Service.getEmailsFromUserId(db, userId);
        return await Service.getEmailFormCredentialsPerEmail(db, emails);
    }

    static async getEmailCredentialsPerEmail(
        db: PostgresDatabase,
        emails: string[]
    ): Promise<EmailCredentialsPerEmail> {
        const emailCredentials: EmailCredentialsPerEmail = {};
        const results = await db
            .select({
                email: credentialEmailTable.email,
                credential: credentialEmailTable.credential,
                isRevoked: credentialEmailTable.isRevoked,
            })
            .from(credentialEmailTable)
            .orderBy(credentialEmailTable.createdAt)
            .where(inArray(credentialEmailTable.email, emails));
        if (results.length === 0) {
            return {};
        } else {
            addCredentials({
                results: results,
                emailCredentialsPerEmail: emailCredentials,
            });
            return emailCredentials;
        }
    }

    static async getEmailFormCredentialsPerEmail(
        db: PostgresDatabase,
        emails: string[]
    ): Promise<EmailCredentialsPerEmail> {
        const emailCredentialsPerEmail =
            await Service.getEmailCredentialsPerEmail(db, emails);
        return emailCredentialsPerEmail;
    }

    static async createAndStoreEmailCredential({
        db,
        email,
        uid,
        sk,
        pkVersion,
        emailCredentialVersion,
        httpErrors,
    }: CreateAndStoreEmailCredentialsProps): Promise<EmailCredential> {
        return await db.transaction(async (tx) => {
            const results = await tx
                .select({ id: credentialEmailTable.id })
                .from(credentialEmailTable)
                .where(
                    and(
                        eq(credentialEmailTable.email, email),
                        eq(credentialEmailTable.isRevoked, false)
                    )
                );
            if (results.length !== 0) {
                throw httpErrors.forbidden(
                    `Attempt to create multiple active email credential`
                );
            }
            const credential = buildEmailCredential({
                email,
                uid,
                sk,
                version: emailCredentialVersion,
            });
            const encodedCredential = base64.encode(
                anyToUint8Array(credential.toJSON())
            );
            await tx.insert(credentialEmailTable).values({
                email: email,
                isRevoked: false,
                pkVersion: pkVersion,
                credential: credential.toJSON(),
            });
            return encodedCredential;
        });
    }

    static async createAndStoreSecretCredentials({
        db,
        unboundSecretCredentialRequest,
        pkVersion,
        secretCredentialVersion,
        userId,
        uid,
        timeboundSecretCredentialRequest,
        httpErrors,
        sk,
    }: CreateSecretCredentialsProps): Promise<SecretCredentialsPerType> {
        const unboundSecretCredential =
            await Service.createAndStoreSecretCredential({
                db,
                secretCredentialRequest: unboundSecretCredentialRequest,
                pkVersion,
                secretCredentialVersion,
                type: "unbound",
                uid,
                userId,
                httpErrors,
                sk,
            });
        const timeboundSecretCredential =
            await Service.createAndStoreSecretCredential({
                db,
                userId,
                uid,
                secretCredentialRequest: timeboundSecretCredentialRequest,
                pkVersion,
                secretCredentialVersion,
                httpErrors,
                sk,
                type: "timebound",
            });
        const secretCredentialsPerType: SecretCredentialsPerType = {
            unbound: {
                active: {
                    blindedCredential: unboundSecretCredential,
                    encryptedBlinding:
                        unboundSecretCredentialRequest.encryptedEncodedBlinding,
                    encryptedBlindedSubject:
                        unboundSecretCredentialRequest.encryptedEncodedBlindedSubject,
                },
                revoked: [],
            },
            timebound: {
                active: {
                    blindedCredential: timeboundSecretCredential,
                    encryptedBlinding:
                        timeboundSecretCredentialRequest.encryptedEncodedBlinding,
                    encryptedBlindedSubject:
                        timeboundSecretCredentialRequest.encryptedEncodedBlindedSubject,
                },
                revoked: [],
            },
        };
        return secretCredentialsPerType;
    }

    static async createAndStoreSecretCredential({
        db,
        secretCredentialRequest,
        type,
        pkVersion,
        secretCredentialVersion,
        uid,
        userId,
        httpErrors,
        sk,
    }: CreateAndStoreSecretCredentialProps): Promise<BlindedCredentialType> {
        return await db.transaction(async (tx) => {
            const results = await tx
                .select({ id: credentialSecretTable.id })
                .from(credentialSecretTable)
                .where(
                    and(
                        eq(credentialSecretTable.userId, userId),
                        eq(credentialSecretTable.type, type),
                        eq(credentialSecretTable.isRevoked, false)
                    )
                );
            if (results.length !== 0) {
                throw httpErrors.forbidden(
                    `Attempt to create multiple active ${type} secret credential`
                );
            }
            let blindedCredentialRequest: BlindedCredentialRequest;
            try {
                blindedCredentialRequest = parseSecretCredentialRequest(
                    secretCredentialRequest.blindedRequest
                );
            } catch (e) {
                throw httpErrors.createError(400, e as Error);
            }
            const credential = buildSecretCredential({
                blindedCredentialRequest,
                uid,
                type,
                sk,
                version: secretCredentialVersion,
            });
            const encodedCredential = base64.encode(
                anyToUint8Array(credential.toJSON())
            );
            await tx.insert(credentialSecretTable).values({
                userId: userId,
                type: type,
                pkVersion: pkVersion,
                isRevoked: false,
                credential: credential.toJSON(),
                encryptedBlinding:
                    secretCredentialRequest.encryptedEncodedBlinding,
                encryptedBlindedSubject:
                    secretCredentialRequest.encryptedEncodedBlindedSubject,
            });
            return encodedCredential;
        });
    }

    static async revokeUserCredentials({
        db,
        email,
        userId,
        now,
    }: RevokeUserCredentialsProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<void> {
        // TODO: use transaction if type of DB is not transaction already
        await db
            .update(credentialEmailTable)
            .set({
                isRevoked: true,
                updatedAt: now,
            })
            .where(eq(credentialEmailTable.email, email));
        await db
            .update(credentialSecretTable)
            .set({
                isRevoked: true,
                updatedAt: now,
            })
            .where(eq(credentialSecretTable.userId, userId));
    }

    static async logoutAllDevicesButOne({
        db,
        didWrite,
        userId,
        now,
        sessionExpiry,
    }: LogoutAllDevicesButOneProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<void> {
        await db
            .update(deviceTable)
            .set({
                encryptedSymmKey: null,
                sessionExpiry: now,
                updatedAt: now,
            })
            .where(
                and(
                    eq(deviceTable.userId, userId),
                    ne(deviceTable.didWrite, didWrite)
                )
            );
        await db
            .update(deviceTable)
            .set({
                sessionExpiry: sessionExpiry,
                updatedAt: now,
            })
            .where(eq(deviceTable.didWrite, didWrite));
    }

    // encryptedSymmKey: z.string().optional(),
    // timeboundSecretCredentialRequest: zodsecretCredentialRequest.optional(),
    // unboundSecretCredentialRequest: zodsecretCredentialRequest.optional(),

    static async updateEncryptedSymmKey({
        db,
        didWrite,
        encryptedSymmKey,
        now,
    }: UpdateEncryptedSymmKeyProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<void> {
        await db
            .update(deviceTable)
            .set({
                encryptedSymmKey: encryptedSymmKey,
                updatedAt: now,
            })
            .where(and(eq(deviceTable.didWrite, didWrite)));
    }

    static async recoverAccount({
        db,
        didWrite,
        pkVersion,
        secretCredentialVersion,
        emailCredentialVersion,
        httpErrors,
        timeboundSecretCredentialRequest,
        unboundSecretCredentialRequest,
        sk,
        encryptedSymmKey,
    }: RecoverAccountProps): Promise<RecoverAccountResp> {
        // TODO do all this as a unique transaction
        const now = nowZeroMs();
        return await db.transaction(async (tx) => {
            const emails = await Service.getEmailsFromDidWrite(tx, didWrite);
            const email = emails[0]; // TODO solve it for multiple emails
            const { userId, uid, userAgent } = await Service.getInfoFromDevice(
                tx,
                didWrite
            );
            await Service.revokeUserCredentials({ db: tx, email, userId, now });
            const loginSessionExpiry = new Date(now);
            loginSessionExpiry.setFullYear(
                loginSessionExpiry.getFullYear() + 1000
            );
            await Service.logoutAllDevicesButOne({
                db: tx,
                didWrite,
                userId,
                now,
                sessionExpiry: loginSessionExpiry,
            });
            await Service.updateEncryptedSymmKey({
                db: tx,
                didWrite,
                encryptedSymmKey,
                now,
            });
            await Service.createAndStoreEmailCredential({
                db: tx,
                email,
                pkVersion,
                emailCredentialVersion,
                uid,
                sk,
                httpErrors,
            });
            await Service.createAndStoreSecretCredential({
                db: tx,
                userId,
                uid,
                pkVersion: pkVersion,
                secretCredentialVersion,
                secretCredentialRequest: timeboundSecretCredentialRequest,
                httpErrors: httpErrors,
                sk,
                type: "timebound",
            });
            await Service.createAndStoreSecretCredential({
                db: tx,
                userId,
                uid,
                pkVersion: pkVersion,
                secretCredentialVersion,
                secretCredentialRequest: unboundSecretCredentialRequest,
                httpErrors: httpErrors,
                sk,
                type: "unbound",
            });
            const credentials = await Service.getUserCredentials(tx, didWrite);
            return {
                ...credentials,
                userId: userId,
                sessionExpiry: loginSessionExpiry,
                syncingDevices: [
                    {
                        didWrite: didWrite,
                        userAgent: userAgent,
                    },
                ],
            };
        });
    }

    static async getUserIdFromDevice(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string> {
        const results = await db
            .select({ userId: userTable.id })
            .from(userTable)
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            throw new Error("This didWrite is not registered to any user");
        }
        return results[0].userId;
    }

    static async getInfoFromDevice(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<InfoDevice> {
        const results = await db
            .select({
                userId: userTable.id,
                uid: userTable.uid,
                userAgent: deviceTable.userAgent,
                sessionExpiry: deviceTable.sessionExpiry,
            })
            .from(userTable)
            .innerJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            throw new Error("This didWrite is not registered to any user");
        }
        return {
            userId: results[0].userId,
            uid: results[0].uid,
            userAgent: results[0].userAgent,
            sessionExpiry: results[0].sessionExpiry,
        };
    }

    static async getUidFromDevice(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string> {
        const results = await db
            .select({ uid: userTable.uid })
            .from(userTable)
            .leftJoin(deviceTable, eq(deviceTable.userId, userTable.id))
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            throw new Error("This didWrite is not registered to any user");
        }
        return results[0].uid;
    }

    static async getSecretCredentialsPerType(
        db: PostgresDatabase,
        userId: string
    ): Promise<SecretCredentialsPerType> {
        const results = await db
            .select({
                type: credentialSecretTable.type,
                blindedCredential: credentialSecretTable.credential, // TODO: make sure this really output a string...
                encryptedBlinding: credentialSecretTable.encryptedBlinding,
                encryptedBlindedSubject:
                    credentialSecretTable.encryptedBlindedSubject,
                isRevoked: credentialSecretTable.isRevoked,
            })
            .from(credentialSecretTable)
            .orderBy(credentialSecretTable.createdAt)
            .where(eq(credentialSecretTable.userId, userId));
        if (results.length === 0) {
            return {};
        } else {
            const secretCredentialsPerType: SecretCredentialsPerType = {};
            for (const result of results) {
                const encodedCredential = base64.encode(
                    anyToUint8Array(result.blindedCredential)
                );
                if (result.type in secretCredentialsPerType) {
                    if (result.isRevoked) {
                        (
                            secretCredentialsPerType[
                                result.type
                            ] as SecretCredentials
                        ).revoked.push({
                            // ts thinks secretCredentialsPerType[result.type] can be undefined :@
                            blindedCredential: encodedCredential,
                            encryptedBlinding: result.encryptedBlinding,
                            encryptedBlindedSubject:
                                result.encryptedBlindedSubject,
                        });
                    } else {
                        (
                            secretCredentialsPerType[
                                result.type
                            ] as SecretCredentials
                        ).active = {
                            // ts thinks secretCredentialsPerType[result.type] can be undefined :@
                            blindedCredential: encodedCredential,
                            encryptedBlinding: result.encryptedBlinding,
                            encryptedBlindedSubject:
                                result.encryptedBlindedSubject,
                        };
                    }
                } else {
                    if (result.isRevoked) {
                        secretCredentialsPerType[result.type] = {
                            active: undefined,
                            revoked: [
                                {
                                    blindedCredential: encodedCredential,
                                    encryptedBlinding: result.encryptedBlinding,
                                    encryptedBlindedSubject:
                                        result.encryptedBlindedSubject,
                                },
                            ],
                        };
                    } else {
                        secretCredentialsPerType[result.type] = {
                            active: {
                                blindedCredential: encodedCredential,
                                encryptedBlinding: result.encryptedBlinding,
                                encryptedBlindedSubject:
                                    result.encryptedBlindedSubject,
                            },
                            revoked: [],
                        };
                    }
                }
            }
            return secretCredentialsPerType;
        }
    }

    static async getEncryptedSymmKey(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<string | undefined> {
        const results = await db
            .select({ encryptedSymmKey: deviceTable.encryptedSymmKey })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        if (results.length === 0) {
            return undefined;
        }
        if (results[0].encryptedSymmKey === null) {
            return undefined;
        }
        return results[0].encryptedSymmKey;
    }

    // maybe remove that when ServerSideEvents is implemented...
    static async getUserCredentials(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<UserCredentials> {
        const userId = await Service.getUserIdFromDevice(db, didWrite);
        const emailCredentialsPerEmail =
            await Service.getEmailCredentialsPerEmailFromUserId(db, userId);
        const secretCredentialsPerType =
            await Service.getSecretCredentialsPerType(db, userId);
        return {
            emailCredentialsPerEmail: emailCredentialsPerEmail,
            secretCredentialsPerType: secretCredentialsPerType,
        };
    }

    static async selectPersonaIdFromAttributes({
        db,
        domain,
    }: SelectPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
        const results = await db
            .select({
                personaId: personaTable.id,
            })
            .from(personaTable)
            .where(and(eq(personaTable.domain, domain)));
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].personaId;
        }
    }

    // TODO actually try to select pseudonym first
    static async selectOrInsertPseudonym({
        tx,
        postAs,
        pseudonym,
    }: SelectOrInsertPseudonymProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number> {
        ////////////// PERSONA - POST AS ///////////
        const resultSelectPseudonymId = await tx
            .select({ id: pseudonymTable.id })
            .from(pseudonymTable)
            .where(eq(pseudonymTable.pseudonym, pseudonym));
        if (resultSelectPseudonymId.length !== 0) {
            return resultSelectPseudonymId[0].id;
        }
        let personaId: number | undefined = undefined;
        // TODO: switch case depending on value of postAs.type - here we only do work for universities
        const selectedPersonaId: number | undefined =
            await Service.selectPersonaIdFromAttributes({
                db: tx,
                domain: postAs.domain,
            });
        if (selectedPersonaId === undefined) {
            const insertedPersona = await tx
                .insert(personaTable)
                .values({
                    domain: postAs.domain,
                })
                .returning({ insertedId: personaTable.id });
            personaId = insertedPersona[0].insertedId;
        } else {
            personaId = selectedPersonaId;
        }
        const insertedAuthor = await tx
            .insert(pseudonymTable)
            .values({
                pseudonym: pseudonym,
                personaId: personaId, // TODO: maybe we could allow posting just as a member of ZKorum? Then this could be undefined
            })
            .returning({ insertedId: pseudonymTable.id });
        return insertedAuthor[0].insertedId;
        /////////////////////////////////////////////////////////////////////////////////////////
    }

    static async createPost({
        db,
        presentation,
        post,
        pseudonym,
        postAs,
    }: CreatePostProps): Promise<string> {
        const presentationCID = await toEncodedCID(presentation);
        const now = nowZeroMs();
        const timestampedPresentation = {
            timestamp: now.getTime(),
            presentation: presentation,
        }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
        const timestampedPresentationCID = await toEncodedCID(
            timestampedPresentation
        );
        await db.transaction(async (tx) => {
            ////////////// PERSONA - POST AS ///////////
            const authorId = await Service.selectOrInsertPseudonym({
                tx: tx,
                postAs: postAs,
                pseudonym: pseudonym,
            });
            /////////////////////////////////////////////////////////////////////////////////////////
            const insertedPost = await tx
                .insert(postTable)
                .values({
                    presentation: presentation.toJSON(),
                    presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
                    slugId: generateRandomSlugId(),
                    timestampedPresentationCID: timestampedPresentationCID,
                    title: post.data.title,
                    body:
                        post.data.body?.length === 0
                            ? undefined
                            : post.data.body, // we don't want to insert a string with length 0
                    authorId: authorId,
                    createdAt: now,
                    updatedAt: now,
                    lastReactedAt: now,
                })
                .returning({
                    insertedId: postTable.id,
                });
            if (post.data.poll !== undefined) {
                const optionalOptions = [
                    post.data.poll.option3,
                    post.data.poll.option4,
                    post.data.poll.option5,
                    post.data.poll.option6,
                ];
                const realOptionalOptions: string[] = optionalOptions.filter(
                    (option) => option !== undefined && option !== ""
                ) as string[];
                await tx.insert(pollTable).values({
                    postId: insertedPost[0].insertedId,
                    option1: post.data.poll.option1,
                    option2: post.data.poll.option2,
                    option3:
                        realOptionalOptions.length >= 1
                            ? realOptionalOptions[0]
                            : undefined,
                    option4:
                        realOptionalOptions.length >= 2
                            ? realOptionalOptions[1]
                            : undefined,
                    option5:
                        realOptionalOptions.length >= 3
                            ? realOptionalOptions[2]
                            : undefined,
                    option6:
                        realOptionalOptions.length >= 4
                            ? realOptionalOptions[3]
                            : undefined,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        });
        // TODO: broadcast timestampedPresentation to Nostr or custom libp2p node
        return timestampedPresentationCID;
    }

    static async fetchFeed({
        db,
        lastReactedAt,
        order,
        limit,
        showHidden,
    }: FetchFeedProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<ExtendedPostData[]> {
        const defaultLimit = 30;
        const actualLimit = limit === undefined ? defaultLimit : limit;
        const whereUpdatedAt =
            lastReactedAt === undefined
                ? undefined
                : order === "more"
                ? lt(postTable.updatedAt, lastReactedAt)
                : gt(postTable.updatedAt, lastReactedAt);
        const results = await db
            .selectDistinctOn([postTable.lastReactedAt, postTable.id], {
                // poll payload
                title: postTable.title,
                body: postTable.body,
                option1: pollTable.option1,
                option1Response: pollTable.option1Response,
                option2: pollTable.option2,
                option2Response: pollTable.option2Response,
                option3: pollTable.option3,
                option3Response: pollTable.option3Response,
                option4: pollTable.option4,
                option4Response: pollTable.option4Response,
                option5: pollTable.option5,
                option5Response: pollTable.option5Response,
                option6: pollTable.option6,
                option6Response: pollTable.option6Response,
                // post as
                pseudonym: pseudonymTable.pseudonym,
                domain: personaTable.domain,
                // metadata
                pollUid: postTable.timestampedPresentationCID,
                slugId: postTable.slugId,
                isHidden: postTable.isHidden,
                updatedAt: postTable.updatedAt,
                lastReactedAt: postTable.lastReactedAt,
                commentCount: postTable.commentCount,
            })
            .from(postTable)
            .innerJoin(
                pseudonymTable,
                eq(pseudonymTable.id, postTable.authorId)
            )
            .innerJoin(
                personaTable,
                eq(personaTable.id, pseudonymTable.personaId)
            )
            .leftJoin(pollTable, eq(postTable.id, pollTable.postId))
            .orderBy(desc(postTable.lastReactedAt), desc(postTable.id))
            .limit(actualLimit)
            .where(
                showHidden === true
                    ? whereUpdatedAt
                    : and(whereUpdatedAt, eq(postTable.isHidden, false))
            );
        const posts: ExtendedPostData[] = results.map((result) => {
            const metadata =
                showHidden === true
                    ? {
                          uid: result.pollUid,
                          slugId: result.slugId,
                          isHidden: result.isHidden,
                          updatedAt: result.updatedAt,
                          lastReactedAt: result.lastReactedAt,
                          commentCount: result.commentCount,
                      }
                    : {
                          uid: result.pollUid,
                          slugId: result.slugId,
                          updatedAt: result.updatedAt,
                          lastReactedAt: result.lastReactedAt,
                          commentCount: result.commentCount,
                      };
            return {
                metadata: metadata,
                payload: {
                    title: result.title,
                    body: toUnionUndefined(result.body),
                    poll:
                        result.option1 !== null &&
                        result.option2 !== null &&
                        result.option1Response !== null &&
                        result.option2Response !== null
                            ? {
                                  options: {
                                      option1: result.option1,
                                      option2: result.option2,
                                      option3: toUnionUndefined(result.option3),
                                      option4: toUnionUndefined(result.option4),
                                      option5: toUnionUndefined(result.option5),
                                      option6: toUnionUndefined(result.option6),
                                  },
                                  result: {
                                      option1Response: result.option1Response,
                                      option2Response: result.option2Response,
                                      option3Response: toUnionUndefined(
                                          result.option3Response
                                      ),
                                      option4Response: toUnionUndefined(
                                          result.option4Response
                                      ),
                                      option5Response: toUnionUndefined(
                                          result.option5Response
                                      ),
                                      option6Response: toUnionUndefined(
                                          result.option6Response
                                      ),
                                  },
                              }
                            : undefined,
                },
                author: {
                    pseudonym: result.pseudonym,
                    domain: result.domain,
                },
            };
        });
        return posts;
    }

    static async fetchPostByUidOrSlugId({
        db,
        postUidOrSlugId,
        type,
        httpErrors,
    }: FetchPostByUidOrSlugIdProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<PostAndId> {
        const fetchPostQuery = fetchPostBy({ db });
        const whereClause =
            type === "postUid"
                ? eq(postTable.timestampedPresentationCID, postUidOrSlugId)
                : eq(postTable.slugId, postUidOrSlugId);
        const results = await fetchPostQuery.where(whereClause);
        if (results.length === 0) {
            throw httpErrors.internalServerError(
                `There is no post for ${type} '${postUidOrSlugId}'`
            );
        }
        if (results.length > 1) {
            throw httpErrors.internalServerError(
                `There are more than one post for ${type} '${postUidOrSlugId}'`
            );
        }
        const result = results[0];
        const post: ExtendedPostData = {
            metadata: {
                uid: result.pollUid,
                slugId: result.slugId,
                isHidden: result.isHidden,
                updatedAt: result.updatedAt,
                lastReactedAt: result.lastReactedAt,
                commentCount: result.commentCount,
            },
            payload: {
                title: result.title,
                body: toUnionUndefined(result.body),
                poll:
                    result.option1 !== null &&
                    result.option2 !== null &&
                    result.option1Response !== null &&
                    result.option2Response !== null
                        ? {
                              options: {
                                  option1: result.option1,
                                  option2: result.option2,
                                  option3: toUnionUndefined(result.option3),
                                  option4: toUnionUndefined(result.option4),
                                  option5: toUnionUndefined(result.option5),
                                  option6: toUnionUndefined(result.option6),
                              },
                              result: {
                                  option1Response: result.option1Response,
                                  option2Response: result.option2Response,
                                  option3Response: toUnionUndefined(
                                      result.option3Response
                                  ),
                                  option4Response: toUnionUndefined(
                                      result.option4Response
                                  ),
                                  option5Response: toUnionUndefined(
                                      result.option5Response
                                  ),
                                  option6Response: toUnionUndefined(
                                      result.option6Response
                                  ),
                              },
                          }
                        : undefined,
            },
            author: {
                pseudonym: result.pseudonym,
                domain: result.domain,
            },
        };
        const postId = result.id;
        return { post, postId };
    }

    static async respondToPoll({
        db,
        presentation,
        response,
        pseudonym,
        postAs,
        httpErrors,
    }: RespondToPollProps): Promise<ExtendedPostData> {
        if (response.optionChosen > 6) {
            throw httpErrors.badRequest(
                "Option chosen must be an integer between 1 and 6 included"
            );
        }
        // check whether poll the user responds to actually exists
        const results = await db
            .selectDistinct({
                // poll metadata
                pollId: pollTable.id,
                // poll payload
                option3: pollTable.option3,
                option4: pollTable.option4,
                option5: pollTable.option5,
                option6: pollTable.option6,
            })
            .from(postTable)
            .innerJoin(pollTable, eq(postTable.id, pollTable.postId)) // this may lead to 0 values in case the post has no associated poll
            .where(eq(postTable.timestampedPresentationCID, response.postUid));
        if (results.length === 0) {
            throw httpErrors.notFound(
                "The post UID you tried to answer to does not exist or has no associated poll"
            );
        }
        if (results.length > 1) {
            throw httpErrors.internalServerError(
                "There are more than one poll corresponding to this UID"
            );
        }
        const result = results[0];
        if (response.optionChosen === 3 && result.option3 === null) {
            throw httpErrors.badRequest(
                `Option 3 does not exist in poll '${response.postUid}'`
            );
        }
        if (response.optionChosen === 4 && result.option4 === null) {
            throw httpErrors.badRequest(
                `Option 4 does not exist in poll '${response.postUid}'`
            );
        }
        if (response.optionChosen === 5 && result.option5 === null) {
            throw httpErrors.badRequest(
                `Option 5 does not exist in poll '${response.postUid}'`
            );
        }
        if (response.optionChosen === 6 && result.option6 === null) {
            throw httpErrors.badRequest(
                `Option 6 does not exist in poll '${response.postUid}'`
            );
        }
        const presentationCID = await toEncodedCID(presentation);
        const now = nowZeroMs();
        const timestampedPresentation = {
            timestamp: now.getTime(),
            presentation: presentation,
        }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
        const timestampedPresentationCID = await toEncodedCID(
            timestampedPresentation
        );
        return await db.transaction(async (tx) => {
            const authorId = await Service.selectOrInsertPseudonym({
                // we need to know if inserted or already existing - for below TODO
                tx: tx,
                postAs: postAs,
                pseudonym: pseudonym,
            });
            // in any case, insert the poll response in the dedicated table
            await tx.insert(pollResponseTable).values({
                presentation: presentation.toJSON(),
                presentationCID: presentationCID,
                timestampedPresentationCID: timestampedPresentationCID,
                authorId: authorId,
                pollId: result.pollId,
                optionChosen: response.optionChosen,
                createdAt: now,
                updatedAt: now,
            });
            // TODO: check if poll has already been responded by this pseudonym, if yes, update it by getting the previous response, delete the old one and add the new one
            // else, just add +1 to the chosen response
            let optionChosenResponseColumnName:
                | "option1Response"
                | "option2Response"
                | "option3Response"
                | "option4Response"
                | "option5Response"
                | "option6Response";
            let optionChosenResponseColumn:
                | typeof pollTable.option1Response
                | typeof pollTable.option2Response
                | typeof pollTable.option3Response
                | typeof pollTable.option4Response
                | typeof pollTable.option5Response
                | typeof pollTable.option6Response;
            switch (
                response.optionChosen // TODO Refactor by making it typesafe by default - this stinks
            ) {
                case 1:
                    optionChosenResponseColumnName = "option1Response";
                    optionChosenResponseColumn = pollTable.option1Response;
                    break;
                case 2:
                    optionChosenResponseColumnName = "option2Response";
                    optionChosenResponseColumn = pollTable.option2Response;
                    break;
                case 3:
                    optionChosenResponseColumnName = "option3Response";
                    optionChosenResponseColumn = pollTable.option3Response;
                    break;
                case 4:
                    optionChosenResponseColumnName = "option4Response";
                    optionChosenResponseColumn = pollTable.option4Response;
                    break;
                case 5:
                    optionChosenResponseColumnName = "option5Response";
                    optionChosenResponseColumn = pollTable.option5Response;
                    break;
                case 6:
                    optionChosenResponseColumnName = "option6Response";
                    optionChosenResponseColumn = pollTable.option6Response;
                    break;
                default:
                    throw httpErrors.badRequest(
                        "Option chosen must be an integer between 1 and 6 included"
                    );
            }
            await tx
                .update(pollTable)
                .set({
                    [optionChosenResponseColumnName]: sql`coalesce(${optionChosenResponseColumn}, 0) + 1`,
                    updatedAt: now,
                })
                .where(eq(pollTable.id, result.pollId));
            await tx
                .update(postTable)
                .set({
                    lastReactedAt: now,
                })
                .where(
                    eq(postTable.timestampedPresentationCID, response.postUid)
                );
            const { post } = await Service.fetchPostByUidOrSlugId({
                db,
                postUidOrSlugId: response.postUid,
                type: "postUid",
                httpErrors,
            });
            return post;
        });
    }

    static async hidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
        await db
            .update(postTable)
            .set({
                isHidden: true,
            })
            .where(eq(postTable.timestampedPresentationCID, pollUid));
    }

    static async unhidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
        await db
            .update(postTable)
            .set({
                isHidden: false,
            })
            .where(eq(postTable.timestampedPresentationCID, pollUid));
    }

    static async hideComment({
        db,
        commentSlugId,
    }: ModerateCommentProps): Promise<void> {
        await db
            .update(commentTable)
            .set({
                isHidden: true,
            })
            .where(eq(commentTable.slugId, commentSlugId));
    }

    static async unhideComment({
        db,
        commentSlugId,
    }: ModerateCommentProps): Promise<void> {
        await db
            .update(commentTable)
            .set({
                isHidden: false,
            })
            .where(eq(commentTable.slugId, commentSlugId));
    }

    static async createComment({
        db,
        pseudonym,
        postAs,
        presentation,
        payload,
        httpErrors,
    }: CreateCommentProps): Promise<PostUid> {
        // Check whether post the user responds to actually exists
        const results = await db
            .select({
                pollId: postTable.id,
            })
            .from(postTable)
            .where(eq(postTable.timestampedPresentationCID, payload.postUid));
        if (results.length === 0) {
            throw httpErrors.notFound(
                "The post UID you tried to answer to does not exist"
            );
        }
        if (results.length > 1) {
            throw httpErrors.internalServerError(
                "There are more than one post corresponding to this UID"
            );
        }
        const result = results[0];
        const presentationCID = await toEncodedCID(presentation);
        const now = nowZeroMs();
        const timestampedPresentation = {
            timestamp: now.getTime(),
            presentation: presentation,
        }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
        const timestampedPresentationCID = await toEncodedCID(
            timestampedPresentation
        );
        await db.transaction(async (tx) => {
            const authorId = await Service.selectOrInsertPseudonym({
                tx: tx,
                postAs: postAs,
                pseudonym: pseudonym,
            });
            await tx.insert(commentTable).values({
                presentation: presentation.toJSON(),
                presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
                timestampedPresentationCID: timestampedPresentationCID,
                slugId: generateRandomSlugId(),
                authorId: authorId,
                content: payload.content,
                postId: result.pollId,
                createdAt: now,
                updatedAt: now,
            });
            await tx
                .update(postTable)
                .set({
                    lastReactedAt: now,
                    commentCount: sql`coalesce(${postTable.commentCount}, 0) + 1`,
                })
                .where(eq(postTable.id, result.pollId));
        });
        return timestampedPresentationCID;
    }

    static async fetchCommentsByPostId({
        db,
        postId,
        order,
        showHidden,
        updatedAt,
        limit,
    }: FetchCommentsByPostIdProps): Promise<PostComment[]> {
        const actualLimit = limit === undefined ? 30 : limit;
        const whereUpdatedAt =
            updatedAt === undefined
                ? eq(commentTable.postId, postId)
                : order === "more"
                ? and(
                      eq(commentTable.postId, postId),
                      lt(commentTable.updatedAt, updatedAt)
                  )
                : and(
                      eq(commentTable.postId, postId),
                      gt(commentTable.updatedAt, updatedAt)
                  );
        const results = await db
            .selectDistinctOn([commentTable.updatedAt, commentTable.id], {
                // comment payload
                content: commentTable.content,
                // post as
                pseudonym: pseudonymTable.pseudonym,
                domain: personaTable.domain,
                // metadata
                commentUid: commentTable.timestampedPresentationCID,
                slugId: commentTable.slugId,
                isHidden: commentTable.isHidden,
                updatedAt: commentTable.updatedAt,
            })
            .from(commentTable)
            .innerJoin(
                pseudonymTable,
                eq(pseudonymTable.id, commentTable.authorId)
            )
            .innerJoin(
                personaTable,
                eq(personaTable.id, pseudonymTable.personaId)
            )
            .orderBy(asc(commentTable.updatedAt), desc(commentTable.id))
            .limit(actualLimit)
            .where(
                showHidden === true
                    ? whereUpdatedAt
                    : and(whereUpdatedAt, eq(commentTable.isHidden, false))
            );
        return results.map((result) => {
            return {
                metadata: {
                    uid: result.commentUid,
                    slugId: result.slugId,
                    isHidden: result.isHidden,
                    updatedAt: result.updatedAt,
                },
                content: result.content,
                author: {
                    pseudonym: result.pseudonym,
                    domain: result.domain,
                },
            };
        });
    }

    static async getPostIdFromSlugId({
        db,
        slugId,
        httpErrors,
    }: GetPostIdFromSlugIdProps): Promise<PostId> {
        const results = await db
            .select({ id: postTable.id })
            .from(postTable)
            .where(eq(postTable.slugId, slugId));
        if (results.length === 0) {
            throw httpErrors.notFound(
                `The post slug id ${slugId} does not exist`
            );
        }
        if (results.length > 1) {
            throw httpErrors.internalServerError(
                `There are more than one post corresponding to the slug id ${slugId}`
            );
        }
        return results[0].id;
    }
}
