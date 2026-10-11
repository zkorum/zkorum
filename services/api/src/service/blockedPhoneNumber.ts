import { getPrimaryDatabase } from "@/shared-backend/db.js";
import {
    blockedPhoneNumberTable,
    phoneTable,
    userTable,
} from "@/shared-backend/schema.js";
import { and, eq, isNull, isNotNull, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function isBlockedPhoneNumber({
    db,
    phoneHash,
    pepperVersion,
}: {
    db: PostgresJsDatabase;
    phoneHash: string;
    pepperVersion: number;
}): Promise<boolean> {
    const writer = getPrimaryDatabase(db);
    const blocked = await writer
        .select({ phoneHash: blockedPhoneNumberTable.phoneHash })
        .from(blockedPhoneNumberTable)
        .where(
            and(
                eq(blockedPhoneNumberTable.phoneHash, phoneHash),
                eq(blockedPhoneNumberTable.pepperVersion, pepperVersion),
                isNull(blockedPhoneNumberTable.revokedAt),
            ),
        )
        .limit(1);
    if (blocked.length !== 0) return true;
    const restrictedOwner = await writer
        .select({ id: phoneTable.id })
        .from(phoneTable)
        .innerJoin(userTable, eq(userTable.id, phoneTable.userId))
        .where(
            and(
                eq(phoneTable.phoneHash, phoneHash),
                eq(phoneTable.pepperVersion, pepperVersion),
                eq(phoneTable.isDeleted, false),
                or(
                    eq(userTable.isDeleted, true),
                    isNotNull(userTable.authRestrictedAt),
                ),
            ),
        )
        .limit(1);
    return restrictedOwner.length !== 0;
}
