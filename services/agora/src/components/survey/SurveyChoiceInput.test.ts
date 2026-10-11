import { QCheckbox, QInput, QSelect, Quasar } from "quasar";
import type { SurveyChoiceDisplay } from "src/shared/types/zod";
import { afterEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

import SurveyChoiceInput from "./SurveyChoiceInput.vue";

const mounted: Array<{ app: App; target: HTMLElement }> = [];
afterEach(() => {
  for (const { app, target } of mounted.splice(0)) {
    app.unmount();
    target.remove();
  }
});

function mountChoice({
  multiple = false,
  display = "list",
  allowsText = true,
}: {
  multiple?: boolean;
  display?: SurveyChoiceDisplay;
  allowsText?: boolean;
} = {}) {
  const single = ref<string | null>(multiple ? null : "other");
  const multi = ref<string[]>([]);
  const texts = ref<Record<string, string>>({ other: "Saved text" });
  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(SurveyChoiceInput, {
            choiceDisplay: display,
            isMultipleSelection: multiple,
            isRequired: true,
            options: [
              { value: "bicycle", label: "Bicycle", allowsText: true },
              { value: "other", label: "Other", allowsText },
            ],
            selectedSingleOptionSlugId: single.value,
            selectedMultiOptionSlugIds: multi.value,
            optionTextValues: texts.value,
            selectOptionLabel: "Select an option",
            maxSelections: multiple ? 2 : 1,
            "onUpdate:selectedSingleOptionSlugId": (value: string | null) => {
              single.value = value;
            },
            "onUpdate:selectedMultiOptionSlugIds": (value: string[]) => {
              multi.value = value;
            },
            "onUpdate:optionTextValues": (value: Record<string, string>) => {
              texts.value = value;
            },
          });
      },
    })
  );
  app.use(Quasar, { components: { QCheckbox, QInput, QSelect } });
  app.use(
    createI18n({
      legacy: false,
      locale: "en",
      messages: { en: { common: { loading: "Loading" } } },
    })
  );
  const target = document.createElement("div");
  document.body.append(target);
  app.mount(target);
  mounted.push({ app, target });
  return { target, single, multi, texts };
}

describe("choice option text inputs", () => {
  it.each(["list", "dropdown"] satisfies SurveyChoiceDisplay[])(
    "edits saved text in the %s layout without changing the selection",
    async (display) => {
      const { target, single, texts } = mountChoice({ display });
      const input = target.querySelector("textarea");
      if (input === null) throw new Error("Expected option text input");
      expect(input.value).toBe("Saved text");
      expect(input.getAttribute("aria-label")).toContain("Other");
      input.value = "Updated text";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await nextTick();
      expect(texts.value.other).toBe("Updated text");
      expect(single.value).toBe("other");
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await nextTick();
      expect(texts.value.other).toBe("");
      expect(single.value).toBe("other");
    }
  );

  it("keeps independent texts for checkboxes and restores drafts after reselecting", async () => {
    const { target, multi, texts } = mountChoice({ multiple: true });
    const [bicycle, other] =
      target.querySelectorAll<HTMLElement>('[role="checkbox"]');
    if (bicycle === undefined || other === undefined)
      throw new Error("Expected choice checkboxes");
    other.click();
    await nextTick();
    expect(multi.value).toEqual(["other"]);
    bicycle.click();
    await nextTick();
    expect(target.querySelectorAll("textarea")).toHaveLength(2);
    const bicycleInput = target.querySelector(
      'textarea[aria-label^="Bicycle"]'
    );
    if (!(bicycleInput instanceof HTMLTextAreaElement))
      throw new Error("Expected bicycle text input");
    bicycleInput.value = "Electric bicycle";
    bicycleInput.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(texts.value).toEqual({
      other: "Saved text",
      bicycle: "Electric bicycle",
    });
    other.click();
    await nextTick();
    expect(target.querySelector('textarea[aria-label^="Other"]')).toBeNull();
    other.click();
    await nextTick();
    const otherInput = target.querySelector('textarea[aria-label^="Other"]');
    expect(
      otherInput instanceof HTMLTextAreaElement ? otherInput.value : undefined
    ).toBe("Saved text");
  });

  it("displays collected text read-only after the author disables its field", () => {
    const { target } = mountChoice({ allowsText: false });
    const input = target.querySelector("textarea");
    expect(input?.value).toBe("Saved text");
    expect(input?.readOnly).toBe(true);
  });

  it("renders submitted markup literally instead of creating HTML elements", async () => {
    const { target, texts } = mountChoice();
    const literal = '<img data-survey-injected="yes" src="x" />';
    texts.value.other = literal;
    await nextTick();
    expect(target.querySelector("textarea")?.value).toBe(literal);
    expect(target.querySelector("[data-survey-injected]")).toBeNull();
  });
});
