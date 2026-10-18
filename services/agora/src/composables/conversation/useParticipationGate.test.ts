import type { ParticipationMode } from "src/shared/types/zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, ref } from "vue";

const state = vi.hoisted(() => ({ loggedIn: false, emailVerified: false }));
const startResumeEntry = vi.hoisted(() => vi.fn());
const navigateToSurveyRoot = vi.hoisted(() =>
  vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
);
const resolveEmailUpdates = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ status: "required" }))
);

vi.mock("pinia", () => ({ storeToRefs: (store: object) => store }));
vi.mock("src/stores/authentication", () => ({
  useAuthenticationStore: () => ({
    isAuthInitialized: ref(true),
    isLoggedIn: ref(state.loggedIn),
    hasStrongVerification: ref(false),
    hasEmailVerification: ref(state.emailVerified),
  }),
}));
vi.mock("src/stores/user", () => ({
  useUserStore: () => ({ verifiedEventTickets: ref(new Set()) }),
}));
vi.mock("src/stores/conversationOnboarding", () => ({
  useConversationOnboardingStore: () => ({ startResumeEntry }),
}));
vi.mock("src/composables/conversation/useSurveyNavigation", () => ({
  useSurveyNavigation: () => ({
    navigateToSurveyRoot,
    navigateToNextSurveyStep: vi.fn(),
  }),
}));
vi.mock("src/utils/api/survey/useSurveyQueries", () => ({
  useSurveyStatusQuery: () => ({
    data: ref({
      surveyGate: {
        hasSurvey: true,
        isOptional: false,
        canParticipate: true,
        status: "complete_valid",
      },
    }),
    refetch: vi.fn(),
  }),
}));
vi.mock(
  "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries",
  () => ({
    useConversationEmailUpdateSummaryQuery: () => ({
      resolveOnboarding: resolveEmailUpdates,
    }),
  })
);
vi.mock("vue-router", () => ({
  useRoute: () => ({
    name: "/project/[projectSlug]/conversation/[postSlugId]/analysis",
    params: { projectSlug: "test", postSlugId: "example" },
    fullPath: "/project/test/conversation/example/analysis?opinion=statement",
  }),
}));

import { useParticipationGate } from "./useParticipationGate";

const apps: App[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  state.loggedIn = false;
  state.emailVerified = false;
});
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

async function mountGate(participationMode: ParticipationMode) {
  const ready =
    Promise.withResolvers<ReturnType<typeof useParticipationGate>>();
  const app = createApp(
    defineComponent(() => {
      ready.resolve(
        useParticipationGate({
          conversationSlugId: "example",
          participationMode,
          requiresEventTicket: undefined,
          surveyGate: undefined,
        })
      );
      return () => null;
    })
  );
  const container = document.createElement("div");
  document.body.append(container);
  apps.push(app);
  app.mount(container);
  return await ready.promise;
}

describe("participation onboarding entry", () => {
  it("opens welcome directly and captures the exact return context", async () => {
    const gate = await mountGate("email_verification");
    expect(await gate.needsParticipationOnboarding()).toBe(true);
    await gate.openParticipationOnboarding();
    expect(resolveEmailUpdates).not.toHaveBeenCalled();
    expect(startResumeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationSlugId: "example",
        returnTarget:
          "/project/test/conversation/example/analysis?opinion=statement",
        routeContext: { kind: "project", projectSlug: "test" },
      })
    );
    expect(navigateToSurveyRoot).toHaveBeenCalledExactlyOnceWith({
      conversationSlugId: "example",
    });
  });

  it("does not skip email-update consent just because the survey is complete", async () => {
    state.loggedIn = true;
    state.emailVerified = true;
    const gate = await mountGate("email_verification");
    expect(await gate.needsParticipationOnboarding()).toBe(true);
    await gate.openParticipationOnboarding();
    expect(resolveEmailUpdates).toHaveBeenCalledOnce();
    expect(navigateToSurveyRoot).toHaveBeenCalledOnce();
  });
});
