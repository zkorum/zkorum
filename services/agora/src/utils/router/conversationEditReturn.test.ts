import { describe, expect, it } from "vitest";

import {
  getConversationEditFallbackPath,
  getConversationEditReturnPath,
} from "./conversationEditReturn";

describe("getConversationEditReturnPath", () => {
  it("keeps a project-scoped return route when the assignment is unchanged", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo:
          "/project/source/conversation/abc123/analysis?view=groups#top",
      })
    ).toBe("/project/source/conversation/abc123/analysis?view=groups#top");
  });

  it("returns to the destination project while preserving tab and query state", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo:
          "/project/source/conversation/abc123/analysis?view=groups#top",
        projectAssignment: {
          previousProjectSlug: "source",
          projectSlug: "destination",
          projectTitle: "Destination",
          target: { kind: "project", projectSlug: "destination" },
        },
      })
    ).toBe("/project/destination/conversation/abc123/analysis?view=groups#top");
  });

  it("returns to the normal route after removing the listed project", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/project/source/conversation/abc123/report",
        projectAssignment: {
          previousProjectSlug: "source",
          projectSlug: "org-default",
          projectTitle: "Organization",
          target: { kind: "no_project", organizationSlug: "owner" },
        },
      })
    ).toBe("/conversation/abc123/report");
  });

  it("does not accept another conversation's project return route", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/project/source/conversation/other/analysis",
      })
    ).toBe("/conversation/abc123/");
  });
  it("keeps same-conversation tabs and query state", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/conversation/abc123/analysis?view=groups#top",
      })
    ).toBe("/conversation/abc123/analysis?view=groups#top");
  });

  it("keeps same-conversation report routes", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/conversation/abc123/report",
      })
    ).toBe("/conversation/abc123/report");
  });

  it("falls back to the base conversation page for other conversations", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/conversation/other/analysis",
      })
    ).toBe("/conversation/abc123/");
  });

  it("falls back to the base conversation page for edit routes", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "/conversation/abc123/edit/survey",
      })
    ).toBe("/conversation/abc123/");
  });

  it("falls back to the base conversation page for non-path return values", () => {
    expect(
      getConversationEditReturnPath({
        conversationSlugId: "abc123",
        returnTo: "https://example.com/conversation/abc123",
      })
    ).toBe("/conversation/abc123/");
  });
});

describe("getConversationEditFallbackPath", () => {
  it("preserves the project but returns to the main view with navigation", () => {
    expect(
      getConversationEditFallbackPath({
        conversationSlugId: "abc123",
        returnTo:
          "/project/source/conversation/abc123/analysis?view=groups#top",
      })
    ).toBe("/project/source/conversation/abc123/");
  });

  it.each(
    [
      "/conversation/abc123/onboarding/verify",
      "/conversation/abc123/edit/survey",
      "/conversation/abc123/%65dit",
      "/conversation/abc123.embed/analysis?embedded=true",
      "/conversation/other/",
      "https://example.com/conversation/abc123/",
      "//example.com/conversation/abc123/",
      "/\\example.com/conversation/abc123/",
      "/\\invalid:port/conversation/abc123/",
      "javascript:alert(1)",
      ["/conversation/abc123/", "https://example.com/"],
      null,
      undefined,
    ].map((returnTo) => ({ returnTo }))
  )("uses a normal same-conversation view for $returnTo", ({ returnTo }) => {
    expect(
      getConversationEditFallbackPath({
        conversationSlugId: "abc123",
        returnTo,
      })
    ).toBe("/conversation/abc123/");
  });

  it("returns home when there is no conversation identifier", () => {
    expect(
      getConversationEditFallbackPath({
        conversationSlugId: "",
        returnTo: "/conversation/abc123/",
      })
    ).toBe("/");
  });
});
