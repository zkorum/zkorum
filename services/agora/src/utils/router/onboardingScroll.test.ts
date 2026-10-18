import { describe, expect, it } from "vitest";

import { isConversationOnboardingRoutePath } from "./conversationRouteContext";
import { shouldPreserveOnboardingScroll } from "./onboardingScroll";

const conversationTabRouteNames = new Set([
  "/conversation/[postSlugId]/",
  "/project/[projectSlug]/conversation/[postSlugId]/",
]);
const onboarding = {
  name: "/conversation/[postSlugId].onboarding/",
  params: { postSlugId: "example", projectSlug: "test" },
} satisfies Parameters<typeof shouldPreserveOnboardingScroll>[0]["from"];

describe("onboarding scroll", () => {
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
