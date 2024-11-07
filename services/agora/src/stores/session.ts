import { defineStore } from "pinia";
import { ref } from "vue";

export const useSessionStore = defineStore("session", () => {

  const sign = ref({
    emailToPrefixedKey: {} as Record<string, string>,
  });

  function setPrefixedKey(email: string, prefixedKey: string) {
    sign.value.emailToPrefixedKey[email] = prefixedKey;
  }

  return { sign, setPrefixedKey };
});
