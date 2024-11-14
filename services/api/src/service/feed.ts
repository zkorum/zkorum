import { postTable } from "@/schema.js";
import type { ExtendedPost } from "@/shared/types/zod.js";
import { and, eq, lt } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";

interface FetchFeedProps {
    db: PostgresDatabase;
    lastSlugId: string | undefined;
    limit?: number;
    showHidden?: boolean;
}

export async function fetchFeed({
    db,
    lastSlugId,
    limit,
    showHidden,
}: FetchFeedProps): Promise<ExtendedPost[]> {
    const defaultLimit = 10;
    const actualLimit = limit ?? defaultLimit;

    let lastCreatedAt = new Date();

    if (lastSlugId) {
        const selectResponse = await db
            .select({ createdAt: postTable.createdAt })
            .from(postTable)
            .where(eq(postTable.slugId, lastSlugId))
        if (selectResponse.length == 1) {
            lastCreatedAt = selectResponse[0].createdAt;
        } else {
            // Ignore the slug ID if it cannot be found
        }
    }

    let whereClause = showHidden ? undefined : eq(postTable.isHidden, false);
    if (lastSlugId) {
        whereClause = and(whereClause, lt(postTable.createdAt, lastCreatedAt));
    }

    const { fetchPostItems } = useCommonPost();

    const posts: ExtendedPost[] = await fetchPostItems({
        db: db,
        showHidden: showHidden ?? false,
        limit: actualLimit,
        where: whereClause,
        enableCompactBody: true
    });

    return posts;
}
