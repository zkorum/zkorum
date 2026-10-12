import type {
  SupportedDisplayLanguageCodes,
  SupportedSpokenLanguageCodes,
} from "src/shared/languages";

export interface OpinionQueryScope {
  readonly viewerUserId: string | undefined;
  readonly displayLanguage: SupportedDisplayLanguageCodes;
  readonly spokenLanguages: readonly SupportedSpokenLanguageCodes[];
}

export function isOpinionQueryForScope({
  queryKey,
  scope,
}: {
  queryKey: readonly unknown[];
  scope: OpinionQueryScope;
}): boolean {
  const viewerIndex =
    queryKey[0] === "comments"
      ? 3
      : queryKey[0] === "opinionTarget"
        ? 2
        : undefined;
  if (viewerIndex === undefined) return false;
  return (
    queryKey[viewerIndex] === scope.viewerUserId &&
    queryKey[viewerIndex + 1] === scope.displayLanguage &&
    JSON.stringify(queryKey[viewerIndex + 2]) ===
      JSON.stringify([...scope.spokenLanguages].sort())
  );
}
