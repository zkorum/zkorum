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
    userCommunityId: string;
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

export interface DummyPostUserVote {
    hasVoted: boolean;
    voteIndex: number;
}

export interface UserRankedCommentItem {
    index: number;
    action: "like" | "dislike" | "pass";
}

export interface DummyCommentRankingForamat {
    rankedCommentList: UserRankedCommentItem[];
    unrankedCommentIndexList: number[];
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
    },
    userInteraction: {
        voting: DummyPostUserVote,
        ranking: DummyCommentRankingForamat,
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

    const masterPostDataList: DummyPostDataFormat[] = [];
    for (let i = 0; i < 200; i++) {
        masterPostDataList.push(generateDummyPostData());
    }

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

    function fetchCommunityPosts(communityId: string, afterSlugId: string, fetchCount: number) {
        const dataList: DummyPostDataFormat[] = [];
        let locatedId = false;
        if (afterSlugId == "") {
            locatedId = true;
        }

        for (let i = 0; i < masterPostDataList.length; i++) {

            const postItem = masterPostDataList[i];
            if (locatedId) {
                if (postItem.metadata.communityId == communityId) {
                    dataList.push(postItem);
                }
            }

            if (postItem.metadata.slugId == afterSlugId) {
                locatedId = true;
            }

            if (dataList.length == fetchCount) {
                break;
            }
        };

        return dataList;
    }

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

    function composeDummyCommentItem(commentText: string, index: number) {
        const newComment: DummyCommentFormat = {
            index: index,
            userCommunityId: generateRandomCommunityItem().id,
            createdAt: new Date(),
            comment: commentText,
            numUpvotes: 0,
            numDownvotes: 0
        }
        return newComment;
    }

    function generateDummyPostData() {
        const postCreatedAtDate = new Date();
        postCreatedAtDate.setDate(postCreatedAtDate.getDate() - getRandomInt(7, 14));

        const numCommentsInPost = getRandomInt(0, 20);
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
        for (let i = 0; i < numCommentsInPost; i++) {
            const commentItem: DummyCommentFormat = {
                index: i,
                userCommunityId: generateRandomCommunityItem().id,
                createdAt: generateRandomDate(postCreatedAtDate, 5),
                comment: "This is random comment number " + (i + 1),
                numUpvotes: getRandomInt(0, 100),
                numDownvotes: getRandomInt(0, 100)
            };
            postComments.push(commentItem);
        }

        const unrankedCommentIndexList: number[] = [];
        const rankedCommentList: UserRankedCommentItem[] = [];
        const numUnrankedComment = Math.min(numCommentsInPost, 2);
        const numRankedComment = Math.min(2, numCommentsInPost - numUnrankedComment);

        let currentRankedCommentIndex = 0;
        for (let i = 0; i < numUnrankedComment; i++) {
            unrankedCommentIndexList.push(currentRankedCommentIndex);
            currentRankedCommentIndex += 1;
        }

        for (let i = 0; i < numRankedComment; i++) {
            const rankedItem: UserRankedCommentItem = {
                index: currentRankedCommentIndex,
                action: "like"
            };
            rankedCommentList.push(rankedItem);
            currentRankedCommentIndex += 1;
        }

        const postDataStatic: DummyPostDataFormat = {
            metadata: {
                uid: "TEST UID",
                slugId: "DUMMY_SLUG_ID",
                isHidden: false,
                createdAt: postCreatedAtDate,
                commentCount: numCommentsInPost,
                communityId: selectedRandomCommunityItem.id,
            },
            payload: {
                title: "TEST POST TITLE",
                body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. ",
                poll: {
                    hasPoll: hasPoll,
                    options: pollOptions
                },
                comments: postComments
            },
            userInteraction: {
                voting: {
                    hasVoted: false,
                    voteIndex: 0
                },
                ranking: {
                    rankedCommentList: rankedCommentList,
                    unrankedCommentIndexList: unrankedCommentIndexList
                }
            }
        };

        return postDataStatic;

    }

    const dummyUserPostData = ref(userPostData);
    return { generateDummyPostData, composeDummyCommentItem, fetchCommunityPosts, dummyUserPostData };
});
