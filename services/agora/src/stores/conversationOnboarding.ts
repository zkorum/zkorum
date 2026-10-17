import { defineStore } from "pinia";
import {
  type ConversationRouteContext,
  normalConversationRouteContext,
} from "src/utils/router/conversationRouteContext";
import { getConversationPath } from "src/utils/survey/navigation";
import { ref } from "vue";

export const useConversationOnboardingStore = defineStore(
  "conversationOnboarding",
  () => {
    const conversationSlugId = ref<string | null>(null);
    const returnTarget = ref<string | null>(null);
    const returnHistoryPosition = ref<number | null>(null);
    const routeContext = ref<ConversationRouteContext>(
      normalConversationRouteContext
    );
    const isResumeMode = ref(false);
    const emailUpdateConsentSkipped = ref(false);

    function startManualEntry({
      conversationSlugId: nextConversationSlugId,
      returnTarget: nextReturnTarget,
      returnHistoryPosition: nextReturnHistoryPosition,
      routeContext: nextRouteContext = normalConversationRouteContext,
    }: {
      conversationSlugId: string;
      returnTarget?: string;
      returnHistoryPosition?: number | null;
      routeContext?: ConversationRouteContext;
    }): void {
      conversationSlugId.value = nextConversationSlugId;
      routeContext.value = nextRouteContext;
      returnTarget.value =
        nextReturnTarget ??
        getConversationPath({
          conversationSlugId: nextConversationSlugId,
          routeContext: nextRouteContext,
        });
      returnHistoryPosition.value = nextReturnHistoryPosition ?? null;
      isResumeMode.value = false;
      emailUpdateConsentSkipped.value = false;
    }

    function startResumeEntry({
      conversationSlugId: nextConversationSlugId,
      returnTarget: nextReturnTarget,
      returnHistoryPosition: nextReturnHistoryPosition,
      routeContext: nextRouteContext = normalConversationRouteContext,
    }: {
      conversationSlugId: string;
      returnTarget?: string;
      returnHistoryPosition?: number | null;
      routeContext?: ConversationRouteContext;
    }): void {
      conversationSlugId.value = nextConversationSlugId;
      routeContext.value = nextRouteContext;
      returnTarget.value =
        nextReturnTarget ??
        getConversationPath({
          conversationSlugId: nextConversationSlugId,
          routeContext: nextRouteContext,
        });
      returnHistoryPosition.value = nextReturnHistoryPosition ?? null;
      isResumeMode.value = true;
      emailUpdateConsentSkipped.value = false;
    }

    function markEmailUpdateConsentSkipped(): void {
      emailUpdateConsentSkipped.value = true;
    }

    function clearForConversation({
      conversationSlugId: currentConversationSlugId,
    }: {
      conversationSlugId: string;
    }): void {
      if (conversationSlugId.value !== currentConversationSlugId) {
        return;
      }

      conversationSlugId.value = null;
      returnTarget.value = null;
      returnHistoryPosition.value = null;
      routeContext.value = normalConversationRouteContext;
      isResumeMode.value = false;
      emailUpdateConsentSkipped.value = false;
    }

    return {
      conversationSlugId,
      returnTarget,
      returnHistoryPosition,
      routeContext,
      isResumeMode,
      emailUpdateConsentSkipped,
      startManualEntry,
      startResumeEntry,
      markEmailUpdateConsentSkipped,
      clearForConversation,
    };
  }
);
