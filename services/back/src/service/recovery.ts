import { deviceTable } from "@/schema.js";
import { and, eq, ne, type TablesRelationalConfig } from "drizzle-orm";
import type { PgTransaction, QueryResultHKT } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import * as authUtilService from "./authUtil.js";
import * as credentialService from "./credential.js";
import { nowZeroMs } from "@/shared/common/util.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import {
    BBSPlusSecretKey as SecretKey,
} from "@docknetwork/crypto-wasm-ts";
import type { SecretCredentialRequest, SecretCredentialRequest } from "@/shared/types/zod.js";
import type { RecoverAccountResp } from "@/shared/types/dto.js";

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


export async function logoutAllDevicesButOne({
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


export async function recoverAccount({
    db,
    didWrite,
    pkVersion,
    secretCredentialVersion,
    emailCredentialVersion,
    httpErrors,
    timeboundSecretCredentialRequest,
    unboundSecretCredentialRequest,
    sk,
}: RecoverAccountProps): Promise<RecoverAccountResp> {
    // TODO do all this as a unique transaction
    const now = nowZeroMs();
    return await db.transaction(async (tx) => {
        const emails = await authUtilService.getEmailsFromDidWrite(tx, didWrite);
        const email = emails[0]; // TODO solve it for multiple emails
        const { userId, uid } = await authUtilService.getInfoFromDevice(
            tx,
            didWrite
        );
        await credentialService.revokeUserCredentials({ db: tx, email, userId, now });
        const loginSessionExpiry = new Date(now);
        loginSessionExpiry.setFullYear(
            loginSessionExpiry.getFullYear() + 1000
        );
        await logoutAllDevicesButOne({
            db: tx,
            didWrite,
            userId,
            now,
            sessionExpiry: loginSessionExpiry,
        });
        await credentialService.createAndStoreEmailCredential({
            db: tx,
            email,
            pkVersion,
            emailCredentialVersion,
            uid,
            sk,
            httpErrors,
        });
        await credentialService.createAndStoreSecretCredential({
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
        await credentialService.createAndStoreSecretCredential({
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
        const credentials = await credentialService.getUserCredentials(tx, didWrite);
        return {
            ...credentials,
            userId: userId,
            sessionExpiry: loginSessionExpiry,
        };
    });
}
