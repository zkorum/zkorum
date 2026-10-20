import {
  QueryClient,
  QueryObserver,
  VueQueryPlugin,
} from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import type { ConversationParticipationStatus } from "src/shared/types/dto";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { emailVerificationStore } from "src/stores/onboarding/email";
import { onboardingFlowStore } from "src/stores/onboarding/flow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  NavigationFailureType,
} from "vue-router";

const auth = vi.hoisted(() => ({
  getDeviceLoginStatus: vi.fn(() => Promise.resolve({ isKnown: false })),
  updateAuthState: vi.fn(() => Promise.resolve()),
}));
const routeUserAfterLogin = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("src/utils/api/auth", () => ({ useBackendAuthApi: () => auth }));
vi.mock("src/stores/loginIntention", () => ({
  useLoginIntentionStore: () => ({ routeUserAfterLogin }),
}));

import { useVerificationComplete } from "./useVerificationComplete";

beforeEach(() => {
  vi.clearAllMocks();
});
const clients: QueryClient[] = [];
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
});

async function setup(path: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const component = { render: () => null };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "/", component },
      { path: "/verify/email/", name: "/verify/email/", component },
      {
        path: "/onboarding/step4-username/",
        name: "/onboarding/step4-username/",
        component,
      },
      {
        path: "/conversation/:postSlugId/onboarding/verify",
        alias: "/conversation/:postSlugId/embed/onboarding/verify",
        name: "/conversation/[postSlugId].onboarding/verify",
        component,
      },
      {
        path: "/conversation/:postSlugId/onboarding/verify/email-code",
        alias: "/conversation/:postSlugId/embed/onboarding/verify/email-code",
        name: "/conversation/[postSlugId].onboarding/verify/email-code",
        component,
      },
      {
        path: "/project/:projectSlug/conversation/:postSlugId/onboarding/verify",
        name: "/conversation/[postSlugId].onboarding/project/verify",
        component,
      },
      {
        path: "/project/:projectSlug/conversation/:postSlugId/onboarding/verify/email-code",
        name: "/conversation/[postSlugId].onboarding/project/verify/email-code",
        component,
      },
    ],
  });
  await router.push(path);
  const app = createApp(component);
  const queryClient = new QueryClient();
  clients.push(queryClient);
  app.use(pinia);
  app.use(VueQueryPlugin, { queryClient });
  app.use(router);
  return {
    router,
    queryClient,
    flow: onboardingFlowStore(pinia),
    onboarding: useConversationOnboardingStore(pinia),
    ...app.runWithContext(useVerificationComplete),
  };
}

describe("verification completion navigation", () => {
  it("refreshes an obsolete credential denial without deriving the next step from local flags", async () => {
    const { queryClient, completeVerification, router } = await setup(
      "/conversation/example/onboarding/verify/email-code"
    );
    const queryKey = ["participation-status", "example"];
    const queryFn = vi
      .fn<() => Promise<ConversationParticipationStatus>>()
      .mockResolvedValue({ status: "ready" });
    const observer = new QueryObserver<ConversationParticipationStatus>(
      queryClient,
      {
        queryKey,
        queryFn,
        initialData: {
          status: "onboarding_required",
          nextStep: { kind: "email", purpose: "login" },
        },
        staleTime: Infinity,
      }
    );
    const unsubscribe = observer.subscribe(() => {});
    try {
      await completeVerification();
      expect(queryFn).toHaveBeenCalledOnce();
      expect(queryClient.getQueryData(queryKey)).toEqual({ status: "ready" });
      expect(router.currentRoute.value.path).toBe(
        "/conversation/example/onboarding/verify"
      );
    } finally {
      unsubscribe();
    }
  });
  it("allows retrying an authenticated handoff after a navigation guard blocks it", async () => {
    const { router, completeVerification, hasCompletionFailed } = await setup(
      "/conversation/example/onboarding/verify/email-code"
    );
    const removeGuard = router.beforeEach(() => false);
    await expect(completeVerification()).rejects.toMatchObject({
      cause: { type: NavigationFailureType.aborted },
    });
    expect(hasCompletionFailed.value).toBe(true);
    removeGuard();
    await completeVerification();
    expect(hasCompletionFailed.value).toBe(false);
    expect(router.currentRoute.value.path).toBe(
      "/conversation/example/onboarding/verify"
    );
  });

  it("clears the completion loading state when refreshing authentication fails", async () => {
    const {
      completeVerification,
      isCompletingVerification,
      hasCompletionFailed,
    } = await setup("/verify/email/");
    const pending = Promise.withResolvers<{ isKnown: false }>();
    auth.getDeviceLoginStatus.mockReturnValueOnce(pending.promise);
    const completion = completeVerification();
    expect(isCompletingVerification.value).toBe(true);
    pending.reject(new Error("Authentication refresh failed"));
    await expect(completion).rejects.toThrow("Authentication refresh failed");
    expect(isCompletingVerification.value).toBe(false);
    expect(routeUserAfterLogin).not.toHaveBeenCalled();
    expect(hasCompletionFailed.value).toBe(true);
    await completeVerification();
    expect(hasCompletionFailed.value).toBe(false);
    expect(routeUserAfterLogin).toHaveBeenCalledOnce();
  });

  it.each([
    "/conversation/example/onboarding/verify",
    "/project/test/conversation/example/onboarding/verify",
    "/conversation/example/embed/onboarding/verify",
  ])(
    "recovers %s from a refreshed verification route without global flow state",
    async (verifyPath) => {
      const { router, flow, completeVerification } = await setup(
        `${verifyPath}/email-code`
      );
      flow.onboardingMode = "SIGNUP";
      await completeVerification();
      expect(auth.updateAuthState).toHaveBeenCalledExactlyOnceWith({
        partialLoginStatus: { isKnown: false },
        forceRefresh: true,
      });
      expect(router.currentRoute.value.path).toBe(verifyPath);
      expect(routeUserAfterLogin).not.toHaveBeenCalled();
    }
  );

  it("does not let an old conversation session redirect settings verification", async () => {
    const { router, onboarding, completeVerification } =
      await setup("/verify/email/");
    onboarding.startResumeEntry({ conversationSlugId: "old-conversation" });
    await completeVerification();
    expect(routeUserAfterLogin).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.path).toBe("/verify/email/");
  });

  it("keeps the signup username step for standalone signup", async () => {
    const { router, flow, completeVerification } =
      await setup("/verify/email/");
    flow.onboardingMode = "SIGNUP";
    await completeVerification();
    expect(router.currentRoute.value.path).toBe("/onboarding/step4-username/");
    expect(routeUserAfterLogin).not.toHaveBeenCalled();
  });

  it("does not navigate away from the restored page when verification finishes after dismissal", async () => {
    const { router, completeVerification } = await setup(
      "/project/test/conversation/example/onboarding/verify/email-code"
    );
    const pending = Promise.withResolvers<void>();
    auth.updateAuthState.mockReturnValueOnce(pending.promise);
    const completing = completeVerification();
    await vi.waitFor(() => expect(auth.updateAuthState).toHaveBeenCalledOnce());
    await router.replace("/");
    const email = emailVerificationStore();
    email.verificationEmail = "new-session@example.test";
    pending.resolve();
    await completing;
    expect(router.currentRoute.value.path).toBe("/");
    expect(routeUserAfterLogin).not.toHaveBeenCalled();
    expect(email.verificationEmail).toBe("new-session@example.test");
  });
});
