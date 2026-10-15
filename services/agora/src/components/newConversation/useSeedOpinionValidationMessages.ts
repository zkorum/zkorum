import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { SeedOpinionValidationFailure } from "src/shared/types/dto";

import { seedOpinionsTranslations } from "./SeedOpinions.i18n";

export function useSeedOpinionValidationMessages() {
  const { t } = useComponentI18n(seedOpinionsTranslations);
  function getFailureMessage(failure: SeedOpinionValidationFailure): string {
    switch (failure.reason) {
      case "duplicate":
        return t("opinionDuplicate");
      case "plain_text_empty":
        return t("opinionCannotBeEmpty");
      case "html_too_long":
        return t("opinionHtmlTooLong");
      case "plain_text_too_long":
        return t("opinionExceedsLimit", {
          limit: failure.limit,
          count: failure.count,
        });
    }
  }
  return { getFailureMessage };
}
