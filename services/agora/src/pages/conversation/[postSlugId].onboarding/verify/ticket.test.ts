import type { TicketVerificationResult } from "src/composables/zupass/useTicketVerificationFlow";
import { participationRejectionFixture } from "src/utils/api/participation/participationTestFixtures";
import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
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
  verify: vi.fn<() => Promise<TicketVerificationResult>>(),
  replace: vi.fn(),
  exit: vi.fn(),
}));
const snapshot = ref<ParticipationStatus>(
  participationRejectionFixture("event_ticket_required").participationStatus
);
const route = reactive({
  path: "/conversation/example/onboarding/verify/ticket",
  fullPath: "/conversation/example/onboarding/verify/ticket",
  name: "/conversation/[postSlugId].onboarding/verify/ticket",
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
vi.mock("src/composables/zupass/useTicketVerificationFlow", () => ({
  useTicketVerificationFlow: () => ({ verifyTicket: mocks.verify }),
}));
vi.mock("src/utils/api/participation/useParticipationStatusQuery", () => ({
  useParticipationStatusQuery: () => ({
    participationStatus: snapshot,
    refetch: vi.fn(),
  }),
}));
vi.mock("src/utils/nav/goBackButton", () => ({
  useGoBackButtonHandler: () => ({ safeNavigateBack: vi.fn() }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/layouts/ConversationOnboardingLayout.vue", () => ({
  default: defineComponent(
    (_, { slots }) =>
      () =>
        h("main", slots.default?.())
  ),
}));
vi.mock("src/components/onboarding/ui/InfoHeader.vue", () => ({
  default: defineComponent(() => () => null),
}));
vi.mock("src/components/onboarding/layouts/StepperLayout.vue", () => ({
  default: defineComponent({
    props: { submitCallBack: { type: Function, required: true } },
    setup(props) {
      return () =>
        h("button", { onClick: () => props.submitCallBack() }, "Verify");
    },
  }),
}));

import Ticket from "./ticket.vue";

let app: App | undefined;
beforeEach(() => {
  route.path = "/conversation/example/onboarding/verify/ticket";
  route.fullPath = route.path;
  route.name = "/conversation/[postSlugId].onboarding/verify/ticket";
  snapshot.value = participationRejectionFixture(
    "event_ticket_required"
  ).participationStatus;
  mocks.replace.mockImplementation((target: { path: string }) => {
    route.path = target.path;
    route.fullPath = target.path;
    route.name = "/conversation/[postSlugId].onboarding/verify";
    return Promise.resolve();
  });
});
afterEach(() => {
  app?.unmount();
  document.body.replaceChildren();
  vi.resetAllMocks();
});
function mountTicket() {
  const target = document.createElement("div");
  document.body.append(target);
  app = createApp(Ticket, {
    sheet: createDismissalController({ fallbackDismiss: async () => {} }),
  });
  app.mount(target);
  return target;
}

describe("ticket snapshot handoff", () => {
  it("does not navigate a reused ticket page after its route changes", async () => {
    const pending = Promise.withResolvers<TicketVerificationResult>();
    mocks.verify.mockReturnValue(pending.promise);
    const target = mountTicket();
    target.querySelector("button")?.click();
    await nextTick();
    route.fullPath = "/conversation/another/onboarding/verify/ticket";
    pending.resolve({
      success: true,
      userIdChanged: false,
      needsCacheRefresh: false,
    });
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("handles a trailing-slash link using the canonical route name", async () => {
    route.path += "/";
    snapshot.value = { status: "ready" };
    mountTicket();
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledOnce());
  });
  it("does not bounce to verification root while the backend still requires a ticket", async () => {
    mountTicket();
    await nextTick();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("advances once from the write-returned snapshot without a survey or conversation refresh", async () => {
    const pending = Promise.withResolvers<TicketVerificationResult>();
    mocks.verify.mockReturnValue(pending.promise);
    const target = mountTicket();
    target.querySelector("button")?.click();
    await nextTick();
    expect(mocks.verify).toHaveBeenCalledExactlyOnceWith({
      eventSlug: "devconnect-2025",
      conversationSlugId: "example",
    });
    snapshot.value = { status: "ready" };
    await nextTick();
    expect(mocks.replace).not.toHaveBeenCalled();
    pending.resolve({
      success: true,
      userIdChanged: false,
      needsCacheRefresh: false,
    });
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledExactlyOnceWith({
        path: "/conversation/example/onboarding/verify",
      })
    );
    await nextTick();
    expect(mocks.replace).toHaveBeenCalledOnce();
  });
});
