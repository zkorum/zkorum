import { defineStore } from "pinia";
import { Post } from "src/shared/types/zod";

export const usePostStore = defineStore("post", {
    state: () => ({
        post: [] as Post[],
    }),

    // getters: {
    //   doubleCount (state) {
    //     return state.counter * 2;
    //   }
    // },

    // actions: {
    //   increment() {
    //     this.counter++;
    //   }
    // }
});
