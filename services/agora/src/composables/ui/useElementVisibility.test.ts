import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  ref,
  shallowRef,
} from "vue";

import { useElementVisibility } from "./useElementVisibility";

const apps: App[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
    800
  );
  vi.stubGlobal("visualViewport", undefined);
});

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function flushFrames(): Promise<void> {
  await nextTick();
  vi.advanceTimersToNextFrame();
  await nextTick();
  vi.advanceTimersToNextFrame();
  await nextTick();
}

function mountVisibility() {
  const host = document.createElement("div");
  document.body.append(host);
  const target = ref<HTMLElement>();
  const enabled = ref(false);
  const visible = ref(true);
  const boundsRevision = ref(0);
  const controls = shallowRef<ReturnType<typeof useElementVisibility>>();
  const viewport = Object.assign(new EventTarget(), {
    height: 800,
    offsetTop: 0,
    scale: 1,
  });
  vi.stubGlobal("visualViewport", viewport);
  const readTarget = vi.fn(() => target.value);
  const Component = defineComponent({
    setup() {
      controls.value = useElementVisibility({
        target: readTarget,
        enabled: () => enabled.value,
        getBounds: () => ({
          top: 12,
          bottom: viewport.height - 12 - boundsRevision.value,
        }),
      });
      return () => h("input");
    },
  });
  const app = createApp({
    render: () =>
      h(KeepAlive, () => (visible.value ? h(Component) : undefined)),
  });
  apps.push(app);
  app.mount(host);
  const input = host.querySelector("input");
  if (input === null) throw new Error("Missing input");
  target.value = input;
  let scrollTop = 0;
  input.getBoundingClientRect = () => new DOMRect(0, 600 - scrollTop, 250, 50);
  const scroll = vi
    .spyOn(window, "scrollBy")
    .mockImplementation((options: number | ScrollToOptions) => {
      if (typeof options === "object") scrollTop += options.top ?? 0;
    });
  return {
    enabled,
    visible,
    viewport,
    scroll,
    boundsRevision,
    readTarget,
    controls,
  };
}

describe("event-driven element visibility", () => {
  it("reveals the field on a keyboard resize before any input event", async () => {
    const { enabled, viewport, scroll } = mountVisibility();
    enabled.value = true;
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
    await flushFrames();
    await flushFrames();
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll).toHaveBeenCalledWith({ top: 262, behavior: "instant" });
  });

  it("stops correcting after manual scrolling until a new focus session", async () => {
    const { enabled, viewport, scroll } = mountVisibility();
    enabled.value = true;
    await flushFrames();
    window.dispatchEvent(new Event("touchmove"));
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
    await flushFrames();
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
    enabled.value = false;
    await nextTick();
    enabled.value = true;
    await flushFrames();
    expect(scroll).toHaveBeenCalledOnce();
  });

  it("cancels pending corrections on blur", async () => {
    const { enabled, viewport, scroll } = mountVisibility();
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
    enabled.value = true;
    await nextTick();
    enabled.value = false;
    await flushFrames();
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
  });

  it("does not scroll for deactivated cached pages", async () => {
    const { enabled, visible, viewport, scroll, readTarget } =
      mountVisibility();
    enabled.value = true;
    await flushFrames();
    visible.value = false;
    await nextTick();
    readTarget.mockClear();
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
    await flushFrames();
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
    expect(readTarget).not.toHaveBeenCalled();
    visible.value = true;
    await flushFrames();
    expect(scroll).toHaveBeenCalledOnce();
  });

  it("coalesces repeated layout changes without postponing pending correction", async () => {
    const { enabled, boundsRevision, scroll } = mountVisibility();
    const requestFrame = vi.spyOn(window, "requestAnimationFrame");
    enabled.value = true;
    await nextTick();
    for (const revision of [400, 401, 402]) {
      boundsRevision.value = revision;
      await nextTick();
    }
    expect(requestFrame).toHaveBeenCalledOnce();
    vi.advanceTimersToNextFrame();
    expect(scroll).toHaveBeenCalledWith({ top: 264, behavior: "instant" });
  });

  it("does not fight pinch zoom", async () => {
    const { enabled, viewport, scroll } = mountVisibility();
    enabled.value = true;
    await flushFrames();
    viewport.height = 400;
    viewport.scale = 2;
    viewport.dispatchEvent(new Event("resize"));
    await flushFrames();
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
  });

  it("allows one explicit arrival reveal without enabling ongoing corrections", async () => {
    const { viewport, controls, scroll } = mountVisibility();
    viewport.height = 400;
    controls.value?.reveal();
    await flushFrames();
    expect(scroll).toHaveBeenCalledOnce();
    scroll.mockClear();
    viewport.height = 300;
    viewport.dispatchEvent(new Event("resize"));
    await flushFrames();
    await flushFrames();
    expect(scroll).not.toHaveBeenCalled();
  });
});
