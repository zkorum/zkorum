import { createPinia, setActivePinia } from "pinia";
import type * as QuasarModule from "quasar";
import { createEmptyDraft } from "src/composables/conversation/draft/conversationDraft.utils";
import { useAuthenticationStore } from "src/stores/authentication";
import type {
  GenerateSeedSuggestionsResult,
  useBackendSeedSuggestionApi,
} from "src/utils/api/seedSuggestion/seedSuggestion";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, h, nextTick, ref } from "vue";

import SeedOpinionEditor from "./SeedOpinionEditor.vue";

const mocks = vi.hoisted(() => ({
  generate:
    vi.fn<
      ReturnType<typeof useBackendSeedSuggestionApi>["generateSeedSuggestions"]
    >(),
  recordUse: vi.fn(),
}));
vi.mock("src/utils/processEnv", () => ({
  processEnv: { VITE_AI_SUGGESTIONS_ENABLED: "true" },
}));
vi.mock("src/utils/api/seedSuggestion/seedSuggestion", () => ({
  useBackendSeedSuggestionApi: () => ({
    generateSeedSuggestions: mocks.generate,
    recordSeedSuggestionUse: mocks.recordUse,
  }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: vi.fn() }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: (texts: { en: Record<string, string> }) => ({
    t: (key: string) => texts.en[key] ?? key,
  }),
}));
vi.mock("quasar", async (importOriginal) => ({
  ...(await importOriginal<typeof QuasarModule>()),
  useQuasar: () => ({ lang: { rtl: false } }),
}));

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.clearAllMocks();
});

function mountEditor() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const auth = useAuthenticationStore();
  auth.setLoginStatus({
    isKnown: true,
    isLoggedIn: true,
    userId: "author-one",
  });
  const disabled = ref(false);
  const loginRequired = vi.fn();
  const container = document.createElement("div");
  document.body.append(container);
  const context = createEmptyDraft();
  const app = createApp({
    render: () =>
      h(SeedOpinionEditor, {
        modelValue: [],
        suggestionContext: context,
        existingOpinions: [],
        disabled: disabled.value,
        editConversationRoute: "/edit",
        onLoginRequired: loginRequired,
      }),
  });
  app.use(pinia);
  apps.push(app);
  app.mount(container);
  return { auth, container, disabled, loginRequired };
}

function clickGenerate(container: HTMLElement): void {
  const button = Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === "Generate with AI"
  );
  if (button === undefined) throw new Error("Missing generate button");
  button.click();
}

describe("SeedOpinionEditor", () => {
  it("clears the previous account's suggestions and cancels its in-flight generation", async () => {
    mocks.generate.mockResolvedValueOnce({
      status: "success",
      data: {
        confident: true,
        generationId: "generation-one",
        suggestions: [
          { suggestionId: "suggestion-one", text: "Private suggestion" },
        ],
      },
    });
    const { auth, container } = mountEditor();
    clickGenerate(container);
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Private suggestion")
    );

    let resolve: ((result: GenerateSeedSuggestionsResult) => void) | undefined;
    mocks.generate.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const generateMore = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.trim() === "Generate more"
    );
    if (generateMore === undefined)
      throw new Error("Missing generate-more button");
    generateMore.click();
    await vi.waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(2));
    const signal = mocks.generate.mock.calls[1]?.[0].signal;

    auth.setLoginStatus({
      isKnown: true,
      isLoggedIn: true,
      userId: "author-two",
    });
    expect(signal?.aborted).toBe(true);
    await nextTick();
    expect(container.textContent).not.toContain("Private suggestion");
    resolve?.({
      status: "success",
      data: {
        confident: true,
        generationId: "generation-two",
        suggestions: [
          { suggestionId: "suggestion-two", text: "Late private suggestion" },
        ],
      },
    });
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Generate with AI")
    );
    expect(container.textContent).not.toContain("Late private suggestion");
  });

  it("keeps actions in place but disabled during saving and requests login before generation", async () => {
    const { auth, container, disabled, loginRequired } = mountEditor();
    const row = container.querySelector(".add-row");
    disabled.value = true;
    await nextTick();
    expect(container.querySelector(".add-row")).toBe(row);
    expect(
      Array.from(
        container.querySelectorAll<HTMLButtonElement>(".add-row button")
      ).every((button) => button.disabled)
    ).toBe(true);

    disabled.value = false;
    auth.setLoginStatus({ isKnown: false });
    await nextTick();
    clickGenerate(container);
    expect(loginRequired).toHaveBeenCalledOnce();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
