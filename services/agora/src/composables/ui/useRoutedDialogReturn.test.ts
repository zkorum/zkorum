import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick } from "vue";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";

import { useRoutedDialogReturn } from "./useRoutedDialogReturn";

const apps: App[] = [];
afterEach(async () => {
  for (const app of apps.splice(0)) app.unmount();
  await nextTick();
  document.documentElement.classList.remove("q-document--prevent-scroll");
  await nextTick();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mountDialog() {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(window, "scrollY", "get").mockReturnValue(470);
  const originButton = document.createElement("button");
  document.body.append(originButton);
  originButton.focus();
  const focus = vi.spyOn(originButton, "focus");
  const page = { render: () => h("main") };
  const dialog = defineComponent(() => {
    useRoutedDialogReturn("/origin?filter=new");
    return () => h("section");
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/origin", component: page },
      { path: "/other", component: page },
      { path: "/dialog", component: dialog },
    ],
  });
  await router.push("/origin?filter=new");
  const app = createApp({ render: () => h(RouterView) });
  app.use(router);
  const container = document.createElement("div");
  document.body.append(container);
  apps.push(app);
  app.mount(container);
  await router.push("/dialog");
  await nextTick();
  return { router, scroll, focus };
}

describe("routed dialog return", () => {
  it("waits for Quasar's delayed scroll unlock before restoring scroll and focus", async () => {
    const { router, scroll, focus } = await mountDialog();
    document.documentElement.classList.add("q-document--prevent-scroll");
    await router.replace("/origin?filter=new");
    await nextTick();
    expect(scroll).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    document.documentElement.classList.remove("q-document--prevent-scroll");
    await vi.waitFor(() =>
      expect(scroll).toHaveBeenCalledExactlyOnceWith({ left: 0, top: 470 })
    );
    expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
  });

  it("cancels and disconnects delayed restoration when a newer navigation leaves the origin", async () => {
    const { router, scroll, focus } = await mountDialog();
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    document.documentElement.classList.add("q-document--prevent-scroll");
    await router.replace("/origin?filter=new");
    await nextTick();
    await router.replace("/other");
    await nextTick();
    expect(disconnect).toHaveBeenCalledOnce();
    document.documentElement.classList.remove("q-document--prevent-scroll");
    await router.replace("/origin?filter=new");
    await nextTick();
    expect(scroll).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });

  it("does not restore scroll or steal focus when leaving for another page", async () => {
    const { router, scroll, focus } = await mountDialog();
    await router.replace("/other");
    await nextTick();
    expect(scroll).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });

  it("still restores the origin when a later navigation is rejected", async () => {
    const { router, scroll } = await mountDialog();
    document.documentElement.classList.add("q-document--prevent-scroll");
    await router.replace("/origin?filter=new");
    await nextTick();
    const stopGuard = router.beforeEach(() => false);
    await router.replace("/other");
    stopGuard();
    document.documentElement.classList.remove("q-document--prevent-scroll");
    await vi.waitFor(() =>
      expect(scroll).toHaveBeenCalledExactlyOnceWith({ left: 0, top: 470 })
    );
  });
});
