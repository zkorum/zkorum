import { describe, expect, it } from "vitest";
import type { RouteRecordRaw } from "vue-router";

import { withOnboardingAliases } from "./onboardingAliases";

describe("onboarding route aliases", () => {
  it("adds project and embed paths recursively without mutating generated route records", () => {
    const child = {
      path: "verify/email-code",
      name: "/conversation/[postSlugId].onboarding/verify/email-code",
      component: { render: () => null },
      alias: "/existing-alias",
    } satisfies RouteRecordRaw;
    const parent = {
      path: "/conversation/:postSlugId/onboarding",
      name: "/conversation/[postSlugId].onboarding",
      component: { render: () => null },
      children: [child],
    } satisfies RouteRecordRaw;
    const result = withOnboardingAliases([parent]);
    expect(result[0]?.alias).toEqual([
      "/project/:projectSlug/conversation/:postSlugId/onboarding",
      "/conversation/:postSlugId/embed/onboarding",
    ]);
    expect(result[0]?.children?.[0]?.alias).toEqual([
      "/existing-alias",
      "/project/:projectSlug/conversation/:postSlugId/onboarding/verify/email-code",
      "/conversation/:postSlugId/embed/onboarding/verify/email-code",
    ]);
    expect("alias" in parent).toBe(false);
    expect(child.alias).toBe("/existing-alias");
    expect(withOnboardingAliases(result)).toEqual(result);
  });
});
