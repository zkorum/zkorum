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
import { useRouter } from "vue-router";

export function useVerificationComplete() {
  const router = useRouter();
  const { updateAuthState, getDeviceLoginStatus } = useBackendAuthApi();
  const flowStore = onboardingFlowStore();
  const { routeUserAfterLogin } = useLoginIntentionStore();
  const { reset: resetEmailVerification } = emailVerificationStore();
  const { reset: resetPhoneVerification } = phoneVerificationStore();

  async function completeVerification() {
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
      await router.replace({
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
      await router.replace({ name: "/onboarding/step4-username/" });
    }
  }

  return { completeVerification };
}
