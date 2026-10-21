import { describe, expect, it } from "vitest";
import { partitionVoteBatches } from "./voteBatches.js";

describe("vote transaction partitioning", () => {
    it("bounds hot conversations without mixing locks or starving smaller batches", () => {
        const hot = Array.from({ length: 1001 }, (_, id) => ({
            id,
            conversationId: 1,
        }));
        const quiet = [{ id: 1001, conversationId: 2 }];
        const batches = partitionVoteBatches([...hot, ...quiet]);
        expect(
            batches.map((batch) => [batch.conversationId, batch.votes.length]),
        ).toEqual([
            [1, 500],
            [2, 1],
            [1, 500],
            [1, 1],
        ]);
        expect(
            batches
                .flatMap((batch) => batch.votes)
                .filter((vote) => vote.conversationId === 1),
        ).toEqual(hot);
    });
});
