import { describe, expect, it } from "vitest";

import { createOpinionVoteCountsTracker } from "./opinionVoteCounts";

function update(opinionSlugId: string) {
  return {
    conversationSlugId: "conversation",
    opinionVoteCounts: [
      {
        opinionSlugId,
        numAgrees: 1,
        numDisagrees: 0,
        numPasses: 0,
        numParticipants: 1,
      },
    ],
  };
}

describe("partial statement vote count ordering", () => {
  it("retains a replayed update to a different statement after newer live delivery", () => {
    const tracker = createOpinionVoteCountsTracker();
    const live = update("statement-a");
    const replay = update("statement-b");
    expect(tracker.retain({ data: live, eventId: "delivery:12" })).toEqual(
      live
    );
    expect(tracker.retain({ data: replay, eventId: "delivery:10" })).toEqual(
      replay
    );
  });

  it("does not let replay or duplicates overwrite newer counts for the same statement", () => {
    const tracker = createOpinionVoteCountsTracker();
    const data = update("statement-a");
    tracker.retain({ data, eventId: "delivery:12" });
    expect(
      tracker.retain({ data, eventId: "delivery:10" }).opinionVoteCounts
    ).toEqual([]);
    expect(
      tracker.retain({ data, eventId: "delivery:12" }).opinionVoteCounts
    ).toEqual([]);
    expect(tracker.retain({ data, eventId: "delivery:13" })).toEqual(data);
  });
});
