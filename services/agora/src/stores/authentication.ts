import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthenticationStore = defineStore("authentication", () => {

  const isAuthenticated = ref(false);

  const verificationEmailAddress = ref("");

  function userLogout() {
    isAuthenticated.value = false;
  }

  return { isAuthenticated, verificationEmailAddress, userLogout };
});
