import { createPinia, setActivePinia } from "pinia";
import type * as QuasarModule from "quasar";
import type {
  UpdateConversationRequest,
  UpdateConversationResponse,
} from "src/shared/types/dto";
import { Dto } from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import {
  buildEditConversationRequest,
  useEditConversationStore,
} from "src/stores/editConversation";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  type FunctionalComponent,
  h,
  nextTick,
} from "vue";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";

const mocks = vi.hoisted(() => ({
  save: vi.fn<
    (request: UpdateConversationRequest) => Promise<UpdateConversationResponse>
  >(),
  getForEdit: vi.fn(),
  notify: vi.fn(),
}));
vi.mock("src/utils/api/post/useConversationMutations", () => ({
  useUpdateConversationMutation: () => ({ mutateAsync: mocks.save }),
}));
vi.mock("src/utils/api/post/postEdit", () => ({
  useBackendPostEditApi: () => ({ getConversationForEdit: mocks.getForEdit }),
}));
vi.mock("src/utils/api/conversationUpdates/conversationEmailUpdates", () => ({
  useBackendConversationEmailUpdatesApi: () => ({
    getConfiguration: vi.fn(() =>
      Promise.resolve({ success: false, reason: "feature_not_available" })
    ),
  }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: mocks.notify }),
}));
vi.mock("quasar", async (importOriginal) => {
  const actual = await importOriginal<typeof QuasarModule>();
  return {
    ...actual,
    useQuasar: () => ({
      lang: { rtl: false },
      platform: { is: { mobile: false } },
    }),
  };
});
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: (texts: { en: Record<string, string> }) => ({
    t: (key: string) => texts.en[key] ?? key,
  }),
}));
vi.mock(
  "src/components/newConversation/NewConversationLayout.vue",
  async () => {
    const { h } = await import("vue");
    const component: FunctionalComponent = (_, { slots }) =>
      h("main", slots.default?.({ isActive: true }));
    return { default: component };
  }
);
vi.mock("src/components/navigation/header/DefaultMenuBar.vue", async () => {
  const { h } = await import("vue");
  const component: FunctionalComponent = (_, { slots }) =>
    h("nav", [slots.left?.(), slots.right?.()]);
  return { default: component };
});
vi.mock("src/components/navigation/buttons/BackButton.vue", async () => {
  const { h } = await import("vue");
  const component: FunctionalComponent = (_, { emit }) =>
    h(
      "button",
      { onClick: (event: MouseEvent) => emit("click", event) },
      "Back"
    );
  component.emits = ["click"];
  return { default: component };
});
vi.mock("src/components/features/conversation/ConversationTitle.vue", () => ({
  default: () => null,
}));
vi.mock("src/components/newConversation/NewConversationControlBar.vue", () => ({
  default: () => null,
}));
vi.mock("src/components/newConversation/ConversationProjectSelect.vue", () => ({
  default: () => null,
}));
vi.mock(
  "src/components/newConversation/ConversationProjectLanguageSettings.vue",
  () => ({ default: () => null })
);
vi.mock("src/components/editor/Editor.vue", async () => {
  const { defineComponent, h, ref } = await import("vue");
  return {
    __esModule: true,
    default: defineComponent({
      props: { modelValue: { type: String, required: true } },
      emits: ["update:modelValue"],
      setup: (props, { emit, expose }) => {
        const field = ref<HTMLTextAreaElement>();
        expose({ focus: () => field.value?.focus() });
        return () =>
          h("textarea", {
            ref: field,
            value: props.modelValue,
            onInput: (event: Event) => {
              if (event.target instanceof HTMLTextAreaElement)
                emit("update:modelValue", event.target.value);
            },
          });
      },
    }),
  };
});
vi.mock("src/components/ui-library/ZKConfirmDialog.vue", async () => {
  const { h } = await import("vue");
  const component: FunctionalComponent<{ modelValue: boolean }> = (
    props,
    { emit }
  ) =>
    props.modelValue
      ? h("button", { onClick: () => emit("confirm") }, "Discard changes")
      : null;
  component.props = { modelValue: Boolean };
  component.emits = ["confirm"];
  return { default: component };
});

import DetailsPage from "../index.vue";
import SeedPage from "./index.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.clearAllMocks();
});

async function mountFlow({
  newSeeds = ["New seed"],
  detailsChanged = true,
}: { newSeeds?: string[]; detailsChanged?: boolean } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthenticationStore().setLoginStatus({
    isKnown: true,
    isLoggedIn: true,
    userId: "00000000-0000-4000-8000-000000000001",
  });
  const response = Dto.getConversationForEditResponse.parse({
    success: true,
    conversationSlugId: "seedtest",
    conversationTitle: "Original title",
    conversationBody: "Original body",
    conversationTypeConfig: {
      conversationType: "polis",
      votingPresentation: "list",
    },
    contentLanguageMetadata: {
      detectedDisplayLanguageCode: null,
      detectedSourceLanguageCode: null,
      detectedRawLanguageCode: null,
      detectionConfidence: null,
      autoDetectionStatus: "not_attempted",
    },
    languageSetting: {
      mode: "auto",
      languageCode: null,
      detectedLanguageCode: null,
      detectedSourceLanguageCode: null,
      detectedRawLanguageCode: null,
      detectionConfidence: null,
      autoDetectionStatus: "not_attempted",
    },
    multilingualSetting: {
      additionalLanguageCodes: [],
      dynamicTranslationEnabled: false,
    },
    languageSettingsSource: "conversation_override",
    currentProjectSlug: "seed-project",
    projectTarget: { kind: "project", projectSlug: "seed-project" },
    projectOptions: [],
    isIndexed: true,
    participationMode: "account_required",
    aiLabelingEnabled: true,
    preferredOpinionGroupCount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isLocked: false,
    editPermissions: {
      canEditNormalSettings: true,
      canEditConversationContent: true,
      canEditSurvey: false,
      canDeleteSurvey: false,
      canAddEventTicket: false,
      canChangeEventTicket: false,
      canRemoveEventTicket: true,
      canUseAnalysisVariantsPreference: false,
      canUseDynamicTranslation: false,
      restrictedPremiumFeatures: [],
    },
    seedOpinions: [
      {
        slugId: "oldseed1",
        content: "<p>An <strong>existing</strong> seed</p>",
      },
    ],
    canAddSeedOpinions: true,
    externalSourceConfig: null,
  });
  if (!response.success) throw new Error("Invalid test fixture");
  const store = useEditConversationStore();
  const title = detailsChanged ? "Changed title" : response.conversationTitle;
  store.start({
    original: response,
    form: {
      conversationTypeConfig: response.conversationTypeConfig,
      title,
      content: "Original body",
      multilingualSetting: response.multilingualSetting,
      inheritProjectLanguages: false,
      isPrivate: false,
      participationMode: "account_required",
      aiLabelingEnabled: true,
      preferredOpinionGroupCount: null,
      surveyConfig: null,
    },
    projectTarget: response.projectTarget,
    isSaving: false,
    newSeedOpinions: newSeeds,
    emailConfiguration: undefined,
    emailOverride: undefined,
    originalEmailOverride: undefined,
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/conversation/:conversationSlugId/edit",
        name: "/conversation/[conversationSlugId]/edit/",
        component: DetailsPage,
      },
      {
        path: "/conversation/:conversationSlugId/edit/seed",
        name: "/conversation/[conversationSlugId]/edit/seed/",
        component: SeedPage,
      },
      {
        path: "/conversation/:postSlugId",
        component: { render: () => h("div", "Conversation") },
      },
      {
        path: "/",
        name: "/",
        component: { render: () => h("div", "Home") },
      },
    ],
  });
  await router.push("/conversation/seedtest/edit/seed?returnTo=/");
  const header = document.createElement("div");
  header.id = "page-header";
  document.body.append(header);
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp(RouterView);
  app.use(pinia);
  app.use(router);
  app.component("QIcon", () => null);
  app.component("QBtn", () => null);
  app.component("QSpinnerDots", () => null);
  apps.push(app);
  app.mount(container);
  await nextTick();
  return { store, router, container, header };
}

function clickButton(label: string): void {
  const button = Array.from(document.querySelectorAll("button, a")).find(
    (button) => button.textContent?.trim() === label
  );
  if (!(button instanceof HTMLElement))
    throw new Error(`Missing button: ${label}`);
  button.click();
}

describe("edit conversation statement step", () => {
  it("prevents leaving or double-submitting while Save is pending", async () => {
    const { router, store } = await mountFlow({ newSeeds: [] });
    let finish = (_response: UpdateConversationResponse) => {};
    mocks.save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    clickButton("Save");
    await vi.waitUntil(() => store.isSaving);
    clickButton("Save");
    await router.push("/conversation/seedtest/edit?returnTo=/");
    expect(router.currentRoute.value.path).toBe(
      "/conversation/seedtest/edit/seed"
    );
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain("Discard changes");
    finish({ success: false, reason: "not_author" });
    await vi.waitUntil(() => !store.isSaving);
    expect(store.hasUnsavedChanges).toBe(true);
  });

  it("clears private draft content when the authenticated user changes", async () => {
    const { store, container } = await mountFlow();
    mocks.getForEdit.mockResolvedValueOnce({
      success: false,
      reason: "not_author",
    });
    useAuthenticationStore().setLoginStatus({
      isKnown: true,
      isLoggedIn: true,
      userId: "00000000-0000-4000-8000-000000000002",
    });
    expect(store.session).toBeUndefined();
    await vi.waitUntil(
      () => !container.textContent?.includes("An existing seed")
    );
    expect(store.hasUnsavedChanges).toBe(false);
  });

  it("loads a different conversation rather than reusing a stale parameter-only route", async () => {
    const { store, router, container } = await mountFlow({
      newSeeds: [],
      detailsChanged: false,
    });
    const original = store.session?.original;
    if (original === undefined) throw new Error("Missing edit fixture");
    mocks.getForEdit.mockResolvedValueOnce({
      ...original,
      conversationSlugId: "nexttest",
      conversationTitle: "Another conversation",
      seedOpinions: [{ slugId: "newseed1", content: "Another existing seed" }],
    });
    await router.push("/conversation/nexttest/edit/seed?returnTo=/");
    await vi.waitUntil(
      () => container.textContent?.includes("Another existing seed") === true
    );
    expect(store.session?.original.conversationSlugId).toBe("nexttest");
    expect(container.textContent).not.toContain("An existing seed");
  });

  it("preserves an absent conversation body for a seed-only save", async () => {
    const { store } = await mountFlow({ detailsChanged: false });
    if (store.session === undefined) throw new Error("Missing edit fixture");
    store.session.original.conversationBody = undefined;
    store.session.form.content = "";
    mocks.save.mockResolvedValueOnce({ success: false, reason: "not_author" });
    clickButton("Save");
    await vi.waitUntil(() => mocks.save.mock.calls.length === 1);
    expect(
      mocks.save.mock.calls.at(0)?.at(0)?.conversationBody
    ).toBeUndefined();
  });

  it("does not rewrite meaningful whitespace in conversation content", async () => {
    const { store, router, container } = await mountFlow({
      newSeeds: [],
      detailsChanged: false,
    });
    await router.push("/conversation/seedtest/edit?returnTo=/");
    await vi.waitUntil(
      () => container.querySelectorAll("textarea").length === 2
    );
    const body = container.querySelectorAll("textarea").item(1);
    body.value = "Original  body";
    body.dispatchEvent(new Event("input", { bubbles: true }));
    clickButton("Next");
    await vi.waitUntil(() => router.currentRoute.value.path.endsWith("/seed"));
    expect(store.hasUnsavedChanges).toBe(true);
    expect(store.session?.form.content).toBe("Original  body");
  });
  it("loads a direct statement-step link through a fresh edit session", async () => {
    const { router, store, container } = await mountFlow({ newSeeds: [] });
    const original = store.session?.original;
    if (original === undefined) throw new Error("Missing edit fixture");
    store.clear();
    await router.push("/");
    mocks.getForEdit.mockResolvedValueOnce(original);
    await router.push("/conversation/seedtest/edit/seed?returnTo=/");
    await vi.waitUntil(
      () => container.textContent?.includes("Existing seed statements") === true
    );
    expect(router.currentRoute.value.query.editStep).toBeUndefined();
    expect(store.session?.newSeedOpinions).toEqual([]);
    expect(mocks.getForEdit).toHaveBeenCalledTimes(1);
  });
  it("clears the edit session and returns to the conversation after a successful save", async () => {
    const { router, store } = await mountFlow({ newSeeds: [] });
    mocks.save.mockResolvedValueOnce({ success: true });
    clickButton("Save");
    await vi.waitUntil(
      () => router.currentRoute.value.path === "/conversation/seedtest/"
    );
    expect(store.session).toBeUndefined();
  });

  it("prompts before discarding unsaved edits outside the edit flow", async () => {
    const { router, store } = await mountFlow({ newSeeds: [] });
    await router.push("/");
    expect(router.currentRoute.value.path).toBe(
      "/conversation/seedtest/edit/seed"
    );
    expect(store.session).toBeDefined();
    clickButton("Discard changes");
    await vi.waitUntil(() => router.currentRoute.value.path === "/");
    expect(store.session).toBeUndefined();
  });
  it("shows existing formatted statements without editing controls and submits only additions", async () => {
    const { container, store } = await mountFlow();
    await vi.waitUntil(() => container.querySelector("textarea") !== null);
    const existing = container.querySelector(".statement-section");
    expect(existing?.querySelector("strong")?.textContent).toBe("existing");
    expect(
      existing?.querySelector("textarea, button, [contenteditable]")
    ).toBeNull();
    mocks.save.mockResolvedValue({ success: false, reason: "not_author" });
    clickButton("Save");
    await vi.waitUntil(() => mocks.save.mock.calls.length === 1);
    expect(mocks.save).toHaveBeenCalledWith({
      ...(store.session === undefined
        ? {}
        : buildEditConversationRequest(store.session)),
      newSeedOpinionList: ["New seed"],
    });
    expect(store.session?.newSeedOpinions).toEqual(["New seed"]);
  });

  it("preserves details and additions across Back and Next without reloading", async () => {
    const { container, router, store } = await mountFlow();
    expect(store.session?.original.conversationSlugId).toBe("seedtest");
    await router.push("/conversation/seedtest/edit?returnTo=/");
    await vi.waitUntil(() =>
      Array.from(container.querySelectorAll("textarea")).some(
        (field) => field.value === "Changed title"
      )
    );
    clickButton("Next");
    await vi.waitUntil(() => router.currentRoute.value.path.endsWith("/seed"));
    await vi.waitUntil(
      () => container.querySelector("textarea")?.value === "New seed"
    );
    expect(store.session?.form.title).toBe("Changed title");
    expect(mocks.getForEdit).not.toHaveBeenCalled();
    expect(router.currentRoute.value.query.returnTo).toBe("/");
  });

  it("allows metadata-only saves and blocks duplicates before saving", async () => {
    const { container, store } = await mountFlow({ newSeeds: [] });
    mocks.save.mockResolvedValue({ success: false, reason: "not_author" });
    clickButton("Save");
    await vi.waitUntil(() => mocks.save.mock.calls.length === 1);
    expect(mocks.save.mock.calls.at(0)?.at(0)?.newSeedOpinionList).toEqual([]);
    if (store.session === undefined) throw new Error("Missing edit session");
    store.session.newSeedOpinions = ["An existing seed"];
    await vi.waitUntil(() => container.querySelector("textarea") !== null);
    for (const element of container.querySelectorAll(
      ".seed-opinion-item-wrapper"
    )) {
      if (element instanceof HTMLElement) element.scrollIntoView = vi.fn();
    }
    clickButton("Save");
    await nextTick();
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("This statement is a duplicate");
  });

  it("keeps Next available when only new statements will change", async () => {
    const { container, router } = await mountFlow({
      newSeeds: [],
      detailsChanged: false,
    });
    await router.push("/conversation/seedtest/edit?returnTo=/");
    await vi.waitUntil(() => container.querySelector("textarea") !== null);
    clickButton("Next");
    await vi.waitUntil(() => router.currentRoute.value.path.endsWith("/seed"));
  });
});
