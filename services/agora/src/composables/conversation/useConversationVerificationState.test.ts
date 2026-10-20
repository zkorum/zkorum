import { createPinia } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, ref } from "vue";

const snapshot = ref<ParticipationStatus>({ status: "checking" });
const refetch = vi.hoisted(() => vi.fn<() => Promise<unknown>>());
vi.mock("src/utils/api/participation/useParticipationStatusQuery", () => ({
  useParticipationStatusQuery: () => ({
    participationStatus: snapshot,
    refetch,
  }),
}));

import { useConversationVerificationState } from "./useConversationVerificationState";

let app: App | undefined;
beforeEach(() => {
  snapshot.value = { status: "checking" };
  refetch.mockResolvedValue(undefined);
});
afterEach(() => {
  app?.unmount();
  vi.resetAllMocks();
});
function mountState(loggedIn: boolean) {
  const pinia = createPinia();
  const auth = useAuthenticationStore(pinia);
  auth.isAuthInitialized = true;
  auth.setLoginStatus({
    isKnown: true,
    userId: "viewer",
    isRegistered: true,
    isLoggedIn: loggedIn,
  });
  let state: ReturnType<typeof useConversationVerificationState> | undefined;
  app = createApp({
    setup() {
      state = useConversationVerificationState({
        conversationSlugId: "example",
        routeContext: { kind: "project", projectSlug: "project" },
      });
      return () => null;
    },
  });
  app.use(pinia);
  app.mount(document.createElement("div"));
  if (state === undefined)
    throw new Error("Verification state was not mounted");
  return state;
}

describe("minimal verification-screen state", () => {
  it("uses backend login intent even when the local session still looks logged in", () => {
    snapshot.value = {
      status: "onboarding_required",
      nextStep: { kind: "account", purpose: "login" },
    };
    const state = mountState(true);
    expect(state.phoneAuthPurpose.value).toBe("login");
    expect(state.credentialChoicePath.value).toBe(
      "/project/project/conversation/example/onboarding/verify/hard"
    );
  });

  it("uses backend credential intent without recomputing verification requirements locally", () => {
    snapshot.value = {
      status: "onboarding_required",
      nextStep: { kind: "identity", purpose: "credential" },
    };
    const state = mountState(false);
    expect(state.phoneAuthPurpose.value).toBe("credential");
    expect(state.credentialChoicePath.value).toBe(
      "/project/project/conversation/example/onboarding/verify/identity"
    );
  });

  it("keeps loading distinct from an unavailable status and retries the same query", async () => {
    const state = mountState(false);
    expect(state.isInitialLoading.value).toBe(true);
    snapshot.value = { status: "unavailable" };
    expect(state.isInitialLoading.value).toBe(false);
    expect(state.hasLoadError.value).toBe(true);
    await state.refetchAll();
    expect(refetch).toHaveBeenCalledOnce();
  });
});
