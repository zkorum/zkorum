import { wasNavigationTriggeredByHistory } from "src/utils/nav/historyBack";
import type { Ref } from "vue";
import { onUnmounted, ref } from "vue";
import type { RouteParamsGeneric, RouteRecordNameGeneric } from "vue-router";
import { onBeforeRouteLeave, useRouter } from "vue-router";

/**
 * Callback function to execute before actually leaving the route
 */
type BeforeLeaveCallback = () => void | Promise<void>;

export interface RouteGuardDestination {
  fullPath: string;
  name: RouteRecordNameGeneric | null | undefined;
  params: RouteParamsGeneric;
}

export interface RouteGuardState {
  /** Whether to show an exit confirmation dialog */
  showExitDialog: Ref<boolean>;
}

export interface RouteGuardActions {
  guardNavigation: (navigation: {
    to: RouteGuardDestination;
    fromPath: string;
  }) => boolean;
  lockRoute: () => void;
  unlockRoute: () => void;
  isRouteLockedCheck: () => boolean;
  proceedWithNavigation: (
    beforeLeaveCallback?: BeforeLeaveCallback
  ) => Promise<void>;
}

interface PendingNavigation {
  targetRoute: string;
  navigationMethod: "push" | "replace";
}

export interface RouteGuardComposable
  extends RouteGuardState, RouteGuardActions {}

export function useRouteGuard(
  beforeUnloadShouldBlockCallback: () => boolean,
  beforeRouteLeaveCallback: (to: RouteGuardDestination) => boolean | "block"
): RouteGuardComposable {
  const router = useRouter();

  // State
  const isRouteLocked = ref(false);
  const showExitDialog = ref(false);
  const pendingNavigation = ref<PendingNavigation | null>(null);

  // Shared helper: block navigation and show the exit dialog
  function blockAndShowDialog({
    pending,
  }: {
    pending: PendingNavigation;
  }): void {
    pendingNavigation.value = pending;
    showExitDialog.value = true;
  }

  // Store original beforeunload handler to restore on cleanup
  const originalBeforeUnload = window.onbeforeunload;

  // Set up browser beforeunload handler
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    const shouldBlock = beforeUnloadShouldBlockCallback();
    if (shouldBlock) {
      event.preventDefault();
      return "Changes that you made may not be saved.";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  // Set up Vue Router guard (handles router.push / router.replace navigations)
  function guardNavigation({
    to: destination,
    fromPath,
  }: {
    to: RouteGuardDestination;
    fromPath: string;
  }): boolean {
    if (!isRouteLocked.value) {
      return true;
    }

    const decision = beforeRouteLeaveCallback(destination);
    if (decision === "block") return false;
    if (decision) {
      return true;
    }

    const navigationMethod = wasNavigationTriggeredByHistory({
      currentPath: fromPath,
      historyBack: window.history.state?.back,
      historyForward: window.history.state?.forward,
    })
      ? "replace"
      : "push";

    blockAndShowDialog({
      pending: {
        targetRoute: destination.fullPath,
        navigationMethod,
      },
    });
    return false;
  }
  onBeforeRouteLeave((to, from) =>
    guardNavigation({ to, fromPath: from.fullPath })
  );

  // Clean up on component unmount
  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.onbeforeunload = originalBeforeUnload;
  });

  const lockRoute = (): void => {
    isRouteLocked.value = true;
  };

  const unlockRoute = (): void => {
    isRouteLocked.value = false;
    pendingNavigation.value = null;
    showExitDialog.value = false;
  };

  const isRouteLockedCheck = (): boolean => {
    return isRouteLocked.value;
  };

  const proceedWithNavigation = async (
    beforeLeaveCallback?: BeforeLeaveCallback
  ): Promise<void> => {
    if (pendingNavigation.value === null) {
      console.warn("No pending route to navigate to");
      return;
    }

    try {
      // Execute any cleanup before leaving
      if (beforeLeaveCallback) {
        await beforeLeaveCallback();
      }

      // Unlock the route and navigate
      const pending = pendingNavigation.value;
      unlockRoute();

      await router[pending.navigationMethod](pending.targetRoute);
    } catch (error) {
      console.error("Failed to navigate to pending route:", error);
      // Re-lock the route if navigation failed
      lockRoute();
      throw error;
    }
  };

  return {
    guardNavigation,
    showExitDialog,
    lockRoute,
    unlockRoute,
    isRouteLockedCheck,
    proceedWithNavigation,
  };
}
