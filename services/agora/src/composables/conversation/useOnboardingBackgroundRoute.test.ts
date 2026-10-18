import { createPinia } from "pinia";
import { QBtn, QDialog, Quasar } from "quasar";
import ApplicationRouteView from "src/components/navigation/ApplicationRouteView.vue";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import ConversationOnboarding from "src/pages/conversation/[postSlugId].onboarding.vue";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import {
  createMemoryHistory,
  createRouter,
  RouterView,
  useRoute,
} from "vue-router";

import { useOnboardingBackgroundRoute } from "./useOnboardingBackgroundRoute";

vi.mock("src/layouts/PersistentLayout.vue", async () => {
  const { defineComponent } = await import("vue");
  return {
    default: defineComponent(
      (_props, { slots }) =>
        () =>
          slots.default?.()
    ),
  };
});
vi.mock("src/composables/zupass/useZupassVerification", () => ({
  useZupassVerification: () => ({ isVerifying: false }),
}));
vi.mock("src/composables/conversation/useConversationOnboardingExit", () => ({
  useConversationOnboardingExit: () => ({
    exitToConversation: () => Promise.resolve(),
  }),
}));

const mountedApps: App[] = [];

afterEach(() => {
  for (const app of mountedApps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function settle(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

async function mountFlow({
  path,
  backgroundDelay,
}: {
  path: string;
  backgroundDelay: Promise<void>;
}) {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const dismiss = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const Conversation = defineComponent(() => {
    const route = useRoute();
    return () => h("article", { "data-background": "" }, route.fullPath);
  });
  const loadConversation = vi.fn(async () => {
    await backgroundDelay;
    return Conversation;
  });
  const Step = defineComponent(
    (props: { sheet: DismissalController }) => {
      const route = useRoute();
      return () =>
        h(
          ConversationOnboardingLayout,
          {
            sheet: props.sheet,
            backCallback: () => {},
            closeCallback: dismiss,
          },
          { default: () => h("div", route.fullPath) }
        );
    },
    { props: { sheet: { type: Object, required: true } } }
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        name: "/",
        component: defineComponent(
          () => () => h("article", { "data-background": "" }, "Feed")
        ),
      },
      {
        path: "/settings/",
        name: "/settings/",
        component: defineComponent(
          () => () => h("article", { "data-background": "" }, "Settings")
        ),
      },
      {
        path: "/conversation/:postSlugId/",
        name: "/conversation/[postSlugId]/",
        component: loadConversation,
      },
      {
        path: "/project/:projectSlug/conversation/:postSlugId/",
        name: "/project/[projectSlug]/conversation/[postSlugId]/",
        component: loadConversation,
      },
      {
        path: "/conversation/:postSlugId/onboarding",
        name: "/conversation/[postSlugId].onboarding",
        component: ConversationOnboarding,
        children: [
          {
            path: "",
            name: "/conversation/[postSlugId].onboarding/",
            component: Step,
          },
          {
            path: "summary",
            name: "/conversation/[postSlugId].onboarding/summary",
            component: Step,
          },
        ],
      },
      {
        path: "/project/:projectSlug/conversation/:postSlugId/onboarding",
        name: "/conversation/[postSlugId].onboarding/project",
        component: ConversationOnboarding,
        children: [
          {
            path: "",
            name: "/conversation/[postSlugId].onboarding/project/",
            component: Step,
          },
        ],
      },
    ],
  });
  await router.push(path);
  const app = createApp(
    defineComponent(() => {
      const { background, isOnboarding } = useOnboardingBackgroundRoute();
      return () =>
        h("div", [
          background.value.kind === "ready"
            ? h(ApplicationRouteView, { route: background.value.route })
            : null,
          isOnboarding.value ? h(RouterView) : null,
        ]);
    })
  );
  app.use(createPinia());
  app.use(router);
  app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
  app.use(Quasar, { components: { QDialog, QBtn } });
  const container = document.createElement("div");
  document.body.append(container);
  mountedApps.push(app);
  app.mount(container);
  await settle();
  return { router, dismiss, loadConversation };
}

describe("routed conversation onboarding", () => {
  it("retains the background instance and route while steps change and when returning", async () => {
    const { router } = await mountFlow({
      path: "/conversation/example/?opinion=statement",
      backgroundDelay: Promise.resolve(),
    });
    const background = document.querySelector("[data-background]");
    await router.push("/conversation/example/onboarding/");
    await settle();
    const dialog = document.querySelector(".q-dialog");
    expect(document.querySelector("[data-background]")).toBe(background);
    expect(background?.textContent).toBe(
      "/conversation/example/?opinion=statement"
    );

    await router.push("/conversation/example/onboarding/summary");
    await settle();
    expect(document.querySelector(".q-dialog")).toBe(dialog);
    expect(background?.textContent).toBe(
      "/conversation/example/?opinion=statement"
    );

    await router.push("/conversation/example/?opinion=statement");
    await settle();
    expect(document.querySelector("[data-background]")).toBe(background);
    expect(document.querySelector(".q-dialog")).toBeNull();
  });

  it("reconstructs the project conversation beneath a direct onboarding link", async () => {
    await mountFlow({
      path: "/project/test/conversation/example/onboarding/",
      backgroundDelay: Promise.resolve(),
    });
    expect(document.querySelector("[data-background]")?.textContent).toBe(
      "/project/test/conversation/example/"
    );
    expect(document.querySelector("[role=dialog]")).not.toBeNull();
  });

  it("delegates backdrop dismissal to the step and stays open if it cannot leave", async () => {
    const { dismiss } = await mountFlow({
      path: "/conversation/example/onboarding/",
      backgroundDelay: Promise.resolve(),
    });
    document
      .querySelector(".q-dialog__backdrop")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(dismiss).toHaveBeenCalledOnce();
    expect(document.querySelector("[role=dialog]")).not.toBeNull();
  });

  it("delegates a downward drag to the same step dismissal", async () => {
    const { dismiss } = await mountFlow({
      path: "/conversation/example/onboarding/",
      backgroundDelay: Promise.resolve(),
    });
    document
      .querySelector(".dialog-drag-handle")
      ?.dispatchEvent(
        new PointerEvent("pointerdown", { clientY: 100, button: 0 })
      );
    window.dispatchEvent(new PointerEvent("pointermove", { clientY: 190 }));
    window.dispatchEvent(new PointerEvent("pointerup", { clientY: 190 }));
    await settle();
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("keeps the originating feed without loading another page", async () => {
    const { router, loadConversation } = await mountFlow({
      path: "/",
      backgroundDelay: Promise.resolve(),
    });
    const background = document.querySelector("[data-background]");
    await router.push("/conversation/example/onboarding/");
    await settle();
    expect(document.querySelector("[data-background]")).toBe(background);
    expect(background?.textContent).toBe("Feed");
    expect(loadConversation).not.toHaveBeenCalled();
  });

  it("finishes one background import across step redirects", async () => {
    const backgroundDelay = Promise.withResolvers<void>();
    const { router, loadConversation } = await mountFlow({
      path: "/conversation/example/onboarding/",
      backgroundDelay: backgroundDelay.promise,
    });
    await router.push("/conversation/example/onboarding/summary");
    backgroundDelay.resolve();
    await settle();
    expect(loadConversation).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-background]")?.textContent).toBe(
      "/conversation/example/"
    );
  });

  it("does not replace a newer page when an old background import finishes", async () => {
    const backgroundDelay = Promise.withResolvers<void>();
    const { router } = await mountFlow({
      path: "/conversation/example/onboarding/",
      backgroundDelay: backgroundDelay.promise,
    });
    await router.push("/settings/");
    backgroundDelay.resolve();
    await settle();
    expect(document.querySelector("[data-background]")?.textContent).toBe(
      "Settings"
    );
  });

  it("encodes external route parameters instead of loading arbitrary background pages", async () => {
    await mountFlow({
      path: "/conversation/..%2Fsettings/onboarding/",
      backgroundDelay: Promise.resolve(),
    });
    expect(document.querySelector("[data-background]")?.textContent).toBe(
      "/conversation/..%2Fsettings/"
    );
  });
});
