import { server } from "@/app.js";
import { commentContentTable, commentTable, postTable, userTable } from "@/schema.js";
import type { FetchUserProfileResponse } from "@/shared/types/dto.js";
import type { CommentItem, ExtendedComment, ExtendedPost } from "@/shared/types/zod.js";
import { httpErrors } from "@fastify/sensible";
import { and, eq, lt, desc, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";
import { getPostSlugIdLastCreatedAt } from "./feed.js";
import { getCommentSlugIdLastCreatedAt } from "./comment.js";
import { fetchPostBySlugId } from "./post.js";


interface GetUserCommentsProps {
  db: PostgresJsDatabase;
  userId: string;
  lastCommentSlugId?: string
}

export async function getUserComments({
  db,
  userId,
  lastCommentSlugId
}: GetUserCommentsProps): Promise<ExtendedComment[]> {

  try {
    const lastCreatedAt = await getCommentSlugIdLastCreatedAt({ lastSlugId: lastCommentSlugId, db: db });

    // Fetch a list of comment IDs first
    const commentResponseList = await db
      .select({
        commentSlugId: commentTable.slugId,
        createdAt: commentTable.createdAt,
        updatedAt: commentTable.updatedAt,
        comment: commentContentTable.content,
        numLikes: commentTable.numLikes,
        numDislikes: commentTable.numDislikes,
        userName: userTable.userName,
        postSlugId: postTable.slugId
      })
      .from(commentTable)
      .innerJoin(
        commentContentTable,
        eq(commentContentTable.id, commentTable.currentContentId)
      )
      .innerJoin(
        userTable,
        eq(userTable.id, userId)
      )
      .innerJoin(
        postTable,
        eq(postTable.id, commentTable.postId)
      )
      .where(and(eq(commentTable.authorId, userId), lt(commentTable.createdAt, lastCreatedAt), isNotNull(postTable.currentContentId)))
      .orderBy(desc(commentTable.createdAt))
      .limit(10);
    
    const extendedCommentList: ExtendedComment[] = [];
    
    for (const commentResponse of commentResponseList) {
      const commentItem: CommentItem = {
        comment: commentResponse.comment,
        commentSlugId: commentResponse.commentSlugId,
        createdAt: commentResponse.createdAt,
        numDislikes: commentResponse.numDislikes,
        numLikes: commentResponse.numLikes,
        updatedAt: commentResponse.updatedAt,
        userName: commentResponse.userName
      }

      const postItem = await fetchPostBySlugId({
        db: db,
        postSlugId: commentResponse.postSlugId,
        fetchPollResponse: false,
        userId: undefined
      });

      const extendedCommentItem: ExtendedComment = {
        commentItem: commentItem,
        postData: postItem
      }

      extendedCommentList.push(extendedCommentItem);
    }
    
    return extendedCommentList;

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while fetching user comments"
    );
  }

}

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
