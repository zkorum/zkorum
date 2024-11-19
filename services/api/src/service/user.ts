import { server } from "@/app.js";
import { postTable, userTable } from "@/schema.js";
import type { FetchUserProfileResponse } from "@/shared/types/dto.js";
import { httpErrors } from "@fastify/sensible";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";
import type { ExtendedPost } from "@/shared/types/zod.js";

interface GetUserProfiletProps {
  db: PostgresJsDatabase;
  userId: string;
}

export async function getUserProfile({
  db,
  userId
}: GetUserProfiletProps): Promise<FetchUserProfileResponse> {

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

    const { fetchPostItems } = useCommonPost();
    const whereClause = eq(postTable.authorId, userId);

    const posts: ExtendedPost[] = await fetchPostItems({
      db: db,
      showHidden: false,
      limit: 0,
      where: whereClause,
      enableCompactBody: true
    });

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
        userPostList: posts
      };
    }

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while fetching user profile"
    );
  }
}
