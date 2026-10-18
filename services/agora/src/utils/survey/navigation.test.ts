import type { ParticipationMode } from "src/shared/types/zod";
import { describe, expect, it } from "vitest";

import { getConversationCredentialChoicePath } from "./navigation";

describe("credential choice navigation", () => {
  it.each([
    { participationMode: "strong_verification", suffix: "verify/identity" },
    { participationMode: "account_required", suffix: "verify/hard" },
    { participationMode: "guest", suffix: "verify/hard" },
    { participationMode: "email_verification", suffix: "" },
    { participationMode: undefined, suffix: "" },
  ] satisfies Array<{
    participationMode: ParticipationMode | undefined;
    suffix: string;
  }>)(
    "returns to the $participationMode credential choices without stored upgrade flags",
    ({ participationMode, suffix }) => {
      expect(
        getConversationCredentialChoicePath({
          conversationSlugId: "example",
          routeContext: { kind: "project", projectSlug: "test" },
          participationMode,
        })
      ).toBe(`/project/test/conversation/example/onboarding/${suffix}`);
    }
  );
});
