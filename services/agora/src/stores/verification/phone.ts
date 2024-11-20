import { defineStore } from "pinia";
import { ref } from "vue";

export const phoneVerificationStore = defineStore("phoneVerification", () => {
  const verificationPhoneNumber = ref("");

  return { verificationPhoneNumber };
});
