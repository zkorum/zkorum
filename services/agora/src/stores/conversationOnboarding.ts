import { defineStore } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import {
  type ConversationRouteContext,
  normalConversationRouteContext,
} from "src/utils/router/conversationRouteContext";
import { getConversationPath } from "src/utils/survey/navigation";
import { ref } from "vue";

export const useConversationOnboardingStore = defineStore(
  "conversationOnboarding",
  () => {
    const auth = useAuthenticationStore();
    let sessionGeneration = 0;
    function captureSession(): () => boolean {
      const generation = sessionGeneration;
      return () => generation === sessionGeneration;
    }
    const conversationSlugId = ref<string | null>(null);
    const returnTarget = ref<string | null>(null);
    const returnHistoryPosition = ref<number | null>(null);
    const routeContext = ref<ConversationRouteContext>(
      normalConversationRouteContext
    );
    const isResumeMode = ref(false);
    const emailUpdateConsentSkipped = ref(false);
    const skippedEmailUpdateConsents = ref(new Set<string>());

    function hasSkippedEmailUpdateConsent(slugId: string): boolean {
      return skippedEmailUpdateConsents.value.has(
        JSON.stringify([slugId, auth.userId])
      );
    }

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
      sessionGeneration++;
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
      sessionGeneration++;
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
      if (conversationSlugId.value !== null) {
        skippedEmailUpdateConsents.value.add(
          JSON.stringify([conversationSlugId.value, auth.userId])
        );
      }
    }

    function clearForConversation({
      conversationSlugId: currentConversationSlugId,
    }: {
      conversationSlugId: string;
    }): void {
      if (conversationSlugId.value !== currentConversationSlugId) {
        return;
      }
      sessionGeneration++;

      conversationSlugId.value = null;
      returnTarget.value = null;
      returnHistoryPosition.value = null;
      routeContext.value = normalConversationRouteContext;
      isResumeMode.value = false;
      emailUpdateConsentSkipped.value = false;
    }

    return {
      captureSession,
      conversationSlugId,
      returnTarget,
      returnHistoryPosition,
      routeContext,
      isResumeMode,
      emailUpdateConsentSkipped,
      hasSkippedEmailUpdateConsent,
      startManualEntry,
      startResumeEntry,
      markEmailUpdateConsentSkipped,
      clearForConversation,
    };
  }
);
