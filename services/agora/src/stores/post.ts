import { defineStore } from "pinia";
import { ref } from "vue";

export interface DummyPollOptionFormat {
    index: number;
    name: string;
    numResponses: number;
}

export interface DummyCommentFormat {
    index: number;
    comment: string;
    numUpvotes: number;
    numDownvotes: number;
}

export interface DummyPostDataFormat {
    metadata: {
        uid: string;
        slugId: string;
        isHidden: boolean;
        updatedAt: Date;
        lastReactedAt: Date;
        commentCount: number;
        communityName: string;
    },
    payload: {
        title: string;
        body: string;
        poll: {
            hasPoll: boolean;
            options: DummyPollOptionFormat[]
        };
        comments: DummyCommentFormat[]
    }
}

export interface DummyUserPostDataFormat {
    slugId: string;
    poll: {
        castedVote: boolean;
        votedIndex: number;
    },
    comment: { ratedIndexList: number[] }
}

export const usePostStore = defineStore("post", () => {
    // post: [] as Post[],

    const userPostData: DummyUserPostDataFormat = {
        slugId: "DUMMY_SLUG_ID",
        poll: {
            castedVote: false,
            votedIndex: 0
        },
        comment: {
            ratedIndexList: [0]
        }
    };

    function generateDummyPostData() {

        const communityNameList = ["world", "china", "france", "russia", "japan"];
        const randomCommunityName = communityNameList[Math.floor(Math.random() * communityNameList.length)];

        const postDataStatic: DummyPostDataFormat = {
            metadata: {
                uid: "TEST UID",
                slugId: "DUMMY_SLUG_ID",
                isHidden: false,
                updatedAt: new Date(),
                lastReactedAt: new Date(),
                commentCount: 10,
                communityName: randomCommunityName,
            },
            payload: {
                title: "TEST TITLE",
                body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. ",
                poll: {
                    hasPoll: true,
                    options: [
                        {
                            index: 0,
                            name: "Option 1",
                            numResponses: 15
                        },
                        {
                            index: 1,
                            name: "Option 2",
                            numResponses: 20
                        },
                        {
                            index: 2,
                            name: "Option 3",
                            numResponses: 23
                        }
                    ]
                },
                comments: [
                    {
                        index: 0,
                        comment: "I really don't like this comment 1",
                        numUpvotes: 5,
                        numDownvotes: 2
                    },
                    {
                        index: 1,
                        comment: "I really don't like this comment 2",
                        numUpvotes: 4,
                        numDownvotes: 3
                    },
                    {
                        index: 2,
                        comment: "I really don't like this comment 3",
                        numUpvotes: 2,
                        numDownvotes: 7
                    },
                    {
                        index: 3,
                        comment: "I really don't like this comment 4",
                        numUpvotes: 1444,
                        numDownvotes: 2222
                    }
                ]
            }
        };

        return postDataStatic;

    }

    const dummyUserPostData = ref(userPostData);
    return { generateDummyPostData, dummyUserPostData };

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
