import { QBtn, QDialog, QIcon, Quasar } from "quasar";
import type { PossibleIntentions } from "src/stores/loginIntention";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

vi.mock("src/composables/zupass/useZupassVerification", () => ({
  useZupassVerification: () => ({ isVerifying: ref(false) }),
}));
vi.mock("src/stores/conversationOnboarding", () => ({
  useConversationOnboardingStore: () => ({ startResumeEntry: vi.fn() }),
}));
vi.mock("src/stores/loginIntention", () => ({
  useLoginIntentionStore: () => ({ setActiveUserIntention: vi.fn() }),
}));
vi.mock("src/stores/onboarding/flow", () => ({
  onboardingFlowStore: () => ({}),
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ fullPath: "/", name: undefined, params: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

import PreParticipationIntentionDialog from "./PreParticipationIntentionDialog.vue";

const mountedApps: App[] = [];

afterEach(() => {
  for (const app of mountedApps.splice(0)) {
    app.unmount();
  }
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("PreParticipationIntentionDialog copy", () => {
  it("updates the entire dialog when the language or participation intention changes", async () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const activeIntention = ref<PossibleIntentions>("agreement");
    const i18n = createI18n({ legacy: false, locale: "en", messages: {} });
    const container = document.createElement("div");
    document.body.append(container);
    const app = createApp(
      defineComponent(
        () => () =>
          h(PreParticipationIntentionDialog, {
            modelValue: true,
            activeIntention: activeIntention.value,
            conversationSlugId: "conversation-one",
            okCallback: vi.fn(),
          })
      )
    );
    app.use(Quasar, { components: { QBtn, QDialog, QIcon } });
    app.use(i18n);
    mountedApps.push(app);
    app.mount(container);
    await nextTick();

    expect(document.body.textContent).toContain(
      "A few quick steps before you participate"
    );
    expect(document.body.textContent).toContain(
      "This short setup helps ensure the quality of the consultation. You participate under a pseudonym."
    );
    expect(document.body.textContent).not.toContain("email");
    expect(document.body.textContent).toContain(
      "return to this statement to cast your vote."
    );
    expect(document.body.textContent).toContain("Get started");
    expect(document.body.textContent).toContain("Not now");

    i18n.global.locale.value = "fr";
    await nextTick();

    expect(document.body.textContent).toContain(
      "Quelques étapes rapides avant de participer"
    );
    expect(document.body.textContent).toContain(
      "Ce court parcours aide à assurer la qualité de la consultation. Vous participez sous pseudonyme."
    );
    expect(document.body.textContent).not.toContain("This short setup");
    expect(document.body.textContent).not.toContain("e-mail");
    expect(document.body.textContent).toContain(
      "Vous retrouverez ensuite cette proposition pour voter."
    );
    expect(document.body.textContent).not.toContain("cast your vote");

    activeIntention.value = "newOpinion";
    await nextTick();

    expect(document.body.textContent).toContain(
      "Votre brouillon de proposition sera sauvegardé."
    );
    expect(document.body.textContent).not.toContain(
      "cette proposition pour voter"
    );
  });
});
