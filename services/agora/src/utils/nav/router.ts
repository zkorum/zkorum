import { computed } from "vue";
import { useRouter } from "vue-router";

// https://github.com/vuejs/vue-router/issues/997
export function usePreviousRoute() {
  const router = useRouter();
  const previousRoute = computed(() => {
    const backUrl = router.options.history.state.back
    return router.resolve({ path: `${backUrl}` })
  });

  return { previousRoute };
}