import type { SupportedDisplayLanguageCodes } from "src/shared/languages";

interface ConversationOnboardingCompletionTranslations {
  onboardingComplete: string;
}

export const conversationOnboardingCompletionTranslations: Record<
  SupportedDisplayLanguageCodes,
  ConversationOnboardingCompletionTranslations
> = {
  en: { onboardingComplete: "You’re all set!" },
  ar: { onboardingComplete: "كل شيء جاهز!" },
  es: { onboardingComplete: "¡Todo listo!" },
  fa: { onboardingComplete: "همه‌چیز آماده است!" },
  fr: { onboardingComplete: "Tout est prêt !" },
  he: { onboardingComplete: "הכול מוכן!" },
  ja: { onboardingComplete: "準備ができました！" },
  ky: { onboardingComplete: "Баары даяр!" },
  ru: { onboardingComplete: "Всё готово!" },
  "zh-Hans": { onboardingComplete: "一切就绪！" },
  "zh-Hant": { onboardingComplete: "一切就緒！" },
};
