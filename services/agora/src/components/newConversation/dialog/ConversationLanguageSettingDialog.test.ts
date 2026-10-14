import type { ConversationMultilingualSetting } from "src/shared/types/zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  type FunctionalComponent,
  h,
  nextTick,
  ref,
} from "vue";

vi.mock("quasar", () => ({ useQuasar: () => ({ lang: { rtl: false } }) }));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key, locale: ref("en") }),
}));
vi.mock("src/components/ui-library/ZKBottomDialogContainer.vue", () => ({
  default: defineComponent(
    (_props, { slots }) =>
      () =>
        h("div", slots.default?.())
  ),
}));
vi.mock("./ConversationLanguageSettingsRow.vue", () => ({
  default: Object.assign(
    (
      props: { title: string; clickable: boolean; disabled: boolean },
      { emit, slots }: Parameters<FunctionalComponent>[1]
    ) =>
      h("div", [
        props.clickable
          ? h(
              "button",
              { disabled: props.disabled, onClick: () => emit("click") },
              props.title
            )
          : null,
        slots.actions?.(),
      ]),
    { props: ["title", "clickable", "disabled"], emits: ["click"] }
  ),
}));
vi.mock("./ConversationAdditionalLanguagesDialog.vue", () => ({
  default: () => null,
}));

import ConversationLanguageSettingDialog from "./ConversationLanguageSettingDialog.vue";

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.replaceChildren();
});

describe("language settings after premium expiry", () => {
  it("shows existing translation as enabled and allows disabling it without clearing languages", async () => {
    const setting = ref<ConversationMultilingualSetting>({
      dynamicTranslationEnabled: true,
      additionalLanguageCodes: ["fr"],
    });
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(
      defineComponent(
        () => () =>
          h(ConversationLanguageSettingDialog, {
            showDialog: true,
            canUseDynamicTranslation: false,
            multilingualSetting: setting.value,
            "onUpdate:multilingualSetting": (value) => {
              setting.value = value;
            },
          })
      )
    );
    app.component(
      "QDialog",
      defineComponent(
        (_props, { slots }) =>
          () =>
            h("div", slots.default?.())
      )
    );
    app.component("QIcon", () => null);
    app.component(
      "QToggle",
      Object.assign(
        (
          props: { modelValue: boolean },
          { emit }: Parameters<FunctionalComponent>[1]
        ) =>
          h("button", {
            "data-translation": props.modelValue,
            onClick: () => emit("update:modelValue", !props.modelValue),
          }),
        { props: ["modelValue"], emits: ["update:modelValue"] }
      )
    );
    app.mount(host);
    expect(host.querySelector('[data-translation="true"]')).not.toBeNull();
    expect(host.querySelector<HTMLButtonElement>("button")?.disabled).toBe(
      false
    );
    host.querySelector<HTMLButtonElement>('[data-translation="true"]')?.click();
    await nextTick();
    expect(setting.value).toEqual({
      dynamicTranslationEnabled: false,
      additionalLanguageCodes: ["fr"],
    });
    expect(host.querySelector("[data-translation]")).toBeNull();
  });
});
