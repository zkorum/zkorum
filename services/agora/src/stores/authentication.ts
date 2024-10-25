import { defineStore } from "pinia";
import { useBackendAuthApi } from "src/utils/api/auth";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

export const useAuthenticationStore = defineStore("authentication", () => {

  const router = useRouter();

  const isAuthenticated = ref(false);

  const verificationEmailAddress = ref("");

  const { deviceIsLoggedOn } = useBackendAuthApi();

  function userLogout() {
    isAuthenticated.value = false;
  }

  function initializeAuthState() {
    onMounted(() => {
      setTimeout(
        async function () {
          if (isAuthenticated.value) {
            const isLoggedOn = await deviceIsLoggedOn();
            if (!isLoggedOn) {
              userLogout();
              router.push({ name: "welcome" });
            }
          }
        }, 200);
    });
  }

  return { isAuthenticated, verificationEmailAddress, userLogout, initializeAuthState };
});
