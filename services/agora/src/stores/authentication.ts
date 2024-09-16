import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthenticationStore = defineStore("authentication", () => {

  const isAuthenticated = ref(false);

  return { isAuthenticated };
});
