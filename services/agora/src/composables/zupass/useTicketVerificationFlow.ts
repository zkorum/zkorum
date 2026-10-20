import { eventTicketRequirementBannerTranslations } from "src/components/post/EventTicketRequirementBanner.i18n";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type {
  ConversationOnboardingTicketVerifyResponse,
  VerifyEventTicket200,
} from "src/shared/types/dto";
import type { EventSlug } from "src/shared/types/zod";
import { useAuthenticationStore } from "src/stores/authentication";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useUserStore } from "src/stores/user";
import { useBackendAuthApi } from "src/utils/api/auth";
import { useParticipationStatusCache } from "src/utils/api/participation/useParticipationStatusQuery";
import { useParticipationViewerLifetime } from "src/utils/api/participation/useParticipationViewerLifetime";
import { useBackendZupassApi } from "src/utils/api/zupass";
import { useNotify } from "src/utils/ui/notify";
import { onScopeDispose } from "vue";

import { useZupassVerification } from "./useZupassVerification";

let activeVerification: symbol | undefined;

export type TicketVerificationResult =
  | { success: true; userIdChanged: boolean; needsCacheRefresh: boolean }
  | { success: false; error: string };

export interface TicketVerificationOptions {
  eventSlug: EventSlug;
  conversationSlugId?: string;
  successMessage?: string;
  onSuccess?: (result: TicketVerificationResult) => void | Promise<void>;
  onIframeReady?: () => void;
}

export function useTicketVerificationFlow() {
  const { requestTicketProof, setOnIframeReady, isVerifying } =
    useZupassVerification();
  const backend = useBackendZupassApi();
  const { updateAuthState } = useBackendAuthApi();
  const { showNotifyMessage } = useNotify();
  const auth = useAuthenticationStore();
  const user = useUserStore();
  const onboarding = useConversationOnboardingStore();
  const cache = useParticipationStatusCache();
  const lifetime = useParticipationViewerLifetime();
  const { t } = useComponentI18n(eventTicketRequirementBannerTranslations);
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
  });

  function getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      deserialization_error: t("errorDeserialization"),
      invalid_proof: t("errorInvalidProof"),
      invalid_signer: t("errorInvalidSigner"),
      wrong_event: t("errorWrongEvent"),
      ticket_already_used: t("errorTicketAlreadyUsed"),
    };
    return messages[code] ?? t("errorUnknown");
  }

  async function verifyTicket({
    eventSlug,
    conversationSlugId,
    successMessage,
    onSuccess,
    onIframeReady,
  }: TicketVerificationOptions): Promise<TicketVerificationResult> {
    if (isVerifying.value) return { success: false, error: "cancelled" };
    const attempt = Symbol();
    activeVerification = attempt;
    const initialViewer = lifetime.capture();
    let phase: { kind: "proof" } | { kind: "auth_refresh"; userId: string } = {
      kind: "proof",
    };
    const isCurrent = () =>
      activeVerification === attempt &&
      !disposed &&
      (phase.kind === "proof" ? initialViewer() : auth.userId === phase.userId);
    user.setTicketVerifying(eventSlug);
    isVerifying.value = true;
    try {
      setOnIframeReady(() => {
        if (isCurrent()) onIframeReady?.();
      });
      const proof = await requestTicketProof({ eventSlug });
      if (!isCurrent()) return { success: false, error: "cancelled" };
      if (!proof.success) {
        if (proof.error === "cancelled") {
          user.clearTicketState(eventSlug);
          return { success: false, error: "cancelled" };
        }
        const reason = proof.error ?? "unknown";
        const message = getErrorMessage(reason);
        user.setTicketError(eventSlug, message);
        showNotifyMessage(message);
        return { success: false, error: reason };
      }

      let result:
        | VerifyEventTicket200
        | ConversationOnboardingTicketVerifyResponse;
      if (conversationSlugId === undefined) {
        result = await backend.verifyEventTicket({
          proof: proof.proof,
          eventSlug,
        });
      } else {
        const response = await backend.verifyConversationEventTicket({
          request: {
            proof: proof.proof,
            eventSlug,
            conversationSlugId,
            skipEmailUpdateConsent:
              onboarding.hasSkippedEmailUpdateConsent(conversationSlugId),
          },
          isCurrent,
        });
        if (response.status === "cancelled")
          return { success: false, error: "cancelled" };
        result = response.data;
      }
      if (!isCurrent()) return { success: false, error: "cancelled" };
      if (!result.success) {
        const message = getErrorMessage(result.reason);
        user.setTicketError(eventSlug, message);
        showNotifyMessage(message);
        return { success: false, error: result.reason };
      }

      const userIdChanged = auth.userId !== result.userId;
      // Verification can deliberately create or merge into the server-returned
      // account. Only that account may receive its continuation snapshot.
      phase = { kind: "auth_refresh", userId: result.userId };
      const { needsCacheRefresh } = await updateAuthState({
        partialLoginStatus: { isKnown: true, userId: result.userId },
        deferCacheOperations: true,
      });
      if (!isCurrent()) return { success: false, error: "cancelled" };
      user.addVerifiedTicket(eventSlug);
      user.clearTicketState(eventSlug);
      if (conversationSlugId !== undefined && "participationStatus" in result)
        cache.setStatus({
          conversationSlugId,
          status: result.participationStatus,
        });
      showNotifyMessage(
        successMessage ??
          (result.accountMerged
            ? t("accountMergedSuccessfully")
            : t("eventTicketVerifiedSuccessfully"))
      );
      const verified: TicketVerificationResult = {
        success: true,
        userIdChanged,
        needsCacheRefresh,
      };
      if (onSuccess !== undefined) await onSuccess(verified);
      return verified;
    } catch {
      if (!isCurrent()) return { success: false, error: "cancelled" };
      const message = getErrorMessage("unknown");
      user.setTicketError(eventSlug, message);
      showNotifyMessage(message);
      return { success: false, error: "unknown" };
    } finally {
      if (activeVerification === attempt) {
        if (!isCurrent()) user.clearTicketState(eventSlug);
        isVerifying.value = false;
        activeVerification = undefined;
      }
    }
  }
  return { verifyTicket };
}
