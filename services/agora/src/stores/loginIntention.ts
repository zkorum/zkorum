import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { onboardingFlowStore } from "./onboarding/flow";
import { useOnboardingPreferencesStore } from "./onboarding/preferences";

export type PossibleIntentions =
  | "none"
  | "newConversation"
  | "emailUpdates"
  | "settings";

export const useLoginIntentionStore = defineStore("loginIntention", () => {
  const router = useRouter();
  const activeUserIntention = ref<PossibleIntentions>("none");
  let emailUpdatesReturnPath = "/email-updates/";

  function createEmailUpdatesIntention(returnPath: string): void {
    emailUpdatesReturnPath = returnPath;
    setActiveUserIntention("emailUpdates");
  }

  function setActiveUserIntention(intention: PossibleIntentions) {
    activeUserIntention.value = intention;
  }

  async function routeUserAfterLogin() {
    const onboardingStore = onboardingFlowStore();
    const shouldShowPreferencesDialog =
      onboardingStore.onboardingMode === "SIGNUP";
    onboardingStore.onboardingMode = "LOGIN";

    switch (activeUserIntention.value) {
      case "none":
        await router.replace({ name: "/" });
        break;
      case "newConversation":
        await router.replace({ name: "/conversation/new/create/" });
        break;
      case "emailUpdates":
        await router.replace(emailUpdatesReturnPath);
        break;
      case "settings":
        await router.replace({ name: "/settings/" });
        break;
    }

    activeUserIntention.value = "none";
    if (shouldShowPreferencesDialog) {
      useOnboardingPreferencesStore().openPreferencesDialog();
    }
  }

  return {
    activeUserIntention,
    createEmailUpdatesIntention,
    routeUserAfterLogin,
    setActiveUserIntention,
  };
});
