import { server } from "@/app.js";
import { postTable, userTable } from "@/schema.js";
import type { FetchUserProfileResponse } from "@/shared/types/dto.js";
import type { ExtendedPost } from "@/shared/types/zod.js";
import { httpErrors } from "@fastify/sensible";
import { and, eq, lt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";
import { getPostSlugIdLastCreatedAt } from "./feed.js";


interface GetUserPostProps {
  db: PostgresJsDatabase;
  userId: string;
  lastPostSlugId?: string
}

export async function getUserPosts({
  db,
  userId,
  lastPostSlugId
}: GetUserPostProps): Promise<ExtendedPost[]> {

  try {
    const { fetchPostItems } = useCommonPost();

    const lastCreatedAt = await getPostSlugIdLastCreatedAt({ lastSlugId: lastPostSlugId, db: db });

    const whereClause = and(eq(postTable.authorId, userId), lt(postTable.createdAt, lastCreatedAt));

    const posts: ExtendedPost[] = await fetchPostItems({
      db: db,
      showHidden: false,
      limit: 10,
      where: whereClause,
      enableCompactBody: true,
      fetchPollResponse: true,
      userId: userId
    });

    return posts;

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while fetching user posts"
    );
  }

}

interface GetUserProfileProps {
  db: PostgresJsDatabase;
  userId: string;
}

export async function getUserProfile({
  db,
  userId
}: GetUserProfileProps): Promise<FetchUserProfileResponse> {

  try {
    const userTableResponse = await db
      .select({
        commentCount: userTable.commentCount,
        postCount: userTable.postCount,
        createdAt: userTable.createdAt,
        userName: userTable.userName
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (userTableResponse.length == 0) {
      throw httpErrors.notFound(
        "Failed to locate user profile"
      );
    } else {
      return {
        commentCount: userTableResponse[0].commentCount,
        postCount: userTableResponse[0].postCount,
        createdAt: userTableResponse[0].createdAt,
        userName: userTableResponse[0].userName,
      };
    }

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while fetching user profile"
    );
  }
}
