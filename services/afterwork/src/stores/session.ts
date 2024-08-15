import { generateFlowId } from "@/crypto/shared";
import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({
    sign: {
      emailToPrefixedKey: {
      } as Record<string, string>,
      flowIdToEmail: {
      } as Record<string, string>,
      uuidToEmail: {
      } as Record<string, string>
    },
    passphrase: {
      uuidToKek: {
      } as Record<string, string>,
      uuidToDek: {
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
      this.sign.emailToPrefixedKey[email] = prefixedKey
    },
    getOrSetFlowId(email: string): string {
      const existingEntry = Object.entries(this.sign.flowIdToEmail).find(([_key, value]) => {
        return value === email
      });
      if (existingEntry !== undefined) {
        return existingEntry[0]
      }
      const flowId = generateFlowId();
      this.sign.flowIdToEmail[flowId] = email;
      return flowId;
    }
  }
});
