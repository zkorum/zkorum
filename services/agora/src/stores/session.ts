import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({
    sign: {
      emailToPrefixedKey: {
      } as Record<string, string>
    }
  }),

  actions: {
    setPrefixedKey(email: string, prefixedKey: string) {
      this.sign.emailToPrefixedKey[email] = prefixedKey;
    }
  }
});
