import { defaultDocument, useEventListener } from "@vueuse/core";
import { isActiveKeyboardScope } from "src/utils/ui/keyboardScope";
import { type MaybeRefOrGetter, toValue } from "vue";

// These controls own Enter (activation, selection, or text editing). Keep their
// native/APG keyboard behavior instead of turning it into a wizard shortcut.
const enterOwnerSelector = [
  "button",
  "a[href]",
  "select",
  "textarea",
  "summary",
  '[contenteditable]:not([contenteditable="false"])',
  '[aria-haspopup]:not([aria-haspopup="false"])',
  ...[
    "button",
    "link",
    "checkbox",
    "radio",
    "switch",
    "combobox",
    "listbox",
    "option",
    "menu",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "tree",
    "treeitem",
    "grid",
    "gridcell",
    "slider",
    "spinbutton",
    "tab",
    "tablist",
  ].map((role) => `[role="${role}"]`),
].join(",");
const textInputTypes = new Set([
  "text",
  "email",
  "tel",
  "number",
  "password",
  "url",
  "search",
]);

export function useDefaultActionOnEnter({
  container,
  button,
  enabled,
}: {
  container: MaybeRefOrGetter<HTMLElement | null | undefined>;
  button: MaybeRefOrGetter<HTMLButtonElement | undefined>;
  enabled: MaybeRefOrGetter<boolean>;
}): void {
  useEventListener(defaultDocument, "keydown", (event: KeyboardEvent) => {
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const root = toValue(container);
    const target = event.target;
    if (root === null || root === undefined || !(target instanceof Element))
      return;
    const path = event.composedPath();
    // Include the dialog's initially focused container, but never another
    // component, an unrelated field, or a teleported popup's contents.
    if (!path.includes(root) && !target.contains(root)) return;
    if (
      path.some(
        (node) => node instanceof Element && node.matches(enterOwnerSelector)
      )
    )
      return;
    const input = path.find((node) => node instanceof HTMLInputElement);
    if (input !== undefined && !textInputTypes.has(input.type)) return;
    if (!isActiveKeyboardScope(root)) return;

    // Prevent implicit form submission from bypassing the same disabled/loading
    // state used by the visible button, or submitting a second time.
    event.preventDefault();
    const action = toValue(button);
    if (
      !event.repeat &&
      toValue(enabled) &&
      action !== undefined &&
      !action.matches(':disabled, [aria-disabled="true"]')
    )
      action.click();
  });
}
