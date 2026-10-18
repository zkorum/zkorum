const inactiveSelector = '[inert], [hidden], [aria-hidden="true"]';

export function isActiveKeyboardScope(container: HTMLElement): boolean {
  if (!container.isConnected || container.closest(inactiveSelector) !== null)
    return false;
  if (
    container.querySelector(
      '[aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"], [role="combobox"][aria-expanded="true"]'
    ) !== null
  )
    return false;
  const modal = [
    ...container.ownerDocument.querySelectorAll(
      '[aria-modal="true"], dialog[open]'
    ),
  ]
    .filter((element) => element.closest(inactiveSelector) === null)
    .at(-1);
  return modal === undefined || modal.contains(container);
}
