import { useLoginIntentionStore } from "src/stores/loginIntention";
import { emailVerificationStore } from "src/stores/onboarding/email";
import { onboardingFlowStore } from "src/stores/onboarding/flow";
import { phoneVerificationStore } from "src/stores/onboarding/phone";
import { useBackendAuthApi } from "src/utils/api/auth";
import {
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "src/utils/router/conversationRouteContext";
import { getSingleRouteParam } from "src/utils/router/params";
import { getConversationSurveyVerifyPath } from "src/utils/survey/navigation";
import { computed, ref } from "vue";
import {
  isNavigationFailure,
  type RouteLocationRaw,
  useRouter,
} from "vue-router";

export function useVerificationComplete() {
  const router = useRouter();
  const { updateAuthState, getDeviceLoginStatus } = useBackendAuthApi();
  const flowStore = onboardingFlowStore();
  const { routeUserAfterLogin } = useLoginIntentionStore();
  const { reset: resetEmailVerification } = emailVerificationStore();
  const { reset: resetPhoneVerification } = phoneVerificationStore();
  const completionState = ref<"idle" | "pending" | "failed">("idle");
  const isCompletingVerification = computed(
    () => completionState.value === "pending"
  );
  const hasCompletionFailed = computed(
    () => completionState.value === "failed"
  );

  async function completeVerification() {
    if (isCompletingVerification.value) return;
    completionState.value = "pending";
    try {
      await finishVerification();
      completionState.value = "idle";
    } catch (error) {
      completionState.value = "failed";
      throw error;
    }
  }

  async function finishVerification() {
    const verificationRoute = router.currentRoute.value;
    const freshStatus = await getDeviceLoginStatus();
    await updateAuthState({
      partialLoginStatus: freshStatus,
      forceRefresh: true,
    });
    if (router.currentRoute.value !== verificationRoute) return;
    resetEmailVerification();
    resetPhoneVerification();

    // The route survives refresh and back/forward navigation; a leftover global
    // onboarding session must not redirect unrelated account verification.
    if (isConversationOnboardingRouteName(verificationRoute.name)) {
      await replaceVerificationRoute({
        path: getConversationSurveyVerifyPath({
          conversationSlugId: getSingleRouteParam(
            "postSlugId" in verificationRoute.params
              ? verificationRoute.params.postSlugId
              : undefined
          ),
          routeContext: getConversationRouteContextFromRoute(verificationRoute),
        }),
      });
      return;
    }

    if (flowStore.onboardingMode === "LOGIN") {
      await routeUserAfterLogin();
    } else {
      await replaceVerificationRoute({ name: "/onboarding/step4-username/" });
    }
  }

  async function replaceVerificationRoute(
    destination: RouteLocationRaw
  ): Promise<void> {
    const failure = await router.replace(destination);
    if (isNavigationFailure(failure)) {
      throw new Error("Verification navigation did not complete", {
        cause: failure,
      });
    }
  }

  return {
    completeVerification,
    isCompletingVerification,
    hasCompletionFailed,
  };
}
