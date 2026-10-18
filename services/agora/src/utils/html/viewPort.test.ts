import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EffectScope, effectScope, nextTick } from "vue";

import { useVisibleViewport } from "./viewPort";

const scopes: EffectScope[] = [];

function useViewportInScope() {
  const scope = effectScope();
  scopes.push(scope);
  const result = scope.run(useVisibleViewport);
  if (result === undefined) throw new Error("Missing viewport scope");
  return result.viewport;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
    800
  );
});

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("shared visible viewport", () => {
  it("accounts for the visual viewport's offset when the keyboard overlays the layout", () => {
    vi.stubGlobal(
      "visualViewport",
      Object.assign(new EventTarget(), {
        height: 400,
        offsetTop: 60,
        scale: 1,
      })
    );
    const viewport = useViewportInScope();
    expect(viewport.value).toEqual({
      top: 60,
      height: 400,
      bottom: 460,
      bottomInset: 340,
      scale: 1,
    });
  });

  it("does not compensate twice when the browser already resizes content", () => {
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      400
    );
    vi.stubGlobal(
      "visualViewport",
      Object.assign(new EventTarget(), {
        height: 400,
        offsetTop: 0,
        scale: 1,
      })
    );
    expect(useViewportInScope().value.bottomInset).toBe(0);
  });

  it("does not interpret pinch zoom as keyboard occlusion", () => {
    vi.stubGlobal(
      "visualViewport",
      Object.assign(new EventTarget(), {
        height: 400,
        offsetTop: 0,
        scale: 2,
      })
    );
    expect(useViewportInScope().value.bottomInset).toBe(0);
  });

  it("shares coalesced resize updates and removes listeners after the last consumer", async () => {
    const visualViewport = Object.assign(new EventTarget(), {
      height: 800,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal("visualViewport", visualViewport);
    const removeListener = vi.spyOn(visualViewport, "removeEventListener");
    const first = useViewportInScope();
    const second = useViewportInScope();
    await nextTick();
    expect(first).toBe(second);
    visualViewport.height = 450;
    visualViewport.dispatchEvent(new Event("resize"));
    visualViewport.height = 400;
    visualViewport.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(first.value.height).toBe(400);
    scopes[0]?.stop();
    expect(removeListener).not.toHaveBeenCalled();
    scopes[1]?.stop();
    expect(removeListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
      { passive: true }
    );
    expect(removeListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true }
    );
  });

  it("uses the layout viewport when no visual viewport is available", () => {
    vi.stubGlobal("visualViewport", undefined);
    expect(useViewportInScope().value).toEqual({
      top: 0,
      height: 800,
      bottom: 800,
      bottomInset: 0,
      scale: 1,
    });
  });

  it("does not publish unchanged viewport events", async () => {
    const visualViewport = Object.assign(new EventTarget(), {
      height: 400,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal("visualViewport", visualViewport);
    const viewport = useViewportInScope();
    const initial = viewport.value;
    await nextTick();
    visualViewport.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(viewport.value).toBe(initial);
  });

  it("cancels pending viewport work when the final consumer is disposed", async () => {
    const visualViewport = Object.assign(new EventTarget(), {
      height: 800,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal("visualViewport", visualViewport);
    const viewport = useViewportInScope();
    await nextTick();
    visualViewport.height = 400;
    visualViewport.dispatchEvent(new Event("resize"));
    scopes[0]?.stop();
    vi.advanceTimersToNextFrame();
    expect(viewport.value.height).toBe(800);
    expect(vi.getTimerCount()).toBe(0);
  });
});
