import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import type { useSurveyPrefetch } from "src/utils/api/survey/useSurveyQueries";
import { createDismissalController } from "src/utils/ui/dismissalController";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  toValue,
} from "vue";

const push = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const preloadStatus = vi.hoisted(() => vi.fn());
const preloadRoute = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const prefetchSurvey = vi.hoisted(() => vi.fn<typeof useSurveyPrefetch>());
const participationStatus = ref<ParticipationStatus>({ status: "checking" });

vi.mock("vue-router", () => ({
  useRouter: () => ({ push, resolve: (path: string) => ({ fullPath: path }) }),
  loadRouteLocation: preloadRoute,
}));
vi.mock("src/utils/api/survey/useSurveyQueries", () => ({
  useSurveyPrefetch: prefetchSurvey,
}));
vi.mock("src/composables/conversation/useConversationOnboardingRoute", () => ({
  useConversationOnboardingRoute: () => ({
    routeConversationSlugId: ref("example"),
    routeContext: ref({ kind: "normal" }),
  }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({ exitToConversation: vi.fn() }),
}));
vi.mock("src/utils/api/participation/useParticipationStatusQuery", () => ({
  useParticipationStatusQuery: preloadStatus,
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/layouts/ConversationOnboardingLayout.vue", () => ({
  default: defineComponent({
    setup(_, { slots }) {
      return () => h("main", slots.default?.());
    },
  }),
}));
vi.mock("src/components/onboarding/layouts/StepperLayout.vue", () => ({
  default: defineComponent({
    props: {
      submitCallBack: { type: Function, required: true },
    },
    setup(props, { slots }) {
      return () =>
        h("section", [
          slots.header?.(),
          h("button", { onClick: () => props.submitCallBack() }, "Continue"),
        ]);
    },
  }),
}));
vi.mock("src/components/onboarding/ui/InfoHeader.vue", () => ({
  default: defineComponent({
    props: { title: { type: String, required: true } },
    setup(props) {
      return () => h("h1", props.title);
    },
  }),
}));

import Welcome from "./index.vue";

let app: App | undefined;
beforeEach(() => {
  participationStatus.value = { status: "checking" };
  preloadStatus.mockReturnValue({ participationStatus });
  preloadRoute.mockResolvedValue(undefined);
});
afterEach(() => {
  app?.unmount();
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("immediate onboarding welcome", () => {
  it("shows Welcome and allows continuation while participation data is still loading", async () => {
    app = createApp(Welcome, {
      sheet: createDismissalController({ fallbackDismiss: async () => {} }),
    });
    const root = document.createElement("div");
    document.body.append(root);
    app.mount(root);

    expect(root.querySelector("h1")?.textContent).toBe("welcomeTitle");
    expect(preloadStatus).toHaveBeenCalledOnce();
    const button = root.querySelector("button");
    if (button === null) throw new Error("Welcome action is missing");
    button.click();
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify",
      })
    );
  });

  it("prepares the backend-selected question and opens it from cache without waiting for imports", async () => {
    participationStatus.value = {
      status: "onboarding_required",
      nextStep: {
        kind: "survey",
        routeResolution: {
          kind: "question",
          questionSlugId: "server-question",
        },
      },
    };
    preloadRoute.mockReturnValue(new Promise(() => {}));
    const root = mountWelcome();
    expect(preloadRoute).toHaveBeenCalledWith({
      fullPath: "/conversation/example/onboarding/question/server-question",
    });
    expect(push).not.toHaveBeenCalled();
    const params = prefetchSurvey.mock.calls[0]?.[0];
    expect(params !== undefined && toValue(params.enabled)).toBe(true);
    root.querySelector("button")?.click();
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/question/server-question",
      })
    );
  });

  it("uses the latest snapshot if the next step changes while preloading", async () => {
    participationStatus.value = {
      status: "onboarding_required",
      nextStep: {
        kind: "survey",
        routeResolution: { kind: "question", questionSlugId: "obsolete" },
      },
    };
    const pending = Promise.withResolvers<void>();
    preloadRoute.mockReturnValue(pending.promise);
    const root = mountWelcome();
    participationStatus.value = {
      status: "onboarding_required",
      nextStep: { kind: "account", purpose: "login" },
    };
    await nextTick();
    root.querySelector("button")?.click();
    pending.resolve();
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify/hard",
      })
    );
    const params = prefetchSurvey.mock.calls[0]?.[0];
    expect(params !== undefined && toValue(params.enabled)).toBe(false);
  });

  it("keeps speculative failures silent and avoids fetching answers for verification", async () => {
    participationStatus.value = {
      status: "onboarding_required",
      nextStep: { kind: "email", purpose: "login" },
    };
    preloadRoute.mockRejectedValue(new Error("Background import failed"));
    const root = mountWelcome();
    await nextTick();
    expect(root.querySelector("h1")?.textContent).toBe("welcomeTitle");
    const params = prefetchSurvey.mock.calls[0]?.[0];
    expect(params !== undefined && toValue(params.enabled)).toBe(false);
    root.querySelector("button")?.click();
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify/email",
      })
    );
  });
});

function mountWelcome(): HTMLElement {
  app = createApp(Welcome, {
    sheet: createDismissalController({ fallbackDismiss: async () => {} }),
  });
  const root = document.createElement("div");
  document.body.append(root);
  app.mount(root);
  return root;
}
