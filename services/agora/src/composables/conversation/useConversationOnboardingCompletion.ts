import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import { useNotify } from "src/utils/ui/notify";

import { conversationOnboardingCompletionTranslations } from "./useConversationOnboardingCompletion.i18n";
import { useConversationOnboardingExit } from "./useConversationOnboardingExit";

export function useConversationOnboardingCompletion() {
  const { exitToConversation } = useConversationOnboardingExit();
  const { showNotifyMessage } = useNotify();
  const { t } = useComponentI18n(conversationOnboardingCompletionTranslations);

  async function completeOnboarding({
    conversationSlugId,
    routeContext,
  }: {
    conversationSlugId: string;
    routeContext: ConversationRouteContext;
  }): Promise<boolean> {
    const didExit = await exitToConversation({
      conversationSlugId,
      routeContext,
    });
    if (!didExit) return false;
    showNotifyMessage({
      message: t("onboardingComplete"),
      icon: "mdi-check-circle-outline",
    });
    return true;
  }

  return { completeOnboarding };
}
