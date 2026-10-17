import { QCheckbox, Quasar } from "quasar";
import type { SupportedDisplayLanguageCodes } from "src/shared/languages";
import { afterEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";

import ConversationUpdateOnboardingConsent from "./ConversationUpdateOnboardingConsent.vue";
import type { ConversationUpdateScopeSummary } from "./conversationUpdateTypes";

const mountedApps: App[] = [];

afterEach(() => {
  for (const app of mountedApps.splice(0)) {
    app.unmount();
  }
  document.body.replaceChildren();
});

describe("ConversationUpdateOnboardingConsent", () => {
  it("explains optional email updates and highlights the no-marketing guarantee for both scopes", () => {
    const project = mountConsent({ locale: "en", scopeKind: "project" });
    const conversation = mountConsent({
      locale: "en",
      scopeKind: "no-project",
    });

    expect(project.textContent).toContain(
      "Receive project updates by email (optional)"
    );
    expect(conversation.textContent).toContain(
      "Receive conversation updates by email (optional)"
    );
    expect(project.textContent).toContain(
      "Only project-related updates from the team running it."
    );
    expect(conversation.textContent).toContain(
      "Only conversation-related updates from the team running it."
    );
    expect(project.querySelector("strong")?.textContent).toBe(
      "No ads or marketing emails."
    );
    expect(conversation.querySelector("strong")?.textContent).toBe(
      "No ads or marketing emails."
    );
    expect(project.textContent).toContain(
      "You can change your preference at any time in your email settings."
    );
  });

  it("renders consent copy in an RTL locale without English leakage", () => {
    const container = mountConsent({ locale: "ar", scopeKind: "project" });

    expect(container.dir).toBe("rtl");
    expect(container.textContent).toContain("هذا المشروع");
    expect(container.textContent).toContain("ميسّرو المشروع");
    expect(container.textContent).toContain("إعدادات البريد الإلكتروني");
    expect(container.textContent).not.toContain("Email me");
  });

  it("uses the approved French scope-specific consent copy", () => {
    const project = mountConsent({ locale: "fr", scopeKind: "project" });
    const conversation = mountConsent({
      locale: "fr",
      scopeKind: "no-project",
    });

    expect(project.textContent).toContain(
      "Recevoir les nouvelles du projet par e-mail (facultatif)"
    );
    expect(project.querySelector("strong")?.textContent).toBe(
      "Sans publicité ni communication commerciale."
    );
    expect(project.textContent).toContain(
      "Uniquement des nouvelles liées au projet, envoyées par l’équipe qui l’anime. Vous pouvez modifier votre choix à tout moment dans les paramètres d’e-mail."
    );
    expect(conversation.textContent).toContain(
      "Recevoir les nouvelles de la conversation par e-mail (facultatif)"
    );
    expect(conversation.textContent).toContain(
      "Uniquement des nouvelles liées à la conversation, envoyées par l’équipe qui l’anime. Vous pouvez modifier votre choix à tout moment dans les paramètres d’e-mail."
    );
  });

  it("uses idiomatic Spanish copy with facilitator and content safeguards", () => {
    const project = mountConsent({ locale: "es", scopeKind: "project" });
    const text = project.textContent ?? "";

    expect(text).toContain("Seguir el proyecto por correo");
    expect(text).toContain("redactadas y enviadas por quienes facilitan");
    expect(text).toContain("permitirle volver a participar");
    expect(text).toContain("publicidad");
    expect(text).toContain("recaudación de fondos");
    expect(text).toContain("campañas políticas");
    expect(text).toContain("promoción que no esté relacionada");
    expect(text).toContain("Puede cambiar esta opción");
  });

  it("associates each optional checkbox with its own formatted description", () => {
    const container = mountConsents({
      locale: "en",
      scopeKinds: ["project", "no-project"],
    });
    const [projectDescription, conversationDescription] =
      container.querySelectorAll("small");
    const [projectCheckbox, conversationCheckbox] =
      container.querySelectorAll('[role="checkbox"]');

    expect(container.querySelectorAll("small")).toHaveLength(2);
    expect(container.querySelectorAll('[role="checkbox"]')).toHaveLength(2);
    expect(projectDescription?.id).toBeTruthy();
    expect(conversationDescription?.id).toBeTruthy();
    expect(projectDescription?.id).not.toBe(conversationDescription?.id);
    expect(projectCheckbox?.getAttribute("aria-describedby")).toBe(
      projectDescription?.id
    );
    expect(conversationCheckbox?.getAttribute("aria-describedby")).toBe(
      conversationDescription?.id
    );
    expect(projectCheckbox?.getAttribute("aria-required")).not.toBe("true");
  });
});

function mountConsent({
  locale,
  scopeKind,
}: {
  locale: SupportedDisplayLanguageCodes;
  scopeKind: ConversationUpdateScopeSummary["kind"];
}): HTMLElement {
  return mountConsents({ locale, scopeKinds: [scopeKind] });
}

function mountConsents({
  locale,
  scopeKinds,
}: {
  locale: SupportedDisplayLanguageCodes;
  scopeKinds: readonly ConversationUpdateScopeSummary["kind"][];
}): HTMLElement {
  const container = document.createElement("div");
  container.dir = locale === "ar" ? "rtl" : "ltr";
  document.body.append(container);
  const app = createApp(
    defineComponent(
      () => () =>
        h(
          "div",
          scopeKinds.map((scopeKind) =>
            h(ConversationUpdateOnboardingConsent, {
              modelValue: false,
              scopeKind,
            })
          )
        )
    )
  );
  app.use(Quasar, { components: { QCheckbox } });
  app.use(createI18n({ legacy: false, locale, messages: {} }));
  mountedApps.push(app);
  app.mount(container);
  return container;
}
