import { describe, expect, it } from "vitest";

import { Dto } from "@/shared/types/dto.js";

describe("opinion page cursor contract", () => {
    const createdCursor = {
        kind: "created",
        opinionSlugId: "opinion1",
        createdAt: "2026-01-01T00:00:00.000Z",
        opinionId: 1,
    };
    const votedCursor = {
        kind: "votes",
        opinionSlugId: "opinion1",
        voteUpdatedAt: "2026-01-01T00:00:00.000Z",
        voteId: 2,
    };

    it("accepts only the cursor belonging to the requested list ordering", () => {
        expect(
            Dto.fetchOpinionPageRequest.safeParse({
                conversationSlugId: "page1234",
                filter: "new",
                cursor: createdCursor,
            }).success,
        ).toBe(true);
        expect(
            Dto.fetchOpinionPageRequest.safeParse({
                conversationSlugId: "page1234",
                filter: "new",
                cursor: votedCursor,
            }).success,
        ).toBe(false);
        expect(
            Dto.fetchOpinionPageRequest.safeParse({
                conversationSlugId: "page1234",
                filter: "my_votes",
                cursor: votedCursor,
            }).success,
        ).toBe(true);
        expect(
            Dto.fetchHiddenOpinionPageRequest.safeParse({
                conversationSlugId: "page1234",
                cursor: votedCursor,
            }).success,
        ).toBe(false);
    });

    it("requires a creation cursor for My statements and rejects a client-selected author", () => {
        const request = {
            conversationSlugId: "page1234",
            filter: "my_statements",
            cursor: createdCursor,
        };
        expect(Dto.fetchOpinionPageRequest.safeParse(request).success).toBe(
            true,
        );
        expect(
            Dto.fetchOpinionPageRequest.safeParse({
                ...request,
                cursor: votedCursor,
            }).success,
        ).toBe(false);
        expect(
            Dto.fetchOpinionPageRequest.safeParse({
                ...request,
                authorId: "another-user",
            }).success,
        ).toBe(false);
    });
});
