import { postTable } from "@/schema.js";
import type { ExtendedPost } from "@/shared/types/zod.js";
import { and, eq, lt } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";

interface FetchFeedProps {
    db: PostgresDatabase;
    lastCreatedAt: Date;
    limit?: number;
    showHidden?: boolean;
}

export async function fetchFeed({
    db,
    lastCreatedAt,
    limit,
    showHidden,
}: FetchFeedProps): Promise<ExtendedPost[]> {
    const defaultLimit = 10;
    const actualLimit = limit ?? defaultLimit;
    const whereUpdatedAt = lt(postTable.lastReactedAt, lastCreatedAt);

    const { fetchPostItems } = useCommonPost();

    const posts: ExtendedPost[] = await fetchPostItems({
        db: db,
        showHidden: showHidden ?? false,
        limit: actualLimit,
        where: showHidden === true
            ? whereUpdatedAt
            : and(whereUpdatedAt, eq(postTable.isHidden, false)),
        enableCompactBody: true
    });

    return posts;
}
