import { QCheckbox, Quasar } from "quasar";
import { afterEach, describe, expect, it } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type VNode,
} from "vue";

import ZKCheckbox from "./ZKCheckbox.vue";

const mountedApps: App[] = [];

afterEach(() => {
  for (const app of mountedApps.splice(0)) {
    app.unmount();
  }
  document.body.replaceChildren();
});

describe("ZKCheckbox descriptions", () => {
  it("preserves plain-text descriptions and their accessible association", () => {
    const container = mountCheckbox({ description: "Email preferences" });
    const description = container.querySelector("small");

    expect(description?.textContent?.trim()).toBe("Email preferences");
    expect(description?.id).toBeTruthy();
    expect(
      container
        .querySelector('[role="checkbox"]')
        ?.getAttribute("aria-describedby")
    ).toBe(description?.id);
  });

  it("omits the description and its association when there is no content", () => {
    const container = mountCheckbox({ description: undefined });

    expect(container.querySelector("small")).toBeNull();
    expect(
      container
        .querySelector('[role="checkbox"]')
        ?.hasAttribute("aria-describedby")
    ).toBe(false);
  });

  it("supports adding and removing a description slot without a dummy text prop", async () => {
    const showDescription = ref(false);
    const container = mountCheckbox({
      description: undefined,
      descriptionSlot: () =>
        showDescription.value
          ? { description: () => [h("strong", "No marketing emails.")] }
          : {},
    });

    expect(container.querySelector("small")).toBeNull();
    showDescription.value = true;
    await nextTick();

    const description = container.querySelector("small");
    expect(description?.querySelector("strong")?.textContent).toBe(
      "No marketing emails."
    );
    expect(description?.id).toBeTruthy();
    expect(
      container
        .querySelector('[role="checkbox"]')
        ?.getAttribute("aria-describedby")
    ).toBe(description?.id);

    showDescription.value = false;
    await nextTick();

    expect(container.querySelector("small")).toBeNull();
    expect(
      container
        .querySelector('[role="checkbox"]')
        ?.hasAttribute("aria-describedby")
    ).toBe(false);
  });
});

function mountCheckbox({
  description,
  descriptionSlot = () => ({}),
}: {
  description: string | undefined;
  descriptionSlot?: () => { description?: () => VNode[] };
}): HTMLElement {
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp(
    defineComponent(
      () => () =>
        h(
          ZKCheckbox,
          {
            modelValue: false,
            label: "Receive updates",
            description,
            required: false,
            disabled: false,
          },
          descriptionSlot()
        )
    )
  );
  app.use(Quasar, { components: { QCheckbox } });
  mountedApps.push(app);
  app.mount(container);
  return container;
}
