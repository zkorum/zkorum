import type { SupportedDisplayLanguageCodes } from "src/shared/languages";
import type { GetConversationForEditResponse } from "src/shared/types/dto";
import { zodConversationMultilingualSetting } from "src/shared/types/zod";

export type ConversationLanguageProject = NonNullable<
  Extract<
    GetConversationForEditResponse,
    { success: true }
  >["projectLanguageProject"]
>;

export function getInheritedProjectLanguageCodes(
  project: ConversationLanguageProject
): [SupportedDisplayLanguageCodes, ...SupportedDisplayLanguageCodes[]] {
  return [
    project.defaultLanguageCode,
    ...new Set(
      project.languageSettings.targetLanguageCodes.filter(
        (code) => code !== project.defaultLanguageCode
      )
    ),
  ];
}

export function getProjectLanguageOverride({
  project,
  detectedLanguageCode,
  dynamicTranslationEnabled = project.languageSettings
    .dynamicTranslationEnabled,
}: {
  project: ConversationLanguageProject;
  detectedLanguageCode: SupportedDisplayLanguageCodes | null | undefined;
  dynamicTranslationEnabled?: boolean;
}) {
  return zodConversationMultilingualSetting.safeParse({
    additionalLanguageCodes: getInheritedProjectLanguageCodes(project).filter(
      (code) => code !== detectedLanguageCode
    ),
    dynamicTranslationEnabled,
  });
}
