import type { ConversationOnboardingStep } from "src/shared/types/dto";
import { describe, expect, it } from "vitest";

import { getConversationCredentialChoicePath } from "./navigation";

describe("credential choice navigation", () => {
  it.each([
    {
      nextStep: { kind: "identity", purpose: "credential" },
      suffix: "verify/identity",
    },
    { nextStep: { kind: "account", purpose: "login" }, suffix: "verify/hard" },
    { nextStep: { kind: "email", purpose: "login" }, suffix: "" },
    { nextStep: undefined, suffix: "verify/hard" },
  ] satisfies Array<{
    nextStep: ConversationOnboardingStep | undefined;
    suffix: string;
  }>)(
    "maps a backend step to the project-scoped $suffix parent",
    ({ nextStep, suffix }) => {
      expect(
        getConversationCredentialChoicePath({
          conversationSlugId: "example",
          routeContext: { kind: "project", projectSlug: "test" },
          nextStep,
        })
      ).toBe(`/project/test/conversation/example/onboarding/${suffix}`);
    }
  );
});
