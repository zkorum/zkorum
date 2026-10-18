import type { SurveyStatusCheckResponse } from "src/shared/types/dto";
import type { SurveyFormData } from "src/utils/api/survey/useSurveyQueries";

export type SurveyFormLoadMode = "all" | "incomplete" | "none";

export function shouldFetchSurveyForm({
  surveyStatus,
  mode = "all",
}: {
  surveyStatus: SurveyStatusCheckResponse | undefined;
  mode?: SurveyFormLoadMode;
}): boolean {
  return (
    surveyStatus?.surveyGate.hasSurvey === true &&
    mode !== "none" &&
    (mode === "all" || surveyStatus.surveyGate.status !== "complete_valid")
  );
}

export function resolveSurveyForm({
  surveyStatus,
  surveyForm,
}: {
  surveyStatus: SurveyStatusCheckResponse | undefined;
  surveyForm: SurveyFormData | undefined;
}): SurveyFormData | undefined {
  if (!shouldFetchSurveyForm({ surveyStatus })) {
    return undefined;
  }

  return surveyForm;
}
