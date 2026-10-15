import type { PostAsSettings } from "src/composables/conversation/draft";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, ref } from "vue";

vi.mock("pinia", () => ({ storeToRefs: (store: object) => store }));
vi.mock("src/stores/user", () => ({
  useUserStore: () => ({
    profileData: ref({
      userName: "Personal account",
      organizationList: [
        { slug: "owner", name: "Owner", imageUrl: undefined },
        { slug: "unavailable", name: "Unavailable", imageUrl: undefined },
      ],
    }),
  }),
}));
vi.mock("src/components/account/DynamicProfileImage.vue", () => ({
  default: () => null,
}));
vi.mock("src/components/ui-library/ZKBottomDialogContainer.vue", () => ({
  default: defineComponent({
    setup(_props, { slots }) {
      return () => h("div", slots.default?.());
    },
  }),
}));

import PostAsAccountDialog from "./PostAsAccountDialog.vue";

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

function mountDialog(allowedPostAs: readonly PostAsSettings[] | undefined) {
  const select = vi.fn();
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp(PostAsAccountDialog, {
    modelValue: true,
    postAs: { postAsOrganization: true, organizationName: "owner" },
    allowedPostAs,
    "onUpdate:postAs": select,
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
  return { host, select };
}

describe("PostAsAccountDialog", () => {
  it("only offers identities with an authorized project destination", () => {
    const { host, select } = mountDialog([
      { postAsOrganization: true, organizationName: "owner" },
    ]);
    expect(host.textContent).toBe("Owner");
    const button = host.querySelector("button");
    expect(button?.type).toBe("button");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    button?.click();
    expect(select).toHaveBeenCalledExactlyOnceWith({
      postAsOrganization: true,
      organizationName: "owner",
    });
  });

  it("supports selecting the personal identity without offering other organizations", () => {
    const { host, select } = mountDialog([
      { postAsOrganization: false, organizationName: "" },
    ]);
    expect(host.textContent).toBe("Personal account");
    host.querySelector("button")?.click();
    expect(select).toHaveBeenCalledExactlyOnceWith({
      postAsOrganization: false,
      organizationName: "",
    });
  });

  it("preserves the full identity picker for creation", () => {
    const { host } = mountDialog(undefined);
    expect(host.querySelectorAll("button")).toHaveLength(3);
  });
});
