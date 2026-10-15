import type { UpdateConversationRequest } from "@/shared/types/dto.js";
import type { SupportedDisplayLanguageCodes } from "@/shared/languages.js";
import type { InheritableProjectLanguageSettingsInput } from "./translationLanguageSetting.js";

export type ConversationTranslationSelection =
    | {
          source: "project_inherited";
          projectLanguageSettings: InheritableProjectLanguageSettingsInput;
      }
    | {
          source: "conversation_override";
          multilingualSetting: UpdateConversationRequest["multilingualSetting"];
      };

interface PersistedTranslationState {
    source: UpdateConversationRequest["languageSettingsSource"];
    dynamicTranslationEnabled: boolean;
    effectiveTargetLanguageCodes: readonly SupportedDisplayLanguageCodes[];
    primaryLanguageCode: SupportedDisplayLanguageCodes | null;
}

export type ConversationTranslationEditAccess =
    | { kind: "configure" }
    | { kind: "retain_existing"; current: PersistedTranslationState }
    | { kind: "disabled_only" };

type TranslationEditAuthorization =
    | { success: false; reason: "premium_access_required" }
    | { success: true; translationWorkEnabled: boolean };

export function authorizeConversationTranslationEdit({
    access,
    requested,
}: {
    access: ConversationTranslationEditAccess;
    requested: ConversationTranslationSelection;
}): TranslationEditAuthorization {
    const dynamicTranslationEnabled =
        requested.source === "project_inherited"
            ? requested.projectLanguageSettings.dynamicTranslationEnabled
            : requested.multilingualSetting.dynamicTranslationEnabled;
    const manualTargetLanguageCodes =
        requested.source === "project_inherited"
            ? requested.projectLanguageSettings.targetLanguageCodes
            : requested.multilingualSetting.additionalLanguageCodes;
    const retainsExistingSettings =
        access.kind === "retain_existing" &&
        access.current.source === requested.source &&
        (!dynamicTranslationEnabled ||
            access.current.dynamicTranslationEnabled) &&
        // Project targets may repeat their primary; an override must not gain a
        // manual target solely because it was previously auto-detected.
        manualTargetLanguageCodes.every(
            (code) =>
                (requested.source === "project_inherited" ||
                    code !== access.current.primaryLanguageCode) &&
                access.current.effectiveTargetLanguageCodes.includes(code),
        );
    const requestsPremiumSettings =
        dynamicTranslationEnabled || manualTargetLanguageCodes.length > 0;
    if (
        access.kind !== "configure" &&
        !retainsExistingSettings &&
        requestsPremiumSettings
    ) {
        return { success: false, reason: "premium_access_required" };
    }
    return {
        success: true,
        // Preserving expired configuration must not authorize new paid work.
        translationWorkEnabled:
            access.kind === "configure" && dynamicTranslationEnabled,
    };
}
