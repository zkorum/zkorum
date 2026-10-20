import { createDismissalController } from "src/utils/ui/dismissalController";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, ref } from "vue";

const push = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const preloadStatus = vi.hoisted(() => vi.fn());

vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
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
});
