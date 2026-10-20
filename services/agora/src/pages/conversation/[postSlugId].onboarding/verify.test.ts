import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
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
const exitToConversation = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const otpUnmounted = vi.hoisted(() => vi.fn());
const refetch = vi.hoisted(() => vi.fn());
const notify = vi.hoisted(() => vi.fn());
const participationStatus = ref<ParticipationStatus>({ status: "checking" });
vi.mock(
  "src/composables/conversation/useConversationOnboardingCompletion",
  () => ({
    useConversationOnboardingCompletion: () => ({ completeOnboarding }),
  })
);
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({ exitToConversation }),
}));
vi.mock("src/utils/api/participation/useParticipationStatusQuery", () => ({
  useParticipationStatusQuery: () => ({ participationStatus, refetch }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: notify }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
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
  vi.clearAllMocks();
  completeOnboarding.mockResolvedValue(true);
  exitToConversation.mockResolvedValue(true);
  participationStatus.value = { status: "checking" };
});

async function mountVerification(
  path = "/conversation/example/onboarding/verify"
) {
  const sheet = createDismissalController({ fallbackDismiss: async () => {} });
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
          {
            path: "hard",
            component: defineComponent(() => () => h("p", "Sign in")),
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

describe("single-snapshot verification handoff", () => {
  it("makes a blocked automatic exit retryable", async () => {
    completeOnboarding.mockResolvedValueOnce(false);
    participationStatus.value = { status: "ready" };
    const { target } = await mountVerification();
    await vi.waitFor(() =>
      expect(target.querySelector("button")).not.toBeNull()
    );
    target.querySelector("button")?.click();
    await vi.waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(2));
  });

  it("unmounts the OTP form while awaiting the next backend-owned step", async () => {
    const { target, router } = await mountVerification(
      "/conversation/example/onboarding/verify/email-code"
    );
    expect(target.querySelector('[data-testid="otp"]')).not.toBeNull();
    await router.replace("/conversation/example/onboarding/verify");
    await nextTick();
    expect(target.querySelector('[data-testid="otp"]')).toBeNull();
    expect(otpUnmounted).toHaveBeenCalledOnce();
    expect(target.querySelector('[data-testid="loading"]')).not.toBeNull();
    participationStatus.value = { status: "ready" };
    await nextTick();
    expect(completeOnboarding).toHaveBeenCalledExactlyOnceWith({
      conversationSlugId: "example",
      routeContext: { kind: "normal" },
    });
  });

  it("shows loading on a direct link until the snapshot arrives", async () => {
    const { target } = await mountVerification();
    expect(target.querySelector('[data-testid="loading"]')).not.toBeNull();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it("keeps failed status loading retryable without claiming completion", async () => {
    const { target } = await mountVerification();
    participationStatus.value = { status: "unavailable" };
    await nextTick();
    target.querySelector("button")?.click();
    expect(refetch).toHaveBeenCalledOnce();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it("follows a sign-in decision without conversation metadata or survey queries", async () => {
    participationStatus.value = {
      status: "onboarding_required",
      nextStep: { kind: "account", purpose: "login" },
    };
    const { target } = await mountVerification();
    await vi.waitFor(() => expect(target.textContent).toContain("Sign in"));
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it("does not announce completion when participation became unavailable", async () => {
    participationStatus.value = {
      status: "blocked",
      reason: "conversation_closed",
    };
    await mountVerification();
    await vi.waitFor(() => expect(exitToConversation).toHaveBeenCalledOnce());
    expect(completeOnboarding).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledExactlyOnceWith("participationUnavailable");
  });
});
