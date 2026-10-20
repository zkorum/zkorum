import type { ConversationOnboardingPreferenceSaveRequest } from "src/shared/types/dto";
import { useBackendConversationEmailUpdatesApi } from "src/utils/api/conversationUpdates/conversationEmailUpdates";

import { useParticipationStatusCache } from "./useParticipationStatusQuery";
import { useParticipationViewerLifetime } from "./useParticipationViewerLifetime";

export function useSaveOnboardingPreference() {
  const api = useBackendConversationEmailUpdatesApi();
  const cache = useParticipationStatusCache();
  const lifetime = useParticipationViewerLifetime();

  async function savePreference(
    request: ConversationOnboardingPreferenceSaveRequest
  ) {
    const isCurrent = lifetime.capture();
    try {
      const result = await api.saveOnboardingPreference({ request, isCurrent });
      if (!isCurrent() || result.status === "cancelled") return undefined;
      const response = result.data;
      if (response.success)
        cache.setStatus({
          conversationSlugId: request.conversationSlugId,
          status: response.participationStatus,
        });
      return response;
    } catch (error) {
      if (!isCurrent()) return undefined;
      throw error;
    }
  }
  return { savePreference };
}
