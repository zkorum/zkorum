import { log } from "@/app.js";
import { userTable } from "@/schema.js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq  } from "drizzle-orm";
import { getUserComments, getUserPosts } from "./user.js";
import { deleteCommentBySlugId } from "./comment.js";
import { deletePostBySlugId } from "./post.js";
import { nowZeroMs } from "@/shared/common/util.js";
import { logout } from "./auth.js";
import { httpErrors } from "@fastify/sensible";
import { checkUserNameInUse } from "./onboarding.js";

interface SubmitUsernameChangeProps {
  db: PostgresJsDatabase;
  username: string;
  userId: string;
}

export async function submitUsernameChange({
  db, username, userId
}: SubmitUsernameChangeProps) {

  // Check if the username is available
  const isInUse = await checkUserNameInUse({
    db: db,
    username: username
  })
  if (isInUse) {
    throw httpErrors.badRequest("The requested username is already in use");
  }

  const userTableResponse = await db.update(userTable)
    .set({
      username: username,
      updatedAt: nowZeroMs()
    })
    .where(eq(userTable.id, userId));
  if (userTableResponse.length === 0) {
    throw httpErrors.internalServerError(
      "Failed to delete user account"
    );
  }
}

interface DeleteAccountProps {
  db: PostgresJsDatabase;
  authHeader: string;
  didWrite: string;
  userId: string;
}

export async function deleteUserAccount({
  db, userId, authHeader, didWrite
}: DeleteAccountProps) {
  try {
    await db.transaction(async (tx) => {
      const updatedUserTableResponse = await tx
        .update(userTable)
        .set({
          isDeleted: true,
          updatedAt: nowZeroMs()
        })
        .where(eq(userTable.id, userId))
        .returning({ id: userTable.id});

      if (updatedUserTableResponse.length != 1) {
        log.error("User table update has an invalid number of affected rows: " + userId);
        tx.rollback();
      }

      // Delete user comments
      const userComments = await getUserComments({
        db: tx,
        userId: userId,
        lastCommentSlugId: undefined
      })
      for (const comment of userComments) {
        await deleteCommentBySlugId({
          authHeader: authHeader,
          commentSlugId: comment.commentItem.commentSlugId,
          db: tx,
          didWrite: didWrite,
          userId: userId
        });
      }

      // Delete user posts
      const userPosts = await getUserPosts({
        db: tx,
        userId: userId,
        lastPostSlugId: undefined
      });
      for (const post of userPosts) {
        await deletePostBySlugId({
          authHeader: authHeader,
          db: tx,
          didWrite: didWrite,
          postSlugId: post.metadata.postSlugId,
          userId: userId
        });
      }

      await logout(tx, didWrite);
    });
  } catch (err: unknown) {
    log.error(err);
    throw httpErrors.internalServerError(
      "Failed to delete user account"
    );
  }

}