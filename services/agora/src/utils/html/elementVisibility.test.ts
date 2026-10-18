import { afterEach, describe, expect, it, vi } from "vitest";

import { getRevealScrollDelta, revealElement } from "./elementVisibility";

function mountScrollPanel({
  top,
  contentHeight,
  inputTop,
  fixed = false,
}: {
  top: number;
  contentHeight: number;
  inputTop: number;
  fixed?: boolean;
}) {
  const panel = document.createElement("div");
  const input = document.createElement("input");
  panel.style.overflowY = "auto";
  if (fixed) panel.style.position = "fixed";
  panel.append(input);
  document.body.append(panel);
  Object.defineProperties(panel, {
    clientHeight: { value: 200 },
    scrollHeight: { value: contentHeight },
  });
  panel.getBoundingClientRect = () => new DOMRect(0, top, 300, 200);
  input.getBoundingClientRect = () =>
    new DOMRect(0, inputTop - panel.scrollTop, 250, 50);
  const scrollPanel = vi.fn((options?: ScrollToOptions | number) => {
    if (typeof options === "object") {
      panel.scrollTop = Math.max(
        0,
        Math.min(contentHeight - 200, options.top ?? 0)
      );
    }
  });
  panel.scrollTo = scrollPanel;
  const scrollDocument = vi
    .spyOn(window, "scrollBy")
    .mockImplementation(() => {});
  return { panel, input, scrollPanel, scrollDocument };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("element visibility", () => {
  it.each([
    { elementTop: 120, elementBottom: 180, expected: 0 },
    { elementTop: 350, elementBottom: 410, expected: 30 },
    { elementTop: 40, elementBottom: 100, expected: -60 },
    { elementTop: 350, elementBottom: 750, expected: 250 },
    { elementTop: 50, elementBottom: 750, expected: -50 },
  ])(
    "reveals $elementTop–$elementBottom with minimal movement",
    ({ elementTop, elementBottom, expected }) => {
      expect(
        getRevealScrollDelta({
          elementTop,
          elementBottom,
          top: 100,
          bottom: 380,
        })
      ).toBe(expected);
    }
  );

  it("does not scroll when an overlay leaves no usable space", () => {
    expect(
      getRevealScrollDelta({
        elementTop: 500,
        elementBottom: 600,
        top: 200,
        bottom: 180,
      })
    ).toBe(0);
  });

  it("scrolls the email panel without moving the document when it can reveal the field", () => {
    const { input, scrollPanel, scrollDocument } = mountScrollPanel({
      top: 100,
      contentHeight: 600,
      inputTop: 350,
    });

    revealElement({ element: input, bounds: { top: 12, bottom: 380 } });

    expect(scrollPanel).toHaveBeenCalledWith({ top: 100, behavior: "instant" });
    expect(scrollDocument).not.toHaveBeenCalled();
  });

  it("also moves the document if the nested panel reaches its scroll limit", () => {
    const { panel, input, scrollDocument } = mountScrollPanel({
      top: 300,
      contentHeight: 250,
      inputTop: 450,
    });

    revealElement({ element: input, bounds: { top: 12, bottom: 380 } });

    expect(panel.scrollTop).toBe(50);
    expect(scrollDocument).toHaveBeenCalledWith({
      top: 70,
      behavior: "instant",
    });
  });

  it("does not scroll the page behind a fixed panel", () => {
    const { panel, input, scrollDocument } = mountScrollPanel({
      top: 300,
      contentHeight: 250,
      inputTop: 450,
      fixed: true,
    });
    revealElement({ element: input, bounds: { top: 12, bottom: 380 } });
    expect(panel.scrollTop).toBe(50);
    expect(scrollDocument).not.toHaveBeenCalled();
  });
});
