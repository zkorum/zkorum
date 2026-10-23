import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { QBtn, QItem, QItemLabel, QItemSection, Quasar } from "quasar";
import type { SurveyFormSnapshot } from "src/shared/types/dto";
import type {
  LocalizedContentTranslationStatus,
  SurveyQuestionContentVariant,
} from "src/shared/types/zod";
import type {
  ContentTranslationResponse,
  useBackendContentTranslationApi,
} from "src/utils/api/contentTranslation/contentTranslation";
import { publishContentTranslationEvent } from "src/utils/translation/contentTranslationEvents";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, h, nextTick, shallowRef } from "vue";
import { createI18n } from "vue-i18n";

import SurveyAnswerReviewItem from "./SurveyAnswerReviewItem.vue";

const api = vi.hoisted(() => ({
  requestContentTranslation:
    vi.fn<
      ReturnType<
        typeof useBackendContentTranslationApi
      >["requestContentTranslation"]
    >(),
  ensureParticipationAuthState: vi.fn(),
  showNotifyMessage: vi.fn(),
}));

vi.mock("src/utils/api/contentTranslation/contentTranslation", () => ({
  useBackendContentTranslationApi: () => api,
}));
vi.mock("src/utils/api/auth", () => ({ useBackendAuthApi: () => api }));
vi.mock("src/utils/ui/notify", () => ({ useNotify: () => api }));
vi.mock("src/utils/api/post/useConversationQuery", () => ({
  updateConversationQueryCache: vi.fn(),
}));
vi.mock("src/stores/language", async () => {
  const { defineStore } = await import("pinia");
  return {
    useLanguageStore: defineStore("review-test-language", {
      state: () => ({ displayLanguage: "en", spokenLanguages: ["en"] }),
    }),
  };
});

const sourceVersion = "00000000-0000-4000-8000-000000000001";
const originalContent: SurveyQuestionContentVariant = {
  questionText: "Votre activité ?",
  options: [
    { optionSlugId: "farming", optionText: "Agriculture" },
    { optionSlugId: "other", optionText: "Autre" },
  ],
};
const translatedContent: SurveyQuestionContentVariant = {
  questionText: "Your occupation?",
  // Deliberately different order: selections must be matched by slug ID.
  options: [
    { optionSlugId: "other", optionText: "Other" },
    { optionSlugId: "farming", optionText: "Farming" },
  ],
};

function choiceQuestion({
  translated = true,
  translationStatus,
}: {
  translated?: boolean;
  translationStatus?: LocalizedContentTranslationStatus;
} = {}): SurveyFormSnapshot["questions"][number] {
  return {
    questionSlugId: "question1",
    questionType: "choice",
    questionText: originalContent.questionText,
    displayOrder: 0,
    isRequired: true,
    choiceDisplay: "list",
    isPublicAggregateSuppressionEnabled: false,
    constraints: { type: "choice", minSelections: 1 },
    options: originalContent.options.map((option, displayOrder) => ({
      ...option,
      displayOrder,
      allowsText: option.optionSlugId === "other",
    })),
    currentAnswer: {
      questionType: "choice",
      optionSlugIds: ["farming", "other"],
      optionTextValues: { other: { textValueHtml: "<p>Mon métier</p>" } },
    },
    isPassed: false,
    isMissingRequired: false,
    isStale: false,
    isCurrentAnswerValid: true,
    currentSemanticVersion: 1,
    displayContent: {
      sourceVersion,
      status: "available",
      mode: translated ? "translated" : "original",
      content: translated ? translatedContent : originalContent,
      translationControl: {
        status:
          translationStatus ?? (translated ? "completed" : "not_requested"),
        alternateMode: translated ? "original" : "translated",
        canRequestAlternate: true,
      },
    },
  };
}

const mounted: Array<{ app: App; queryClient: QueryClient }> = [];

function mountReview(initialQuestion: SurveyFormSnapshot["questions"][number]) {
  const onEdit = vi.fn();
  const question = shallowRef(initialQuestion);
  const app = createApp({
    render: () =>
      h(SurveyAnswerReviewItem, {
        conversationSlugId: "hLdan18",
        question: question.value,
        sourceLanguageCode: "fr",
        statusLabel: "Not answered",
        editLabel: "Edit",
        onEdit,
      }),
  });
  const queryClient = new QueryClient();
  app.use(createPinia());
  app.use(VueQueryPlugin, { queryClient });
  app.use(Quasar, { components: { QBtn, QItem, QItemLabel, QItemSection } });
  app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
  const container = document.createElement("div");
  document.body.append(container);
  app.mount(container);
  mounted.push({ app, queryClient });
  return { container, onEdit, question };
}

function translationResponse({
  completed = true,
}: { completed?: boolean } = {}): ContentTranslationResponse {
  return {
    success: true,
    subject: {
      kind: "survey_question",
      conversationSlugId: "hLdan18",
      questionSlugId: "question1",
    },
    content: {
      kind: "translatable",
      sourceVersion,
      initialMode: "original",
      translation: {
        targetLanguageCode: "en",
        sourceLanguage: {
          kind: "recognized",
          languageCode: "fr",
          label: "French",
        },
        status: completed ? "completed" : "pending",
      },
      variants: {
        original: originalContent,
        translated: completed ? translatedContent : undefined,
      },
    },
  };
}

function getButton({
  container,
  label,
}: {
  container: HTMLElement;
  label: string;
}) {
  const button = [...container.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === label
  );
  if (button === undefined) throw new Error(`Missing button: ${label}`);
  return button;
}

beforeEach(() => {
  api.requestContentTranslation.mockResolvedValue(translationResponse());
});

afterEach(() => {
  for (const { app, queryClient } of mounted.splice(0)) {
    app.unmount();
    queryClient.clear();
  }
  document.body.replaceChildren();
  vi.resetAllMocks();
});

describe("survey answer review translations", () => {
  it.each<LocalizedContentTranslationStatus>(["pending", "running"])(
    "updates automatically when a %s translation completes",
    async (translationStatus) => {
      api.requestContentTranslation.mockResolvedValueOnce(
        translationResponse({ completed: false })
      );
      const { container } = mountReview(
        choiceQuestion({ translated: false, translationStatus })
      );
      expect(container.textContent).toContain("Translating...");
      expect(getButton({ container, label: "Show translation" }).disabled).toBe(
        true
      );

      await vi.waitFor(() =>
        expect(api.ensureParticipationAuthState).toHaveBeenCalledOnce()
      );
      publishContentTranslationEvent({
        subject: {
          kind: "survey_question",
          conversationSlugId: "hLdan18",
          questionSlugId: "question1",
          sourceVersion,
        },
        targetLanguageCode: "en",
        status: "completed",
        timestamp: 1,
      });

      await vi.waitFor(() => {
        expect(container.textContent).toContain("Your occupation?");
        expect(container.textContent).toContain("Farming, Other — Mon métier");
        expect(container.textContent).not.toContain("Translating...");
      });
    }
  );

  it("localizes questions and selected options and toggles them together", async () => {
    const { container, onEdit } = mountReview(choiceQuestion());
    expect(container.textContent).toContain("Your occupation?");
    expect(container.textContent).toContain("Farming, Other — Mon métier");
    expect(api.requestContentTranslation).not.toHaveBeenCalled();

    getButton({ container, label: "Show original (French)" }).click();
    await vi.waitFor(() => {
      expect(container.textContent).toContain("Votre activité ?");
      expect(container.textContent).toContain(
        "Agriculture, Autre — Mon métier"
      );
    });

    getButton({ container, label: "Show translation" }).click();
    await vi.waitFor(() => {
      expect(container.textContent).toContain("Your occupation?");
      expect(container.textContent).toContain("Farming, Other — Mon métier");
    });

    getButton({ container, label: "Edit" }).click();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("requests a translation from the shared control when showing the original", async () => {
    const { container } = mountReview(choiceQuestion({ translated: false }));
    expect(container.textContent).toContain("Votre activité ?");
    getButton({ container, label: "Show translation" }).click();

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Your occupation?");
      expect(container.textContent).toContain("Farming, Other — Mon métier");
    });
    expect(api.requestContentTranslation).toHaveBeenCalledWith({
      subject: {
        kind: "survey_question",
        conversationSlugId: "hLdan18",
        questionSlugId: "question1",
      },
      targetLanguageCode: "en",
      requestMode: "queue_if_missing",
    });
  });

  it("shows original content without a translation control when translation is unavailable", () => {
    const { container } = mountReview({
      ...choiceQuestion(),
      displayContent: undefined,
    });
    expect(container.textContent).toContain("Votre activité ?");
    expect(container.textContent).toContain("Agriculture, Autre — Mon métier");
    expect(container.querySelector(".content-translation-control")).toBeNull();
    expect(api.requestContentTranslation).not.toHaveBeenCalled();
  });

  it("preserves free-text answers as escaped text without requesting a translation", () => {
    const answerText = 'Mon métier <img src=x onerror="alert(1)">';
    const { container } = mountReview({
      questionSlugId: "question2",
      questionType: "free_text",
      questionText: "Votre activité ?",
      displayOrder: 0,
      isRequired: false,
      constraints: {
        type: "free_text",
        inputMode: "rich_text",
        maxPlainTextLength: 1000,
        maxHtmlLength: 2000,
      },
      currentAnswer: {
        questionType: "free_text",
        textValueHtml: '<p>Mon métier &lt;img src=x onerror="alert(1)"&gt;</p>',
        textValuePlainText: `\n ${answerText} \n`,
      },
      isPassed: false,
      isMissingRequired: false,
      isStale: false,
      isCurrentAnswerValid: true,
      currentSemanticVersion: 1,
    });
    expect(
      container.querySelector(".survey-question-item__answer")?.textContent
    ).toBe(answerText);
    expect(container.querySelector("img")).toBeNull();
    expect(api.requestContentTranslation).not.toHaveBeenCalled();
  });

  it("shows the status fallback for unanswered questions", () => {
    const { container } = mountReview({
      ...choiceQuestion(),
      currentAnswer: undefined,
      isCurrentAnswerValid: false,
      isMissingRequired: true,
    });
    expect(container.textContent).toContain("Not answered");
    expect(container.textContent).not.toContain("Farming, Other");
  });

  it("falls back to original labels for untranslated options and skips removed selections", () => {
    const { container } = mountReview({
      ...choiceQuestion(),
      currentAnswer: {
        questionType: "choice",
        optionSlugIds: ["farming", "removed", "other"],
      },
      displayContent: {
        sourceVersion,
        status: "available",
        mode: "translated",
        content: {
          questionText: translatedContent.questionText,
          options: [{ optionSlugId: "farming", optionText: "Farming" }],
        },
        translationControl: {
          status: "completed",
          alternateMode: "original",
          canRequestAlternate: true,
        },
      },
    });
    expect(
      container.querySelector(".survey-question-item__answer")?.textContent
    ).toBe("Farming, Autre");
  });

  it("ignores a late translation response after the question changes", async () => {
    const pendingResponse = Promise.withResolvers<ContentTranslationResponse>();
    api.requestContentTranslation.mockReturnValueOnce(pendingResponse.promise);
    const { container, question } = mountReview(
      choiceQuestion({ translated: false })
    );
    getButton({ container, label: "Show translation" }).click();
    await vi.waitFor(() =>
      expect(api.requestContentTranslation).toHaveBeenCalledOnce()
    );

    question.value = {
      ...choiceQuestion({ translated: false }),
      questionText: "Nouvelle question ?",
      currentSemanticVersion: 2,
      displayContent: {
        sourceVersion: "00000000-0000-4000-8000-000000000002",
        status: "available",
        mode: "original",
        content: { ...originalContent, questionText: "Nouvelle question ?" },
        translationControl: {
          status: "not_requested",
          alternateMode: "translated",
          canRequestAlternate: true,
        },
      },
    };
    await nextTick();
    pendingResponse.resolve(translationResponse());
    await vi.waitFor(() =>
      expect(api.ensureParticipationAuthState).toHaveBeenCalled()
    );
    await nextTick();

    expect(container.textContent).toContain("Nouvelle question ?");
    expect(container.textContent).not.toContain("Your occupation?");
    expect(container.textContent).toContain("Agriculture, Autre — Mon métier");
  });
});
