import { describe, expect, it, vi } from "vitest";

import { createDismissalController } from "./dismissalController";

describe("dismissal controller", () => {
  it("uses the current step and ignores stale registration cleanup", async () => {
    const fallbackDismiss = vi
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined);
    const first = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const second = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const controller = createDismissalController({ fallbackDismiss });
    const unregisterFirst = controller.registerDismiss(first);
    const unregisterSecond = controller.registerDismiss(second);
    unregisterFirst();
    await controller.dismiss();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(fallbackDismiss).not.toHaveBeenCalled();

    unregisterSecond();
    await controller.dismiss();
    expect(fallbackDismiss).toHaveBeenCalledOnce();
  });

  it("coalesces repeated dismiss gestures while saving", async () => {
    const save = Promise.withResolvers<void>();
    const handler = vi.fn(() => save.promise);
    const controller = createDismissalController({ fallbackDismiss: handler });
    const first = controller.dismiss();
    const second = controller.dismiss();
    expect(handler).toHaveBeenCalledOnce();
    save.resolve();
    await Promise.all([first, second]);
    await controller.dismiss();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("allows retry after a rejected save without swallowing the error", async () => {
    const handler = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("Save failed"))
      .mockResolvedValueOnce(undefined);
    const controller = createDismissalController({ fallbackDismiss: handler });
    await expect(controller.dismiss()).rejects.toThrow("Save failed");
    await controller.dismiss();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
