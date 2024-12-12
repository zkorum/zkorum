import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", () => {

  const emptyMapping: Record<string, string> = {};

  const sign = useStorage("phone-to-prefixed-key", emptyMapping);

  function setPrefixedKey(email: string, prefixedKey: string) {
    sign.value[email] = prefixedKey;
  }

  return { sign, setPrefixedKey };
});
