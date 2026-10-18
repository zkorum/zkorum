import { afterEach, describe, expect, it, vi } from "vitest";

const getTabbable = vi.hoisted(() => vi.fn<() => HTMLElement[]>());
vi.mock("tabbable", () => ({ tabbable: getTabbable }));

import { loopDialogTabFocus } from "./dialogKeyboard";

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

function mountDialog() {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const content = document.createElement("div");
  const first = document.createElement("button");
  const middle = document.createElement("input");
  const last = document.createElement("button");
  content.append(first, middle, last);
  dialog.append(content);
  document.body.append(dialog);
  getTabbable.mockReturnValue([first, middle, last]);
  content.addEventListener("keydown", loopDialogTabFocus);
  return { dialog, content, first, middle, last };
}

function key({
  target,
  options = {},
}: {
  target: HTMLElement;
  options?: KeyboardEventInit;
}): KeyboardEvent {
  target.focus();
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);
  return event;
}

describe("dialog Tab boundary navigation", () => {
  it("wraps both boundaries without changing ordinary Tab behavior", () => {
    const { dialog, first, middle, last } = mountDialog();
    expect(key({ target: last }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(getTabbable).toHaveBeenCalledWith(dialog);
    expect(
      key({ target: first, options: { shiftKey: true } }).defaultPrevented
    ).toBe(true);
    expect(document.activeElement).toBe(last);
    expect(key({ target: middle }).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(middle);
  });

  it("does not override a nested dialog's keyboard interaction", () => {
    const { content, first } = mountDialog();
    const nested = document.createElement("div");
    nested.setAttribute("role", "dialog");
    nested.append(first);
    content.append(nested);
    expect(
      key({ target: first, options: { shiftKey: true } }).defaultPrevented
    ).toBe(false);
    expect(getTabbable).not.toHaveBeenCalled();
  });

  it("leaves modified keys and controls that already handle Tab alone", () => {
    const { first } = mountDialog();
    for (const options of [
      { key: "Enter" },
      { altKey: true },
      { ctrlKey: true },
      { metaKey: true },
    ]) {
      expect(key({ target: first, options }).defaultPrevented).toBe(false);
    }
    first.addEventListener("keydown", (event) => event.preventDefault());
    key({ target: first });
    expect(getTabbable).not.toHaveBeenCalled();
  });
});
