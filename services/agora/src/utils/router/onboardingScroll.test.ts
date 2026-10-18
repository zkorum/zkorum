import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import { isConversationOnboardingRoutePath } from "./conversationRouteContext";
import {
  createOnboardingScrollPreservation,
  shouldPreserveOnboardingScroll,
} from "./onboardingScroll";

const conversationTabRouteNames = new Set([
  "/conversation/[postSlugId]/",
  "/project/[projectSlug]/conversation/[postSlugId]/",
]);
const onboarding = {
  name: "/conversation/[postSlugId].onboarding/",
  params: { postSlugId: "example", projectSlug: "test" },
} satisfies Parameters<typeof shouldPreserveOnboardingScroll>[0]["from"];

describe("onboarding scroll", () => {
  it("retains the origin through steps and forgets it after returning", async () => {
    const component = { render: () => null };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "/", component },
        { path: "/other", name: "/settings/", component },
        {
          path: "/onboarding",
          name: "/conversation/[postSlugId].onboarding/",
          component,
        },
        {
          path: "/onboarding/summary",
          name: "/conversation/[postSlugId].onboarding/summary",
          component,
        },
      ],
    });
    await router.push("/?filter=recent");
    const origin = router.currentRoute.value;
    await router.push("/onboarding");
    const firstStep = router.currentRoute.value;
    await router.push("/onboarding/summary");
    const summary = router.currentRoute.value;
    await router.push("/other");
    const other = router.currentRoute.value;
    const scroll = createOnboardingScrollPreservation({
      conversationTabRouteNames,
    });
    expect(scroll.shouldPreserveScroll({ to: firstStep, from: origin })).toBe(
      true
    );
    expect(scroll.shouldPreserveScroll({ to: summary, from: firstStep })).toBe(
      true
    );
    expect(scroll.shouldPreserveScroll({ to: origin, from: summary })).toBe(
      true
    );
    expect(scroll.shouldPreserveScroll({ to: firstStep, from: other })).toBe(
      true
    );
    expect(scroll.shouldPreserveScroll({ to: origin, from: firstStep })).toBe(
      false
    );
  });
  it("preserves the originating feed's scroll without suppressing scrolling to other pages", () => {
    expect(
      shouldPreserveOnboardingScroll({
        to: { name: "/", params: {}, fullPath: "/?filter=recent" },
        from: onboarding,
        conversationTabRouteNames,
        originFullPath: "/?filter=recent",
      })
    ).toBe(true);
    expect(
      shouldPreserveOnboardingScroll({
        to: { name: "/", params: {}, fullPath: "/" },
        from: onboarding,
        conversationTabRouteNames,
        originFullPath: "/?filter=recent",
      })
    ).toBe(false);
  });
  it("preserves scroll when opening the sheet and returning to the same scoped conversation", () => {
    const conversation = {
      name: "/project/[projectSlug]/conversation/[postSlugId]/",
      params: { postSlugId: "example", projectSlug: "test" },
    } satisfies Parameters<typeof shouldPreserveOnboardingScroll>[0]["to"];
    expect(
      shouldPreserveOnboardingScroll({
        to: onboarding,
        from: conversation,
        conversationTabRouteNames,
      })
    ).toBe(true);
    expect(
      shouldPreserveOnboardingScroll({
        to: conversation,
        from: onboarding,
        conversationTabRouteNames,
      })
    ).toBe(true);
  });

  it("keeps normal scrolling for unrelated destinations and other projects", () => {
    expect(
      shouldPreserveOnboardingScroll({
        to: { name: "/settings/", params: {} },
        from: onboarding,
        conversationTabRouteNames,
      })
    ).toBe(false);
    expect(
      shouldPreserveOnboardingScroll({
        to: {
          name: "/project/[projectSlug]/conversation/[postSlugId]/",
          params: { postSlugId: "example", projectSlug: "other" },
        },
        from: onboarding,
        conversationTabRouteNames,
      })
    ).toBe(false);
  });

  it.each([
    ["/conversation/example/onboarding/", true],
    ["/project/test/conversation/example/onboarding/verify/email", true],
    ["/conversation/onboarding/", false],
    ["/project/onboarding/conversation/example/", false],
    ["/conversation/example/onboarding-preview", false],
  ])(
    "identifies onboarding path %s without confusing identifiers with route segments",
    (path, expected) => {
      expect(isConversationOnboardingRoutePath(path)).toBe(expected);
    }
  );
});
