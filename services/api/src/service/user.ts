import { server } from "@/app.js";
import { userTable } from "@/schema.js";
import type { FetchUserProfileResponse } from "@/shared/types/dto.js";
import { httpErrors } from "@fastify/sensible";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

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

    if (userTableResponse.length == 0) {
      throw httpErrors.notFound(
        "Failed to locate user profile"
      );
    } else {
      return {
        commentCount: userTableResponse[0].commentCount,
        postCount: userTableResponse[0].postCount,
        createdAt: userTableResponse[0].createdAt,
        userName: userTableResponse[0].userName
      };
    }

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while fetching user profile"
    );
  }
}
