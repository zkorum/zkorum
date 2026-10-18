import { defaultDocument, defaultWindow } from "@vueuse/core";
import { nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";

async function waitForScrollUnlock(signal: AbortSignal): Promise<void> {
  const root = defaultDocument?.documentElement;
  if (
    root === undefined ||
    !root.classList.contains("q-document--prevent-scroll") ||
    signal.aborted
  )
    return;

  // Quasar delays scroll unlock on native iOS. Observe its lock lifecycle
  // rather than restoring against a fixed body or guessing a timeout.
  await new Promise<void>((resolve) => {
    const finish = () => {
      observer.disconnect();
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (!root.classList.contains("q-document--prevent-scroll")) finish();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    signal.addEventListener("abort", finish, { once: true });
  });
}

export function useRoutedDialogReturn(returnTarget: string | undefined): void {
  const router = useRouter();
  const previousFocus = defaultDocument?.activeElement;
  const previousScroll =
    defaultWindow === undefined
      ? undefined
      : { left: defaultWindow.scrollX, top: defaultWindow.scrollY };

  onUnmounted(async () => {
    // The route render releases inert before the originating page is focused.
    await nextTick();
    if (
      returnTarget === undefined ||
      router.currentRoute.value.fullPath !== returnTarget
    )
      return;

    const cancellation = new AbortController();
    const stopNavigation = router.afterEach((_to, _from, failure) => {
      if (failure === undefined) cancellation.abort();
    });
    try {
      await waitForScrollUnlock(cancellation.signal);
      if (cancellation.signal.aborted) return;
      // Quasar only restores scroll when pathname is unchanged. Routed dialogs
      // change pathname while retaining the same background component.
      if (previousScroll !== undefined) defaultWindow?.scrollTo(previousScroll);
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        !previousFocus.closest("[inert]")
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    } finally {
      stopNavigation();
    }
  });
}
