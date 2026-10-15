import type {
  SupportedDisplayLanguageCodes,
  SupportedSpokenLanguageCodes,
} from "src/shared/languages";
import type { FeedSortAlgorithm } from "src/shared/types/zod";
import type { ViewerQueryScope } from "src/utils/query/viewerScope";

type FeedQueryScope = readonly [
  SupportedDisplayLanguageCodes,
  readonly SupportedSpokenLanguageCodes[],
  Readonly<ViewerQueryScope>,
];
export type FeedQueryKey = readonly [
  "feed",
  FeedSortAlgorithm,
  ...FeedQueryScope,
];

export function getFeedQueryScope({
  displayLanguage,
  spokenLanguages,
  viewerScope,
}: {
  displayLanguage: SupportedDisplayLanguageCodes;
  spokenLanguages: readonly SupportedSpokenLanguageCodes[];
  viewerScope: ViewerQueryScope;
}): FeedQueryScope {
  return [displayLanguage, [...spokenLanguages].sort(), { ...viewerScope }];
}

export function getFeedQueryKey({
  sortAlgorithm,
  ...scope
}: {
  sortAlgorithm: FeedSortAlgorithm;
  displayLanguage: SupportedDisplayLanguageCodes;
  spokenLanguages: readonly SupportedSpokenLanguageCodes[];
  viewerScope: ViewerQueryScope;
}): FeedQueryKey {
  return ["feed", sortAlgorithm, ...getFeedQueryScope(scope)];
}
