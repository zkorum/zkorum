import { pollResponseContentTable, pollResponseProofTable, pollResponseTable, pollTable } from "@/schema.js";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";
import type { HttpErrors } from "@fastify/sensible";
import { eq, sql } from "drizzle-orm";
import { server } from "@/app.js";

interface SubmitPollResponseProps {
  db: PostgresDatabase;
  postSlugId: string;
  voteIndex: number;
  authorId: string;
  httpErrors: HttpErrors;
  didWrite: string;
  authHeader: string;
}

export async function submitPollResponse({
  db,
  postSlugId,
  voteIndex,
  authorId,
  httpErrors,
  didWrite,
  authHeader
}: SubmitPollResponseProps) {

  if (voteIndex < 0 || voteIndex > 5) {
    throw httpErrors.badRequest("Invalid vote index");
  }

  const { id: postId, contentId: postContentId } = await useCommonPost().getPostAndContentIdFromSlugId({
    db: db,
    postSlugId: postSlugId,
    httpErrors: httpErrors
  });

  if (postContentId == null) {
    throw httpErrors.notFound("Failed to locate post resource: " + postSlugId);
  }

  console.log("Post ID: " + postId.toString());
  console.log("Current content ID: " + postContentId.toString());

  try {


    await db.transaction(async (tx) => {

      const insertPollResponseTableResponse = await tx.insert(pollResponseTable).values({
        authorId: authorId,
        postId: postId,
      }).returning({ id: pollResponseTable.id });

      const pollResponseTableId = insertPollResponseTableResponse[0].id;

      const insertPollResponseProofTableResponse = await tx.insert(pollResponseProofTable).values({
        type: "creation",
        postId: postId,
        parentId: null,
        authorDid: didWrite,
        proof: authHeader,
        proofVersion: 1
      }).returning({ id: pollResponseTable.id });

      const pollResponseProofTableId = insertPollResponseProofTableResponse[0].id;

      const pollResponseContentTableResponse = await tx.insert(pollResponseContentTable).values({
        pollResponseId: pollResponseTableId,
        pollResponseProofId: pollResponseProofTableId,
        postContentId: postContentId,
        parentId: null,
        optionChosen: voteIndex,
      }).returning({ id: pollResponseContentTable.id });

      const pollResponseContentId = pollResponseContentTableResponse[0].id;

      const option1CountDiff = voteIndex == 0 ? 1 : 0;
      const option2CountDiff = voteIndex == 1 ? 1 : 0;
      const option3CountDiff = voteIndex == 2 ? 1 : 0;
      const option4CountDiff = voteIndex == 3 ? 1 : 0;
      const option5CountDiff = voteIndex == 4 ? 1 : 0;
      const option6CountDiff = voteIndex == 5 ? 1 : 0;

      // Update vote counter
      await tx
        .update(pollTable)
        .set({
          ...voteIndex == 0 && { option1Response: sql`${pollTable.option1Response} + ${option1CountDiff}` },
          ...voteIndex == 1 && { option2Response: sql`${pollTable.option2Response} + ${option2CountDiff}` },
          ...voteIndex == 2 && { option3Response: sql`${pollTable.option3Response} + ${option3CountDiff}` },
          ...voteIndex == 3 && { option4Response: sql`${pollTable.option4Response} + ${option4CountDiff}` },
          ...voteIndex == 4 && { option5Response: sql`${pollTable.option5Response} + ${option5CountDiff}` },
          ...voteIndex == 5 && { option6Response: sql`${pollTable.option6Response} + ${option6CountDiff}` },
        })
        .where(eq(pollTable.postContentId, postContentId));

      await db
        .update(pollResponseTable)
        .set({
          currentContentId: pollResponseContentId
        })
        .where(eq(pollResponseTable.id, pollResponseTableId));

    });
  } catch (error) {
    server.log.error(error);
    throw httpErrors.internalServerError("Error while creating poll response entry");
  }
}
