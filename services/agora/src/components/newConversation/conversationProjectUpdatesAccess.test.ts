import { describe, expect, it } from "vitest";

import { canSelectConversationUpdatesSettingWithAccess } from "./createConversationUpdatesSettingsLogic";

describe("Email Update settings during project moves", () => {
  it("allows explicit off without enabling unavailable features", () => {
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "disable_only",
        hasParticipantContactEmail: false,
        scopeDefaultEnabled: true,
        value: false,
      })
    ).toBe(true);
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "disable_only",
        hasParticipantContactEmail: true,
        scopeDefaultEnabled: false,
        value: true,
      })
    ).toBe(false);
  });
  it("allows inheriting a disabled default but not an enabled default", () => {
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "disable_only",
        hasParticipantContactEmail: true,
        scopeDefaultEnabled: false,
        value: undefined,
      })
    ).toBe(true);
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "disable_only",
        hasParticipantContactEmail: true,
        scopeDefaultEnabled: true,
        value: undefined,
      })
    ).toBe(false);
  });
  it("retains the contact and authorization requirements for enablement", () => {
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "configure",
        hasParticipantContactEmail: false,
        scopeDefaultEnabled: false,
        value: true,
      })
    ).toBe(false);
    expect(
      canSelectConversationUpdatesSettingWithAccess({
        access: "none",
        hasParticipantContactEmail: true,
        scopeDefaultEnabled: false,
        value: false,
      })
    ).toBe(false);
  });
});
