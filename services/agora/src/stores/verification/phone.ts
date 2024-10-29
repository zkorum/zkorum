import { defineStore } from "pinia";
import { ref } from "vue";

export const phoneVerificationStore = defineStore("phoneVerification", () => {
  const verificationNumber = ref("");

  return { verificationNumber };
});
