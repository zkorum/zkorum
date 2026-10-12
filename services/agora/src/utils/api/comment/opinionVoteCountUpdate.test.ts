import { zodDisplayedOpinionItem } from "src/shared/types/zod";
import { describe, expect, it } from "vitest";

import { applyOpinionVoteCountUpdate } from "./opinionVoteCountUpdate";

const opinion = zodDisplayedOpinionItem.parse({
  opinionSlugId: "editstat",
  opinion: "Statement",
  sourceLanguageCode: "en",
  username: "author",
  isSeed: true,
  isEdited: false,
  createdAt: "2026-10-10T10:00:00Z",
  updatedAt: "2026-10-10T10:00:00Z",
  numParticipants: 0,
  numAgrees: 0,
  numDisagrees: 0,
  numPasses: 0,
  moderation: { status: "unmoderated" },
  management: { canEdit: true, canDelete: true },
  displayContent: {
    sourceVersion: "00000000-0000-4000-8000-000000000001",
    status: "available",
    mode: "original",
    content: { content: "Statement" },
    translationControl: null,
  },
});
const counts = {
  opinionSlugId: opinion.opinionSlugId,
  numParticipants: 0,
  numAgrees: 0,
  numDisagrees: 0,
  numPasses: 0,
};

describe("live edit availability", () => {
  it("revokes seed edit availability immediately when a vote arrives", () => {
    const result = applyOpinionVoteCountUpdate({
      opinion,
      counts: { ...counts, numAgrees: 1 },
      authorHasVote: true,
    });
    expect(result.opinion.management?.canEdit).toBe(false);
  });
  it("refreshes authoritative permissions instead of granting edit rights from zero counts", () => {
    const result = applyOpinionVoteCountUpdate({
      opinion: { ...opinion, management: { canEdit: false, canDelete: true } },
      counts,
      authorHasVote: false,
    });
    expect(result.opinion.management?.canEdit).toBe(false);
    expect(result.needsPermissionRefresh).toBe(true);
  });
  it("keeps hidden statements unavailable even if their author can delete them", () => {
    const result = applyOpinionVoteCountUpdate({
      opinion: {
        ...opinion,
        management: { canEdit: false, canDelete: true },
        moderation: {
          status: "moderated",
          action: "hide",
          reason: "spam",
          explanation: "Hidden",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      counts,
      authorHasVote: false,
    });
    expect(result.opinion.management?.canEdit).toBe(false);
    expect(result.needsPermissionRefresh).toBe(false);
  });
});
