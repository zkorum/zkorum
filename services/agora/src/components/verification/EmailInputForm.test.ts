import { createPinia } from "pinia";
import { QIcon, QInput, Quasar } from "quasar";
import { afterEach, describe, expect, it } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

import EmailInputForm from "./EmailInputForm.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

describe("email field accessibility", () => {
  it("names the field and associates instructions and validation errors with the native input", async () => {
    const form = ref<InstanceType<typeof EmailInputForm>>();
    const container = document.createElement("div");
    document.body.append(container);
    const app = createApp(
      defineComponent(() => () => h(EmailInputForm, { ref: form }))
    );
    app.use(createPinia());
    app.use(Quasar, { components: { QInput, QIcon } });
    app.use(createI18n({ legacy: false, locale: "en", messages: {} }));
    apps.push(app);
    app.mount(container);
    await nextTick();
    const input = container.querySelector("input");
    if (input === null) throw new Error("Email input was not rendered");
    expect(input.getAttribute("aria-label")).toBe("Email address");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    const descriptionId = input.getAttribute("aria-describedby");
    expect(descriptionId).not.toBeNull();
    expect(document.getElementById(descriptionId ?? "")?.textContent).toContain(
      "6-digit"
    );
    expect(form.value?.submit()).toBe(false);
    await nextTick();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedIds =
      input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedIds).toHaveLength(2);
    expect(
      describedIds
        .map((id) => document.getElementById(id)?.textContent)
        .join(" ")
    ).toContain("Please enter an email address");
  });
});
