import type {
  SupportedDisplayLanguageCodes,
  SupportedSpokenLanguageCodes,
} from "src/shared/languages";

export function getOpinionTargetQueryKey({
  opinionSlugId,
  viewerUserId,
  displayLanguage,
  spokenLanguages,
}: {
  opinionSlugId: string;
  viewerUserId: string | undefined;
  displayLanguage: SupportedDisplayLanguageCodes;
  spokenLanguages: readonly SupportedSpokenLanguageCodes[];
}): readonly unknown[] {
  return [
    "opinionTarget",
    opinionSlugId,
    viewerUserId,
    displayLanguage,
    [...spokenLanguages].sort(),
  ];
}
