import { useAuthenticationStore } from "src/stores/authentication";
import { onScopeDispose, watch } from "vue";

export function useParticipationViewerLifetime() {
  const auth = useAuthenticationStore();
  let generation = 0;
  watch(
    [() => auth.userId, () => auth.isLoggedIn],
    ([nextId, nextLoggedIn], [previousId, previousLoggedIn]) => {
      // An accepted first participation can create this viewer's guest account.
      if (
        previousId === undefined &&
        nextId !== undefined &&
        auth.isGuest &&
        !nextLoggedIn &&
        !previousLoggedIn
      )
        return;
      generation++;
    },
    { flush: "sync" }
  );
  onScopeDispose(() => {
    generation++;
  });
  function capture(): () => boolean {
    const version = generation;
    return () => generation === version;
  }
  return { capture };
}
