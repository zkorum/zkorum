import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import type {
  SurveyResponseWithdrawResponse,
  SurveyStatusCheckResponse,
} from "src/shared/types/dto";
import type { SurveyGateSummary } from "src/shared/types/zod";
import {
  getSurveyFormQueryKey,
  getSurveyStatusQueryKey,
} from "src/utils/query/conversationQueryKeys";
import type {
  useViewerQueryScope,
  ViewerQueryScope,
} from "src/utils/query/viewerScope";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
} from "vue";

import type { useBackendSurveyApi } from "./survey";

const api = vi.hoisted(() => ({
  withdrawSurveyResponse:
    vi.fn<ReturnType<typeof useBackendSurveyApi>["withdrawSurveyResponse"]>(),
}));
const viewerScopeMock = vi.hoisted(() => vi.fn<typeof useViewerQueryScope>());
vi.mock("./survey", () => ({ useBackendSurveyApi: () => api }));
vi.mock("src/utils/api/auth", () => ({
  useBackendAuthApi: () => ({
    ensureParticipationAuthState: () => Promise.resolve(undefined),
  }),
}));
vi.mock(import("src/utils/query/viewerScope"), async (importOriginal) => ({
  ...(await importOriginal()),
  useViewerQueryScope: viewerScopeMock,
}));
vi.mock("src/utils/api/post/useConversationQuery", () => ({
  updateConversationQueryCache: vi.fn(),
}));

import {
  type SurveyFormData,
  useSurveyWithdrawMutation,
} from "./useSurveyQueries";

const conversationSlugId = "conversation-one";
const viewerScope = {
  kind: "viewer",
  userId: "viewer-one",
} satisfies ViewerQueryScope;
const statusKey = getSurveyStatusQueryKey({ conversationSlugId, viewerScope });
const formKey = getSurveyFormQueryKey({
  conversationSlugId,
  viewerScope,
  displayLanguage: "en",
  spokenLanguages: [],
});
const completedGate: SurveyGateSummary = {
  hasSurvey: true,
  isOptional: false,
  canParticipate: true,
  status: "complete_valid",
};
const withdrawnGate: SurveyGateSummary = {
  ...completedGate,
  canParticipate: false,
  status: "not_started",
};
const completedStatus: SurveyStatusCheckResponse = {
  surveyGate: completedGate,
  routeResolution: { kind: "summary" },
};
const completedForm: SurveyFormData = {
  success: true,
  currentRevision: 1,
  surveyGate: completedGate,
  questions: [
    {
      questionSlugId: "question-one",
      questionType: "choice",
      questionText: "How do you travel?",
      displayOrder: 0,
      isRequired: true,
      isPublicAggregateSuppressionEnabled: false,
      choiceDisplay: "list",
      constraints: { type: "choice", minSelections: 1, maxSelections: 1 },
      options: [
        { optionSlugId: "bicycle", optionText: "Bicycle", displayOrder: 0 },
      ],
      currentAnswer: { questionType: "choice", optionSlugIds: ["bicycle"] },
      isPassed: false,
      isStale: false,
      isMissingRequired: false,
      isCurrentAnswerValid: true,
      currentSemanticVersion: 1,
      answeredQuestionSemanticVersion: 1,
      displayContent: {
        status: "available",
        mode: "original",
        sourceVersion: "00000000-0000-4000-8000-000000000001",
        content: {
          questionText: "How do you travel?",
          options: [{ optionSlugId: "bicycle", optionText: "Bicycle" }],
        },
        translationControl: null,
      },
    },
  ],
};

const apps: App[] = [];
const clients: QueryClient[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  for (const client of clients.splice(0)) client.clear();
  vi.resetAllMocks();
});

function mountWithdrawal() {
  const queryClient = new QueryClient();
  clients.push(queryClient);
  queryClient.setQueryData(statusKey, completedStatus);
  queryClient.setQueryData(formKey, completedForm);
  const activeConversationSlugId = ref(conversationSlugId);
  const activeViewerScope = ref<ViewerQueryScope>(viewerScope);
  viewerScopeMock.mockReturnValue(computed(() => activeViewerScope.value));
  let withdraw:
    | ReturnType<typeof useSurveyWithdrawMutation>["mutateAsync"]
    | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        const mutation = useSurveyWithdrawMutation({
          conversationSlugId: activeConversationSlugId,
        });
        withdraw = mutation.mutateAsync;
        return () => h("div");
      },
    })
  );
  app.use(VueQueryPlugin, { queryClient });
  app.mount(document.createElement("div"));
  apps.push(app);
  api.withdrawSurveyResponse.mockResolvedValue({
    status: "success",
    data: {
      success: true,
      surveyGate: withdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    },
  });
  if (withdraw === undefined) throw new Error("Withdrawal was not mounted");
  return { queryClient, withdraw, activeConversationSlugId, activeViewerScope };
}

describe("survey withdrawal cache", () => {
  it("keeps the cleared survey fresh when navigating from welcome", async () => {
    const { queryClient, withdraw } = mountWithdrawal();

    await withdraw();

    // fetchQuery, like mounting the next onboarding step, reuses fresh data.
    const staleStatusRead = vi.fn(() => Promise.resolve(completedStatus));
    const staleFormRead = vi.fn(() => Promise.resolve(completedForm));
    const status = await queryClient.fetchQuery({
      queryKey: statusKey,
      queryFn: staleStatusRead,
      staleTime: 30_000,
    });
    const form = await queryClient.fetchQuery({
      queryKey: formKey,
      queryFn: staleFormRead,
      staleTime: 30_000,
    });

    expect(status).toEqual({
      surveyGate: withdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    });
    expect(form.questions[0]).toMatchObject({
      currentAnswer: undefined,
      isPassed: false,
      isCurrentAnswerValid: false,
      isMissingRequired: true,
      answeredQuestionSemanticVersion: undefined,
    });
    expect(staleStatusRead).not.toHaveBeenCalled();
    expect(staleFormRead).not.toHaveBeenCalled();
  });

  it("prevents pre-withdrawal reads from restoring answers and summary navigation", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    const statusRead = Promise.withResolvers<SurveyStatusCheckResponse>();
    const formRead = Promise.withResolvers<SurveyFormData>();
    const statusAborted = vi.fn();
    const formAborted = vi.fn();
    const pendingStatus = queryClient.fetchQuery({
      queryKey: statusKey,
      queryFn: ({ signal }) => {
        signal.addEventListener("abort", statusAborted);
        return statusRead.promise;
      },
    });
    const pendingForm = queryClient.fetchQuery({
      queryKey: formKey,
      queryFn: ({ signal }) => {
        signal.addEventListener("abort", formAborted);
        return formRead.promise;
      },
    });
    const readsSettled = Promise.allSettled([pendingStatus, pendingForm]);

    await withdraw();
    statusRead.resolve(completedStatus);
    formRead.resolve(completedForm);
    await readsSettled;
    await nextTick();

    expect(statusAborted).toHaveBeenCalledOnce();
    expect(formAborted).toHaveBeenCalledOnce();
    expect(
      queryClient.getQueryData<SurveyStatusCheckResponse>(statusKey)
    ).toEqual({
      surveyGate: withdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    });
    expect(
      queryClient.getQueryData<SurveyFormData>(formKey)?.questions[0]
        ?.currentAnswer
    ).toBeUndefined();
  });

  it("discards the completed route even when the form is no longer cached", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    queryClient.removeQueries({ queryKey: formKey, exact: true });

    await withdraw();

    expect(
      queryClient.getQueryData<SurveyStatusCheckResponse>(statusKey)
    ).toEqual({
      surveyGate: withdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    });
    expect(queryClient.getQueryData(formKey)).toBeUndefined();
  });

  it("uses the backend route even when cached questions suggest a different destination", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    api.withdrawSurveyResponse.mockResolvedValue({
      status: "success",
      data: {
        success: true,
        surveyGate: withdrawnGate,
        routeResolution: {
          kind: "question",
          questionSlugId: "server-question",
        },
      },
    });

    await withdraw();

    expect(
      queryClient.getQueryData<SurveyStatusCheckResponse>(statusKey)
    ).toEqual({
      surveyGate: withdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "server-question" },
    });
  });

  it("updates the request's conversation and viewer if navigation or identity changes", async () => {
    const {
      queryClient,
      withdraw,
      activeConversationSlugId,
      activeViewerScope,
    } = mountWithdrawal();
    const response = Promise.withResolvers<{
      status: "success";
      data: SurveyResponseWithdrawResponse;
    }>();
    api.withdrawSurveyResponse.mockReturnValue(response.promise);
    const otherViewer = {
      kind: "viewer",
      userId: "viewer-two",
    } satisfies ViewerQueryScope;
    const otherViewerStatusKey = getSurveyStatusQueryKey({
      conversationSlugId,
      viewerScope: otherViewer,
    });
    const otherConversationStatusKey = getSurveyStatusQueryKey({
      conversationSlugId: "conversation-two",
      viewerScope: otherViewer,
    });
    queryClient.setQueryData(otherViewerStatusKey, completedStatus);
    queryClient.setQueryData(otherConversationStatusKey, completedStatus);

    const pending = withdraw();
    await vi.waitFor(() =>
      expect(api.withdrawSurveyResponse).toHaveBeenCalledOnce()
    );
    activeConversationSlugId.value = "conversation-two";
    activeViewerScope.value = otherViewer;
    response.resolve({
      status: "success",
      data: {
        success: true,
        surveyGate: withdrawnGate,
        routeResolution: { kind: "question", questionSlugId: "question-one" },
      },
    });
    await pending;

    expect(api.withdrawSurveyResponse).toHaveBeenCalledWith({
      conversationSlugId,
    });
    expect(
      queryClient.getQueryData<SurveyStatusCheckResponse>(statusKey)?.surveyGate
    ).toEqual(withdrawnGate);
    expect(queryClient.getQueryData(otherViewerStatusKey)).toEqual(
      completedStatus
    );
    expect(queryClient.getQueryData(otherConversationStatusKey)).toEqual(
      completedStatus
    );
    expect(queryClient.getQueryState(otherViewerStatusKey)?.isInvalidated).toBe(
      false
    );
  });

  it("clears passed optional questions in every cached language for this viewer only", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    const translatedKey = getSurveyFormQueryKey({
      conversationSlugId,
      viewerScope,
      displayLanguage: "fr",
      spokenLanguages: [],
    });
    const otherViewerKey = getSurveyFormQueryKey({
      conversationSlugId,
      viewerScope: { kind: "viewer", userId: "viewer-two" },
      displayLanguage: "en",
      spokenLanguages: [],
    });
    const optionalGate: SurveyGateSummary = {
      ...completedGate,
      isOptional: true,
    };
    const optionalWithdrawnGate: SurveyGateSummary = {
      ...optionalGate,
      status: "not_started",
    };
    const passedForm: SurveyFormData = {
      ...completedForm,
      surveyGate: optionalGate,
      questions: completedForm.questions.map((question) => ({
        ...question,
        isRequired: false,
        currentAnswer: undefined,
        isPassed: true,
        isCurrentAnswerValid: false,
      })),
    };
    queryClient.setQueryData(formKey, passedForm);
    queryClient.setQueryData(translatedKey, passedForm);
    queryClient.setQueryData(otherViewerKey, completedForm);
    queryClient.setQueryData<SurveyStatusCheckResponse>(statusKey, {
      surveyGate: optionalGate,
      routeResolution: { kind: "summary" },
    });
    api.withdrawSurveyResponse.mockResolvedValue({
      status: "success",
      data: {
        success: true,
        surveyGate: optionalWithdrawnGate,
        routeResolution: { kind: "question", questionSlugId: "question-one" },
      },
    });

    await withdraw();

    expect(
      queryClient.getQueryData<SurveyStatusCheckResponse>(statusKey)
    ).toEqual({
      surveyGate: optionalWithdrawnGate,
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    });
    expect(
      queryClient.getQueryData<SurveyFormData>(translatedKey)?.questions[0]
    ).toMatchObject({
      currentAnswer: undefined,
      isPassed: false,
      isCurrentAnswerValid: false,
      isMissingRequired: false,
      answeredQuestionSemanticVersion: undefined,
    });
    expect(
      queryClient.getQueryData<SurveyFormData>(formKey)?.questions[0]
        ?.currentAnswer
    ).toBeUndefined();
    expect(queryClient.getQueryData(otherViewerKey)).toEqual(completedForm);
    expect(queryClient.getQueryState(otherViewerKey)?.isInvalidated).toBe(
      false
    );
  });

  it("invalidates live results and counts while preserving checkpoint caches", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    const feedKey = ["feed", viewerScope];
    const countsKey = ["survey-completion-counts", conversationSlugId];
    const liveResultsKey = [
      "survey-results-aggregated",
      conversationSlugId,
      undefined,
      undefined,
      "en",
      [],
    ];
    const checkpointKey = [
      "survey-results-aggregated",
      conversationSlugId,
      undefined,
      42,
      "en",
      [],
    ];
    const otherConversationKey = [
      "survey-completion-counts",
      "conversation-two",
    ];
    for (const key of [
      feedKey,
      countsKey,
      liveResultsKey,
      checkpointKey,
      otherConversationKey,
    ]) {
      queryClient.setQueryData(key, {});
    }

    await withdraw();

    for (const key of [feedKey, countsKey, liveResultsKey]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of [checkpointKey, otherConversationKey]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
  });

  it("keeps answers when the server refuses withdrawal", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    api.withdrawSurveyResponse.mockResolvedValue({
      status: "success",
      data: { success: false, reason: "conversation_closed" },
    });

    await expect(withdraw()).resolves.toEqual({
      success: false,
      reason: "conversation_closed",
    });

    expect(queryClient.getQueryData(statusKey)).toEqual(completedStatus);
    expect(queryClient.getQueryData(formKey)).toEqual(completedForm);
    expect(queryClient.getQueryState(statusKey)?.isInvalidated).toBe(false);
  });

  it("keeps answers when the withdrawal request fails", async () => {
    const { queryClient, withdraw } = mountWithdrawal();
    api.withdrawSurveyResponse.mockRejectedValue(
      new Error("Network unavailable")
    );

    await expect(withdraw()).rejects.toThrow("Network unavailable");

    expect(queryClient.getQueryData(statusKey)).toEqual(completedStatus);
    expect(queryClient.getQueryData(formKey)).toEqual(completedForm);
  });
});
