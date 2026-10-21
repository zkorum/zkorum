import { useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useLanguageStore } from "src/stores/language";
import { useBackendAuthApi } from "src/utils/api/auth";
import { useParticipationStatusCache } from "src/utils/api/participation/useParticipationStatusQuery";
import { useParticipationViewerLifetime } from "src/utils/api/participation/useParticipationViewerLifetime";
import { getSurveyFormQueryKey } from "src/utils/query/conversationQueryKeys";
import {
  useViewerQueryScope,
  type ViewerQueryScope,
} from "src/utils/query/viewerScope";
import { computed, effectScope, type MaybeRefOrGetter, toValue } from "vue";

import {
  applySurveyAnswer,
  applySurveyRecovery,
  cancelSurveyReads,
  getCachedSurveyForm,
  isObsoleteSurveyResult,
  markSurveyResultQueriesStale,
  type SurveyWriteResponse,
} from "./surveyCache";

interface SurveyWriteContext {
  readonly conversationSlugId: string;
  readonly sourceSurveyConfigId: number | undefined;
  readonly viewerScope: ViewerQueryScope;
  readonly isViewerCurrent: () => boolean;
  readonly isScreenCurrent: () => boolean;
  readonly release: () => void;
}

async function settleDiscardedMutation(mutation: {
  continue: () => Promise<unknown>;
}): Promise<void> {
  try {
    await mutation.continue();
  } catch {
    // The original mutateAsync caller owns the result/error of this operation.
  }
}

export function useSurveyWriteContext(
  conversationSlugId: MaybeRefOrGetter<string>
) {
  const queryClient = useQueryClient();
  const auth = useAuthenticationStore();
  const onboarding = useConversationOnboardingStore();
  const viewerScope = useViewerQueryScope();
  const screenLifetime = useParticipationViewerLifetime(auth);
  const participationCache = useParticipationStatusCache();
  const { ensureParticipationAuthState } = useBackendAuthApi();
  const { displayLanguage, spokenLanguages } = storeToRefs(useLanguageStore());
  const scope = {
    id: computed(() => `survey-write:${toValue(conversationSlugId)}`),
  };
  // Reset the observer on conversation changes instead of changing an in-flight
  // mutation's scope and stranding the writes queued behind it.
  const mutationKey = computed(() => [
    "survey-write",
    toValue(conversationSlugId),
  ]);

  function capture(): SurveyWriteContext {
    // A write can finish after its screen unmounts. Keep ownership tracking alive
    // until it settles, while independently suppressing obsolete screen actions.
    const operation = effectScope(true);
    const isSameViewer =
      operation.run(() => useParticipationViewerLifetime(auth).capture()) ??
      (() => false);
    let ownsCache = true;
    const slugId = toValue(conversationSlugId);
    const isScreenCurrent = screenLifetime.capture();
    const isSessionCurrent = onboarding.captureSession();
    const context: SurveyWriteContext = {
      conversationSlugId: slugId,
      sourceSurveyConfigId: getCachedSurveyForm({
        queryClient,
        conversationSlugId: slugId,
        viewerScope: viewerScope.value,
      })?.surveyConfigId,
      viewerScope: viewerScope.value,
      isViewerCurrent: () => ownsCache && isSameViewer(),
      isScreenCurrent: () => isScreenCurrent() && isSessionCurrent(),
      release: () => {
        unsubscribe();
        operation.stop();
      },
    };
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "removed") return;
      const variables: unknown = event.mutation.state.variables;
      if (
        typeof variables !== "object" ||
        variables === null ||
        !("context" in variables) ||
        variables.context !== context
      )
        return;
      // Logout clears the QueryClient before changing auth state. Invalidating
      // ownership here closes that window and prevents private cache revival.
      ownsCache = false;
      // Clearing the mutation cache also removes its queue. Let a paused write
      // settle through its ownership guard after that clear completes.
      queueMicrotask(() => {
        void settleDiscardedMutation(event.mutation);
      });
    });
    return context;
  }

  function ownerScope(context: SurveyWriteContext): ViewerQueryScope {
    return context.viewerScope.userId === undefined && auth.isGuest
      ? viewerScope.value
      : context.viewerScope;
  }

  function isObsolete({
    response,
    context,
  }: {
    response: SurveyWriteResponse;
    context: SurveyWriteContext;
  }): boolean {
    return (
      !context.isViewerCurrent() ||
      isObsoleteSurveyResult({
        queryClient,
        conversationSlugId: context.conversationSlugId,
        viewerScope: ownerScope(context),
        response,
        sourceSurveyConfigId: context.sourceSurveyConfigId,
      })
    );
  }

  async function reconcile({
    response,
    context,
  }: {
    response: SurveyWriteResponse | undefined;
    context: SurveyWriteContext;
  }): Promise<void> {
    if (response === undefined || !context.isViewerCurrent()) return;
    if (!response.success && response.reason !== "survey_changed") {
      participationCache.setStatus({
        conversationSlugId: context.conversationSlugId,
        status: response.participationStatus,
      });
      return;
    }
    await ensureParticipationAuthState();
    if (isObsolete({ response, context })) return;
    const cache = {
      queryClient,
      conversationSlugId: context.conversationSlugId,
      viewerScope: ownerScope(context),
    };
    cancelSurveyReads(cache);
    participationCache.setStatus({
      conversationSlugId: context.conversationSlugId,
      status: response.participationStatus,
    });
    if (response.recovery !== undefined) {
      applySurveyRecovery({
        ...cache,
        recovery: response.recovery,
        formQueryKey: getSurveyFormQueryKey({
          conversationSlugId: context.conversationSlugId,
          viewerScope: cache.viewerScope,
          displayLanguage: displayLanguage.value,
          spokenLanguages: spokenLanguages.value,
        }),
      });
    } else if (response.success && "savedQuestion" in response) {
      applySurveyAnswer({ ...cache, response });
    }
    await markSurveyResultQueriesStale({
      queryClient,
      conversationSlugId: context.conversationSlugId,
    });
  }

  function present<T extends SurveyWriteResponse>({
    response,
    context,
  }: {
    response: T | undefined;
    context: SurveyWriteContext;
  }): T | undefined {
    if (
      response === undefined ||
      !context.isScreenCurrent() ||
      toValue(conversationSlugId) !== context.conversationSlugId ||
      isObsolete({ response, context })
    )
      return undefined;
    return response;
  }

  return { capture, reconcile, present, scope, mutationKey };
}
