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
    const blocked = writer
        .select({ phoneHash: blockedPhoneNumberTable.phoneHash })
        .from(blockedPhoneNumberTable)
        .where(
            and(
                eq(blockedPhoneNumberTable.phoneHash, phoneHash),
                eq(blockedPhoneNumberTable.pepperVersion, pepperVersion),
                isNull(blockedPhoneNumberTable.revokedAt),
            ),
        );
    const restrictedOwner = writer
        .select({ phoneHash: phoneTable.phoneHash })
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
        );
    const denied = await blocked.unionAll(restrictedOwner).limit(1);
    return denied.length !== 0;
}
