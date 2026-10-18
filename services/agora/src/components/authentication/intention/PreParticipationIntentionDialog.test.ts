import { QBtn, QDialog, QIcon, Quasar } from "quasar";
import type { PossibleIntentions } from "src/stores/loginIntention";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

const push = vi.hoisted(() => vi.fn());
const setActiveUserIntention = vi.hoisted(() => vi.fn());

vi.mock("src/stores/loginIntention", () => ({
  useLoginIntentionStore: () => ({ setActiveUserIntention }),
}));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
}));

import PreParticipationIntentionDialog from "./PreParticipationIntentionDialog.vue";

const mountedApps: App[] = [];

beforeEach(() => {
  vi.clearAllMocks();
});

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
            okCallback: vi.fn(),
          })
      )
    );
    app.use(Quasar, { components: { QBtn, QDialog, QIcon } });
    app.use(i18n);
    mountedApps.push(app);
    app.mount(container);
    await nextTick();

    expect(document.body.textContent).toContain("Log in to Agora");
    expect(document.body.textContent).toContain(
      "Log in to participate in the discussions"
    );
    expect(document.body.textContent).not.toContain("email");
    expect(document.body.textContent).toContain(
      "return to this statement to cast your vote."
    );
    expect(document.body.textContent).toContain("Log In");
    expect(document.body.textContent).toContain("Cancel");

    i18n.global.locale.value = "fr";
    await nextTick();

    expect(document.body.textContent).toContain("Se connecter à Agora");
    expect(document.body.textContent).toContain(
      "Connectez-vous pour participer aux discussions"
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
