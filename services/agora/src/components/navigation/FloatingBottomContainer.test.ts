import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, h, KeepAlive, nextTick, ref } from "vue";

vi.mock("quasar", () => ({
  useQuasar: () => ({ lang: { rtl: false } }),
}));
vi.mock("src/stores/navigation", () => ({
  useNavigationStore: () => ({
    drawerBehavior: ref("mobile"),
    drawerWidth: ref(280),
  }),
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/conversation/test/" }),
}));

import FloatingBottomContainer from "./FloatingBottomContainer.vue";

const apps: App[] = [];

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

describe("floating composer lifecycle", () => {
  it("hides cached overlays without destroying their composer state", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const visible = ref(true);
    const app = createApp({
      render: () =>
        h(KeepAlive, () =>
          visible.value
            ? h(FloatingBottomContainer, {}, () => h("input"))
            : undefined
        ),
    });
    apps.push(app);
    app.mount(host);
    await nextTick();

    const input = document.querySelector(".bottomBar input");
    if (!(input instanceof HTMLInputElement))
      throw new Error("Missing composer");
    input.value = "Unsaved statement";
    visible.value = false;
    await nextTick();
    await nextTick();
    const bar = document.querySelector(".bottomBar");
    if (!(bar instanceof HTMLElement)) throw new Error("Missing cached bar");
    expect(bar.style.display).toBe("none");

    visible.value = true;
    await nextTick();
    await nextTick();
    expect(document.querySelector(".bottomBar input")).toBe(input);
    expect(input.value).toBe("Unsaved statement");
    expect(bar.style.display).not.toBe("none");
  });
});
