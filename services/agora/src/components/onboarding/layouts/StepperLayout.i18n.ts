import type { SupportedDisplayLanguageCodes } from "src/shared/languages";

export interface StepperLayoutTranslations {
  continue: string;
}

export const stepperLayoutTranslations: Record<
  SupportedDisplayLanguageCodes,
  StepperLayoutTranslations
> = {
  en: { continue: "Continue" },
  ar: { continue: "متابعة" },
  es: { continue: "Continuar" },
  fa: { continue: "ادامه" },
  fr: { continue: "Continuer" },
  he: { continue: "המשך" },
  ja: { continue: "続ける" },
  ky: { continue: "Улантуу" },
  ru: { continue: "Продолжить" },
  "zh-Hans": { continue: "继续" },
  "zh-Hant": { continue: "繼續" },
};
