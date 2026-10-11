import type { SSEEventDataByType } from "src/shared/types/dto";
import type { DisplayedOpinionItem } from "src/shared/types/zod";

export function applyOpinionContentUpdate({
  opinion,
  event,
}: {
  opinion: DisplayedOpinionItem;
  event: SSEEventDataByType["opinion_updated"];
}): DisplayedOpinionItem {
  if (
    opinion.opinionSlugId !== event.opinionSlugId ||
    opinion.displayContent.sourceVersion !== event.previousSourceVersion
  )
    return opinion;
  return {
    ...opinion,
    opinion: event.opinion,
    sourceLanguageCode: event.sourceLanguageCode,
    isEdited: true,
    updatedAt: new Date(event.timestamp),
    displayContent: {
      sourceVersion: event.sourceVersion,
      status: "available",
      mode: "original",
      content: { content: event.opinion },
      translationControl: opinion.displayContent.translationControl === null ? null : {
        status: "pending", alternateMode: "translated", canRequestAlternate: true,
      },
    },
  };
}
