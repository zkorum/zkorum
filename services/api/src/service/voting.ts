import { commentTable, postTable, voteContentTable, voteProofTable, voteTable } from "@/schema.js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { httpErrors } from "@fastify/sensible";
import { server } from "@/app.js";
import type { VotingOption } from "@/shared/types/zod.js";
import type { FetchUserVotesForPostSlugIdResponseResponse } from "@/shared/types/dto.js";


interface GetCommentIdAndContentIdFromCommentSlugIdProps {
  db: PostgresJsDatabase,
  commentSlugId: string,
}

interface GetCommentIdAndContentIdFromCommentSlugIdReturn {
  commentId: number,
  contentId: number
}

async function getCommentIdAndContentIdFromCommentSlugId({
  db, commentSlugId
}: GetCommentIdAndContentIdFromCommentSlugIdProps): Promise<GetCommentIdAndContentIdFromCommentSlugIdReturn> {

  const response = await db.select({
    commentId: commentTable.id,
    contentId: commentTable.currentContentId
  })
    .from(commentTable)
    .where(eq(commentTable.slugId, commentSlugId));
  if (response.length == 1) {
    const commentData = response[0];
    if (commentData.contentId == null) {
      throw httpErrors.notFound(
        "Failed to locate comment content ID"
      );
    } else {
      return {
        commentId: commentData.commentId,
        contentId: commentData.contentId
      };
    }

  } else {
    throw httpErrors.internalServerError(
      "Database error while fetching comment ID from comment slug ID"
    );
  }

}

interface CastVoteForCommentSlugIdProps {
  db: PostgresJsDatabase,
  commentSlugId: string,
  userId: string,
  didWrite: string,
  authHeader: string,
  optionChosen: VotingOption
}

export async function castVoteForCommentSlugId({
  db, userId, commentSlugId, didWrite, authHeader, optionChosen }: CastVoteForCommentSlugIdProps) {

  const commentData = await getCommentIdAndContentIdFromCommentSlugId({ db: db, commentSlugId: commentSlugId });

  try {
    await db.transaction(async (tx) => {

      const voteTableResponse = await tx.insert(voteTable).values({
        authorId: userId,
        commentId: commentData.commentId,
        currentContentId: null,
      }).returning({ voteTableId: voteTable.id });

      const voteTableId = voteTableResponse[0].voteTableId;

      const voteProofTableResponse = await tx.insert(voteProofTable).values({
        type: "creation",
        voteId: voteTableId,
        parentId: null,
        authorDid: didWrite,
        proof: authHeader,
        proofVersion: 1
      }).returning({ voteProofTableId: voteProofTable.id });

      const voteProofTableId = voteProofTableResponse[0].voteProofTableId;

      const voteContentTableResponse = await tx.insert(voteContentTable).values({
        voteId: voteTableId,
        voteProofId: voteProofTableId,
        commentContentId: commentData.contentId,
        parentId: null,
        optionChosen: optionChosen
      }).returning({ voteContentTableId: voteContentTable.id });

      const voteContentTableId = voteContentTableResponse[0].voteContentTableId;

      await tx.update(voteTable).set({
        currentContentId: voteContentTableId,
      }).where(eq(voteTable.id, voteTableId));

      const numLikesDiff = optionChosen == "like" ? 1 : 0;
      const numDislikesDiff = optionChosen == "dislike" ? 1 : 0;

      await tx.update(commentTable).set({
        numLikes: sql`${commentTable.numLikes} + ${numLikesDiff}`,
        numDislikes: sql`${commentTable.numDislikes} + ${numDislikesDiff}`
      }).where(eq(commentTable.currentContentId, commentData.contentId));

    });

  } catch (err: unknown) {
    server.log.error(err);
    throw httpErrors.internalServerError(
      "Database error while casting new vote"
    );
  }

}

interface GetUserVotesForPostSlugIdProps {
  db: PostgresJsDatabase,
  postSlugId: string,
  userId: string
}

export async function getUserVotesForPostSlugId({
  db, postSlugId }: GetUserVotesForPostSlugIdProps): Promise<FetchUserVotesForPostSlugIdResponseResponse> {

  const userResponses = await db
    .select({
      optionChosen: voteContentTable.optionChosen,
      commentSlugId: commentTable.slugId
    })
    .from(voteTable)
    .innerJoin(voteContentTable, eq(voteContentTable.id, voteTable.currentContentId))
    .innerJoin(commentTable, eq(commentTable.id, voteTable.commentId))
    .innerJoin(postTable, eq(commentTable.postId, postTable.id))
    .where(eq(postTable.slugId, postSlugId));

  const userVoteList: FetchUserVotesForPostSlugIdResponseResponse = [];

  userResponses.forEach(response => {
    userVoteList.push({
      commentSlugId: response.commentSlugId,
      chosenOption: response.optionChosen
    })
  });

  return userVoteList;
}