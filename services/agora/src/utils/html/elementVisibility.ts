export interface VerticalVisibleBounds {
  readonly top: number;
  readonly bottom: number;
}

export function getRevealScrollDelta({
  elementTop,
  elementBottom,
  top,
  bottom,
}: VerticalVisibleBounds & {
  elementTop: number;
  elementBottom: number;
}): number {
  if (bottom <= top) return 0;
  if (elementTop < top) return elementTop - top;
  // A tall statement can't fit in the remaining space. Reveal its beginning
  // rather than jumping to its end and losing the statement's identity.
  if (elementBottom - elementTop > bottom - top) {
    return elementTop - top;
  }
  return elementBottom > bottom ? elementBottom - bottom : 0;
}

/** Reveal through nested scroll panels first, then through the document. */
export function revealElement({
  element,
  bounds,
}: {
  element: HTMLElement;
  bounds: VerticalVisibleBounds;
}): void {
  if (bounds.bottom <= bounds.top) return;
  const document = element.ownerDocument;
  const view = document.defaultView;
  if (view === null || view.getComputedStyle(element).position === "fixed")
    return;
  for (
    let parent = element.parentElement;
    parent !== null &&
    parent !== document.body &&
    parent !== document.documentElement;
    parent = parent.parentElement
  ) {
    const style = view.getComputedStyle(parent);
    if (
      parent.scrollHeight > parent.clientHeight &&
      /^(auto|scroll|hidden)$/.test(style.overflowY)
    ) {
      const parentRect = parent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const delta = getRevealScrollDelta({
        elementTop: elementRect.top,
        elementBottom: elementRect.bottom,
        top: Math.max(bounds.top, parentRect.top + parent.clientTop),
        bottom: Math.min(
          bounds.bottom,
          parentRect.top + parent.clientTop + parent.clientHeight
        ),
      });
      if (Math.abs(delta) > 1) {
        parent.scrollTo({ top: parent.scrollTop + delta, behavior: "instant" });
      }
    }
    // Scrolling the document cannot reveal content inside a fixed overlay.
    if (style.position === "fixed") return;
  }

  const rect = element.getBoundingClientRect();
  const delta = getRevealScrollDelta({
    elementTop: rect.top,
    elementBottom: rect.bottom,
    ...bounds,
  });
  if (Math.abs(delta) > 1) {
    view.scrollBy({ top: delta, behavior: "instant" });
  }
}
