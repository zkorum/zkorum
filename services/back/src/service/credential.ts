import {
    BBSPlusSecretKey as SecretKey,
    BBSPlusBlindedCredentialRequest as BlindedCredentialRequest,
} from "@docknetwork/crypto-wasm-ts";
import {
    type EmailCredentialsPerEmail,
    type EmailCredential,
    type SecretCredentialType,
    type SecretCredentialsPerType,
    type SecretCredentials,
    type SecretCredentialRequest,
    type BlindedCredentialType,
} from "../shared/types/zod.js";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { credentialEmailTable, credentialSecretTable } from "@/schema.js";
import { base64 } from "../shared/common/index.js";
import { anyToUint8Array } from "@/shared/common/arrbufs.js";
import { and, eq, inArray, type TablesRelationalConfig } from "drizzle-orm";
import * as authUtilService from "./authUtil.js";
import type { PgTransaction, QueryResultHKT } from "drizzle-orm/pg-core";
import type { UserCredentials } from "@/shared/types/dto.js";
import { buildEmailCredential, buildSecretCredential, parseSecretCredentialRequest } from "@/logic/credential.js";

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

interface CreateAndStoreEmailCredentialsProps {
    db: PostgresDatabase;
    email: string;
    pkVersion: number;
    emailCredentialVersion: string;
    uid: string;
    sk: SecretKey;
    httpErrors: HttpErrors;
}

interface GetCredentialsResult {
    email: string;
    credential: object;
    isRevoked: boolean | null;
}

interface AddCredentialProps {
    results: GetCredentialsResult[];
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
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

export async function createAndStoreEmailCredential({
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

export async function createAndStoreSecretCredentials({
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
        await createAndStoreSecretCredential({
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
        await createAndStoreSecretCredential({
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

export async function createAndStoreSecretCredential({
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


export async function getEmailCredentialsPerEmailFromUserId(
    db: PostgresDatabase,
    userId: string
): Promise<EmailCredentialsPerEmail> {
    const emails = await authUtilService.getEmailsFromUserId(db, userId);
    return await getEmailCredentialsPerEmail(db, emails);
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


export async function getEmailCredentialsPerEmail(
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

export async function revokeUserCredentials({
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

// maybe remove that when ServerSideEvents is implemented...
export async function getUserCredentials(
    db: PostgresDatabase,
    didWrite: string
): Promise<UserCredentials> {
    const userId = await authUtilService.getUserIdFromDevice(db, didWrite);
    const emailCredentialsPerEmail =
        await getEmailCredentialsPerEmailFromUserId(db, userId);
    const secretCredentialsPerType =
        await getSecretCredentialsPerType(db, userId);
    return {
        emailCredentialsPerEmail: emailCredentialsPerEmail,
        secretCredentialsPerType: secretCredentialsPerType,
    };
}

export async function getSecretCredentialsPerType(
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
