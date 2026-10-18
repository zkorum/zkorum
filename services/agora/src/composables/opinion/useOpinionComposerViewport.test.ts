import { revealElement } from "src/utils/html/elementVisibility";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getOpinionRevealTarget } from "./useOpinionComposerViewport";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("edited statement reveal target", () => {
  it("reveals the complete short card even when its text is already visible", () => {
    const card = document.createElement("article");
    const content = document.createElement("div");
    card.append(content);
    document.body.append(card);
    card.getBoundingClientRect = () => new DOMRect(0, 240, 350, 200);
    content.getBoundingClientRect = () => new DOMRect(0, 300, 300, 20);
    const bounds = { top: 120, bottom: 400 };
    const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});

    const target = getOpinionRevealTarget({
      sourceElements: { card, content },
      bounds,
    });
    revealElement({ element: target, bounds });

    expect(target).toBe(card);
    expect(scroll).toHaveBeenCalledWith({ top: 40, behavior: "instant" });
  });

  it("keeps the statement text identifiable when the complete card cannot fit", () => {
    const card = document.createElement("article");
    const content = document.createElement("div");
    card.append(content);
    card.getBoundingClientRect = () => new DOMRect(0, 200, 350, 500);
    expect(
      getOpinionRevealTarget({
        sourceElements: { card, content },
        bounds: { top: 120, bottom: 400 },
      })
    ).toBe(content);
  });

  it("uses the complete card when it fits exactly", () => {
    const card = document.createElement("article");
    const content = document.createElement("div");
    card.getBoundingClientRect = () => new DOMRect(0, 200, 350, 280);
    expect(
      getOpinionRevealTarget({
        sourceElements: { card, content },
        bounds: { top: 120, bottom: 400 },
      })
    ).toBe(card);
  });
});
