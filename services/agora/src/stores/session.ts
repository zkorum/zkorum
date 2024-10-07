import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({
    sign: {
      emailToPrefixedKey: {
      } as Record<string, string>
    }
  }),

  getters: {
    doubleCount(state) {
      console.log(state);
      // return state.session * 2;
    }
  },

  actions: {
    setPrefixedKey(email: string, prefixedKey: string) {
      this.sign.emailToPrefixedKey[email] = prefixedKey;
    }
  }
});
