import { QBtn, QIcon, QLinearProgress, Quasar } from "quasar";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type VNode,
} from "vue";
import { createI18n } from "vue-i18n";

import StepperLayout from "./StepperLayout.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mountStepper(
  body: () => VNode = () => h("input", { type: "text" })
) {
  const enabled = ref(true);
  const loading = ref(false);
  const visible = ref(true);
  const step = ref(1);
  const submit = vi.fn();
  const formSubmit = vi.fn();
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp(
    defineComponent(
      () => () =>
        h(
          "form",
          {
            onSubmit: (event: Event) => {
              event.preventDefault();
              formSubmit();
            },
          },
          h(
            StepperLayout,
            {
              submitCallBack: submit,
              currentStep: step.value,
              totalSteps: 3,
              enableNextButton: enabled.value,
              showNextButton: visible.value,
              showLoadingButton: loading.value,
              fixedNavigation: true,
            },
            {
              header: () =>
                h(InfoHeader, {
                  title: "Your answer",
                  description: "Choose an answer",
                  iconName: "mdi-information",
                }),
              body,
            }
          )
        )
    )
  );
  app.use(Quasar, { components: { QBtn, QIcon, QLinearProgress } });
  app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
  apps.push(app);
  app.mount(container);
  await nextTick();
  return {
    container,
    submit,
    formSubmit,
    enabled,
    loading,
    visible,
    step,
    app,
  };
}

function element({
  container,
  selector,
}: {
  container: HTMLElement;
  selector: string;
}): HTMLElement {
  const found = container.querySelector(selector);
  if (!(found instanceof HTMLElement))
    throw new Error(`Missing test element: ${selector}`);
  return found;
}

function pressEnter({
  target,
  options = {},
}: {
  target: EventTarget;
  options?: KeyboardEventInit;
}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
    composed: true,
    ...options,
  });
  target.dispatchEvent(event);
  return event;
}

describe("onboarding stepper keyboard accessibility", () => {
  it("activates the actual Continue button once from a single-line input and prevents a second form submit", async () => {
    const { container, submit, formSubmit } = await mountStepper();
    const click = vi.fn();
    element({
      container,
      selector: 'button[aria-label="Continue"]',
    }).addEventListener("click", click);
    const event = pressEnter({
      target: element({ container, selector: "input" }),
    });
    expect(event.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
    expect(formSubmit).not.toHaveBeenCalled();
  });

  it.each(["disabled", "loading", "hidden"])(
    "does not bypass the %s Continue state",
    async (state) => {
      const { container, submit, enabled, loading, visible } =
        await mountStepper();
      enabled.value = state !== "disabled";
      loading.value = state === "loading";
      visible.value = state !== "hidden";
      await nextTick();
      expect(
        pressEnter({ target: element({ container, selector: "input" }) })
          .defaultPrevented
      ).toBe(true);
      expect(submit).not.toHaveBeenCalled();
    }
  );

  it("continues from the initially focused dialog container or the step's static content", async () => {
    const { container, submit } = await mountStepper();
    pressEnter({ target: element({ container, selector: "h1" }) });
    pressEnter({ target: container });
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it.each([
    { name: "multiline input", tag: "textarea", attrs: {} },
    { name: "native select", tag: "select", attrs: {} },
    { name: "another button", tag: "button", attrs: { type: "button" } },
    { name: "link", tag: "a", attrs: { href: "#help" } },
    { name: "disclosure", tag: "summary", attrs: {} },
    {
      name: "rich-text editor",
      tag: "div",
      attrs: { contenteditable: "true" },
    },
    { name: "combobox", tag: "input", attrs: { role: "combobox" } },
    { name: "radio choice", tag: "div", attrs: { role: "radio" } },
    { name: "checkbox", tag: "input", attrs: { type: "checkbox" } },
    { name: "menu item", tag: "div", attrs: { role: "menuitem" } },
  ])("preserves Enter's own behavior in a $name", async ({ tag, attrs }) => {
    const { container, submit } = await mountStepper(() =>
      h(tag, { ...attrs, "data-control": "" })
    );
    const event = pressEnter({
      target: element({ container, selector: "[data-control]" }),
    });
    expect(event.defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("leaves an open dropdown alone even when focus stays on other step content", async () => {
    const { container, submit } = await mountStepper(() =>
      h("div", { role: "combobox", "aria-expanded": "true" })
    );
    const event = pressEnter({
      target: element({ container, selector: ".scrollContent" }),
    });
    expect(event.defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("preserves the keyboard behavior of controls inside a component's shadow DOM", async () => {
    const { container, submit } = await mountStepper(() =>
      h("div", { "data-shadow": "" })
    );
    const host = element({ container, selector: "[data-shadow]" });
    const shadow = host.attachShadow({ mode: "open" });
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    shadow.append(checkbox);
    expect(pressEnter({ target: checkbox }).defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not act on the inert background or when a nested modal is open", async () => {
    const { container, submit } = await mountStepper();
    container.setAttribute("inert", "");
    pressEnter({ target: element({ container, selector: "input" }) });
    container.removeAttribute("inert");
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.append(modal);
    pressEnter({ target: element({ container, selector: "input" }) });
    expect(submit).not.toHaveBeenCalled();
  });

  it("respects child handlers and ignores unrelated fields, held keys, modifiers, and IME composition", async () => {
    const { container, submit } = await mountStepper();
    const input = element({ container, selector: "input" });
    for (const options of [
      { isComposing: true },
      { repeat: true },
      { shiftKey: true },
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
    ])
      pressEnter({ target: input, options });
    input.addEventListener("keydown", (event) => event.preventDefault());
    pressEnter({ target: input });
    const unrelated = document.createElement("input");
    document.body.append(unrelated);
    pressEnter({ target: unrelated });
    expect(submit).not.toHaveBeenCalled();
  });

  it("provides a heading and labelled progress, preserves field focus during validation, and moves focus to new step content", async () => {
    const { container, step, enabled } = await mountStepper();
    expect(document.activeElement).toBe(
      element({ container, selector: ".scrollContent" })
    );
    expect(element({ container, selector: "h1" }).textContent).toContain(
      "Your answer"
    );
    expect(
      element({ container, selector: '[role="progressbar"]' }).getAttribute(
        "aria-label"
      )
    ).toBe("Step 1 of 3");
    const input = element({ container, selector: "input" });
    input.focus();
    enabled.value = false;
    await nextTick();
    expect(document.activeElement).toBe(input);
    step.value = 2;
    await nextTick();
    expect(document.activeElement).toBe(
      element({ container, selector: ".scrollContent" })
    );
    expect(
      element({ container, selector: ".scrollContent" }).getAttribute(
        "aria-label"
      )
    ).toBe("Step 2 of 3");
  });

  it("does not steal focus from a nested modal when the underlying step changes", async () => {
    const { step } = await mountStepper();
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    const field = document.createElement("input");
    modal.append(field);
    document.body.append(modal);
    field.focus();
    step.value = 2;
    await nextTick();
    expect(document.activeElement).toBe(field);
  });
});
