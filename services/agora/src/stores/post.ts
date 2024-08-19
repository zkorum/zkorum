import { defineStore } from "pinia";
import { ExtendedPostData } from "src/shared/types/zod";
import { ref } from "vue";

export const usePostStore = defineStore("post", () => {
    // post: [] as Post[],


    const postData: ExtendedPostData = {
        metadata: {
            uid: "TEST UID",
            slugId: "DUMMY_SLUG_ID",
            isHidden: false,
            updatedAt: new Date(),
            lastReactedAt: new Date(),
            commentCount: 10
        },
        payload: {
            title: "TEST TITLE",
            body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. ",
            poll: {
                options: {
                    option1: "OPTION 1",
                    option2: "OPTION 2",
                    option3: "OPTION 3"
                },
                result: {
                    option1Response: 15,
                    option2Response: 20,
                    option3Response: 23
                }
            }
        },
        author: {
            pseudonym: "TEST pseudonym",
            domain: "google.com"
        }
    };

    const dummyPostData = ref<ExtendedPostData>(postData);
    return { dummyPostData };

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
