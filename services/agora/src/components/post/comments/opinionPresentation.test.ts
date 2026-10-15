import type { OpinionTarget } from "src/shared/types/dto";
import type { ConversationTypeConfig } from "src/shared/types/zod";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import { describe, expect, it } from "vitest";

import {
  resolveLinkedOpinionFilter,
  resolveOpinionView,
} from "./opinionPresentation";

describe("resolveOpinionView", () => {
  it("uses the facilitator's setting for Discover and New, but keeps review lists", () => {
    const metadata = {
      conversationType: "polis",
      votingPresentation: "one_at_a_time",
    } satisfies ConversationTypeConfig;
    const routeContext = { kind: "normal" } satisfies ConversationRouteContext;
    expect(
      resolveOpinionView({
        metadata,
        routeContext,
        filter: "discover",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "one_at_a_time", order: "discover" });
    expect(
      resolveOpinionView({
        metadata,
        routeContext,
        filter: "new",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "one_at_a_time", order: "new" });
    expect(
      resolveOpinionView({
        metadata,
        routeContext,
        filter: "my_votes",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "list", filter: "my_votes" });
    expect(
      resolveOpinionView({
        metadata,
        routeContext,
        filter: "moderated",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "list", filter: "moderated" });
    expect(
      resolveOpinionView({
        metadata,
        routeContext,
        filter: "my_statements",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "list", filter: "my_statements" });
  });

  it("opens statement URLs in a highlightable list even for one-at-a-time Discover", () => {
    expect(
      resolveOpinionView({
        metadata: {
          conversationType: "polis",
          votingPresentation: "one_at_a_time",
        },
        routeContext: { kind: "normal" },
        filter: "discover",
        hasOpinionTarget: true,
      })
    ).toEqual({ kind: "list", filter: "discover" });
  });

  it("always locks a Polis embed to Discover, including list conversations", () => {
    expect(
      resolveOpinionView({
        metadata: { conversationType: "polis", votingPresentation: "list" },
        routeContext: { kind: "embed" },
        filter: "my_votes",
        hasOpinionTarget: true,
      })
    ).toEqual({ kind: "one_at_a_time", order: "discover" });
  });

  it("does not apply Polis presentation to ranking", () => {
    expect(
      resolveOpinionView({
        metadata: { conversationType: "ranking", rankingMode: "bws" },
        routeContext: { kind: "embed" },
        filter: "discover",
        hasOpinionTarget: false,
      })
    ).toEqual({ kind: "list", filter: "discover" });
  });
});

describe("resolveLinkedOpinionFilter", () => {
  const target: OpinionTarget = {
    conversationSlugId: "conversa",
    isOwn: true,
    opinion: {
      opinionSlugId: "statement",
      opinion: "My statement",
      sourceLanguageCode: "en",
      username: "author",
      createdAt: new Date(),
      updatedAt: new Date(),
      numParticipants: 0,
      numAgrees: 0,
      numDisagrees: 0,
      numPasses: 0,
      moderation: { status: "unmoderated" },
      isSeed: false,
      displayContent: {
        sourceVersion: "source",
        status: "available",
        mode: "original",
        content: { content: "My statement" },
        translationControl: null,
      },
    },
  };

  it("resolves the same URL using the current presentation and viewer", () => {
    for (const votingPresentation of ["list", "one_at_a_time"] satisfies Array<
      "list" | "one_at_a_time"
    >) {
      const metadata = {
        conversationType: "polis",
        votingPresentation,
      } satisfies ConversationTypeConfig;
      expect(
        resolveLinkedOpinionFilter({
          metadata,
          target,
          filterSelection: { kind: "automatic" },
        })
      ).toBe(
        votingPresentation === "one_at_a_time" ? "my_statements" : "discover"
      );
      expect(
        resolveLinkedOpinionFilter({
          metadata,
          target: { ...target, isOwn: false },
          filterSelection: { kind: "automatic" },
        })
      ).toBe("discover");
    }
  });

  it("preserves an explicit filter while routing moderated statements to moderation history", () => {
    const metadata = {
      conversationType: "polis",
      votingPresentation: "one_at_a_time",
    } satisfies ConversationTypeConfig;
    expect(
      resolveLinkedOpinionFilter({
        metadata,
        target,
        filterSelection: { kind: "explicit", filter: "my_votes" },
      })
    ).toBe("my_votes");
    expect(
      resolveLinkedOpinionFilter({
        metadata,
        filterSelection: { kind: "explicit", filter: "my_votes" },
        target: {
          ...target,
          opinion: {
            ...target.opinion,
            moderation: {
              status: "moderated",
              action: "move",
              reason: "spam",
              explanation: "",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      })
    ).toBe("moderated");
  });
});
