import type {
  SurveyAnswerSaveResponse,
  SurveyStatusCheckResponse,
} from "src/shared/types/dto";
import type { SurveyGateSummary } from "src/shared/types/zod";
import type {
  SurveyFormData,
  useSurveyAnswerSaveMutation,
} from "src/utils/api/survey/useSurveyQueries";
import { createDismissalController } from "src/utils/ui/dismissalController";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, ref } from "vue";

const saveAnswer = vi.hoisted(() =>
  vi.fn<ReturnType<typeof useSurveyAnswerSaveMutation>["mutateAsync"]>()
);
const exitToConversation = vi.hoisted(() => vi.fn());
const showNotifyMessage = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const navigateToSurveyRoot = vi.hoisted(() => vi.fn());
const handleVueError = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  optional: false,
  completed: false,
  hasNextQuestion: false,
}));

vi.mock("pinia", () => ({ storeToRefs: (store: object) => store }));
vi.mock("src/stores/language", () => ({
  useLanguageStore: () => ({ displayLanguage: ref("en") }),
}));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingRoute", () => ({
  useConversationOnboardingRoute: () => ({
    route: { params: { questionSlugId: "question-one" } },
    routeConversationSlugId: ref("conversation-one"),
    routeContext: ref({ kind: "project", projectSlug: "project-one" }),
  }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({ exitToConversation }),
}));
vi.mock("src/composables/conversation/useSurveyNavigation", () => ({
  useSurveyNavigation: () => ({
    navigateToNextSurveyStep: vi.fn(),
    navigateToSurveyRoot,
  }),
}));
vi.mock("src/utils/nav/goBackButton", () => ({
  useGoBackButtonHandler: () => ({ safeNavigateBack: vi.fn() }),
}));
vi.mock("src/utils/query/viewerScope", () => ({
  useViewerQueryScope: () => ref({ userId: "user-one" }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({
    t: (key: string) =>
      key === "onboardingComplete" ? "You’re all set!" : key,
  }),
}));
vi.mock("src/utils/api/survey/useSurveyQueries", () => ({
  useSurveyAnswerSaveMutation: () => ({
    mutateAsync: saveAnswer,
    isPending: ref(false),
  }),
}));
vi.mock("src/composables/conversation/useConversationSurveyState", () => ({
  useConversationSurveyState: () => ({
    conversationData: ref(undefined),
    conversationDisplayContent: ref(undefined),
    conversationSlugId: ref("conversation-one"),
    surveyStatus: ref<SurveyStatusCheckResponse>({
      surveyGate: createSurveyGate(),
      routeResolution: { kind: "question", questionSlugId: "question-one" },
    }),
    surveyForm: ref<SurveyFormData>({
      success: true,
      currentRevision: 1,
      surveyGate: createSurveyGate(),
      questions: state.hasNextQuestion
        ? [
            createQuestion(),
            {
              ...createQuestion(),
              questionSlugId: "question-two",
              displayOrder: 1,
            },
          ]
        : [createQuestion()],
    }),
    surveyStepTotal: ref(state.hasNextQuestion ? 4 : 3),
    requirementState: ref({ needsAuth: false, needsTicket: false }),
    isInitialLoading: ref(false),
    hasLoadError: ref(false),
    refetchAll: vi.fn(),
  }),
}));
vi.mock("src/utils/translation/useSurveyQuestionDisplayContent", () => ({
  useSurveyQuestionDisplayContent: () => ({
    displayedContent: ref({ questionText: "Transport?", options: [] }),
    translationPreview: ref(undefined),
    translationMode: ref("original"),
  }),
}));
vi.mock("src/components/editor/Editor.vue", () => ({
  default: defineComponent(() => () => null),
}));
vi.mock("src/layouts/ConversationOnboardingLayout.vue", () => ({
  default: defineComponent({
    name: "OnboardingLayout",
    props: { closeCallback: { type: Function, required: true } },
    setup(props, { slots }) {
      return () =>
        h("main", [
          h("button", { onClick: props.closeCallback }, "Close"),
          slots.default?.(),
        ]);
    },
  }),
}));
vi.mock("src/components/onboarding/layouts/StepperLayout.vue", () => ({
  default: defineComponent({
    name: "StepperLayout",
    props: { submitCallBack: { type: Function, required: true } },
    setup(props, { slots }) {
      return () =>
        h("section", [
          slots.body?.(),
          h("button", { onClick: props.submitCallBack }, "Next"),
        ]);
    },
  }),
}));
vi.mock("src/components/survey/SurveyChoiceInput.vue", () => ({
  default: defineComponent(
    (_props, { emit }) =>
      () =>
        h(
          "button",
          {
            onClick: () => emit("update:selectedSingleOptionSlugId", "bicycle"),
          },
          "Bicycle"
        ),
    { emits: ["update:selectedSingleOptionSlugId"] }
  ),
}));

import SurveyQuestion from "./question.[questionSlugId].vue";

function createQuestion(): Extract<
  SurveyFormData["questions"][number],
  { questionType: "choice" }
> {
  return {
    questionSlugId: "question-one",
    questionType: "choice",
    questionText: "Transport?",
    displayOrder: 0,
    isRequired: !state.optional,
    isPublicAggregateSuppressionEnabled: false,
    choiceDisplay: "list",
    constraints: { type: "choice", minSelections: 1, maxSelections: 1 },
    options: [
      { optionSlugId: "bicycle", optionText: "Bicycle", displayOrder: 0 },
    ],
    isPassed: false,
    isStale: false,
    currentAnswer: state.completed
      ? { questionType: "choice", optionSlugIds: ["bicycle"] }
      : undefined,
    isMissingRequired: !state.optional && !state.completed,
    isCurrentAnswerValid: state.completed,
    currentSemanticVersion: 1,
    displayContent: {
      status: "available",
      mode: "original",
      sourceVersion: "00000000-0000-4000-8000-000000000001",
      content: {
        questionText: "Transport?",
        options: [{ optionSlugId: "bicycle", optionText: "Bicycle" }],
      },
      translationControl: null,
    },
  };
}

function createSurveyGate(): SurveyGateSummary {
  return {
    hasSurvey: true,
    isOptional: state.optional,
    canParticipate: state.optional || state.completed,
    status: state.completed ? "complete_valid" : "in_progress",
  };
}

function createSaveResponse({
  justCompleted = true,
  status = "complete_valid",
}: {
  justCompleted?: boolean;
  status?: SurveyGateSummary["status"];
} = {}): Extract<SurveyAnswerSaveResponse, { success: true }> {
  return {
    success: true,
    justCompleted,
    surveyGate: {
      ...createSurveyGate(),
      status,
      canParticipate: status === "complete_valid" || state.optional,
    },
  };
}

const apps: App[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  state.optional = false;
  state.completed = false;
  state.hasNextQuestion = false;
  saveAnswer.mockResolvedValue(createSaveResponse());
  exitToConversation.mockResolvedValue(true);
});
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

function mountQuestion(): HTMLElement {
  const target = document.createElement("div");
  document.body.append(target);
  const app = createApp(SurveyQuestion, {
    sheet: createDismissalController({
      fallbackDismiss: () => Promise.resolve(),
    }),
  });
  app.config.errorHandler = handleVueError;
  app.component("QChip", (props: { label: string }) => h("span", props.label));
  apps.push(app);
  app.mount(target);
  return target;
}

async function clickButton({
  target,
  label,
}: {
  target: HTMLElement;
  label: string;
}): Promise<void> {
  const button = [...target.querySelectorAll("button")].find(
    (element) => element.textContent === label
  );
  if (button === undefined) throw new Error(`Button ${label} not found`);
  button.click();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe("questionnaire completion", () => {
  it("does not announce completion when the onboarding exit is ignored", async () => {
    exitToConversation.mockResolvedValueOnce(false);
    state.completed = true;
    const target = mountQuestion();
    await clickButton({ target, label: "Next" });
    expect(showNotifyMessage).not.toHaveBeenCalled();
  });

  it("returns directly to the consultation after the final answer is saved", async () => {
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(saveAnswer).toHaveBeenCalledWith({
      questionSlugId: "question-one",
      answer: { questionType: "choice", optionSlugIds: ["bicycle"] },
    });
    expect(exitToConversation).toHaveBeenCalledWith({
      conversationSlugId: "conversation-one",
      routeContext: { kind: "project", projectSlug: "project-one" },
    });
    expect(exitToConversation).toHaveBeenCalledAfter(saveAnswer);
    expect(showNotifyMessage).toHaveBeenCalledWith({
      message: "You’re all set!",
      icon: "mdi-check-circle-outline",
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("also returns directly when passing the last optional question", async () => {
    state.optional = true;
    const target = mountQuestion();
    await clickButton({ target, label: "Next" });

    expect(saveAnswer).toHaveBeenCalledWith({
      questionSlugId: "question-one",
      answer: null,
    });
    expect(exitToConversation).toHaveBeenCalledOnce();
    expect(showNotifyMessage).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not announce completion or leave when saving fails", async () => {
    saveAnswer.mockRejectedValue(new Error("Save failed"));
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(exitToConversation).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(showNotifyMessage).toHaveBeenCalledExactlyOnceWith(
      "failedToSaveAnswerMessage"
    );
  });

  it("returns from an already saved final answer without another write or summary screen", async () => {
    state.completed = true;
    const target = mountQuestion();
    await clickButton({ target, label: "Next" });

    expect(saveAnswer).not.toHaveBeenCalled();
    expect(exitToConversation).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it("uses the saved gate when the response is complete without a new completion transition", async () => {
    saveAnswer.mockResolvedValue(createSaveResponse({ justCompleted: false }));
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(exitToConversation).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it("continues to the next question when the survey is not complete", async () => {
    state.hasNextQuestion = true;
    saveAnswer.mockResolvedValue(
      createSaveResponse({ justCompleted: false, status: "in_progress" })
    );
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(exitToConversation).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledExactlyOnceWith({
      path: "/project/project-one/conversation/conversation-one/onboarding/question/question-two",
    });
    expect(showNotifyMessage).not.toHaveBeenCalled();
  });

  it("keeps a still-incomplete survey on the review path after its last question", async () => {
    saveAnswer.mockResolvedValue(
      createSaveResponse({ justCompleted: false, status: "in_progress" })
    );
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(exitToConversation).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledExactlyOnceWith({
      path: "/project/project-one/conversation/conversation-one/onboarding/summary",
    });
    expect(showNotifyMessage).not.toHaveBeenCalled();
  });

  it("routes a backend verification block back to onboarding without announcing completion", async () => {
    saveAnswer.mockResolvedValue({
      success: false,
      reason: "email_verification_required",
    });
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(navigateToSurveyRoot).toHaveBeenCalledExactlyOnceWith({
      conversationSlugId: "conversation-one",
      routeContext: { kind: "project", projectSlug: "project-one" },
    });
    expect(exitToConversation).not.toHaveBeenCalled();
    expect(showNotifyMessage).not.toHaveBeenCalled();
  });

  it("prevents another save or close while a save is in flight", async () => {
    const pendingSave = Promise.withResolvers<SurveyAnswerSaveResponse>();
    saveAnswer.mockReturnValueOnce(pendingSave.promise);
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });
    await clickButton({ target, label: "Next" });
    await clickButton({ target, label: "Close" });

    expect(saveAnswer).toHaveBeenCalledOnce();
    expect(exitToConversation).not.toHaveBeenCalled();
    pendingSave.resolve(createSaveResponse());
    await vi.waitFor(() => expect(exitToConversation).toHaveBeenCalledOnce());
  });

  it("does not report a saved answer as failed when navigation fails", async () => {
    const navigationError = new Error("Navigation failed");
    exitToConversation.mockRejectedValueOnce(navigationError);
    const target = mountQuestion();
    await clickButton({ target, label: "Bicycle" });
    await clickButton({ target, label: "Next" });

    expect(saveAnswer).toHaveBeenCalledOnce();
    expect(handleVueError.mock.calls[0]?.[0]).toBe(navigationError);
    expect(showNotifyMessage).not.toHaveBeenCalled();
  });
});
