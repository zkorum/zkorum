import { createPinia } from "pinia";
import type {
  ConversationOnboardingPreferenceSaveResponse,
  ConversationParticipationStatus,
} from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import type { useSaveOnboardingPreference } from "src/utils/api/participation/useSaveOnboardingPreference";
import { createDismissalController } from "src/utils/ui/dismissalController";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
} from "vue";

const mocks = vi.hoisted(() => ({
  save: vi.fn<
    ReturnType<typeof useSaveOnboardingPreference>["savePreference"]
  >(),
  replace: vi.fn<() => Promise<void>>(),
  exit: vi.fn(),
  notify: vi.fn(),
  skip: vi.fn(),
  refetch: vi.fn(),
  removeSummaries: vi.fn(),
}));
const projectStatus = {
  status: "onboarding_required",
  nextStep: {
    kind: "email_updates",
    action: {
      operation: "set_project_preference",
      projectSlug: "project",
      conversationSlugId: "example",
      initialEnabled: true,
    },
  },
} satisfies ConversationParticipationStatus;
const snapshot = ref<ParticipationStatus>(projectStatus);
const route = reactive({
  fullPath: "/conversation/example/onboarding/complete",
});

vi.mock("vue-router", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingRoute", () => ({
  useConversationOnboardingRoute: () => ({
    route,
    routeConversationSlugId: ref("example"),
    routeContext: ref({ kind: "normal" }),
  }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({ exitToConversation: mocks.exit }),
}));
vi.mock("src/stores/conversationOnboarding", () => ({
  useConversationOnboardingStore: () => ({
    markEmailUpdateConsentSkipped: mocks.skip,
  }),
}));
vi.mock("src/utils/api/participation/useParticipationStatusQuery", () => ({
  useParticipationStatusQuery: () => ({
    participationStatus: snapshot,
    refetch: mocks.refetch,
  }),
}));
vi.mock("src/utils/api/participation/useSaveOnboardingPreference", () => ({
  useSaveOnboardingPreference: () => ({ savePreference: mocks.save }),
}));
vi.mock(
  "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries",
  () => ({
    useInvalidateParticipationAfterPreference: () => mocks.removeSummaries,
  })
);
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: mocks.notify }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/layouts/ConversationOnboardingLayout.vue", () => ({
  default: defineComponent({
    props: { closeCallback: { type: Function, required: true } },
    setup(props, { slots }) {
      return () =>
        h("main", [
          h("button", { onClick: () => props.closeCallback() }, "Close"),
          slots.default?.(),
        ]);
    },
  }),
}));
vi.mock("src/components/ui/ErrorRetryBlock.vue", () => ({
  default: defineComponent({
    emits: ["retry"],
    setup(_, { emit }) {
      return () => h("button", { onClick: () => emit("retry") }, "Retry");
    },
  }),
}));
vi.mock(
  "src/components/onboarding/ConversationEmailUpdateOnboardingStep.vue",
  () => ({
    default: defineComponent({
      props: {
        conversationUpdatesChecked: Boolean,
        showConversationUpdatesPreference: Boolean,
        scopeKind: { type: String, required: true },
        isSaving: Boolean,
        continueWithoutSavingLabel: { type: String, default: undefined },
      },
      emits: [
        "continue",
        "continueWithoutSaving",
        "update:conversationUpdatesChecked",
      ],
      setup(props, { emit }) {
        return () =>
          h(
            "section",
            {
              "data-preference": String(
                props.showConversationUpdatesPreference
              ),
              "data-scope": props.scopeKind,
              "data-checked": String(props.conversationUpdatesChecked),
            },
            [
              h(
                "button",
                { disabled: props.isSaving, onClick: () => emit("continue") },
                "Continue"
              ),
              h(
                "button",
                {
                  disabled: props.isSaving,
                  onClick: () =>
                    emit(
                      "update:conversationUpdatesChecked",
                      !props.conversationUpdatesChecked
                    ),
                },
                "Toggle"
              ),
              props.continueWithoutSavingLabel === undefined
                ? undefined
                : h(
                    "button",
                    { onClick: () => emit("continueWithoutSaving") },
                    "Skip"
                  ),
            ]
          );
      },
    }),
  })
);

import Complete from "./complete.vue";

const apps: App[] = [];
function successResponse(): Extract<
  ConversationOnboardingPreferenceSaveResponse,
  { success: true }
> {
  return {
    success: true,
    result: {
      operation: "set_project_preference",
      projectSlug: "project",
      state: "enabled",
      globalResumed: false,
    },
    participationStatus: { status: "ready" },
  };
}
beforeEach(() => {
  route.fullPath = "/conversation/example/onboarding/complete";
  snapshot.value = projectStatus;
  mocks.save.mockResolvedValue(successResponse());
  mocks.replace.mockResolvedValue(undefined);
});
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.resetAllMocks();
});
function mountComplete() {
  const pinia = createPinia();
  const auth = useAuthenticationStore(pinia);
  auth.setLoginStatus({ isKnown: true, isLoggedIn: true, userId: "viewer" });
  const target = document.createElement("div");
  document.body.append(target);
  const app = createApp(Complete, {
    sheet: createDismissalController({ fallbackDismiss: async () => {} }),
  });
  app.use(pinia);
  apps.push(app);
  app.mount(target);
  async function click(label: string) {
    const button = [...target.querySelectorAll("button")].find(
      (candidate) => candidate.textContent === label
    );
    if (button === undefined) throw new Error(`Missing ${label} button`);
    button.click();
    await nextTick();
  }
  return { target, click, auth };
}

describe("backend-owned email preference step", () => {
  it("does not navigate a newer view when an earlier preference save completes", async () => {
    const pending =
      Promise.withResolvers<ConversationOnboardingPreferenceSaveResponse>();
    mocks.save.mockReturnValue(pending.promise);
    const { click } = mountComplete();
    await click("Continue");
    route.fullPath = "/conversation/another/onboarding/complete";
    pending.resolve(successResponse());
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("renders the cached action without fetching a survey, form, conversation, or email summary", () => {
    const { target } = mountComplete();
    expect(target.querySelector("section")?.getAttribute("data-scope")).toBe(
      "project"
    );
    expect(target.querySelector("section")?.getAttribute("data-checked")).toBe(
      "true"
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("saves the explicit choice and hands the returned snapshot to the common resolver", async () => {
    const { click } = mountComplete();
    await click("Toggle");
    await click("Continue");
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify",
      })
    );
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith({
      operation: "set_project_preference",
      projectSlug: "project",
      conversationSlugId: "example",
      enabled: false,
    });
    expect(mocks.removeSummaries).toHaveBeenCalledExactlyOnceWith({
      result: successResponse().result,
      preserveConversationSlugId: "example",
    });
  });

  it("uses the same resolver when the backend says a survey still remains", async () => {
    mocks.save.mockResolvedValue({
      ...successResponse(),
      participationStatus: {
        status: "onboarding_required",
        nextStep: {
          kind: "survey",
          routeResolution: { kind: "question", questionSlugId: "question" },
        },
      },
    });
    const { click } = mountComplete();
    await click("Continue");
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify",
      })
    );
  });

  it("does not overwrite a user's checkbox on an equivalent background snapshot", async () => {
    const { click, target } = mountComplete();
    await click("Toggle");
    snapshot.value = {
      ...projectStatus,
      nextStep: {
        ...projectStatus.nextStep,
        action: { ...projectStatus.nextStep.action },
      },
    };
    await nextTick();
    expect(target.querySelector("section")?.getAttribute("data-checked")).toBe(
      "false"
    );
  });

  it("resets the choice after an account switch", async () => {
    const { click, target, auth } = mountComplete();
    await click("Toggle");
    auth.setLoginStatus({ isKnown: true, isLoggedIn: true, userId: "another" });
    await nextTick();
    expect(target.querySelector("section")?.getAttribute("data-checked")).toBe(
      "true"
    );
  });

  it("does not submit or mark consent skipped when dismissed", async () => {
    const { click } = mountComplete();
    await click("Close");
    expect(mocks.exit).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.skip).not.toHaveBeenCalled();
  });

  it("prevents duplicate saves and dismissal while saving", async () => {
    const pending =
      Promise.withResolvers<ConversationOnboardingPreferenceSaveResponse>();
    mocks.save.mockReturnValue(pending.promise);
    const { click } = mountComplete();
    await click("Continue");
    await click("Continue");
    await click("Close");
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.exit).not.toHaveBeenCalled();
    pending.resolve(successResponse());
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledOnce());
  });

  it("keeps a refused write retryable and permits explicit skipping", async () => {
    mocks.save.mockResolvedValue({
      success: false,
      reason: "feature_not_available",
    });
    const { click } = mountComplete();
    await click("Continue");
    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledExactlyOnceWith({
        message: "emailUpdatePreferenceSaveError",
        force: true,
      })
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    await click("Skip");
    expect(mocks.skip).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledOnce());
    expect(mocks.save).toHaveBeenCalledOnce();
  });

  it("reports a real request failure once", async () => {
    mocks.save.mockRejectedValue(new Error("network failure"));
    const { click } = mountComplete();
    await click("Continue");
    await vi.waitFor(() => expect(mocks.notify).toHaveBeenCalledOnce());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("silently ignores an expected cancellation", async () => {
    mocks.save.mockResolvedValue(undefined);
    const { click } = mountComplete();
    await click("Continue");
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not invent completion while the backend snapshot is loading", async () => {
    snapshot.value = { status: "checking" };
    const { click } = mountComplete();
    await click("Continue");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("can retry a failed snapshot or explicitly skip the optional choice", async () => {
    snapshot.value = { status: "unavailable" };
    const { click } = mountComplete();
    await click("Retry");
    expect(mocks.refetch).toHaveBeenCalledOnce();
    await click("Skip");
    expect(mocks.skip).toHaveBeenCalledOnce();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("does not save again if the backend no longer offers the step", async () => {
    snapshot.value = { status: "ready" };
    const { click } = mountComplete();
    await click("Continue");
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledOnce());
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("preserves the global-resume notification from a successful write", async () => {
    mocks.save.mockResolvedValue({
      ...successResponse(),
      result: {
        operation: "set_project_preference",
        projectSlug: "project",
        state: "enabled",
        globalResumed: true,
      },
    });
    const { click } = mountComplete();
    await click("Continue");
    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledExactlyOnceWith({
        message: "preferenceSavedAndGlobalResumed",
        force: true,
      })
    );
  });
});
