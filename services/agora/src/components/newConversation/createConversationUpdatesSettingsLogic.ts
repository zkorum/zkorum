export type ConversationUpdatesSettingAccess =
  | "configure"
  | "disable_only"
  | "none";

export function canSelectConversationUpdatesSettingWithAccess({
  access,
  hasParticipantContactEmail,
  scopeDefaultEnabled,
  value,
}: {
  access: ConversationUpdatesSettingAccess;
  hasParticipantContactEmail: boolean;
  scopeDefaultEnabled: boolean;
  value: boolean | undefined;
}): boolean {
  return (
    (access === "configure" ||
      (access === "disable_only" && !(value ?? scopeDefaultEnabled))) &&
    canSelectConversationUpdatesSetting({
      hasParticipantContactEmail,
      scopeDefaultEnabled,
      value,
    })
  );
}

export function shouldShowConversationUpdatesSettings({
  canConfigure,
  hasParticipantContactEmail,
  mode,
}: {
  canConfigure: boolean;
  hasParticipantContactEmail: boolean;
  mode: "create" | "edit";
}): boolean {
  return canConfigure && (mode === "edit" || hasParticipantContactEmail);
}

export function canSelectConversationUpdatesSetting({
  hasParticipantContactEmail,
  scopeDefaultEnabled,
  value,
}: {
  hasParticipantContactEmail: boolean;
  scopeDefaultEnabled: boolean;
  value: boolean | undefined;
}): boolean {
  return (
    hasParticipantContactEmail ||
    value === false ||
    (value === undefined && !scopeDefaultEnabled)
  );
}

export function hasConversationUpdatesSettingChanged({
  currentOverride,
  originalOverride,
}: {
  currentOverride: boolean | undefined;
  originalOverride: boolean | undefined;
}): boolean {
  return currentOverride !== originalOverride;
}

export function getConversationUpdatesOverrideUpdate({
  currentOverride,
  originalOverride,
}: {
  currentOverride: boolean | undefined;
  originalOverride: boolean | undefined;
}): boolean | null | undefined {
  if (currentOverride === originalOverride) {
    return undefined;
  }
  return currentOverride ?? null;
}
