import { defineStore } from "pinia";
import { ref } from "vue";
import { usePostStore } from "./post";

export const useAuthenticationStore = defineStore("authentication", () => {
  const verificationEmailAddress = ref("");
  const isAuthenticated = ref(false);

  const { resetPostData } = usePostStore();

  function userLogout() {
    resetPostData();
    isAuthenticated.value = false;
  }

  return { isAuthenticated, verificationEmailAddress, userLogout };
});
