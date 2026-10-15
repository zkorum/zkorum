import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import { z } from "zod";

vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/components/newConversation/ConversationControlButton.vue", () => ({
  default: defineComponent({
    props: { label: { type: String, required: true } },
    emits: ["click"],
    setup(props, { emit }) {
      return () => h("button", { onClick: () => emit("click") }, props.label);
    },
  }),
}));
vi.mock("src/components/ui-library/ZKBottomDialogContainer.vue", () => ({
  default: defineComponent({
    setup(_props, { slots }) {
      return () => h("div", slots.default?.());
    },
  }),
}));
vi.mock("src/components/ui-library/ZKSelect.vue", () => ({
  default: defineComponent({
    props: { options: { type: Array, required: true } },
    emits: ["update:modelValue"],
    setup(props, { emit }) {
      return () =>
        h("div", [
          ...z
            .array(z.object({ value: z.string(), label: z.string() }))
            .parse(props.options)
            .map((option) =>
              h(
                "button",
                {
                  "data-value": option.value,
                  onClick: () => emit("update:modelValue", option.value),
                },
                option.label
              )
            ),
          h(
            "button",
            {
              "data-value": "invalid",
              onClick: () => emit("update:modelValue", ["other"]),
            },
            "invalid"
          ),
        ]);
    },
  }),
}));

import type { ConversationProjectSelectOption } from "./conversationProjectSelect";
import ConversationProjectSelect from "./ConversationProjectSelect.vue";

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

describe("ConversationProjectSelect", () => {
  it("labels an organization default simply No project", () => {
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(ConversationProjectSelect, {
      options: [{ target: { kind: "no_project", organizationSlug: "test" } }],
      modelValue: { kind: "no_project", organizationSlug: "test" },
      fallbackLabel: undefined,
    });
    app.mount(host);
    expect(host.querySelector("button")?.textContent).toBe("noProjectLabel");
  });

  it("never uses a stale project fallback label for a default scope", () => {
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(ConversationProjectSelect, {
      options: [],
      modelValue: { kind: "no_project" },
      fallbackLabel: "Previous project",
    });
    app.mount(host);
    expect(host.querySelector("button")?.textContent).toBe("noProjectLabel");
  });

  it("never emits a selection when options load, reorder, or disappear", async () => {
    const options = ref<ConversationProjectSelectOption[]>([
      {
        target: { kind: "project", projectSlug: "current" },
        title: "Current",
      },
    ]);
    const select = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(ConversationProjectSelect, {
              options: options.value,
              modelValue: { kind: "project", projectSlug: "current" },
              fallbackLabel: "Current",
              "onUpdate:modelValue": select,
            });
        },
      })
    );
    app.mount(host);
    options.value = [
      { target: { kind: "project", projectSlug: "other" }, title: "Other" },
      ...options.value,
    ];
    await nextTick();
    options.value = [];
    await nextTick();
    expect(select).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Current");
  });

  it("emits only a target from the provided options after explicit selection", async () => {
    const select = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(ConversationProjectSelect, {
      options: [
        {
          target: { kind: "project", projectSlug: "other" },
          title: "Other",
        },
      ],
      modelValue: { kind: "project", projectSlug: "current" },
      fallbackLabel: "Current",
      "onUpdate:modelValue": select,
    });
    app.component(
      "QDialog",
      defineComponent({
        setup(_props, { slots }) {
          return () => h("div", slots.default?.());
        },
      })
    );
    app.mount(host);
    host.querySelector<HTMLButtonElement>('[data-value="invalid"]')?.click();
    expect(select).not.toHaveBeenCalled();
    host
      .querySelector<HTMLButtonElement>('[data-value="project:other"]')
      ?.click();
    await nextTick();
    expect(select).toHaveBeenCalledExactlyOnceWith({
      kind: "project",
      projectSlug: "other",
    });
  });
});
