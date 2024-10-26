import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthenticationStore = defineStore("authentication", () => {

  const verificationEmailAddress = ref("");
  const isAuthenticated = ref(false);

  function userLogout() {
    isAuthenticated.value = false;
  }

  return { isAuthenticated, verificationEmailAddress, userLogout };
});
