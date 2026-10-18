import { tabbable } from "tabbable";

export function loopDialogTabFocus(event: KeyboardEvent): void {
  if (
    event.key !== "Tab" ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  const dialog =
    event.currentTarget instanceof Element
      ? event.currentTarget.closest<HTMLElement>('[role="dialog"], dialog')
      : null;
  if (
    dialog === null ||
    !(event.target instanceof Element) ||
    event.target.closest('[role="dialog"], dialog') !== dialog
  )
    return;

  // Delegate visibility, disabled controls, radio groups, and tabindex ordering
  // to tabbable; only wrap the boundary that Quasar's focus-in trap misses.
  const controls = tabbable(dialog);
  const first = controls.at(0);
  const last = controls.at(-1);
  if (first === undefined || last === undefined) return;
  const active = dialog.ownerDocument.activeElement;
  if (
    event.shiftKey &&
    (active === first || (active instanceof Element && active.contains(first)))
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
