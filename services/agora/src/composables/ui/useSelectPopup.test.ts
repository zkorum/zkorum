import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EffectScope, effectScope, nextTick, watch } from "vue";

import { useSelectPopup } from "./useSelectPopup";

const scopes: EffectScope[] = [];

function usePopupInScope() {
  const scope = effectScope();
  scopes.push(scope);
  const popup = scope.run(useSelectPopup);
  if (popup === undefined) throw new Error("Missing popup scope");
  return popup;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("select popup viewport sizing", () => {
  it("shares keyboard resize updates and releases listeners after its last consumer", async () => {
    const viewport = Object.assign(new EventTarget(), {
      height: 800,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal("visualViewport", viewport);
    const removeListener = vi.spyOn(viewport, "removeEventListener");
    const first = usePopupInScope();
    const second = usePopupInScope();
    await nextTick();
    expect(first).toBe(second);

    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(first.value.popupContentStyle).toBe(
      "--zk-select-popup-max-height: 180px"
    );

    scopes[0]?.stop();
    expect(removeListener).not.toHaveBeenCalled();
    scopes[1]?.stop();
    expect(removeListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
      {
        passive: true,
      }
    );

    viewport.height = 600;
    const remounted = usePopupInScope();
    expect(remounted.value.popupContentStyle).toBe(
      "--zk-select-popup-max-height: 270px"
    );
  });

  it("does not publish new popup props when only the viewport offset changes", async () => {
    const viewport = Object.assign(new EventTarget(), {
      height: 400,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal("visualViewport", viewport);
    const popup = usePopupInScope();
    const initial = popup.value;
    const changed = vi.fn();
    const stop = watch(popup, changed);
    await nextTick();

    viewport.offsetTop = 60;
    viewport.dispatchEvent(new Event("scroll"));
    vi.advanceTimersToNextFrame();
    await nextTick();

    expect(popup.value).toBe(initial);
    expect(changed).not.toHaveBeenCalled();
    stop();
  });
});
