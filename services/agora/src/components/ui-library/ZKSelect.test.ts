import { QSelect, Quasar } from "quasar";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";

import ZKSelect from "./ZKSelect.vue";

const apps: App[] = [];
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function mountSelect({
  behavior = "dialog",
  multiple = true,
}: {
  behavior?: "dialog" | "menu";
  multiple?: boolean;
} = {}) {
  const selected = ref<string | string[] | null>(multiple ? [] : null);
  const app = createApp(
    defineComponent(
      () => () =>
        h(ZKSelect, {
          modelValue: selected.value,
          options: [
            { label: "Bicycle", value: "bicycle" },
            { label: "Train", value: "train" },
          ],
          label: "Transport",
          multiple,
          searchable: true,
          "onUpdate:modelValue": (value: string | string[] | null) => {
            selected.value = value;
          },
        })
    )
  );
  // Use the real Quasar popup in both mobile-dialog and desktop-menu modes.
  app.component(
    "QSelect",
    defineComponent({
      inheritAttrs: false,
      setup(_props, { attrs, slots, expose }) {
        const select = ref<QSelect>();
        expose({
          hidePopup: () => select.value?.hidePopup(),
          blur: () => select.value?.blur(),
          updateInputValue: (
            ...args: Parameters<QSelect["updateInputValue"]>
          ) => select.value?.updateInputValue(...args),
        });
        return () => h(QSelect, { ...attrs, ref: select, behavior }, slots);
      },
    })
  );
  app.use(Quasar);
  app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
  const target = document.createElement("div");
  document.body.append(target);
  app.mount(target);
  apps.push(app);
  return { target, selected };
}

async function openSelect({
  target,
  behavior = "dialog",
}: {
  target: HTMLElement;
  behavior?: "dialog" | "menu";
}): Promise<HTMLElement> {
  const control = target.querySelector<HTMLElement>(".q-field__control");
  if (control === null) throw new Error("Select control not found");
  if (behavior === "menu") target.querySelector("input")?.focus();
  control.click();
  const selector = behavior === "dialog" ? ".q-select__dialog" : ".q-menu";
  await vi.waitFor(() => {
    expect(document.querySelector(selector)).not.toBeNull();
  });
  const dialog = document.querySelector<HTMLElement>(selector);
  if (dialog === null) throw new Error("Select dialog not found");
  return dialog;
}

function clickDone(dialog: HTMLElement): void {
  const button = [...dialog.querySelectorAll("button")].find(
    (element) => element.textContent === "Done"
  );
  if (button === undefined) throw new Error("Done button not found");
  button.click();
}

describe("select popup dismissal", () => {
  it.each(["dialog", "menu"] satisfies ("dialog" | "menu")[])(
    "closes the %s with Done and preserves selections when reopened",
    async (behavior) => {
      const { target, selected } = mountSelect({ behavior });
      const dialog = await openSelect({ target, behavior });
      await vi.waitFor(() => {
        expect(dialog.querySelectorAll('[role="option"]')).toHaveLength(2);
      });
      const option = [
        ...dialog.querySelectorAll<HTMLElement>('[role="option"]'),
      ].find((element) => element.textContent === "Bicycle");
      if (option === undefined) throw new Error("Bicycle option not found");
      option.click();
      await vi.waitFor(() => expect(selected.value).toEqual(["bicycle"]));
      const selector = behavior === "dialog" ? ".q-select__dialog" : ".q-menu";
      expect(document.querySelector(selector)).not.toBeNull();

      clickDone(dialog);
      await vi.waitFor(() => {
        expect(document.querySelector(selector)).toBeNull();
      });
      expect(selected.value).toEqual(["bicycle"]);
      expect(document.activeElement).not.toBeInstanceOf(HTMLInputElement);

      const reopenedDialog = await openSelect({ target, behavior });
      expect(reopenedDialog.textContent).toContain("Bicycle");
      expect(selected.value).toEqual(["bicycle"]);
    }
  );

  it("keeps Done available when a search has no matching options", async () => {
    const { target, selected } = mountSelect();
    const dialog = await openSelect({ target });
    const input = dialog.querySelector("input");
    if (input === null) throw new Error("Search input not found");
    input.value = "no matching transport";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(dialog.textContent).toContain("No results"));

    clickDone(dialog);
    await vi.waitFor(() => {
      expect(document.querySelector(".q-select__dialog")).toBeNull();
    });
    expect(selected.value).toEqual([]);
    const reopenedDialog = await openSelect({ target });
    await vi.waitFor(() =>
      expect(reopenedDialog.textContent).toContain("Bicycle")
    );
  });

  it("keeps single-select auto-dismissal without a Done button", async () => {
    const { target, selected } = mountSelect({ multiple: false });
    const dialog = await openSelect({ target });
    await vi.waitFor(() =>
      expect(dialog.querySelectorAll('[role="option"]')).toHaveLength(2)
    );
    expect(
      [...dialog.querySelectorAll("button")].some(
        (button) => button.textContent === "Done"
      )
    ).toBe(false);
    const option = dialog.querySelector<HTMLElement>('[role="option"]');
    if (option === null) throw new Error("Select option not found");
    option.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".q-select__dialog")).toBeNull()
    );
    expect(selected.value).toBe("bicycle");
  });
});
