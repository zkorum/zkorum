import { defineStore } from "pinia";
import { CommunityItem, useCommunityStore } from "./community";
import { ref } from "vue";

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

type PossibleCommentActions = "like" | "dislike"
export interface UserRankedCommentItem {
    index: number;
    action: PossibleCommentActions;
}

export interface DummyCommentRankingFormat {
    rankedCommentList: Map<number, PossibleCommentActions>;
    assignedRankingItems: number[];
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
        pollVoting: DummyPostUserVote,
        commentRanking: DummyCommentRankingFormat,
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

    const emptyPost: DummyPostDataFormat = {
        metadata: {
            uid: "",
            slugId: "",
            isHidden: false,
            createdAt: new Date(),
            commentCount: 0,
            communityId: ""
        },
        payload: {
            title: "",
            body: "",
            poll: {
                hasPoll: false,
                options: []
            },
            comments: []
        },
        userInteraction: {
            pollVoting: {
                hasVoted: false,
                voteIndex: 0
            },
            commentRanking: {
                rankedCommentList: new Map(),
                assignedRankingItems: []
            }
        }
    };

    const masterPostDataList = ref<DummyPostDataFormat[]>([]);
    for (let i = 0; i < 200; i++) {
        masterPostDataList.value.push(generateDummyPostData(i));
    }

    function getPostBySlugId(slugId: string) {
        for (let i = 0; i < masterPostDataList.value.length; i++) {
            const postItem = masterPostDataList.value[i];
            if (slugId == postItem.metadata.slugId) {
                return postItem;
            }
        }

        return emptyPost;
    }

    function updateCommentRanking(postSlugId: string, commentIndex: number, action: PossibleCommentActions) {
        const post = getPostBySlugId(postSlugId);
        const rankedCommentMap = post.userInteraction.commentRanking.rankedCommentList;
        rankedCommentMap.set(commentIndex, action);
    }

    function fetchCommunityPosts(communityId: string, afterSlugId: string, fetchCount: number) {
        const dataList: DummyPostDataFormat[] = [];
        let locatedId = false;
        if (afterSlugId == "") {
            locatedId = true;
        }

        for (let i = 0; i < masterPostDataList.value.length; i++) {

            const postItem = masterPostDataList.value[i];
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

    function generateDummyPostData(postIndex: number) {
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
                comment: "This is random comment index " + (i),
                numUpvotes: getRandomInt(0, 100),
                numDownvotes: getRandomInt(0, 100)
            };
            postComments.push(commentItem);
        }

        const numRequiredCommentRanking = Math.min(3, numCommentsInPost);
        const assignedRankingItems: number[] = [];
        const rankedCommentList = new Map<number, PossibleCommentActions>();
        const numRankedComment = getRandomInt(0, numCommentsInPost - numRequiredCommentRanking);

        let currentRankedCommentIndex = 0;
        for (let i = 0; i < numRequiredCommentRanking; i++) {
            assignedRankingItems.push(currentRankedCommentIndex);
            currentRankedCommentIndex += 1;
        }

        for (let i = 0; i < numRankedComment; i++) {
            const possibleCommentActions: PossibleCommentActions[] = ["like", "dislike"];
            const randomActionIndex = getRandomInt(0, possibleCommentActions.length - 1);
            rankedCommentList.set(currentRankedCommentIndex, possibleCommentActions[randomActionIndex]);
            currentRankedCommentIndex += 1;
        }

        const postDataStatic: DummyPostDataFormat = {
            metadata: {
                uid: "TEST UID",
                slugId: "DUMMY_SLUG_ID_" + postIndex.toString(),
                isHidden: false,
                createdAt: postCreatedAtDate,
                commentCount: numCommentsInPost,
                communityId: selectedRandomCommunityItem.id,
            },
            payload: {
                title: "TEST POST TITLE INDEX - " + postIndex,
                body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. ",
                poll: {
                    hasPoll: hasPoll,
                    options: pollOptions
                },
                comments: postComments
            },
            userInteraction: {
                pollVoting: {
                    hasVoted: false,
                    voteIndex: 0
                },
                commentRanking: {
                    rankedCommentList: rankedCommentList,
                    assignedRankingItems: assignedRankingItems
                }
            }
        };

        return postDataStatic;

    }

    return { getPostBySlugId, composeDummyCommentItem, fetchCommunityPosts, updateCommentRanking, emptyPost };
});
