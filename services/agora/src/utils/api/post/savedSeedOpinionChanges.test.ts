import { QueryClient } from "@tanstack/vue-query";
import type { DisplayedOpinionItem } from "src/shared/types/zod";
import type { OpinionCache } from "src/utils/api/comment/opinionCache";
import { initialOpinionPageRequest } from "src/utils/api/comment/opinionPageBoundary";
import type { OpinionQueryScope } from "src/utils/api/comment/opinionQueryScope";
import { describe, expect, it } from "vitest";

import { createSavedSeedOpinionChanges } from "./savedSeedOpinionChanges";

const originalVersion = "00000000-0000-4000-8000-000000000001";
const savedVersion = "00000000-0000-4000-8000-000000000002";
const newerVersion = "00000000-0000-4000-8000-000000000003";
const scope: OpinionQueryScope = {
  viewerUserId: "viewer",
  displayLanguage: "en",
  spokenLanguages: ["en"],
};
function opinion({
  slugId,
  version,
  content,
}: {
  slugId: string;
  version: string;
  content: string;
}): DisplayedOpinionItem {
  return {
    opinionSlugId: slugId,
    opinion: content,
    sourceLanguageCode: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
    numParticipants: 0,
    numAgrees: 0,
    numDisagrees: 0,
    numPasses: 0,
    username: "author",
    isSeed: true,
    moderation: { status: "unmoderated" },
    displayContent: {
      sourceVersion: version,
      status: "available",
      mode: "original",
      content: { content },
      translationControl: null,
    },
  };
}
function seedCache({
  queryClient,
  key,
  items,
}: {
  queryClient: QueryClient;
  key: readonly unknown[];
  items: DisplayedOpinionItem[];
}): void {
  const request = initialOpinionPageRequest({
    conversationSlugId: "conversation",
    filter: "new",
  });
  queryClient.setQueryData<OpinionCache>(key, {
    pageParams: [request],
    pages: [{ items, nextCursor: null, nextRequest: undefined }],
  });
}

describe("saved seed statement cache updates", () => {
  it("uses confirmed content immediately and removes deletions only from the matching viewer/locale", () => {
    const queryClient = new QueryClient();
    const key = ["comments", "conversation", "new", "viewer", "en", ["en"]];
    const otherViewer = [
      "comments",
      "conversation",
      "new",
      "someone-else",
      "en",
      ["en"],
    ];
    const otherLocale = [
      "comments",
      "conversation",
      "new",
      "viewer",
      "fr",
      ["en"],
    ];
    const old = opinion({
      slugId: "edited01",
      version: originalVersion,
      content: "Original",
    });
    const deleted = opinion({
      slugId: "deleted1",
      version: originalVersion,
      content: "Deleted",
    });
    const saved = opinion({
      slugId: "edited01",
      version: savedVersion,
      content: "Confirmed edit",
    });
    for (const cacheKey of [key, otherViewer, otherLocale])
      seedCache({ queryClient, key: cacheKey, items: [old, deleted] });
    const deletedTarget = ["opinionTarget", "deleted1", "viewer", "en", ["en"]];
    queryClient.setQueryData(deletedTarget, deleted);
    const changes = createSavedSeedOpinionChanges({
      changes: [
        {
          action: "edit",
          slugId: "edited01",
          sourceVersion: originalVersion,
          content: "Confirmed edit",
        },
        {
          action: "delete",
          slugId: "deleted1",
          sourceVersion: originalVersion,
        },
      ],
      opinions: [saved],
    });
    changes.updateCache({
      queryClient,
      conversationSlugId: "conversation",
      scope,
    });
    expect(
      queryClient.getQueryData<OpinionCache>(key)?.pages.at(0)?.items
    ).toEqual([saved]);
    expect(queryClient.getQueryData(deletedTarget)).toBeUndefined();
    for (const cacheKey of [otherViewer, otherLocale])
      expect(
        queryClient.getQueryData<OpinionCache>(cacheKey)?.pages.at(0)?.items
      ).toEqual([old, deleted]);
    queryClient.clear();
  });

  it("does not overwrite a newer revision delivered before an older save response", () => {
    const queryClient = new QueryClient();
    const key = ["comments", "conversation", "new", "viewer", "en", ["en"]];
    const targetKey = ["opinionTarget", "edited01", "viewer", "en", ["en"]];
    const newer = opinion({
      slugId: "edited01",
      version: newerVersion,
      content: "Later update",
    });
    const saved = opinion({
      slugId: "edited01",
      version: savedVersion,
      content: "Earlier save",
    });
    seedCache({ queryClient, key, items: [newer] });
    queryClient.setQueryData(targetKey, newer);
    createSavedSeedOpinionChanges({
      changes: [
        {
          action: "edit",
          slugId: "edited01",
          sourceVersion: originalVersion,
          content: "Earlier save",
        },
      ],
      opinions: [saved],
    }).updateCache({ queryClient, conversationSlugId: "conversation", scope });
    expect(
      queryClient.getQueryData<OpinionCache>(key)?.pages.at(0)?.items
    ).toEqual([newer]);
    expect(queryClient.getQueryData(targetKey)).toEqual(newer);
    queryClient.clear();
  });
});
