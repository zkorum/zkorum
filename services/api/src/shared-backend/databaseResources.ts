/** **** WARNING: GENERATED FROM SHARED-BACKEND DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";

// Keep database-only consumers independent of the native Valkey client.
const databaseTimeoutMs = z.coerce.number().int().min(1).max(2_147_483_647);

export const databaseResourceConfigSchema = z.object({
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(5),
    DB_STATEMENT_TIMEOUT_MS: databaseTimeoutMs.default(30000),
    DB_LOCK_TIMEOUT_MS: databaseTimeoutMs.default(5000),
    DB_IDLE_TRANSACTION_TIMEOUT_MS: databaseTimeoutMs.default(60000),
});
