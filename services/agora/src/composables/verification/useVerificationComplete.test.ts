import { createPinia, setActivePinia } from "pinia";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { emailVerificationStore } from "src/stores/onboarding/email";
import { onboardingFlowStore } from "src/stores/onboarding/flow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";

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
  app.use(pinia);
  app.use(router);
  return {
    router,
    flow: onboardingFlowStore(pinia),
    onboarding: useConversationOnboardingStore(pinia),
    ...app.runWithContext(useVerificationComplete),
  };
}

describe("verification completion navigation", () => {
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
