import { Dto } from "src/shared/types/dto";
import { describe, expect, it } from "vitest";

import { applyOpinionContentUpdate } from "./opinionContentUpdate";

const originalVersion = "00000000-0000-4000-8000-000000000001";
const editedVersion = "00000000-0000-4000-8000-000000000002";
const item = Dto.getOpinionBySlugIdListResponse
  .parse([
    {
      opinionSlugId: "edited01",
      opinion: "<p>Original statement</p>",
      sourceLanguageCode: "en",
      createdAt: "2026-10-10T10:00:00Z",
      updatedAt: "2026-10-10T10:00:00Z",
      username: "author",
      isSeed: false,
      isEdited: false,
      numParticipants: 1,
      numAgrees: 1,
      numDisagrees: 0,
      numPasses: 0,
      moderation: { status: "unmoderated" },
      displayContent: {
        sourceVersion: originalVersion,
        status: "available",
        mode: "translated",
        content: { content: "<p>Ancienne traduction</p>" },
        translationControl: null,
      },
    },
  ])
  .at(0);
if (item === undefined) throw new Error("Missing statement fixture");
const event = {
  conversationSlugId: "editconv",
  opinionSlugId: "edited01",
  previousSourceVersion: originalVersion,
  sourceVersion: editedVersion,
  opinion: "<p>Updated statement</p>",
  sourceLanguageCode: "en",
  timestamp: new Date("2026-10-10T11:00:00Z").getTime(),
};

describe("statement content events", () => {
  it("updates current content without reusing an old translation or changing the publication date and votes", () => {
    const updated = applyOpinionContentUpdate({ opinion: item, event });
    expect(updated).toMatchObject({
      opinion: event.opinion,
      isEdited: true,
      createdAt: item.createdAt,
      numAgrees: 1,
      displayContent: {
        sourceVersion: editedVersion,
        mode: "original",
        content: { content: event.opinion },
      },
    });
    expect(item.opinion).toBe("<p>Original statement</p>");
    expect(item.isEdited).toBe(false);
  });
  it("does not overwrite a newer version when an old event is replayed", () => {
    const updated = applyOpinionContentUpdate({ opinion: item, event });
    expect(applyOpinionContentUpdate({ opinion: updated, event })).toBe(
      updated
    );
    expect(
      applyOpinionContentUpdate({
        opinion: updated,
        event: {
          ...event,
          previousSourceVersion: "00000000-0000-4000-8000-000000000003",
        },
      })
    ).toBe(updated);
  });
});
