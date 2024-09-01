import { defineStore } from "pinia";
import { ref } from "vue";
import { CommunityItem, useCommunityStore } from "./community";

export interface DummyPollOptionFormat {
    index: number;
    name: string;
    numResponses: number;
}

export interface DummyCommentFormat {
    index: number;
    communityId: string;
    createdAt: Date;
    comment: string;
    numUpvotes: number;
    numDownvotes: number;
}

export interface DummyPostMetadataFormat {
    uid: string;
    slugId: string;
    isHidden: boolean;
    createdAt: Date;
    commentCount: number;
    communityId: string;
}

export interface DummyPostDataFormat {
    metadata: DummyPostMetadataFormat,
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

    function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateRandomDate(minDate: Date, maxAdditionDays: number) {
        const returnDate = structuredClone(minDate);

        const subtractDays = getRandomInt(0, maxAdditionDays);

        returnDate.setDate(returnDate.getDate() + subtractDays);

        return returnDate;
    }

    function generateRandomCommunityItem(): CommunityItem {
        const communityNameList = useCommunityStore().communityList;
        const communityItem = communityNameList[Math.floor(Math.random() * communityNameList.length)];
        return communityItem;
    }

    function generateDummyPostData() {
        const postCreatedAtDate = new Date();
        postCreatedAtDate.setDate(postCreatedAtDate.getDate() - getRandomInt(7, 14));

        const numComments = getRandomInt(0, 20);
        const selectedRandomCommunityItem = generateRandomCommunityItem();
        const hasPoll = true;

        const numPollOptions = getRandomInt(2, 6);
        const pollOptionList: DummyPollOptionFormat[] = [];
        for (let i = 0; i < numPollOptions; i++) {
            const pollItem: DummyPollOptionFormat = {
                index: i,
                name: "Dummy Option " + (i + 1),
                numResponses: getRandomInt(0, 100)
            };
            pollOptionList.push(pollItem);
        }

        let pollOptions: DummyPollOptionFormat[] = [];
        if (hasPoll) {
            pollOptions = pollOptionList;
        }
        const postComments: DummyCommentFormat[] = [];
        for (let i = 0; i < numComments; i++) {
            const commentItem: DummyCommentFormat = {
                index: 0,
                communityId: generateRandomCommunityItem().id,
                createdAt: generateRandomDate(postCreatedAtDate, 5),
                comment: "This is random comment number " + (i + 1),
                numUpvotes: getRandomInt(0, 100),
                numDownvotes: getRandomInt(0, 100)
            };
            postComments.push(commentItem);
        }

        const postDataStatic: DummyPostDataFormat = {
            metadata: {
                uid: "TEST UID",
                slugId: "DUMMY_SLUG_ID",
                isHidden: false,
                createdAt: postCreatedAtDate,
                commentCount: numComments,
                communityId: selectedRandomCommunityItem.id,
            },
            payload: {
                title: "TEST TITLE",
                body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. ",
                poll: {
                    hasPoll: hasPoll,
                    options: pollOptions
                },
                comments: postComments
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
