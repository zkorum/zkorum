import { Environment } from "@/app.js";
import { toEncodedCID } from "@/shared/common/cid.js";
import { domainFromEmail, toUnionUndefined } from "@/shared/shared.js";
import {
    essecCampusStrToEnum,
    essecCampusToString,
    essecProgramStrToEnum,
    essecProgramToString,
} from "@/shared/types/university.js";
import sesClientModule from "@aws-sdk/client-ses";
import {
    BBSPlusCredential as Credential,
    BBSPlusBlindedCredentialRequest as BlindedCredentialRequest,
    Presentation,
    BBSPlusSecretKey as SecretKey,
} from "@docknetwork/crypto-wasm-ts";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { countries as allCountries, type TCountryCode } from "countries-list";
import {
    and,
    desc,
    eq,
    gt,
    inArray,
    isNotNull,
    isNull,
    lt,
    sql,
    type TablesRelationalConfig,
} from "drizzle-orm";
import type { PgTransaction, QueryResultHKT } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import isEqual from "lodash/isEqual.js";
import nodemailer from "nodemailer";
import {
    codeToString,
    generateOneTimeCode,
    generateRandomSlugId,
    generateRandomHex,
    generateUUID,
} from "../crypto.js";
import {
    type AuthenticateRequestBody,
    type EmailSecretCredentials,
    type GetDeviceStatusResp,
    type IsLoggedInResponse,
    type UserCredentials,
    type VerifyOtp200,
} from "@/shared/types/dto.js";
import {
    alumEligibilityTable,
    alumPersonaTable,
    authAttemptTable,
    commentTable,
    credentialEmailTable,
    credentialFormTable,
    credentialSecretTable,
    deviceTable,
    eligibilityTable,
    emailTable,
    facultyEligibilityTable,
    facultyPersonaTable,
    personaTable,
    pollResponseTable,
    pollTable,
    pseudonymTable,
    studentEligibilityTable,
    studentPersonaTable,
    universityEligibilityTable,
    universityPersonaTable,
    userTable,
} from "../schema.js";
import { anyToUint8Array } from "../shared/common/arrbufs.js";
import { base64 } from "../shared/common/index.js";
import {
    zoduniversityType,
    type BlindedCredentialType,
    type Devices,
    type Eligibilities,
    type EmailCredential,
    type EmailCredentialsPerEmail,
    type EmailFormCredentialsPerEmail,
    type ExtendedPollData,
    type FormCredential,
    type FormCredentialRequest,
    type FormCredentialsPerEmail,
    type Poll,
    type PollUid,
    type ResponseToPollPayload,
    type SecretCredentialRequest,
    type SecretCredentialType,
    type SecretCredentials,
    type SecretCredentialsPerType,
    type UniversityType,
    type WebDomainType,
    type CreateCommentPayload,
    type PostSlugId,
    type PostId,
    type PostComment,
} from "../shared/types/zod.js";
import {
    buildEmailCredential,
    buildFormCredential,
    buildSecretCredential,
    getIsEligible,
    parseSecretCredentialRequest,
    type PostAs,
} from "./credential.js";
import { nowZeroMs } from "@/shared/common/util.js";

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
    pkVersion: number;
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
    sk: SecretKey;
    unboundSecretCredentialRequest: SecretCredentialRequest;
    timeboundSecretCredentialRequest: SecretCredentialRequest;
    httpErrors: HttpErrors;
}

interface CreateSecretCredentialsProps {
    db: PostgresDatabase;
    uid: string;
    userId: string;
    pkVersion: number;
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

interface GetLatestFormCredentialRequestProps {
    db: PostgresDatabase;
    email: string;
    httpErrors: HttpErrors;
}

interface CreateAndStoreEmailCredentialsProps {
    db: PostgresDatabase;
    email: string;
    pkVersion: number;
    uid: string;
    sk: SecretKey;
    httpErrors: HttpErrors;
}

interface CreateAndStoreFormCredentialProps {
    db: PostgresDatabase;
    email: string;
    pkVersion: number;
    formCredentialRequest: FormCredentialRequest;
    uid: string;
    sk: SecretKey;
    httpErrors: HttpErrors;
}

interface AddCredentialProps {
    results: GetCredentialsResult[];
    credentialsPerEmail: EmailCredentialsPerEmail | FormCredentialsPerEmail;
}

interface SelectStudentPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    campus: string | undefined;
    program: string | undefined;
    admissionYear: number | undefined;
}

interface SelectAlumPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
}

interface SelectFacultyPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
}

interface SelectUniversityPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
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

interface SelectPersonaIdFromAttributesProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
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

interface SelectAlumEligibilityIdFromAttributesProps {
    db: PostgresDatabase;
}

interface SelectFacultyEligibilityIdFromAttributesProps {
    db: PostgresDatabase;
}

interface SelectUniversityEligibilityIdFromAttributesProps {
    db: PostgresDatabase;
    types: UniversityType[] | undefined;
    countries: string[] | undefined;
    studentEligibilityId: number | undefined;
    alumEligibilityId: number | undefined;
    facultyEligibilityId: number | undefined;
}

interface FetchFeedProps<
    TQueryResult extends QueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
    updatedAt: Date | undefined;
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
    postUidOrSlugId: PollUid | PostSlugId;
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
    authenticateRequestBody: AuthenticateRequestBody;
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    env: Environment;
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
    throttleMinutesInterval: number;
    httpErrors: HttpErrors;
    env: Environment;
    awsMailConf: AwsMailConf;
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
    env: Environment;
    awsMailConf: AwsMailConf;
}

interface ModeratePostProps {
    db: PostgresDatabase;
    pollUid: PollUid;
}

interface ModerateCommentProps {
    db: PostgresDatabase;
    commentSlugId: PostSlugId;
}

interface PostAndId {
    post: ExtendedPollData;
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
            id: pollTable.id,
            // poll payload
            question: pollTable.question,
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
            type: personaTable.type,
            universityType: universityPersonaTable.type,
            universityCountries: universityPersonaTable.countries,
            studentCampus: studentPersonaTable.campus,
            studentProgram: studentPersonaTable.program,
            studentAdmissionYear: studentPersonaTable.admissionYear,
            // eligibility
            eligibilityDomains: eligibilityTable.domains,
            eligibilityTypes: eligibilityTable.types,
            eligibilityUniversityTypes: universityEligibilityTable.types,
            eligibilityUniversityCountries:
                universityEligibilityTable.countries,
            eligibilityStudentCampuses: studentEligibilityTable.campuses,
            eligibilityStudentPrograms: studentEligibilityTable.programs,
            eligibilityStudentAdmissionYears:
                studentEligibilityTable.admissionYears,
            // metadata
            pollUid: pollTable.timestampedPresentationCID,
            slugId: pollTable.slugId,
            isHidden: pollTable.isHidden,
            updatedAt: pollTable.updatedAt,
        })
        .from(pollTable)
        .innerJoin(pseudonymTable, eq(pseudonymTable.id, pollTable.authorId))
        .innerJoin(personaTable, eq(personaTable.id, pseudonymTable.personaId))
        .leftJoin(
            universityPersonaTable,
            eq(universityPersonaTable.id, personaTable.universityPersonaId)
        )
        .leftJoin(
            studentPersonaTable,
            eq(studentPersonaTable.id, universityPersonaTable.studentPersonaId)
        )
        .leftJoin(
            eligibilityTable,
            eq(pollTable.eligibilityId, eligibilityTable.id)
        )
        .leftJoin(
            universityEligibilityTable,
            eq(
                eligibilityTable.universityEligibilityId,
                universityEligibilityTable.id
            )
        )
        .leftJoin(
            studentEligibilityTable,
            eq(
                universityEligibilityTable.studentEligibilityId,
                studentEligibilityTable.id
            )
        );
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
                        pkVersion,
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
        const now = nowZeroMs();
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

    static async authenticateAttempt({
        db,
        type,
        authenticateRequestBody,
        userId,
        minutesBeforeCodeExpiry,
        didWrite,
        throttleMinutesInterval,
        httpErrors,
        env,
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
                authenticateRequestBody,
                throttleMinutesInterval,
                httpErrors,
                env,
                awsMailConf,
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
                env,
                awsMailConf,
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
                env,
                awsMailConf,
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
        authenticateRequestBody,
        throttleMinutesInterval,
        httpErrors,
        env,
        awsMailConf,
    }: InsertAuthAttemptCodeProps): Promise<AuthenticateOtp> {
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
        if (env === Environment.Production) {
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
        env,
        awsMailConf,
    }: UpdateAuthAttemptCodeProps): Promise<AuthenticateOtp> {
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
        if (env === Environment.Production) {
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
        unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest,
        httpErrors,
    }: RegisterProps): Promise<EmailSecretCredentials> {
        const uid = generateRandomHex();
        const now = nowZeroMs();
        const in1000years = new Date(now);
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
                    pkVersion,
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
        const now = nowZeroMs();
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
        const now = nowZeroMs();
        const in1000years = new Date(now);
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
            .orderBy(credentialFormTable.createdAt)
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
            .orderBy(credentialEmailTable.createdAt)
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
        pkVersion,
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
            const credential = buildEmailCredential({ email, uid, sk });
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

    static async getLatestFormCredentialRequest({
        db,
        email,
        httpErrors,
    }: GetLatestFormCredentialRequestProps): Promise<FormCredentialRequest> {
        const results = await db
            .select({ credential: credentialFormTable.credential })
            .from(credentialFormTable)
            .orderBy(credentialFormTable.createdAt)
            .where(and(eq(credentialFormTable.email, email)));
        if (results.length === 0) {
            throw httpErrors.forbidden(`The form has never been filled`);
        }
        const latestFormCredential = Credential.fromJSON(
            results[results.length - 1].credential
        ) as any; // TODO type this...
        const type: UniversityType = latestFormCredential.subject.typeSpecific
            .type as UniversityType;
        switch (type) {
            case "student":
                return {
                    type: type,
                    campus: essecCampusStrToEnum(
                        latestFormCredential.subject.typeSpecific.campus
                    ),
                    program: essecProgramStrToEnum(
                        latestFormCredential.subject.typeSpecific.program
                    ),
                    countries:
                        latestFormCredential.subject.typeSpecific.countries,
                    admissionYear:
                        latestFormCredential.subject.typeSpecific.admissionYear,
                };
            case "alum":
            case "faculty":
                return {
                    type: type,
                };
        }
    }

    static async createAndStoreFormCredential({
        db,
        email,
        formCredentialRequest,
        uid,
        pkVersion,
        sk,
        httpErrors,
    }: CreateAndStoreFormCredentialProps): Promise<FormCredential> {
        return await db.transaction(async (tx) => {
            const results = await tx
                .select({ id: credentialFormTable.id })
                .from(credentialFormTable)
                .where(
                    and(
                        eq(credentialFormTable.email, email),
                        eq(credentialFormTable.isRevoked, false)
                    )
                );
            if (results.length !== 0) {
                throw httpErrors.forbidden(
                    `Attempt to create multiple active form credential`
                );
            }
            const credential = buildFormCredential({
                email,
                formCredentialRequest,
                sk,
                uid,
            });
            const encodedCredential = base64.encode(
                anyToUint8Array(credential.toJSON())
            );
            await tx.insert(credentialFormTable).values({
                email: email,
                pkVersion: pkVersion,
                isRevoked: false,
                credential: credential.toJSON(),
            });
            return encodedCredential;
        });
    }

    static async createAndStoreSecretCredentials({
        db,
        unboundSecretCredentialRequest,
        pkVersion,
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

    static async selectFacultyEligibilityIdFromAttributes({
        db,
    }: SelectFacultyEligibilityIdFromAttributesProps): Promise<
        number | undefined
    > {
        const results = await db
            .select({
                facultyEligibilityId: facultyEligibilityTable.id,
            })
            .from(facultyEligibilityTable);
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].facultyEligibilityId;
        }
    }

    static async selectAlumEligibilityIdFromAttributes({
        db,
    }: SelectAlumEligibilityIdFromAttributesProps): Promise<
        number | undefined
    > {
        const results = await db
            .select({
                alumEligibilityId: alumEligibilityTable.id,
            })
            .from(alumEligibilityTable);
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].alumEligibilityId;
        }
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

    static async selectAlumPersonaIdFromAttributes({
        db,
    }: SelectAlumPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
        const results = await db
            .select({
                alumPersonaId: alumPersonaTable.id,
            })
            .from(alumPersonaTable);
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].alumPersonaId;
        }
    }

    static async selectFacultyPersonaIdFromAttributes({
        db,
    }: SelectFacultyPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
        const results = await db
            .select({
                facultyPersonaId: facultyPersonaTable.id,
            })
            .from(facultyPersonaTable);
        if (results.length === 0) {
            return undefined;
        } else {
            return results[0].facultyPersonaId;
        }
    }

    static async selectStudentPersonaIdFromAttributes({
        db,
        campus,
        program,
        admissionYear,
    }: SelectStudentPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
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
    }: SelectUniversityPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
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
                    eq(universityPersonaTable.type, type),
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
    }: SelectPersonaIdFromAttributesProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<number | undefined> {
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
        let universityPersonaId: number | undefined = undefined;
        let personaId: number | undefined = undefined;
        // TODO: switch case depending on value of postAs.type - here we only do work for universities
        if (postAs.typeSpecific !== undefined) {
            let studentPersonaId: number | undefined = undefined;
            let alumPersonaId: number | undefined = undefined;
            let facultyPersonaId: number | undefined = undefined;
            switch (postAs.typeSpecific.type) {
                case zoduniversityType.enum.student:
                    const selectedStudentPersonaId: number | undefined =
                        await Service.selectStudentPersonaIdFromAttributes({
                            db: tx,
                            campus:
                                postAs.typeSpecific.campus !== undefined
                                    ? essecCampusToString(
                                          postAs.typeSpecific.campus
                                      )
                                    : undefined,
                            program:
                                postAs.typeSpecific.program !== undefined
                                    ? essecProgramToString(
                                          postAs.typeSpecific.program
                                      )
                                    : undefined,
                            admissionYear:
                                postAs.typeSpecific.admissionYear !== undefined
                                    ? postAs.typeSpecific.admissionYear
                                    : undefined,
                        });
                    if (selectedStudentPersonaId === undefined) {
                        const insertedStudentPersona = await tx
                            .insert(studentPersonaTable)
                            .values({
                                campus:
                                    postAs.typeSpecific.campus !== undefined
                                        ? essecCampusToString(
                                              postAs.typeSpecific.campus
                                          )
                                        : undefined,
                                program:
                                    postAs.typeSpecific.program !== undefined
                                        ? essecProgramToString(
                                              postAs.typeSpecific.program
                                          )
                                        : undefined,
                                admissionYear:
                                    postAs.typeSpecific.admissionYear !==
                                    undefined
                                        ? postAs.typeSpecific.admissionYear
                                        : undefined,
                            })
                            .returning({
                                insertedId: studentPersonaTable.id,
                            });
                        studentPersonaId = insertedStudentPersona[0].insertedId;
                    } else {
                        studentPersonaId = selectedStudentPersonaId;
                    }
                    break;
                case zoduniversityType.enum.alum:
                    const selectedAlumPersonaId: number | undefined =
                        await Service.selectAlumPersonaIdFromAttributes({
                            db: tx,
                        });
                    if (selectedAlumPersonaId === undefined) {
                        const insertedAlumPersona = await tx
                            .insert(alumPersonaTable)
                            .values({ id: undefined }) // inserts default values, see https://github.com/drizzle-team/drizzle-orm/issues/1629
                            .returning({
                                insertedId: alumPersonaTable.id,
                            });
                        alumPersonaId = insertedAlumPersona[0].insertedId;
                    } else {
                        alumPersonaId = selectedAlumPersonaId;
                    }
                    break;
                case zoduniversityType.enum.faculty:
                    const selectedFacultyPersonaId: number | undefined =
                        await Service.selectFacultyPersonaIdFromAttributes({
                            db: tx,
                        });
                    if (selectedFacultyPersonaId === undefined) {
                        const insertedFacultyPersona = await tx
                            .insert(facultyPersonaTable)
                            .values({ id: undefined })
                            .returning({
                                insertedId: facultyPersonaTable.id,
                            });
                        facultyPersonaId = insertedFacultyPersona[0].insertedId;
                    } else {
                        facultyPersonaId = selectedFacultyPersonaId;
                    }
                    break;
            }
            let personaCountries = undefined;
            if (postAs.typeSpecific.countries) {
                const postAsCountries = postAs.typeSpecific.countries;
                personaCountries = Object.keys(
                    postAs.typeSpecific.countries
                ).filter(
                    (countryCode) =>
                        postAsCountries[countryCode as TCountryCode] === true
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
                        type: postAs.typeSpecific.type,
                        countries: personaCountries,
                        studentPersonaId: studentPersonaId,
                        alumPersonaId: alumPersonaId,
                        facultyPersonaId: facultyPersonaId,
                    })
                    .returning({ insertedId: personaTable.id });
                universityPersonaId = insertedUniversityPersona[0].insertedId;
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
            .returning({ insertedId: pseudonymTable.id });
        return insertedAuthor[0].insertedId;
        /////////////////////////////////////////////////////////////////////////////////////////
    }

    static async createPoll({
        db,
        presentation,
        poll,
        pseudonym,
        postAs,
    }: CreatePollProps): Promise<string> {
        const presentationCID = await toEncodedCID(presentation);
        const now = nowZeroMs();
        const timestampedPresentation = {
            timestamp: now.getTime(),
            presentation: presentation,
        }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
        const timestampedPresentationCID = await toEncodedCID(
            timestampedPresentation
        );
        const optionalOptions = [
            poll.data.option3,
            poll.data.option4,
            poll.data.option5,
            poll.data.option6,
        ];
        const realOptionalOptions: string[] = optionalOptions.filter(
            (option) => option !== undefined && option !== ""
        ) as string[];

        await db.transaction(async (tx) => {
            ////////////// PERSONA - POST AS ///////////
            const authorId = await Service.selectOrInsertPseudonym({
                tx: tx,
                postAs: postAs,
                pseudonym: pseudonym,
            });
            /////////////////////////////////////////////////////////////////////////////////////////

            //////////////////////// ELIGIBILITY ///////////////////////////////////////////////////
            let eligibilityId: number | undefined = undefined;
            let universityEligibilityId: number | undefined = undefined;
            let eligibilityTypes: UniversityType[] = [];
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
                if (poll.eligibility.student === true) {
                    eligibilityTypes.push(zoduniversityType.enum.student);
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
                                .returning({
                                    insertedId: studentEligibilityTable.id,
                                });
                            studentEligibilityId =
                                insertedStudentEligibility[0].insertedId;
                        } else {
                            studentEligibilityId = selectedStudentEligibilityId;
                        }
                    }
                }
                if (poll.eligibility.alum === true) {
                    eligibilityTypes.push(zoduniversityType.enum.alum);
                    const selectedAlumEligibilityId: number | undefined =
                        await Service.selectAlumEligibilityIdFromAttributes({
                            db: tx,
                        });
                    if (selectedAlumEligibilityId === undefined) {
                        const insertedAlumEligibility = await tx
                            .insert(alumEligibilityTable)
                            .values({ id: undefined })
                            .returning({ insertedId: alumEligibilityTable.id });
                        alumEligibilityId =
                            insertedAlumEligibility[0].insertedId;
                    } else {
                        alumEligibilityId = selectedAlumEligibilityId;
                    }
                }
                if (poll.eligibility.faculty === true) {
                    eligibilityTypes.push(zoduniversityType.enum.faculty);
                    const selectedFacultyEligibilityId: number | undefined =
                        await Service.selectFacultyEligibilityIdFromAttributes({
                            db: tx,
                        });
                    if (selectedFacultyEligibilityId === undefined) {
                        const insertedFacultyEligibility = await tx
                            .insert(facultyEligibilityTable)
                            .values({ id: undefined })
                            .returning({
                                insertedId: facultyEligibilityTable.id,
                            });
                        facultyEligibilityId =
                            insertedFacultyEligibility[0].insertedId;
                    } else {
                        facultyEligibilityId = selectedFacultyEligibilityId;
                    }
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
                presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
                slugId: generateRandomSlugId(),
                timestampedPresentationCID: timestampedPresentationCID,
                question: poll.data.question,
                option1: poll.data.option1,
                option2: poll.data.option2,
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
                authorId: authorId,
                eligibilityId: eligibilityId,
                createdAt: now,
                updatedAt: now,
            });
        });
        // TODO: broadcast timestampedPresentation to Nostr or custom libp2p node
        return timestampedPresentationCID;
    }

    static async fetchFeed({
        db,
        updatedAt,
        order,
        limit,
        showHidden,
    }: FetchFeedProps<
        QueryResultHKT,
        Record<string, unknown>,
        TablesRelationalConfig
    >): Promise<ExtendedPollData[]> {
        const defaultLimit = 30;
        const actualLimit = limit === undefined ? defaultLimit : limit;
        const whereUpdatedAt =
            updatedAt === undefined
                ? undefined
                : order === "more"
                ? lt(pollTable.updatedAt, updatedAt)
                : gt(pollTable.updatedAt, updatedAt);
        const results = await db
            .selectDistinctOn([pollTable.updatedAt, pollTable.id], {
                // poll payload
                question: pollTable.question,
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
                type: personaTable.type,
                universityType: universityPersonaTable.type,
                universityCountries: universityPersonaTable.countries,
                studentCampus: studentPersonaTable.campus,
                studentProgram: studentPersonaTable.program,
                studentAdmissionYear: studentPersonaTable.admissionYear,
                // eligibility
                eligibilityDomains: eligibilityTable.domains,
                eligibilityTypes: eligibilityTable.types,
                eligibilityUniversityTypes: universityEligibilityTable.types,
                eligibilityUniversityCountries:
                    universityEligibilityTable.countries,
                eligibilityStudentCampuses: studentEligibilityTable.campuses,
                eligibilityStudentPrograms: studentEligibilityTable.programs,
                eligibilityStudentAdmissionYears:
                    studentEligibilityTable.admissionYears,
                // metadata
                pollUid: pollTable.timestampedPresentationCID,
                slugId: pollTable.slugId,
                isHidden: pollTable.isHidden,
                updatedAt: pollTable.updatedAt,
            })
            .from(pollTable)
            .innerJoin(
                pseudonymTable,
                eq(pseudonymTable.id, pollTable.authorId)
            )
            .innerJoin(
                personaTable,
                eq(personaTable.id, pseudonymTable.personaId)
            )
            .leftJoin(
                universityPersonaTable,
                eq(universityPersonaTable.id, personaTable.universityPersonaId)
            )
            .leftJoin(
                studentPersonaTable,
                eq(
                    studentPersonaTable.id,
                    universityPersonaTable.studentPersonaId
                )
            )
            // TODO: alum and faculty-specific attributes
            // .leftJoin(
            //     alumPersonaTable,
            //     eq(alumPersonaTable.id, universityPersonaTable.alumPersonaId)
            // )
            // .leftJoin(
            //     facultyPersonaTable,
            //     eq(
            //         facultyPersonaTable.id,
            //         universityPersonaTable.facultyPersonaId
            //     )
            // )
            .leftJoin(
                eligibilityTable,
                eq(pollTable.eligibilityId, eligibilityTable.id)
            )
            .leftJoin(
                universityEligibilityTable,
                eq(
                    eligibilityTable.universityEligibilityId,
                    universityEligibilityTable.id
                )
            )
            .leftJoin(
                studentEligibilityTable,
                eq(
                    universityEligibilityTable.studentEligibilityId,
                    studentEligibilityTable.id
                )
            )
            // TODO: alum and faculty eligibility when specific attributes will be created
            .orderBy(desc(pollTable.updatedAt), desc(pollTable.id))
            .limit(actualLimit)
            .where(
                showHidden === true
                    ? whereUpdatedAt
                    : and(whereUpdatedAt, eq(pollTable.isHidden, false))
            );
        const polls: ExtendedPollData[] = results.map((result) => {
            const metadata =
                showHidden === true
                    ? {
                          uid: result.pollUid,
                          slugId: result.slugId === null ? "" : result.slugId, // TODO change that when slug is notnull
                          isHidden: result.isHidden,
                          updatedAt: result.updatedAt,
                      }
                    : {
                          uid: result.pollUid,
                          slugId: result.slugId === null ? "" : result.slugId, // TODO change that when slug is notnull
                          updatedAt: result.updatedAt,
                      };
            return {
                metadata: metadata,
                payload: {
                    data: {
                        question: result.question,
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
                },
                author: {
                    pseudonym: result.pseudonym,
                    domain: result.domain,
                    type: result.type,
                    university:
                        result.universityType !== null
                            ? {
                                  type: result.universityType,
                                  student:
                                      result.studentCampus !== null ||
                                      result.studentProgram !== null ||
                                      result.studentAdmissionYear !== null ||
                                      result.universityCountries !== null
                                          ? {
                                                countries: toUnionUndefined(
                                                    result.universityCountries
                                                ) as TCountryCode[] | undefined,
                                                campus: toUnionUndefined(
                                                    result.studentCampus
                                                ),
                                                program: toUnionUndefined(
                                                    result.studentProgram
                                                ),
                                                admissionYear: toUnionUndefined(
                                                    result.studentAdmissionYear
                                                ),
                                            }
                                          : undefined,
                              }
                            : undefined,
                },
                eligibility: {
                    domains: toUnionUndefined(result.eligibilityDomains),
                    types: toUnionUndefined(result.eligibilityTypes),

                    university:
                        result.eligibilityUniversityTypes !== null
                            ? {
                                  types: toUnionUndefined(
                                      result.eligibilityUniversityTypes
                                  ),
                                  student:
                                      result.eligibilityUniversityCountries !==
                                          null ||
                                      result.eligibilityStudentPrograms !==
                                          null ||
                                      result.eligibilityStudentPrograms !==
                                          null ||
                                      result.eligibilityStudentAdmissionYears !==
                                          null
                                          ? {
                                                countries: toUnionUndefined(
                                                    result.eligibilityUniversityCountries
                                                ) as TCountryCode[] | undefined,
                                                campuses: toUnionUndefined(
                                                    result.eligibilityStudentCampuses
                                                ),
                                                programs: toUnionUndefined(
                                                    result.eligibilityStudentPrograms
                                                ),
                                                admissionYears:
                                                    toUnionUndefined(
                                                        result.eligibilityStudentAdmissionYears
                                                    ),
                                            }
                                          : undefined,
                              }
                            : undefined,
                },
            };
        });
        return polls;
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
                ? eq(pollTable.timestampedPresentationCID, postUidOrSlugId)
                : eq(pollTable.slugId, postUidOrSlugId);
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
        const post: ExtendedPollData = {
            metadata: {
                uid: result.pollUid,
                slugId: result.slugId === null ? "" : result.slugId, // TODO change that when slug is notnull
                isHidden: result.isHidden,
                updatedAt: result.updatedAt,
            },
            payload: {
                data: {
                    question: result.question,
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
                    option3Response: toUnionUndefined(result.option3Response),
                    option4Response: toUnionUndefined(result.option4Response),
                    option5Response: toUnionUndefined(result.option5Response),
                    option6Response: toUnionUndefined(result.option6Response),
                },
            },
            author: {
                pseudonym: result.pseudonym,
                domain: result.domain,
                type: result.type,
                university:
                    result.universityType !== null
                        ? {
                              type: result.universityType,
                              student:
                                  result.studentCampus !== null ||
                                  result.studentProgram !== null ||
                                  result.studentAdmissionYear !== null ||
                                  result.universityCountries !== null
                                      ? {
                                            countries: toUnionUndefined(
                                                result.universityCountries
                                            ) as TCountryCode[] | undefined,
                                            campus: toUnionUndefined(
                                                result.studentCampus
                                            ),
                                            program: toUnionUndefined(
                                                result.studentProgram
                                            ),
                                            admissionYear: toUnionUndefined(
                                                result.studentAdmissionYear
                                            ),
                                        }
                                      : undefined,
                          }
                        : undefined,
            },
            eligibility: {
                domains: toUnionUndefined(result.eligibilityDomains),
                types: toUnionUndefined(result.eligibilityTypes),

                university:
                    result.eligibilityUniversityTypes !== null
                        ? {
                              types: toUnionUndefined(
                                  result.eligibilityUniversityTypes
                              ),
                              student:
                                  result.eligibilityUniversityCountries !==
                                      null ||
                                  result.eligibilityStudentPrograms !== null ||
                                  result.eligibilityStudentPrograms !== null ||
                                  result.eligibilityStudentAdmissionYears !==
                                      null
                                      ? {
                                            countries: toUnionUndefined(
                                                result.eligibilityUniversityCountries
                                            ) as TCountryCode[] | undefined,
                                            campuses: toUnionUndefined(
                                                result.eligibilityStudentCampuses
                                            ),
                                            programs: toUnionUndefined(
                                                result.eligibilityStudentPrograms
                                            ),
                                            admissionYears: toUnionUndefined(
                                                result.eligibilityStudentAdmissionYears
                                            ),
                                        }
                                      : undefined,
                          }
                        : undefined,
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
    }: RespondToPollProps): Promise<ExtendedPollData> {
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
                // eligibility
                eligibilityDomains: eligibilityTable.domains,
                eligibilityTypes: eligibilityTable.types,
                eligibilityUniversityTypes: universityEligibilityTable.types,
                eligibilityUniversityCountries:
                    universityEligibilityTable.countries,
                eligibilityStudentCampuses: studentEligibilityTable.campuses,
                eligibilityStudentPrograms: studentEligibilityTable.programs,
                eligibilityStudentAdmissionYears:
                    studentEligibilityTable.admissionYears,
                // metadata
                pollUID: pollTable.timestampedPresentationCID,
            })
            .from(pollTable)
            .leftJoin(
                eligibilityTable,
                eq(pollTable.eligibilityId, eligibilityTable.id)
            )
            .leftJoin(
                universityEligibilityTable,
                eq(
                    eligibilityTable.universityEligibilityId,
                    universityEligibilityTable.id
                )
            )
            .leftJoin(
                studentEligibilityTable,
                eq(
                    universityEligibilityTable.studentEligibilityId,
                    studentEligibilityTable.id
                )
            )
            .where(eq(pollTable.timestampedPresentationCID, response.pollUid));
        if (results.length === 0) {
            throw httpErrors.notFound(
                "The poll UID you tried to answer to does not exist"
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
                `Option 3 does not exist in poll '${response.pollUid}'`
            );
        }
        if (response.optionChosen === 4 && result.option4 === null) {
            throw httpErrors.badRequest(
                `Option 4 does not exist in poll '${response.pollUid}'`
            );
        }
        if (response.optionChosen === 5 && result.option5 === null) {
            throw httpErrors.badRequest(
                `Option 5 does not exist in poll '${response.pollUid}'`
            );
        }
        if (response.optionChosen === 6 && result.option6 === null) {
            throw httpErrors.badRequest(
                `Option 6 does not exist in poll '${response.pollUid}'`
            );
        }
        // check wheter postAs matches poll's eligiblity
        const eligibility: Eligibilities = {
            domains: toUnionUndefined(result.eligibilityDomains),
            types: toUnionUndefined(result.eligibilityTypes),

            university:
                result.eligibilityUniversityTypes !== null
                    ? {
                          types: toUnionUndefined(
                              result.eligibilityUniversityTypes
                          ),
                          student:
                              result.eligibilityUniversityCountries !== null ||
                              result.eligibilityStudentPrograms !== null ||
                              result.eligibilityStudentPrograms !== null ||
                              result.eligibilityStudentAdmissionYears !== null
                                  ? {
                                        countries: toUnionUndefined(
                                            result.eligibilityUniversityCountries
                                        ) as TCountryCode[] | undefined,
                                        campuses: toUnionUndefined(
                                            result.eligibilityStudentCampuses
                                        ),
                                        programs: toUnionUndefined(
                                            result.eligibilityStudentPrograms
                                        ),
                                        admissionYears: toUnionUndefined(
                                            result.eligibilityStudentAdmissionYears
                                        ),
                                    }
                                  : undefined,
                      }
                    : undefined,
        };
        const isEligible = getIsEligible(eligibility, postAs);
        if (!isEligible) {
            throw httpErrors.unauthorized(
                `Respondent '${pseudonym}' is not eligible to poll '${
                    response.pollUid
                }':\neligibility = '${JSON.stringify(
                    eligibility
                )}\n'postAs = '${JSON.stringify(postAs)}'`
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
                .where(
                    eq(pollTable.timestampedPresentationCID, response.pollUid)
                );
            const { post } = await Service.fetchPostByUidOrSlugId({
                db,
                postUidOrSlugId: response.pollUid,
                type: "postUid",
                httpErrors,
            });
            return post;
        });
    }

    static async hidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
        await db
            .update(pollTable)
            .set({
                isHidden: true,
            })
            .where(eq(pollTable.timestampedPresentationCID, pollUid));
    }

    static async unhidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
        await db
            .update(pollTable)
            .set({
                isHidden: false,
            })
            .where(eq(pollTable.timestampedPresentationCID, pollUid));
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
    }: CreateCommentProps): Promise<PollUid> {
        // Check whether post the user responds to actually exists
        const results = await db
            .select({
                pollId: pollTable.id,
            })
            .from(pollTable)
            .where(eq(pollTable.timestampedPresentationCID, payload.postUid));
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
        const authorId = await Service.selectOrInsertPseudonym({
            tx: db,
            postAs: postAs,
            pseudonym: pseudonym,
        });
        await db.insert(commentTable).values({
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
                type: personaTable.type,
                universityType: universityPersonaTable.type,
                universityCountries: universityPersonaTable.countries,
                studentCampus: studentPersonaTable.campus,
                studentProgram: studentPersonaTable.program,
                studentAdmissionYear: studentPersonaTable.admissionYear,
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
            .leftJoin(
                universityPersonaTable,
                eq(universityPersonaTable.id, personaTable.universityPersonaId)
            )
            .leftJoin(
                studentPersonaTable,
                eq(
                    studentPersonaTable.id,
                    universityPersonaTable.studentPersonaId
                )
            )
            .orderBy(desc(commentTable.updatedAt), desc(commentTable.id))
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
                    type: result.type,
                    university:
                        result.universityType !== null
                            ? {
                                  type: result.universityType,
                                  student:
                                      result.studentCampus !== null ||
                                      result.studentProgram !== null ||
                                      result.studentAdmissionYear !== null ||
                                      result.universityCountries !== null
                                          ? {
                                                countries: toUnionUndefined(
                                                    result.universityCountries
                                                ) as TCountryCode[] | undefined,
                                                campus: toUnionUndefined(
                                                    result.studentCampus
                                                ),
                                                program: toUnionUndefined(
                                                    result.studentProgram
                                                ),
                                                admissionYear: toUnionUndefined(
                                                    result.studentAdmissionYear
                                                ),
                                            }
                                          : undefined,
                              }
                            : undefined,
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
            .select({ id: pollTable.id })
            .from(pollTable)
            .where(eq(pollTable.slugId, slugId));
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
