import PrimeVue from "primevue/config";
import { afterEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

import ZKInputOtp from "./ZKInputOtp.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

describe("accessible verification code inputs", () => {
  it("labels each position while retaining paste, digit validation, and arrow-key navigation", async () => {
    const code = ref("");
    const container = document.createElement("div");
    document.body.append(container);
    const app = createApp(
      defineComponent(
        () => () =>
          h(ZKInputOtp, {
            modelValue: code.value,
            length: 6,
            integerOnly: true,
            "onUpdate:modelValue": (value) => {
              code.value = value;
            },
          })
      )
    );
    app.use(PrimeVue);
    app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
    apps.push(app);
    app.mount(container);
    await nextTick();
    const inputs = [...container.querySelectorAll("input")];
    expect(inputs).toHaveLength(6);
    expect(inputs.map((input) => input.getAttribute("aria-label"))).toEqual(
      Array.from(
        { length: 6 },
        (_, index) => `Verification code, character ${index + 1} of 6`
      )
    );
    const first = inputs.at(0);
    const second = inputs.at(1);
    if (first === undefined || second === undefined)
      throw new Error("Code inputs were not rendered");
    first.focus();
    const invalid = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(invalid);
    expect(invalid.defaultPrevented).toBe(true);
    first.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(document.activeElement).toBe(second);
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", {
      value: { getData: () => "123456" },
    });
    first.dispatchEvent(paste);
    await nextTick();
    expect(code.value).toBe("123456");
    expect(inputs.map((input) => input.value).join("")).toBe("123456");
    first.focus();
    first.setSelectionRange(0, 0);
    first.click();
    expect(first.selectionStart).toBe(0);
    expect(first.selectionEnd).toBe(1);
    expect(
      inputs.every(
        (input) =>
          input.autocomplete === "one-time-code" &&
          input.inputMode === "numeric"
      )
    ).toBe(true);
  });
});
