import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import type { RouteNamedMap } from "vue-router/auto-routes";

import { getConversationMetadataSlugId } from "./conversationMetadataRoute";

describe("conversation metadata route", () => {
  it.each([
    "/conversation/[postSlugId]/",
    "/conversation/[postSlugId]/analysis",
    "/conversation/[postSlugId].embed/analysis",
    "/conversation/[postSlugId].onboarding/verify/email",
    "/project/[projectSlug]/conversation/[postSlugId]/analysis",
  ] satisfies Array<keyof RouteNamedMap>)(
    "resolves reader route %s",
    (name) => {
      expect(
        getConversationMetadataSlugId({
          name,
          params: { postSlugId: "conv1234" },
        })
      ).toBe("conv1234");
    }
  );

  it("resolves management routes with their alternate parameter name", () => {
    expect(
      getConversationMetadataSlugId({
        name: "/conversation/[conversationSlugId]/edit/",
        params: { conversationSlugId: "conv1234" },
      })
    ).toBe("conv1234");
  });

  it.each([
    "/",
    "/conversation/new/create/",
    "/conversation/import/[importSlugId]",
    "/project/[projectSlug]",
  ] satisfies Array<keyof RouteNamedMap>)(
    "ignores routes without conversation data: %s",
    (name) => {
      expect(
        getConversationMetadataSlugId({ name, params: {} })
      ).toBeUndefined();
    }
  );

  it("does not use a conversation-like parameter outside conversation routes", () => {
    expect(
      getConversationMetadataSlugId({
        name: "/settings/account/profile/",
        params: { postSlugId: "conv1234" },
      })
    ).toBeUndefined();
  });

  it("handles alternate-case URLs without lowercasing the slug", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          name: "/conversation/[postSlugId]/",
          path: "/conversation/:postSlugId",
          component: { render: () => undefined },
        },
      ],
    });
    await router.push("/CONVERSATION/Mixed123");
    expect(getConversationMetadataSlugId(router.currentRoute.value)).toBe(
      "Mixed123"
    );
  });

  it("handles alternate-case project URLs", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          name: "/project/[projectSlug]/conversation/[postSlugId]/analysis",
          path: "/project/:projectSlug/conversation/:postSlugId/analysis",
          component: { render: () => undefined },
        },
      ],
    });
    await router.push("/PROJECT/project/CONVERSATION/Mixed123/ANALYSIS");
    expect(getConversationMetadataSlugId(router.currentRoute.value)).toBe(
      "Mixed123"
    );
  });
});
