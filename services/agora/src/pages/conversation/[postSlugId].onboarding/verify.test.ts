import type { SurveyStatusCheckResponse } from "src/shared/types/dto";
import { createDismissalController } from "src/utils/ui/dismissalController";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  onUnmounted,
  ref,
} from "vue";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";

const completeOnboarding = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const otpUnmounted = vi.hoisted(() => vi.fn());
const refetchAll = vi.hoisted(() => vi.fn());
const loading = ref(true);
const loadError = ref(false);
const surveyStatus = ref<SurveyStatusCheckResponse>();

vi.mock(
  "src/composables/conversation/useConversationOnboardingCompletion",
  () => ({
    useConversationOnboardingCompletion: () => ({ completeOnboarding }),
  })
);
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({ exitToConversation: vi.fn() }),
}));
vi.mock("src/stores/conversationOnboarding", () => ({
  useConversationOnboardingStore: () => ({
    emailUpdateConsentSkipped: false,
    isResumeMode: false,
  }),
}));
vi.mock("src/composables/conversation/useConversationSurveyState", () => ({
  useConversationSurveyState: () => ({
    conversationSlugId: ref("example"),
    conversationData: ref({
      metadata: { participationMode: "account_required" },
    }),
    surveyStatus,
    surveyForm: ref(undefined),
    requirementState: ref({ needsAuth: false, needsTicket: false }),
    isInitialLoading: loading,
    hasLoadError: loadError,
    refetchAll,
  }),
}));
vi.mock(
  "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries",
  () => ({
    useConversationEmailUpdateSummaryQuery: () => ({
      onboardingResolution: ref({ status: "not_required" }),
    }),
  })
);
vi.mock("src/layouts/ConversationOnboardingLayout.vue", () => ({
  default: defineComponent(
    (_props, { slots }) =>
      () =>
        h("main", slots.default?.())
  ),
}));
vi.mock("src/components/ui/PageLoadingSpinner.vue", () => ({
  default: defineComponent(() => () => h("div", { "data-testid": "loading" })),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/components/ui/ErrorRetryBlock.vue", () => ({
  default: defineComponent({
    emits: ["retry"],
    setup(_props, { emit }) {
      return () => h("button", { onClick: () => emit("retry") }, "Retry");
    },
  }),
}));

import Verification from "./verify.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  completeOnboarding.mockReset().mockResolvedValue(true);
  otpUnmounted.mockReset();
  refetchAll.mockReset();
  loading.value = true;
  loadError.value = false;
  surveyStatus.value = undefined;
});

async function mountVerification(path: string) {
  const sheet = createDismissalController({
    fallbackDismiss: () => Promise.resolve(),
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/conversation/:postSlugId/onboarding/verify",
        name: "/conversation/[postSlugId].onboarding/verify",
        component: Verification,
        props: { sheet },
        children: [
          {
            path: "email-code",
            name: "/conversation/[postSlugId].onboarding/verify/email-code",
            component: defineComponent(() => {
              onUnmounted(otpUnmounted);
              return () => h("p", { "data-testid": "otp" }, "Enter code");
            }),
          },
        ],
      },
    ],
  });
  await router.push(path);
  const target = document.createElement("div");
  document.body.append(target);
  const app = createApp(() => h(RouterView));
  app.use(router);
  apps.push(app);
  app.mount(target);
  return { target, router };
}

describe("verification handoff", () => {
  it("makes a blocked automatic exit retryable", async () => {
    completeOnboarding.mockResolvedValueOnce(false);
    surveyStatus.value = {
      surveyGate: {
        hasSurvey: false,
        isOptional: false,
        canParticipate: true,
        status: "no_survey",
      },
      routeResolution: { kind: "none" },
    };
    loading.value = false;
    const { target } = await mountVerification(
      "/conversation/example/onboarding/verify"
    );
    await vi.waitFor(() =>
      expect(target.querySelector("button")).not.toBeNull()
    );
    target.querySelector("button")?.click();
    await vi.waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(2));
  });

  it("unmounts the old OTP form while resolving fresh account data", async () => {
    const { target, router } = await mountVerification(
      "/conversation/example/onboarding/verify/email-code"
    );
    const originalStep = target.querySelector('[data-testid="otp"]');
    expect(originalStep).not.toBeNull();
    await router.replace("/conversation/example/onboarding/verify");
    await nextTick();
    expect(target.querySelector('[data-testid="otp"]')).toBeNull();
    expect(otpUnmounted).toHaveBeenCalledOnce();
    expect(target.querySelector('[data-testid="loading"]')).not.toBeNull();

    surveyStatus.value = {
      surveyGate: {
        hasSurvey: true,
        isOptional: false,
        canParticipate: true,
        status: "complete_valid",
      },
      routeResolution: { kind: "summary" },
    };
    loading.value = false;
    await nextTick();
    expect(completeOnboarding).toHaveBeenCalledExactlyOnceWith({
      conversationSlugId: "example",
      routeContext: { kind: "normal" },
    });
  });

  it("shows a loading state rather than a blank sheet on a direct verification link", async () => {
    const { target } = await mountVerification(
      "/conversation/example/onboarding/verify"
    );
    expect(target.querySelector('[data-testid="loading"]')).not.toBeNull();
  });

  it("keeps a failed account refresh retryable without completing onboarding", async () => {
    const { target } = await mountVerification(
      "/conversation/example/onboarding/verify"
    );
    loading.value = false;
    loadError.value = true;
    await nextTick();
    expect(target.querySelector('[data-testid="loading"]')).toBeNull();
    target.querySelector("button")?.click();
    expect(refetchAll).toHaveBeenCalledOnce();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });
});
