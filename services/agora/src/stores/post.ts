import { defineStore } from "pinia";
import { CommunityItem, useCommunityStore } from "./community";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";

export interface DummyPollOptionFormat {
    index: number;
    option: string;
    numResponses: number;
}

export interface DummyCommentFormat {
    index: number;
    userCommunityId: string;
    userCommunityImage: string;
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
    posterName: string;
    posterImagePath: string;
}

export interface DummyPostUserVote {
    hasVoted: boolean;
    voteIndex: number;
}

export type PossibleCommentRankingActions = "like" | "dislike" | "pass"

export interface UserRankedCommentItem {
    index: number;
    action: PossibleCommentRankingActions;
}

export interface DummyCommentRankingFormat {
    rankedCommentList: Map<number, PossibleCommentRankingActions>;
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

    const forceAddPolls = useStorage("force-add-polls", false);
    const communityStore = useCommunityStore();

    let largestPostIndex = 0;

    const emptyPost: DummyPostDataFormat = {
        metadata: {
            uid: "",
            slugId: "",
            isHidden: false,
            createdAt: new Date(),
            commentCount: 0,
            communityId: "",
            posterName: "",
            posterImagePath: ""
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

    const preparedList = generateRealisticPosts();
    masterPostDataList.value = preparedList;

    for (let i = 0; i < 200; i++) {
        masterPostDataList.value.push(generateDummyPostData());
    }

    function generateRealisticPosts() {
        const postList: DummyPostDataFormat[] = [];

        const postItem1 = createSingleRealisticPost(
            "pirates",
            "Do you think it's possible for people from different cultures to co-exist peacefully?",
            "",
            true,
            ["Yes", "No"],
            [
                "I doubt it. Many humans seem easily brainwashed…cult-like…and I don’t know where they came from.",
                "Coexistence, yes. Perfect harmony, no.",
                "Peace is possible, but human nature seems drawn to conflict. Can we evolve beyond our instincts?",
                "I believe peace is achievable, but greed and power often get in the way",
                "If humans truly wanted peace, we'd stop fighting for resources and start working together",
                "Humans are capable of peace. It's just that peace is harder than war, and we tend to take the easier path.",
                "It is already happening! Compared to thousands of years before WWII, the world is tremendously much more peaceful today!",
                "When all people accept the teaching of Jesus Christ, there can be peaceful coexistence as all the teaching of Jesus Christ is of love, forgiveness and compassion that shows no favoritism for race or gender.",
                "Because of the right and wrong mentality, people always want to be on the right side. “I’m right! We’re right! Anyone that disagrees with us is wrong!” This whole mentality is the root cause of arguments and conflicts.",
                "Sadly no. People have been in conflict with other people since the beginning of Mankind. From Tribal fights over food or land, to religious battles over beliefs, it has always been part of the nature of mankind.",
                "Depends, conflict will always show up, so it comes down to individuals being able to regulate their feelings & behaviours relative to their desires and expectations."
            ]
        );
        postList.push(postItem1);

        return postList;
    }

    function createSingleRealisticPost(companyId: string, title: string, body: string, hasPoll: boolean, pollOptions: string[], commentList: string[]) {
        const dummyPost = generateDummyPostData();
        const companyItem = communityStore.getCompanyItemFromId(companyId);
        dummyPost.metadata.posterName = companyItem.label;
        dummyPost.metadata.posterImagePath = "/development/logos/" + companyItem.profilePicture;
        dummyPost.metadata.commentCount = commentList.length;
        dummyPost.payload.title = title;
        dummyPost.payload.body = body;
        dummyPost.payload.poll.hasPoll = hasPoll;
        dummyPost.payload.poll.options = [];
        for (let i = 0; i < pollOptions.length; i++) {
            const pollOption: DummyPollOptionFormat = generateDummyPollItem(i, pollOptions[i]);
            dummyPost.payload.poll.options.push(pollOption);
        }
        dummyPost.payload.comments = [];
        for (let i = 0; i < commentList.length; i++) {
            const commentItem = composeDummyCommentItem(commentList[i], i, dummyPost.metadata.createdAt);
            dummyPost.payload.comments.push(commentItem);
        }
        return dummyPost;
    }

    function getUnrankedComments(postSlugId: string): DummyCommentFormat[] {
        const postItem = getPostBySlugId(postSlugId);
        const assignedRankingItems = postItem.userInteraction.commentRanking.assignedRankingItems;
        const rankedCommentList = postItem.userInteraction.commentRanking.rankedCommentList;

        const unrankedCommentIndexes: number[] = [];

        for (let i = 0; i < assignedRankingItems.length; i++) {
            const assignedIndex = assignedRankingItems[i];
            let isRanked = false;
            for (const [key] of rankedCommentList.entries()) {
                if (assignedIndex == key) {
                    isRanked = true;
                }
            }
            if (!isRanked) {
                unrankedCommentIndexes.push(assignedIndex);
            }
        }

        const unrankedComments: DummyCommentFormat[] = [];
        for (let unrankedIndex = 0; unrankedIndex < unrankedCommentIndexes.length; unrankedIndex++) {
            for (let commentIndex = 0; commentIndex < postItem.payload.comments.length; commentIndex++) {
                const commentItem = postItem.payload.comments[commentIndex];
                if (unrankedCommentIndexes[unrankedIndex] == commentItem.index) {
                    unrankedComments.push(commentItem);
                    break;
                }
            }
        }

        return unrankedComments;
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

    function updateCommentRanking(postSlugId: string, commentIndex: number, rankingAction: PossibleCommentRankingActions) {
        const post = getPostBySlugId(postSlugId);
        const rankedCommentMap = post.userInteraction.commentRanking.rankedCommentList;
        const currentAction = rankedCommentMap.get(commentIndex);

        let upvoteDiff = 0;
        let downvoteDiff = 0;

        if (currentAction != undefined && rankingAction != "pass") {
            if (currentAction == "like") {
                if (rankingAction == "like") {
                    rankedCommentMap.delete(commentIndex);
                    upvoteDiff -= 1;
                } else if (rankingAction == "dislike") {
                    rankedCommentMap.set(commentIndex, "dislike");
                    upvoteDiff -= 1;
                    downvoteDiff += 1;
                } else {
                    console.log("Invalid state");
                }
            } else if (currentAction == "dislike") {
                if (rankingAction == "like") {
                    rankedCommentMap.set(commentIndex, "like");
                    upvoteDiff += 1;
                    downvoteDiff -= 1;
                } else if (rankingAction == "dislike") {
                    rankedCommentMap.delete(commentIndex);
                    downvoteDiff -= 1;
                } else {
                    console.log("Invalid state");
                }
            }
        } else {
            if (rankingAction == "like") {
                rankedCommentMap.set(commentIndex, "like");
                upvoteDiff += 1;
            } else if (rankingAction == "dislike") {
                rankedCommentMap.set(commentIndex, "dislike");
                downvoteDiff += 1;
            } else {
                rankedCommentMap.set(commentIndex, "pass");
            }
        }

        for (let i = 0; i < post.payload.comments.length; i++) {
            const commentItem = post.payload.comments[i];
            if (commentItem.index == commentIndex) {
                commentItem.numUpvotes += upvoteDiff;
                commentItem.numDownvotes += downvoteDiff;
                break;
            }
        }
    }

    function fetchUnifiedPosts(afterSlugId: string, fetchCount: number) {
        const dataList: DummyPostDataFormat[] = [];
        let locatedId = false;
        if (afterSlugId == "") {
            locatedId = true;
        }

        for (let i = 0; i < masterPostDataList.value.length; i++) {

            const postItem = masterPostDataList.value[i];
            if (locatedId) {
                dataList.push(postItem);
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
        const communityNameList = communityStore.communityList;
        const communityItem = communityNameList[Math.floor(Math.random() * communityNameList.length)];
        return communityItem;
    }

    function getCommunityImageFromId(communityId: string) {
        const communityList = communityStore.communityList;

        for (let i = 0; i < communityList.length; i++) {
            const communityItem = communityList[i];
            if (communityItem.id == communityId) {
                return "/images/communities/flags/" + communityItem.code + ".svg";
            }
        }

        return ""
    }

    function composeDummyCommentItem(commentText: string, index: number, postCreatedAtDate: Date) {
        const communityItem = generateRandomCommunityItem();

        const newComment: DummyCommentFormat = {
            index: index,
            userCommunityId: communityItem.id,
            userCommunityImage: getCommunityImageFromId(communityItem.id),
            createdAt: generateRandomDate(postCreatedAtDate, 5),
            comment: commentText,
            numUpvotes: getRandomInt(0, 100),
            numDownvotes: getRandomInt(0, 100)
        }
        return newComment;
    }

    function generateRandomCompanyItem() {
        const nameIndex = getRandomInt(1, 8);
        const companyName = "Company " + nameIndex;

        return {
            name: companyName,
            imageName: "/images/companies/company" + nameIndex.toString() + ".jpeg"
        }

    }

    function submitNewPost(postTitle: string, postBody: string) {
        const postData = generateDummyPostData();
        postData.payload.title = postTitle;
        postData.payload.body = postBody;

        masterPostDataList.value.push(postData);

        return postData.metadata.slugId;
    }

    function generateDummyPollItem(index: number, option: string) {
        const pollItem: DummyPollOptionFormat = {
            index: index,
            option: option,
            numResponses: getRandomInt(0, 100)
        };
        return pollItem;
    }

    function generateDummyPostData() {

        const postIndex = largestPostIndex;

        const postCreatedAtDate = new Date();
        postCreatedAtDate.setDate(postCreatedAtDate.getDate() - getRandomInt(7, 14));

        const numCommentsInPost = getRandomInt(0, 20);
        const selectedRandomCommunityItem = generateRandomCommunityItem();
        const hasPoll = forceAddPolls.value ? true : getRandomInt(0, 100) < 20;

        const numPollOptions = getRandomInt(2, 6);
        const pollOptionList: DummyPollOptionFormat[] = [];
        for (let i = 0; i < numPollOptions; i++) {
            const pollItem: DummyPollOptionFormat = generateDummyPollItem(i, "Dummy Option " + (i + 1));
            pollOptionList.push(pollItem);
        }

        let pollOptions: DummyPollOptionFormat[] = [];
        if (hasPoll) {
            pollOptions = pollOptionList;
        }

        const randomText = "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted.";

        const postComments: DummyCommentFormat[] = [];
        for (let i = 0; i < numCommentsInPost; i++) {
            const comment = "This is random comment index " + (i) + ". " + randomText.substring(0, 270);
            const commentItem = composeDummyCommentItem(comment, i, postCreatedAtDate);
            postComments.push(commentItem);
        }

        const numRequiredCommentRanking = Math.min(3, numCommentsInPost);
        const assignedRankingItems: number[] = [];
        const rankedCommentList = new Map<number, PossibleCommentRankingActions>();
        const numRankedComment = getRandomInt(0, numCommentsInPost - numRequiredCommentRanking);

        let currentRankedCommentIndex = 0;
        for (let i = 0; i < numRequiredCommentRanking; i++) {
            assignedRankingItems.push(currentRankedCommentIndex);
            currentRankedCommentIndex += 1;
        }

        for (let i = 0; i < numRankedComment; i++) {
            const possibleCommentActions: PossibleCommentRankingActions[] = ["like", "dislike"];
            const randomActionIndex = getRandomInt(0, possibleCommentActions.length - 1);
            rankedCommentList.set(currentRankedCommentIndex, possibleCommentActions[randomActionIndex]);
            currentRankedCommentIndex += 1;
        }

        const companyItem = generateRandomCompanyItem();

        // postBody = postBody.substring(0, Math.min(postBody.length, 600));
        const postBody = randomText.substring(0, 140);

        const postDataStatic: DummyPostDataFormat = {
            metadata: {
                uid: "TEST UID",
                slugId: "DUMMY_SLUG_ID_" + postIndex.toString(),
                isHidden: false,
                createdAt: postCreatedAtDate,
                commentCount: numCommentsInPost,
                communityId: selectedRandomCommunityItem.id,
                posterName: companyItem.name,
                posterImagePath: companyItem.imageName
            },
            payload: {
                title: "TEST POST TITLE INDEX - " + postIndex,
                body: postBody,
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

        largestPostIndex++;

        return postDataStatic;

    }

    return {
        getUnrankedComments,
        getPostBySlugId,
        composeDummyCommentItem,
        fetchUnifiedPosts,
        updateCommentRanking,
        getCommunityImageFromId,
        submitNewPost,
        emptyPost
    };
});
