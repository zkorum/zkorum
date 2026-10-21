import type { QueryClient } from "@tanstack/vue-query";
import type {
  SurveyAnswerRecovery,
  SurveyAnswerSaveResponse,
  SurveyFormSnapshot,
  SurveyResponseWithdrawResponse,
  SurveyStatusCheckResponse,
} from "src/shared/types/dto";
import type {
  SurveyGateSummary,
  SurveyRouteResolution,
} from "src/shared/types/zod";
import {
  type getSurveyFormQueryKey,
  getSurveyStatusQueryKey,
} from "src/utils/query/conversationQueryKeys";
import {
  isQueryForViewerScope,
  type ViewerQueryScope,
} from "src/utils/query/viewerScope";

import { updateConversationQueryCache } from "../post/useConversationQuery";
import { isLiveSurveyResultsQueryKey } from "./surveyQueryKeys";

export type SurveyWriteResponse =
  | SurveyAnswerSaveResponse
  | SurveyResponseWithdrawResponse;
type SurveyVersion = Pick<
  SurveyFormSnapshot,
  "surveyConfigId" | "currentRevision"
>;

interface SurveyCacheContext {
  readonly queryClient: QueryClient;
  readonly conversationSlugId: string;
  readonly viewerScope: ViewerQueryScope;
}

export function isNewerSurveyVersion({
  current,
  incoming,
}: {
  current: SurveyVersion;
  incoming: SurveyVersion;
}): boolean {
  return (
    current.surveyConfigId > incoming.surveyConfigId ||
    (current.surveyConfigId === incoming.surveyConfigId &&
      current.currentRevision > incoming.currentRevision)
  );
}

export function getCachedSurveyForm({
  queryClient,
  conversationSlugId,
  viewerScope,
}: SurveyCacheContext): SurveyFormSnapshot | undefined {
  return queryClient
    .getQueriesData<SurveyFormSnapshot>({
      queryKey: ["survey-form", conversationSlugId],
    })
    .reduce<SurveyFormSnapshot | undefined>((latest, [queryKey, data]) => {
      if (
        data === undefined ||
        !isQueryForViewerScope({ queryKey, viewerScope })
      )
        return latest;
      return latest === undefined ||
        isNewerSurveyVersion({ current: data, incoming: latest })
        ? data
        : latest;
    }, undefined);
}

export function isObsoleteSurveyResult({
  response,
  sourceSurveyConfigId,
  ...context
}: SurveyCacheContext & {
  response: SurveyWriteResponse;
  sourceSurveyConfigId: number | undefined;
}): boolean {
  const latest = getCachedSurveyForm(context);
  if (latest === undefined) return false;
  if ("recovery" in response && response.recovery?.kind === "survey") {
    return isNewerSurveyVersion({
      current: latest,
      incoming: response.recovery.form,
    });
  }
  if (response.success && "surveyConfigId" in response) {
    return isNewerSurveyVersion({ current: latest, incoming: response });
  }
  return (
    "recovery" in response &&
    response.recovery?.kind === "no_survey" &&
    sourceSurveyConfigId !== undefined &&
    latest.surveyConfigId > sourceSurveyConfigId
  );
}

export function updateSurveyGateViewerCaches({
  surveyGate,
  routeResolution,
  ...context
}: SurveyCacheContext & {
  surveyGate: SurveyGateSummary;
  routeResolution: SurveyRouteResolution | undefined;
}): void {
  const { queryClient, conversationSlugId, viewerScope } = context;
  const queryKey = getSurveyStatusQueryKey({ conversationSlugId, viewerScope });
  if (routeResolution === undefined) {
    // Config-edit responses return a gate, not a participant continuation.
    // Keep the route stale until the backend resolves it instead of guessing.
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: "none",
    });
  } else {
    queryClient.setQueryData<SurveyStatusCheckResponse>(queryKey, {
      surveyGate,
      routeResolution,
    });
  }
  updateConversationQueryCache({
    queryClient,
    conversationSlugId,
    viewerScope,
    updateConversation: (conversation) => ({
      interaction: { ...conversation.interaction, surveyGate },
    }),
  });
}

export function applySurveyAnswer({
  response,
  ...context
}: SurveyCacheContext & {
  response: Extract<SurveyAnswerSaveResponse, { success: true }>;
}): void {
  const { queryClient, conversationSlugId, viewerScope } = context;
  const matchesViewer = (queryKey: readonly unknown[]) =>
    isQueryForViewerScope({ queryKey, viewerScope });
  // An answer delta only describes this exact questionnaire revision. Older
  // language caches must refresh their other questions before advancing revision.
  const isSameVersion = (form: SurveyFormSnapshot) =>
    form.surveyConfigId === response.surveyConfigId &&
    form.currentRevision === response.currentRevision;
  queryClient.setQueriesData<SurveyFormSnapshot>(
    {
      queryKey: ["survey-form", conversationSlugId],
      predicate: (query) => matchesViewer(query.queryKey),
    },
    (form) => {
      if (form === undefined || !isSameVersion(form)) return form;
      return {
        ...form,
        surveyGate: response.surveyGate,
        questions: form.questions.map((question) =>
          question.questionSlugId === response.savedQuestion.questionSlugId
            ? {
                ...response.savedQuestion,
                displayContent: question.displayContent,
              }
            : question
        ),
      };
    }
  );
  for (const [queryKey, form] of queryClient.getQueriesData<SurveyFormSnapshot>(
    { queryKey: ["survey-form", conversationSlugId] }
  )) {
    if (
      form !== undefined &&
      matchesViewer(queryKey) &&
      isNewerSurveyVersion({ current: response, incoming: form })
    ) {
      void queryClient.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: "none",
      });
    }
  }
  updateSurveyGateViewerCaches({
    ...context,
    surveyGate: response.surveyGate,
    routeResolution: response.routeResolution,
  });
}

function mergeRecoveryForm({
  previous,
  incoming,
}: {
  previous: SurveyFormSnapshot;
  incoming: SurveyFormSnapshot;
}): SurveyFormSnapshot {
  if (isNewerSurveyVersion({ current: previous, incoming })) return previous;
  if (
    previous.surveyConfigId !== incoming.surveyConfigId ||
    previous.currentRevision !== incoming.currentRevision
  )
    return incoming;
  const displayByQuestion = new Map(
    previous.questions.map((question) => [
      question.questionSlugId,
      question.displayContent,
    ])
  );
  return {
    ...incoming,
    questions: incoming.questions.map((question) => ({
      ...question,
      displayContent:
        displayByQuestion.get(question.questionSlugId) ??
        question.displayContent,
    })),
  };
}

export function applySurveyRecovery({
  recovery,
  formQueryKey,
  ...context
}: SurveyCacheContext & {
  recovery: SurveyAnswerRecovery;
  formQueryKey: ReturnType<typeof getSurveyFormQueryKey>;
}): void {
  const { queryClient, conversationSlugId, viewerScope } = context;
  const filters = {
    queryKey: ["survey-form", conversationSlugId],
    predicate: (query: { queryKey: readonly unknown[] }) =>
      isQueryForViewerScope({ queryKey: query.queryKey, viewerScope }),
  };
  if (recovery.kind === "survey") {
    queryClient.setQueriesData<SurveyFormSnapshot>(filters, (previous) =>
      previous === undefined
        ? undefined
        : mergeRecoveryForm({ previous, incoming: recovery.form })
    );
    if (queryClient.getQueryData(formQueryKey) === undefined)
      queryClient.setQueryData(formQueryKey, recovery.form);
  } else {
    queryClient.removeQueries(filters);
  }
  updateSurveyGateViewerCaches({
    ...context,
    surveyGate:
      recovery.kind === "survey"
        ? recovery.form.surveyGate
        : recovery.surveyGate,
    routeResolution: recovery.routeResolution,
  });
}

export function cancelSurveyReads({
  queryClient,
  conversationSlugId,
  viewerScope,
}: SurveyCacheContext): void {
  // TanStack cancellation synchronously aborts/reverts the query; seeding caches
  // in the same turn prevents guest promotion from starting a replica reread.
  for (const resource of ["survey-form", "survey-status", "conversation"]) {
    void queryClient.cancelQueries({
      queryKey: [resource, conversationSlugId],
      predicate: (query) =>
        isQueryForViewerScope({ queryKey: query.queryKey, viewerScope }),
    });
  }
}

export function removeSurveyFormCaches({
  queryClient,
  conversationSlugId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
}): void {
  queryClient.removeQueries({ queryKey: ["survey-form", conversationSlugId] });
}

export async function markSurveyQueriesStale({
  queryClient,
  conversationSlugId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
}): Promise<void> {
  await Promise.all([
    ...["survey-form", "survey-status", "conversation"].map((resource) =>
      queryClient.invalidateQueries({
        queryKey: [resource, conversationSlugId],
        refetchType: "none",
      })
    ),
    markSurveyResultQueriesStale({ queryClient, conversationSlugId }),
  ]);
}

export async function markSurveyResultQueriesStale({
  queryClient,
  conversationSlugId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
}): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["feed"], refetchType: "none" }),
    queryClient.invalidateQueries({
      queryKey: ["survey-completion-counts", conversationSlugId],
      refetchType: "none",
    }),
    queryClient.invalidateQueries({
      predicate: (query) =>
        isLiveSurveyResultsQueryKey({
          queryKey: query.queryKey,
          conversationSlugId,
        }),
      refetchType: "none",
    }),
  ]);
}
