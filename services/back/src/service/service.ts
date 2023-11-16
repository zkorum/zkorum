import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { and, eq, gt, inArray, isNotNull, isNull } from "drizzle-orm";
import {
    authAttemptTable,
    credentialEmailTable,
    credentialFormTable,
    credentialSecretTable,
    deviceTable,
    eligibilityTable,
    emailTable,
    personaTable,
    pollTable,
    pseudonymTable,
    studentEligibilityTable,
    studentPersonaTable,
    universityEligibilityTable,
    universityPersonaTable,
    userTable,
} from "../schema.js";
import {
    type AuthenticateRequestBody,
    type GetDeviceStatusResp,
    type IsLoggedInResponse,
    type VerifyOtp200,
    type EmailSecretCredentials,
    type UserCredentials,
} from "../dto.js";
import {
    codeToString,
    generateOneTimeCode,
    generateRandomHex,
    generateUUID,
} from "../crypto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import {
    Presentation,
    BBSPlusSecretKey as SecretKey,
} from "@docknetwork/crypto-wasm-ts";
import {
    buildEmailCredential,
    buildFormCredential,
    buildSecretCredential,
    parseSecretCredentialRequest,
    type PostAs,
    type WebDomainType,
} from "./credential.js";
import type {
    Devices,
    SecretCredentialRequest,
    FormCredentialRequest,
    EmailCredentialsPerEmail,
    EmailCredential,
    BlindedCredentialType,
    SecretCredentialType,
    SecretCredentialsPerType,
    Poll,
    FormCredentialsPerEmail,
    EmailFormCredentialsPerEmail,
    FormCredential,
    SecretCredentials,
} from "../shared/types/zod.js";
import { base64 } from "../shared/common/index.js";
import { anyToUint8Array } from "../shared/common/arrbufs.js";
import { BBSPlusBlindedCredentialRequest as BlindedCredentialRequest } from "@docknetwork/crypto-wasm-ts";
import { toEncodedCID } from "@/shared/common/cid.js";
import {
    UniversityType,
    essecCampusToString,
    essecProgramToString,
    universityTypeToString,
} from "@/shared/types/university.js";
import { type TCountryCode, countries as allCountries } from "countries-list";
import isEqual from "lodash/isEqual.js";

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

interface CreatePollProps {
    db: PostgresDatabase;
    presentation: Presentation;
    poll: Poll;
    pseudonym: string;
    postAs: PostAs;
}

interface VerifyOtpProps {
    db: PostgresDatabase;
    maxAttempt: number;
    didWrite: string;
    code: number;
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
    sk: SecretKey;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    httpErrors: HttpErrors;
}

interface CreateSecretCredentialsProps {
    db: PostgresDatabase;
    uid: string;
    userId: string;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    httpErrors: HttpErrors;
    sk: SecretKey;
}

interface CreateAndStoreSecretCredentialProps {
    db: PostgresDatabase;
    uid: string;
    userId: string;
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
    uid: string;
    sk: SecretKey;
}

interface CreateAndStoreFormCredentialProps {
    db: PostgresDatabase;
    email: string;
    formCredentialRequest: FormCredentialRequest;
    uid: string;
    sk: SecretKey;
}

interface AddCredentialProps {
    results: GetCredentialsResult[];
    credentialsPerEmail: EmailCredentialsPerEmail | FormCredentialsPerEmail;
}

interface SelectStudentPersonaIdFromAttributesProps {
    db: PostgresDatabase;
    campus: string | undefined;
    program: string | undefined;
    admissionYear: number | undefined;
}

interface SelectUniversityPersonaIdFromAttributesProps {
    db: PostgresDatabase;
    type: UniversityType;
    countries: string[] | undefined;
    studentPersonaId: number | undefined;
    alumPersonaId: number | undefined;
    facultyPersonaId: number | undefined;
}

interface SelectEligibilityIdProps {
    db: PostgresDatabase;
    domains: string[] | undefined; // for now users can only ask questions to people in their own community
    types: WebDomainType[] | undefined; // for now users can only ask questions to people in their own community
    universityEligibilityId: number | undefined;
}

interface SelectPersonaIdFromAttributesProps {
    db: PostgresDatabase;
    domain: string;
    type: WebDomainType;
    universityPersonaId: number | undefined;
}

interface SelectStudentEligibilityIdFromAttributesProps {
    db: PostgresDatabase;
    campuses: string[] | undefined;
    programs: string[] | undefined;
    admissionYears: number[] | undefined;
}

interface SelectUniversityEligibilityIdFromAttributesProps {
    db: PostgresDatabase;
    types: string[] | undefined;
    countries: string[] | undefined;
    studentEligibilityId: number | undefined;
    alumEligibilityId: number | undefined;
    facultyEligibilityId: number | undefined;
}

function addCredentials({ results, credentialsPerEmail }: AddCredentialProps) {
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

        const userId = await Service.getUserId(db, authenticateBody.email);
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

    static async getUserId(
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

    static async getDeviceStatus(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<GetDeviceStatusResp> {
        const now = new Date();
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
                isSyncing: false,
            };
        } else {
            return {
                userId: resultDevice[0].userId,
                isLoggedIn: resultDevice[0].sessionExpiry > now,
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
            if (!deviceStatus.isSyncing) {
                throw httpErrors.createError(409, "Conflict", {
                    reason: "awaiting_syncing",
                    userId: deviceStatus.userId,
                });
            } else if (deviceStatus.isLoggedIn) {
                const syncingDevices = await Service.getAllSyncingDidWrites(
                    db,
                    deviceStatus.userId
                );
                const { emailCredentialsPerEmail, formCredentialsPerEmail } =
                    await Service.getEmailFormCredentialsPerEmailFromUserId(
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
                    encryptedSymmKey: deviceStatus.encryptedSymmKey,
                    syncingDevices: syncingDevices,
                    emailCredentialsPerEmail: emailCredentialsPerEmail,
                    formCredentialsPerEmail: formCredentialsPerEmail,
                    secretCredentialsPerType: secretCredentialsPerType,
                });
            }
        }
        return deviceStatus;
    }

    static async isLoggedIn(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<IsLoggedInResponse> {
        const now = new Date();
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
        return await db
            .update(authAttemptTable)
            .set({
                guessAttemptAmount: attemptAmount,
                updatedAt: new Date(),
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
        const now = new Date();
        if (resultOtp[0].codeExpiry <= now) {
            return { success: false, reason: "expired_code" };
        } else if (resultOtp[0].code === code) {
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
                        emailCredentialsPerEmail,
                        secretCredentialsPerType,
                    } = await Service.register({
                        db,
                        didWrite,
                        encryptedSymmKey,
                        sk,
                        unboundSecretCredentialRequest,
                        timeboundSecretCredentialRequest,
                        httpErrors,
                    });
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        encryptedSymmKey: encryptedSymmKey,
                        syncingDevices: [didWrite],
                        emailCredentialsPerEmail: emailCredentialsPerEmail,
                        formCredentialsPerEmail: {},
                        secretCredentialsPerType: secretCredentialsPerType,
                    };
                }
                case "login_known_device": {
                    // device is not awaiting syncing and is not already logged-in, otherwise throwIfAwaitingSyncingOrLoggedIn would have thrown already
                    const existingEncryptedSymmKey =
                        await Service.getEncryptedSymmKey(db, didWrite);
                    if (existingEncryptedSymmKey !== undefined) {
                        // this check is unecessary because device is not awaiting syncing, but we keep it as a safety net in case someone accidentally removes the throws protection
                        await Service.login(db, didWrite);
                    }
                    const syncingDevices = await Service.getAllSyncingDidWrites(
                        db,
                        resultOtp[0].userId
                    );
                    const {
                        emailCredentialsPerEmail,
                        formCredentialsPerEmail,
                    } = await Service.getEmailFormCredentialsPerEmailFromUserId(
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
                        encryptedSymmKey: existingEncryptedSymmKey,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: emailCredentialsPerEmail,
                        formCredentialsPerEmail: formCredentialsPerEmail,
                        secretCredentialsPerType: secretCredentialsPerType,
                    };
                }
                case "login_new_device": {
                    await Service.awaitSyncingNewDevice(db, didWrite);
                    const syncingDevices = await Service.getAllSyncingDidWrites(
                        db,
                        resultOtp[0].userId
                    );
                    return {
                        success: true,
                        userId: resultOtp[0].userId,
                        syncingDevices: syncingDevices,
                        emailCredentialsPerEmail: {}, // user already have an email credential, but this will be unused. We don't want to send the credentials before the device has been confirmed
                        formCredentialsPerEmail: {}, // user may actually have already filled credentials, but this will be unused. We don't want to send the credentials before the device has been confirmed
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
        const now = new Date();
        await db
            .update(authAttemptTable)
            .set({
                codeExpiry: now,
                updatedAt: now,
            })
            .where(eq(authAttemptTable.didWrite, didWrite));
    }

    static async getAllSyncingDidWrites(
        db: PostgresDatabase,
        userId: string
    ): Promise<Devices> {
        const results = await db
            .select({ didWrite: deviceTable.didWrite })
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
            return results.map((result) => result.didWrite);
        }
    }

    static async hasFilledForms(
        db: PostgresDatabase,
        email: string
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(credentialFormTable)
            .where(
                and(
                    eq(credentialFormTable.email, email),
                    eq(credentialFormTable.isRevoked, false)
                )
            );
        if (result.length > 0) {
            return true;
        } else {
            return false;
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

    static async authenticateAttempt(
        db: PostgresDatabase,
        type: AuthenticateType,
        authenticateRequestBody: AuthenticateRequestBody,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        const now = new Date();
        const resultHasAttempted = await db
            .select({
                codeExpiry: authAttemptTable.codeExpiry,
                lastEmailSentAt: authAttemptTable.lastEmailSentAt,
            })
            .from(authAttemptTable)
            .where(eq(authAttemptTable.didWrite, didWrite));
        if (resultHasAttempted.length === 0) {
            // this is a first attempt, generate new code, insert data and send email in one transaction
            return await this.insertAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
        } else if (authenticateRequestBody.isRequestingNewCode) {
            // if user wants to regenerate new code, do it (if possible according to throttling rules)
            return await this.updateAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
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
            return await this.updateAuthAttemptCode(
                db,
                type,
                userId,
                minutesBeforeCodeExpiry,
                didWrite,
                now,
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors
            );
        }
    }

    static async insertAuthAttemptCode(
        db: PostgresDatabase,
        type: AuthenticateType,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        now: Date,
        authenticateRequestBody: AuthenticateRequestBody,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            minutesBeforeCodeExpiry,
            httpErrors
        );
        const oneTimeCode = generateOneTimeCode();
        const codeExpiry = new Date(now);
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        // TODO: transaction to actually send the email + update DB && remove the logging below!
        // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists
        console.log("\n\nCode:", codeToString(oneTimeCode), codeExpiry, "\n\n");
        await db.insert(authAttemptTable).values({
            didWrite: didWrite,
            type: type,
            email: authenticateRequestBody.email,
            userId: userId,
            didExchange: authenticateRequestBody.didExchange,
            code: oneTimeCode,
            codeExpiry: codeExpiry,
            lastEmailSentAt: now,
        });
        const nextCodeSoonestTime = new Date();
        nextCodeSoonestTime.setTime(now.getTime());
        nextCodeSoonestTime.setMinutes(
            nextCodeSoonestTime.getMinutes() + throttleMinutesInterval
        );
        return {
            codeExpiry: codeExpiry,
            nextCodeSoonestTime: nextCodeSoonestTime,
        };
    }

    static async updateAuthAttemptCode(
        db: PostgresDatabase,
        type: AuthenticateType,
        userId: string,
        minutesBeforeCodeExpiry: number,
        didWrite: string,
        now: Date,
        authenticateRequestBody: AuthenticateRequestBody,
        throttleMinutesInterval: number,
        httpErrors: HttpErrors
    ): Promise<AuthenticateOtp> {
        await Service.throttleByEmail(
            db,
            authenticateRequestBody.email,
            throttleMinutesInterval,
            minutesBeforeCodeExpiry,
            httpErrors
        );
        const oneTimeCode = generateOneTimeCode();
        const codeExpiry = new Date(now);
        codeExpiry.setMinutes(
            codeExpiry.getMinutes() + minutesBeforeCodeExpiry
        );
        // TODO: transaction to actually send the email + update DB && remove the logging below!
        // TODO: verify if email does exist and is reachable to avoid bounce. Use: https://github.com/reacherhq/check-if-email-exists
        console.log("\n\nCode:", codeToString(oneTimeCode), codeExpiry, "\n\n");
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
        const nextCodeSoonestTime = new Date();
        nextCodeSoonestTime.setTime(now.getTime());
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
        unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest,
        httpErrors,
    }: RegisterProps): Promise<EmailSecretCredentials> {
        const uid = generateRandomHex();
        const now = new Date();
        const in1000years = new Date();
        in1000years.setFullYear(in1000years.getFullYear() + 1000);
        return await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    email: authAttemptTable.email,
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
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
            await tx
                .insert(userTable)
                .values({ uid: uid, id: authAttemptResult[0].userId });
            await tx.insert(deviceTable).values({
                userId: authAttemptResult[0].userId,
                didWrite: didWrite,
                didExchange: authAttemptResult[0].didExchange,
                encryptedSymmKey: encryptedSymmKey,
                sessionExpiry: in1000years,
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
                    sk: sk,
                    uid: uid,
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
                    unboundSecretCredentialRequest,
                    timeboundSecretCredentialRequest,
                    httpErrors,
                    sk,
                });
            return { emailCredentialsPerEmail, secretCredentialsPerType };
        });
    }

    // ! WARN we assume the OTP was verified for login new device at this point
    static async awaitSyncingNewDevice(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        await db.transaction(async (tx) => {
            const authAttemptResult = await tx
                .select({
                    userId: authAttemptTable.userId,
                    didExchange: authAttemptTable.didExchange,
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
                // it's a new device - so no encryption key. Users must manually accept syncing from an existing syncing device. This is necessary because symmetric keys are only known client-side, and it is a protection against an attacker that would have access to the user's email address. Even in such situation, the attacker will not be able to get access to the user's credentials and secrets unless the attacker has also access to one of the user's existing syncing device - or unless the attacker successfully phishes the user into accepting syncing with the attacker's device.
                didExchange: authAttemptResult[0].didExchange,
                sessionExpiry: now,
            });
        });
    }

    // ! WARN we assume the OTP was verified and the device is already syncing
    static async login(db: PostgresDatabase, didWrite: string) {
        const now = new Date();
        const in1000years = new Date();
        in1000years.setFullYear(in1000years.getFullYear() + 1000);
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
                    sessionExpiry: in1000years,
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
        // now - 3 minutes if minutesInterval == 3
        const minutesIntervalAgo = new Date();
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
        const now = new Date();
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

    static async getFormCredentialsPerEmailFromDidWrite(
        db: PostgresDatabase,
        didWrite: string
    ): Promise<FormCredentialsPerEmail> {
        const emails = await Service.getEmailsFromDidWrite(db, didWrite);
        return await Service.getFormCredentialsPerEmail(db, emails);
    }

    static async getEmailFormCredentialsPerEmailFromUserId(
        db: PostgresDatabase,
        userId: string
    ): Promise<EmailFormCredentialsPerEmail> {
        const emails = await Service.getEmailsFromUserId(db, userId);
        return await Service.getEmailFormCredentialsPerEmail(db, emails);
    }

    static async getFormCredentialsPerEmail(
        db: PostgresDatabase,
        emails: string[]
    ): Promise<FormCredentialsPerEmail> {
        const formCredentials: FormCredentialsPerEmail = {};
        const results = await db
            .select({
                email: credentialFormTable.email,
                credential: credentialFormTable.credential,
                isRevoked: credentialFormTable.isRevoked,
            })
            .from(credentialFormTable)
            .where(inArray(credentialFormTable.email, emails));
        if (results.length === 0) {
            return {};
        } else {
            addCredentials({
                results: results,
                credentialsPerEmail: formCredentials,
            });
            return formCredentials;
        }
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
            .where(inArray(credentialEmailTable.email, emails));
        if (results.length === 0) {
            return {};
        } else {
            addCredentials({
                results: results,
                credentialsPerEmail: emailCredentials,
            });
            return emailCredentials;
        }
    }

    static async getEmailFormCredentialsPerEmail(
        db: PostgresDatabase,
        emails: string[]
    ): Promise<EmailFormCredentialsPerEmail> {
        const emailCredentialsPerEmail =
            await Service.getEmailCredentialsPerEmail(db, emails);
        const formCredentialsPerEmail =
            await Service.getFormCredentialsPerEmail(db, emails);
        return { emailCredentialsPerEmail, formCredentialsPerEmail };
    }

    static async createAndStoreEmailCredential({
        db,
        email,
        uid,
        sk,
    }: CreateAndStoreEmailCredentialsProps): Promise<EmailCredential> {
        const credential = buildEmailCredential({ email, uid, sk });
        const encodedCredential = base64.encode(
            anyToUint8Array(credential.toJSON())
        );
        await db.insert(credentialEmailTable).values({
            email: email,
            isRevoked: false,
            credential: credential.toJSON(),
        });
        return encodedCredential;
    }

    static async createAndStoreFormCredential({
        db,
        email,
        formCredentialRequest,
        uid,
        sk,
    }: CreateAndStoreFormCredentialProps): Promise<FormCredential> {
        const credential = buildFormCredential({
            email,
            formCredentialRequest,
            sk,
            uid,
        });
        const encodedCredential = base64.encode(
            anyToUint8Array(credential.toJSON())
        );
        await db.insert(credentialFormTable).values({
            email: email,
            isRevoked: false,
            credential: credential.toJSON(),
        });
        return encodedCredential;
    }

    static async createAndStoreSecretCredentials({
        db,
        unboundSecretCredentialRequest,
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
        uid,
        userId,
        httpErrors,
        sk,
    }: CreateAndStoreSecretCredentialProps): Promise<BlindedCredentialType> {
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
        });
        const encodedCredential = base64.encode(
            anyToUint8Array(credential.toJSON())
        );
        await db.insert(credentialSecretTable).values({
            userId: userId,
            type: type,
            isRevoked: false,
            credential: credential.toJSON(),
            encryptedBlinding: secretCredentialRequest.encryptedEncodedBlinding,
            encryptedBlindedSubject:
                secretCredentialRequest.encryptedEncodedBlindedSubject,
        });
        return encodedCredential;
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
        const { emailCredentialsPerEmail, formCredentialsPerEmail } =
            await Service.getEmailFormCredentialsPerEmailFromUserId(db, userId);
        const secretCredentialsPerType =
            await Service.getSecretCredentialsPerType(db, userId);
        return {
            emailCredentialsPerEmail: emailCredentialsPerEmail,
            formCredentialsPerEmail: formCredentialsPerEmail,
            secretCredentialsPerType: secretCredentialsPerType,
        };
    }

    static async selectStudentEligibilityIdFromAttributes({
        db,
        campuses,
        programs,
        admissionYears,
    }: SelectStudentEligibilityIdFromAttributesProps): Promise<
        number | undefined
    > {
        const campusesWhere =
            campuses === undefined
                ? isNull(studentEligibilityTable.campuses)
                : eq(studentEligibilityTable.campuses, campuses);
        const programWhere =
            programs === undefined
                ? isNull(studentEligibilityTable.programs)
                : eq(studentEligibilityTable.programs, programs);
        const admissionYearsWhere =
            admissionYears === undefined
                ? isNull(studentEligibilityTable.admissionYears)
                : eq(studentEligibilityTable.admissionYears, admissionYears);

        const results = await db
            .select({
                studentEligibilityId: studentEligibilityTable.id,
            })
            .from(studentEligibilityTable)
            .where(and(campusesWhere, programWhere, admissionYearsWhere));
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].studentEligibilityId;
        }
    }

    static async selectStudentPersonaIdFromAttributes({
        db,
        campus,
        program,
        admissionYear,
    }: SelectStudentPersonaIdFromAttributesProps): Promise<number | undefined> {
        const campusWhere =
            campus === undefined
                ? isNull(studentPersonaTable.campus)
                : eq(studentPersonaTable.campus, campus);
        const programWhere =
            program === undefined
                ? isNull(studentPersonaTable.program)
                : eq(studentPersonaTable.program, program);
        const admissionYearWhere =
            admissionYear === undefined
                ? isNull(studentPersonaTable.admissionYear)
                : eq(studentPersonaTable.admissionYear, admissionYear);

        const results = await db
            .select({
                studentPersonaId: studentPersonaTable.id,
            })
            .from(studentPersonaTable)
            .where(and(campusWhere, programWhere, admissionYearWhere));
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].studentPersonaId;
        }
    }

    static async selectUniversityEligibilityIdFromAttributes({
        db,
        types,
        countries,
        studentEligibilityId,
        alumEligibilityId,
        facultyEligibilityId,
    }: SelectUniversityEligibilityIdFromAttributesProps): Promise<
        number | undefined
    > {
        const typesWhere =
            types === undefined
                ? isNull(universityEligibilityTable.types)
                : eq(universityEligibilityTable.types, types);
        const countriesWhere =
            countries === undefined
                ? isNull(universityEligibilityTable.countries)
                : eq(universityEligibilityTable.countries, countries);
        const studentEligibilityIdWhere =
            studentEligibilityId === undefined
                ? isNull(universityEligibilityTable.studentEligibilityId)
                : eq(
                      universityEligibilityTable.studentEligibilityId,
                      studentEligibilityId
                  );
        const alumEligibilityIdWhere =
            alumEligibilityId === undefined
                ? isNull(universityEligibilityTable.alumEligibilityId)
                : eq(
                      universityEligibilityTable.alumEligibilityId,
                      alumEligibilityId
                  );
        const facultyEligibilityIdWhere =
            facultyEligibilityId === undefined
                ? isNull(universityEligibilityTable.facultyEligibilityId)
                : eq(
                      universityEligibilityTable.facultyEligibilityId,
                      facultyEligibilityId
                  );

        const results = await db
            .select({
                universityEligibilityId: universityEligibilityTable.id,
            })
            .from(universityEligibilityTable)
            .where(
                and(
                    typesWhere,
                    countriesWhere,
                    studentEligibilityIdWhere,
                    alumEligibilityIdWhere,
                    facultyEligibilityIdWhere
                )
            );
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].universityEligibilityId;
        }
    }

    static async selectUniversityPersonaIdFromAttributes({
        db,
        type,
        countries,
        studentPersonaId,
        alumPersonaId,
        facultyPersonaId,
    }: SelectUniversityPersonaIdFromAttributesProps): Promise<
        number | undefined
    > {
        const typeStr = universityTypeToString(type);
        const countriesWhere =
            countries === undefined
                ? isNull(universityPersonaTable.countries)
                : eq(universityPersonaTable.countries, countries);
        const studentPersonaIdWhere =
            studentPersonaId === undefined
                ? isNull(universityPersonaTable.studentPersonaId)
                : eq(universityPersonaTable.studentPersonaId, studentPersonaId);
        const alumPersonaIdWhere =
            alumPersonaId === undefined
                ? isNull(universityPersonaTable.alumPersonaId)
                : eq(universityPersonaTable.alumPersonaId, alumPersonaId);
        const facultyPersonaIdWhere =
            facultyPersonaId === undefined
                ? isNull(universityPersonaTable.facultyPersonaId)
                : eq(universityPersonaTable.facultyPersonaId, facultyPersonaId);

        const results = await db
            .select({
                universityPersonaId: universityPersonaTable.id,
            })
            .from(universityPersonaTable)
            .where(
                and(
                    eq(universityPersonaTable.type, typeStr),
                    countriesWhere,
                    studentPersonaIdWhere,
                    alumPersonaIdWhere,
                    facultyPersonaIdWhere
                )
            );
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].universityPersonaId;
        }
    }

    static async selectEligibilityId({
        db,
        domains,
        types,
        universityEligibilityId,
    }: SelectEligibilityIdProps): Promise<number | undefined> {
        const domainsWhere =
            domains === undefined
                ? isNull(eligibilityTable.domains)
                : eq(eligibilityTable.domains, domains);
        const typesWhere =
            types === undefined
                ? isNull(eligibilityTable.types)
                : eq(eligibilityTable.types, types);
        const universityEligibilityIdWhere =
            universityEligibilityId === undefined
                ? isNull(eligibilityTable.universityEligibilityId)
                : eq(
                      eligibilityTable.universityEligibilityId,
                      universityEligibilityId
                  );
        const results = await db
            .select({
                eligibilityId: eligibilityTable.id,
            })
            .from(eligibilityTable)
            .where(and(domainsWhere, typesWhere, universityEligibilityIdWhere));
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].eligibilityId;
        }
    }

    static async selectPersonaIdFromAttributes({
        db,
        domain,
        type,
        universityPersonaId,
    }: SelectPersonaIdFromAttributesProps): Promise<number | undefined> {
        const universityPersonaIdWhere =
            universityPersonaId === undefined
                ? isNull(personaTable.universityPersonaId)
                : eq(personaTable.universityPersonaId, universityPersonaId);
        const results = await db
            .select({
                personaId: personaTable.id,
            })
            .from(personaTable)
            .where(
                and(
                    eq(personaTable.domain, domain),
                    eq(personaTable.type, type),
                    universityPersonaIdWhere
                )
            );
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].personaId;
        }
    }

    static async createPoll({
        db,
        presentation,
        poll,
        pseudonym,
        postAs,
    }: CreatePollProps): Promise<string> {
        const now = new Date();
        const timestampedPresentation = {
            timestamp: now.getTime(),
            presentation: presentation,
        }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
        const timestampedPresentationCID = await toEncodedCID(
            timestampedPresentation
        );
        const optionalOptions = [
            poll.option3,
            poll.option4,
            poll.option5,
            poll.option6,
        ];
        const realOptionalOptions: string[] = optionalOptions.filter(
            (option) => option !== undefined && option !== ""
        ) as string[];

        // TODO try select persona first, if exists just use that ID - or maybe add constraints in operational DB + add onConflictDoNothing
        // TODO try to select pseudonym first, if exists verifies that it matches with persona, else log warning and update
        // TODO try to select eligibility first, if exists just use that ID or maybe add constraints in operational DB + add onConflictDoNothing
        await db.transaction(async (tx) => {
            ////////////// PERSONA - POST AS ///////////
            let universityPersonaId: number | undefined = undefined;
            let personaId: number | undefined = undefined;
            // TODO: switch case depending on value of postAs.type - here we only do work for universities
            if (postAs.typeSpecific !== undefined) {
                let studentPersonaId: number | undefined = undefined;
                let alumPersonaId: number | undefined = undefined;
                let facultyPersonaId: number | undefined = undefined;
                switch (postAs.typeSpecific.type) {
                    case UniversityType.STUDENT:
                        if (
                            postAs.typeSpecific.campus !== undefined ||
                            postAs.typeSpecific.program !== undefined ||
                            postAs.typeSpecific.admissionYear !== undefined
                        ) {
                            const selectedStudentPersonaId: number | undefined =
                                await Service.selectStudentPersonaIdFromAttributes(
                                    {
                                        db: tx,
                                        campus:
                                            postAs.typeSpecific.campus !==
                                            undefined
                                                ? essecCampusToString(
                                                      postAs.typeSpecific.campus
                                                  )
                                                : undefined,
                                        program:
                                            postAs.typeSpecific.program !==
                                            undefined
                                                ? essecProgramToString(
                                                      postAs.typeSpecific
                                                          .program
                                                  )
                                                : undefined,
                                        admissionYear:
                                            postAs.typeSpecific
                                                .admissionYear !== undefined
                                                ? postAs.typeSpecific
                                                      .admissionYear
                                                : undefined,
                                    }
                                );
                            if (selectedStudentPersonaId === undefined) {
                                const insertedStudentPersona = await tx
                                    .insert(studentPersonaTable)
                                    .values({
                                        campus:
                                            postAs.typeSpecific.campus !==
                                            undefined
                                                ? essecCampusToString(
                                                      postAs.typeSpecific.campus
                                                  )
                                                : undefined,
                                        program:
                                            postAs.typeSpecific.program !==
                                            undefined
                                                ? essecProgramToString(
                                                      postAs.typeSpecific
                                                          .program
                                                  )
                                                : undefined,
                                        admissionYear:
                                            postAs.typeSpecific
                                                .admissionYear !== undefined
                                                ? postAs.typeSpecific
                                                      .admissionYear
                                                : undefined,
                                    })
                                    .returning({
                                        insertedId: studentPersonaTable.id,
                                    });
                                studentPersonaId =
                                    insertedStudentPersona[0].insertedId;
                            } else {
                                studentPersonaId = selectedStudentPersonaId;
                            }
                        }
                        break;
                    case UniversityType.ALUM:
                        // TODO
                        break;
                    case UniversityType.FACULTY:
                        // TODO
                        break;
                }
                let personaCountries = undefined;
                if (postAs.typeSpecific.countries) {
                    const postAsCountries = postAs.typeSpecific.countries;
                    personaCountries = Object.keys(
                        postAs.typeSpecific.countries
                    ).filter(
                        (countryCode) =>
                            postAsCountries[countryCode as TCountryCode] ===
                            true
                    );
                }
                const selectedUniversityPersonaId: number | undefined =
                    await Service.selectUniversityPersonaIdFromAttributes({
                        db: tx,
                        type: postAs.typeSpecific.type,
                        countries: personaCountries,
                        studentPersonaId: studentPersonaId,
                        alumPersonaId: alumPersonaId,
                        facultyPersonaId: facultyPersonaId,
                    });

                if (selectedUniversityPersonaId === undefined) {
                    const insertedUniversityPersona = await tx
                        .insert(universityPersonaTable)
                        .values({
                            type: universityTypeToString(
                                postAs.typeSpecific.type
                            ),
                            countries: personaCountries,
                            studentPersonaId: studentPersonaId,
                            alumPersonaId: alumPersonaId,
                            facultyPersonaId: facultyPersonaId,
                        })
                        .returning({ insertedId: personaTable.id });
                    universityPersonaId =
                        insertedUniversityPersona[0].insertedId;
                } else {
                    universityPersonaId = selectedUniversityPersonaId;
                }
            }
            const selectedPersonaId: number | undefined =
                await Service.selectPersonaIdFromAttributes({
                    db: tx,
                    domain: postAs.domain,
                    type: postAs.type,
                    universityPersonaId: universityPersonaId,
                });
            if (selectedPersonaId === undefined) {
                const insertedPersona = await tx
                    .insert(personaTable)
                    .values({
                        domain: postAs.domain,
                        type: postAs.type,
                        universityPersonaId: universityPersonaId,
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
                .returning({ insertedId: pseudonymTable.id })
                .onConflictDoNothing({
                    target: pseudonymTable.pseudonym,
                })
                .onConflictDoUpdate({
                    target: pseudonymTable.personaId,
                    set: { personaId: personaId, updatedAt: now },
                }); // TODO: how to log a warning when that happen?, it should not!
            /////////////////////////////////////////////////////////////////////////////////////////

            //////////////////////// ELIGIBILITY ///////////////////////////////////////////////////
            let eligibilityId: number | undefined = undefined;
            let universityEligibilityId: number | undefined = undefined;
            let eligibilityTypes: string[] = [];
            let eligibilityCountries: TCountryCode[] = [];
            let studentEligibilityId: number | undefined = undefined;
            let alumEligibilityId: number | undefined = undefined;
            let facultyEligibilityId: number | undefined = undefined;
            if (poll.eligibility !== undefined) {
                if (
                    poll.eligibility.countries !== undefined &&
                    poll.eligibility.countries.length == 1
                ) {
                    if (isEqual(poll.eligibility.countries, ["FR"])) {
                        eligibilityCountries = ["FR"];
                    } else {
                        const allCountriesButFrance = Object.keys(
                            allCountries
                        ).filter((country) => country !== "FR");
                        eligibilityCountries =
                            allCountriesButFrance as TCountryCode[];
                    }
                }
                if (poll.eligibility.student !== undefined) {
                    eligibilityTypes.push(
                        universityTypeToString(UniversityType.STUDENT)
                    );
                    if (
                        (poll.eligibility.admissionYears !== undefined &&
                            poll.eligibility.admissionYears.length > 0) ||
                        (poll.eligibility.campuses !== undefined &&
                            poll.eligibility.campuses.length > 0) ||
                        (poll.eligibility.programs !== undefined &&
                            poll.eligibility.programs.length > 0)
                    ) {
                        const selectedStudentEligibilityId: number | undefined =
                            await Service.selectStudentEligibilityIdFromAttributes(
                                {
                                    db: tx,
                                    campuses:
                                        poll.eligibility.campuses !== undefined
                                            ? poll.eligibility.campuses.map(
                                                  (campus) =>
                                                      essecCampusToString(
                                                          campus
                                                      )
                                              )
                                            : undefined,
                                    programs:
                                        poll.eligibility.programs !== undefined
                                            ? poll.eligibility.programs.map(
                                                  (program) =>
                                                      essecProgramToString(
                                                          program
                                                      )
                                              )
                                            : undefined,
                                    admissionYears:
                                        poll.eligibility.admissionYears !==
                                        undefined
                                            ? poll.eligibility.admissionYears
                                            : undefined,
                                }
                            );
                        if (selectedStudentEligibilityId === undefined) {
                            const insertedStudentEligibility = await tx // maybe one day there might no eligibility at all, meaning anyone from ZKorum can respond
                                .insert(studentEligibilityTable)
                                .values({
                                    campuses:
                                        poll.eligibility.campuses !== undefined
                                            ? poll.eligibility.campuses.map(
                                                  (campus) =>
                                                      essecCampusToString(
                                                          campus
                                                      )
                                              )
                                            : undefined,
                                    programs:
                                        poll.eligibility.programs !== undefined
                                            ? poll.eligibility.programs.map(
                                                  (program) =>
                                                      essecProgramToString(
                                                          program
                                                      )
                                              )
                                            : undefined,
                                    admissionYears:
                                        poll.eligibility.admissionYears !==
                                        undefined
                                            ? poll.eligibility.admissionYears
                                            : undefined,
                                })
                                .returning({ insertedId: eligibilityTable.id });
                            studentEligibilityId =
                                insertedStudentEligibility[0].insertedId;
                        } else {
                            studentEligibilityId = selectedStudentEligibilityId;
                        }
                    }
                    if (poll.eligibility.alum !== undefined) {
                        eligibilityTypes.push(
                            universityTypeToString(UniversityType.ALUM)
                        );
                        // TODO ALUM info
                    }
                    if (poll.eligibility.faculty !== undefined) {
                        eligibilityTypes.push(
                            universityTypeToString(UniversityType.FACULTY)
                        );
                    }
                    // TODO FACULTY info
                }
            }
            if (
                eligibilityTypes.length !== 0 ||
                eligibilityCountries.length !== 0
            ) {
                const selectedUniversityEligibilityId: number | undefined =
                    await Service.selectUniversityEligibilityIdFromAttributes({
                        db: tx,
                        types:
                            eligibilityTypes.length !== 0
                                ? eligibilityTypes
                                : undefined,
                        countries:
                            eligibilityCountries.length !== 0
                                ? eligibilityCountries
                                : undefined,
                        studentEligibilityId: studentEligibilityId,
                        alumEligibilityId: alumEligibilityId,
                        facultyEligibilityId: facultyEligibilityId,
                    });
                if (selectedUniversityEligibilityId === undefined) {
                    const insertedUniversityEligibility = await tx
                        .insert(universityEligibilityTable)
                        .values({
                            types:
                                eligibilityTypes.length !== 0
                                    ? eligibilityTypes
                                    : undefined,
                            countries:
                                eligibilityCountries.length !== 0
                                    ? eligibilityCountries
                                    : undefined,
                            studentEligibilityId: studentEligibilityId,
                            alumEligibilityId: alumEligibilityId,
                            facultyEligibilityId: facultyEligibilityId,
                        })
                        .returning({
                            insertedId: universityEligibilityTable.id,
                        });
                    universityEligibilityId =
                        insertedUniversityEligibility[0].insertedId;
                } else {
                    universityEligibilityId = selectedUniversityEligibilityId;
                }
            }
            const selectedEligibilityId: number | undefined =
                await Service.selectEligibilityId({
                    db: tx,
                    domains: [postAs.domain], // for now users can only ask questions to people in their own community
                    types: [postAs.type], // for now users can only ask questions to people in their own community
                    universityEligibilityId: universityEligibilityId,
                });
            if (selectedEligibilityId === undefined) {
                const insertedEligibility = await tx // maybe one day there might no eligibility at all, meaning anyone from ZKorum can respond
                    .insert(eligibilityTable)
                    .values({
                        domains: [postAs.domain], // for now users can only ask questions to people in their own community
                        types: [postAs.type], // for now users can only ask questions to people in their own community
                        universityEligibilityId: universityEligibilityId,
                    })
                    .returning({ insertedId: eligibilityTable.id });
                eligibilityId = insertedEligibility[0].insertedId;
            } else {
                eligibilityId = selectedEligibilityId;
            }

            /////////////////////////////////////////////////////////////////////////////////////////

            await tx.insert(pollTable).values({
                presentation: presentation.toJSON(),
                timestampedPresentationCID: timestampedPresentationCID,
                question: poll.question,
                option1: poll.option1,
                option2: poll.option2,
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
                authorId: insertedAuthor[0].insertedId,
                eligibilityId: eligibilityId,
            });
        });
        // TODO: broadcast timestampedPresentation to Nostr or custom libp2p node
        return timestampedPresentationCID;
    }
}
// id: uuid("id").primaryKey(),
// presentation: jsonb("presentation").$type<object>().notNull(), // verifiable presentation as received
// // TODO add the other fields - maybe create tables for author, postAs, eligibility and pollContent
// timestampedPresentationCID: char("time_pres_cid", { length: 61 }) // see shared/test/common/cid.test.ts for length
//     .notNull()
//     .unique(), // CID calculated from stringified object representing pres+created_at.
// authorId: uuid("author_id") // "postAs"
//     .notNull()
//     .references(() => pseudonymTable.id), // the author of the poll
// eligibilityId: uuid("eligibility_id")
//     .notNull()
//     .references(() => eligibilityTable.id),
// question: varchar("question", { length: MAX_LENGTH_QUESTION }).notNull(),
// option1: varchar("option1", { length: MAX_LENGTH_OPTION }).notNull(),
// option2: varchar("option2", { length: MAX_LENGTH_OPTION }).notNull(),
// option3: varchar("option3", { length: MAX_LENGTH_OPTION }),
// option4: varchar("option4", { length: MAX_LENGTH_OPTION }),
// option5: varchar("option5", { length: MAX_LENGTH_OPTION }),
// option6: varchar("option6", { length: MAX_LENGTH_OPTION }),
// createdAt: timestamp("created_at").defaultNow().notNull(),
// updatedAt: timestamp("updated_at").defaultNow().notNull(),
