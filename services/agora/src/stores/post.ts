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
  createdAt: Date;
  comment: string;
  numUpvotes: number;
  numDownvotes: number;
  slugId: string;
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

export type PossibleCommentRankingActions = "like" | "dislike" | "pass";

export interface UserRankedCommentItem {
  index: number;
  action: PossibleCommentRankingActions;
}

export interface DummyCommentRankingFormat {
  rankedCommentList: Map<number, PossibleCommentRankingActions>;
  assignedRankingItems: number[];
}

export interface DummyPostDataFormat {
  metadata: DummyPostMetadataFormat;
  payload: {
    title: string;
    body: string;
    poll: {
      hasPoll: boolean;
      options: DummyPollOptionFormat[];
    };
    comments: DummyCommentFormat[];
  };
  userInteraction: {
    commentRanking: DummyCommentRankingFormat;
  };
}

export interface DummyUserPostDataFormat {
  slugId: string;
  poll: {
    castedVote: boolean;
    votedIndex: number;
  };
  comment: { ratedIndexList: number[] };
}

export const usePostStore = defineStore("post", () => {
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
      posterImagePath: "",
    },
    payload: {
      title: "",
      body: "",
      poll: {
        hasPoll: false,
        options: [],
      },
      comments: [],
    },
    userInteraction: {
      commentRanking: {
        rankedCommentList: new Map(),
        assignedRankingItems: [],
      },
    },
  };

  const masterPostDataList = ref<DummyPostDataFormat[]>([]);

  const preparedList = generateRealisticPosts();
  masterPostDataList.value = preparedList;

  /*
  for (let i = 0; i < 200; i++) {
      masterPostDataList.value.push(generateDummyPostData());
  }
  */

  const lastSavedHomeFeedPosition = useStorage(
    "last-saved-home-feed-position",
    0
  );

  function generateRealisticPosts() {
    const postList: DummyPostDataFormat[] = [];

    {
      const postItem = createSingleRealisticPost(
        "unesco",
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
          "Depends, conflict will always show up, so it comes down to individuals being able to regulate their feelings & behaviours relative to their desires and expectations.",
        ]
      );
      postList.push(postItem);
    }

    {
      const postItem = createSingleRealisticPost(
        "pew",
        "Misinformation",
        "What is misinformation for you? What’s your experience with online misinformation?",
        false,
        [],
        [
          "In my view, misinformation can result from incorrect knowledge, incomplete knowledge, ignorance or even an attempt to prank or tease.<br /><br />There is no real malice or gain. When people refuse to correct their information or even admit the possibility of incorrect information, they enter the realm of disinformation.",
          "All people are misinformed to a certain degree. No one knows everything or is correct about everything. Or more specifically, because most people get most of their information from other people and do not have first-hand knowledge.",
          "A propaganda term used to silence opposition",
          "Misinformation is anything that doesn’t correspond to reality. Anything that doesn’t stand up to scrutiny or critical examination.",
          "We can’t stop misinformation with bans alone. Better education and awareness are needed.",
          "In an age of misinformation, critical thinking is our best defense.",
          "Freedom of speech or harmful misinformation? The line gets blurrier with every debate.",
        ]
      );
      postList.push(postItem);
    }

    {
      const postItem = createSingleRealisticPost(
        "pirates",
        "What do you think about the detainment of Pavel Durov?",
        "",
        false,
        [],
        [
          "Stop calling Telegram a marker of freedom! It is a surveillance tool in disguise of a privacy tool. Nothing there is encrypted by default. It’s impossible for group chats to be encrypted.",
          "Think of Mr. Durov whatever you want, Telegram as a service has value. It allowed revolutionaries to plan protests from Iran to Russia, allowed freedom of speech to occur even under oppressive regimes.",
          "It would be helpful to the global public to understand more details about why he was arrested",
          "While Telegram champions user privacy, ignoring local laws can lead to operational challenges; global platforms must navigate regulatory requirements, even if they conflict with their principles.",
          "Not blocking child porn isn't a compatibility issue of principles.",
        ]
      );
      postList.push(postItem);
    }

    {
      const postItem = createSingleRealisticPost(
        "hrw",
        "Venezuela: Brutal crackdown on protesters",
        "(Bogota) - Venezuelan authorities are committing widespread human rights violations against protesters, bystanders, opposition leaders, and critics following the July 28, 2024, presidential election.<br /><br />Link to article:<br />https://www.hrw.org/news/2024/09/04/venezuela-brutal-crackdown-protesters-voters",
        false,
        [],
        [
          "Heartbreaking to see what has happened to Venezuela. So much resource wealth; so much misery.",
          "What Maduro has achieved in Venezuela combines the two worst Latin American extremes. He’s got the historically right-wing style political repression, with the historically leftist economic incompetence.",
          "How long will the international community watch without real action",
          "Venezuela proves that political division and corruption can destroy even the richest nations.",
        ]
      );
      postList.push(postItem);
    }

    {
      const postItem = createSingleRealisticPost(
        "unherd",
        "How the AfD revolution ends - Can Germany adopt its policies?",
        "Have the worst fears of the Berliner establishment finally come to pass?<Br /><br />If banning the AfD isn’t a viable option, can the centre adopt some of its policies? Link in bio.",
        false,
        [],
        [
          "The AfD may offend you - or anyone else - but when there's a record turnout of over 70% and the opponent gets a third of the vote – the problem isn’t them – it’s you.",
          "A firewall to shut out the AfD may be just all part of the Great Game of politics but it also devalues the democratic franchise of a substantial number of your fellow citizens that voted for them. Every vote counts - not just those cast for ‘acceptable’ candidates.",
          "Willfully blocking a political party supported by roughly 20 percent of voters is not defending democracy, it is destroying it.",
          "Here’s a genuine conundrum: should it be within the legislative ability of a democratic state to ban a political party whose stated aim was to overthrow democracy, should it gain power?",
          "For me, it’s ostrich-like to dismiss political concerns around immigration at the same time as you deplore the rise of a coalition that has emerged as a direct response to your refusal to acknowledge political concerns around immigration.",
          "This shows the need for better dialogue on immigration, not more hate.",
          "Germany can't allow neo-Nazism to take root again.",
        ]
      );
      postList.push(postItem);
    }

    return postList;
  }

  function allocateAllCommentsForRanking(postSlugId: string) {
    const postItem = getPostBySlugId(postSlugId);
    postItem.userInteraction.commentRanking.assignedRankingItems = [];
    for (let i = 0; i < postItem.payload.comments.length; i++) {
      postItem.userInteraction.commentRanking.assignedRankingItems.push(i);
    }
  }

  function createSingleRealisticPost(
    companyId: string,
    title: string,
    body: string,
    hasPoll: boolean,
    pollOptions: string[],
    commentList: string[]
  ) {
    const dummyPost = generateDummyPostData();
    const companyItem = communityStore.getCompanyItemFromId(companyId);
    dummyPost.metadata.posterName = companyItem.label;
    dummyPost.metadata.posterImagePath =
      "/development/logos/" + companyItem.profilePicture;
    dummyPost.metadata.commentCount = commentList.length;
    dummyPost.payload.title = title;
    dummyPost.payload.body = body;
    dummyPost.payload.poll.hasPoll = hasPoll;
    dummyPost.payload.poll.options = [];
    dummyPost.userInteraction.commentRanking.rankedCommentList = new Map();
    for (let i = 0; i < pollOptions.length; i++) {
      const pollOption: DummyPollOptionFormat = generateDummyPollItem(
        i,
        pollOptions[i]
      );
      dummyPost.payload.poll.options.push(pollOption);
    }
    dummyPost.payload.comments = [];
    for (let i = 0; i < commentList.length; i++) {
      const commentItem = composeDummyCommentItem(
        commentList[i],
        i,
        dummyPost.metadata.createdAt
      );
      dummyPost.payload.comments.push(commentItem);
    }

    const assignedRankingCount = Math.min(3, commentList.length);
    dummyPost.userInteraction.commentRanking.assignedRankingItems = [];
    for (let i = 0; i < assignedRankingCount; i++) {
      dummyPost.userInteraction.commentRanking.assignedRankingItems.push(i);
    }

    return dummyPost;
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

  function updateCommentRanking(
    postSlugId: string,
    commentIndex: number,
    rankingAction: PossibleCommentRankingActions
  ) {
    const post = getPostBySlugId(postSlugId);
    const rankedCommentMap =
      post.userInteraction.commentRanking.rankedCommentList;
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

  function fetchCuratedPosts(afterSlugId: string, fetchCount: number) {
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
    }

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
    const communityItem =
      communityNameList[Math.floor(Math.random() * communityNameList.length)];
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

    return "";
  }

  function composeDummyCommentItem(
    commentText: string,
    index: number,
    postCreatedAtDate: Date
  ) {
    //const communityItem = generateRandomCommunityItem();

    const newComment: DummyCommentFormat = {
      index: index,
      //userCommunityId: communityItem.id,
      //userCommunityImage: getCommunityImageFromId(communityItem.id),
      createdAt: generateRandomDate(postCreatedAtDate, 5),
      comment: commentText,
      numUpvotes: getRandomInt(0, 100),
      numDownvotes: getRandomInt(0, 100),
      slugId: "comment-slug-id-" + index.toString(),
    };
    return newComment;
  }

  function generateRandomCompanyItem() {
    const nameIndex = getRandomInt(1, 8);
    const companyName = "Company " + nameIndex;

    return {
      name: companyName,
      imageName: "/images/companies/company" + nameIndex.toString() + ".jpeg",
    };
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
      numResponses: getRandomInt(0, 100),
    };
    return pollItem;
  }

  function generateDummyPostData() {
    const postIndex = largestPostIndex;

    const postCreatedAtDate = new Date();
    postCreatedAtDate.setDate(
      postCreatedAtDate.getDate() - getRandomInt(7, 14)
    );

    const numCommentsInPost = getRandomInt(0, 20);
    const selectedRandomCommunityItem = generateRandomCommunityItem();
    const hasPoll = getRandomInt(0, 100) < 20;

    const numPollOptions = getRandomInt(2, 6);
    const pollOptionList: DummyPollOptionFormat[] = [];
    for (let i = 0; i < numPollOptions; i++) {
      const pollItem: DummyPollOptionFormat = generateDummyPollItem(
        i,
        "Dummy Option " + (i + 1)
      );
      pollOptionList.push(pollItem);
    }

    let pollOptions: DummyPollOptionFormat[] = [];
    if (hasPoll) {
      pollOptions = pollOptionList;
    }

    const randomText =
      "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted.";

    const postComments: DummyCommentFormat[] = [];
    for (let i = 0; i < numCommentsInPost; i++) {
      const comment =
        "This is random comment index " +
        i +
        ". " +
        randomText.substring(0, 270);
      const commentItem = composeDummyCommentItem(
        comment,
        i,
        postCreatedAtDate
      );
      postComments.push(commentItem);
    }

    const numRequiredCommentRanking = Math.min(3, numCommentsInPost);
    const assignedRankingItems: number[] = [];
    const rankedCommentList = new Map<number, PossibleCommentRankingActions>();
    const numRankedComment = getRandomInt(
      0,
      numCommentsInPost - numRequiredCommentRanking
    );

    let currentRankedCommentIndex = 0;
    for (let i = 0; i < numRequiredCommentRanking; i++) {
      assignedRankingItems.push(currentRankedCommentIndex);
      currentRankedCommentIndex += 1;
    }

    for (let i = 0; i < numRankedComment; i++) {
      const possibleCommentActions: PossibleCommentRankingActions[] = [
        "like",
        "dislike",
      ];
      const randomActionIndex = getRandomInt(
        0,
        possibleCommentActions.length - 1
      );
      rankedCommentList.set(
        currentRankedCommentIndex,
        possibleCommentActions[randomActionIndex]
      );
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
        posterImagePath: companyItem.imageName,
      },
      payload: {
        title: "TEST POST TITLE INDEX - " + postIndex,
        body: postBody,
        poll: {
          hasPoll: hasPoll,
          options: pollOptions,
        },
        comments: postComments,
      },
      userInteraction: {
        commentRanking: {
          rankedCommentList: rankedCommentList,
          assignedRankingItems: assignedRankingItems,
        },
      },
    };

    largestPostIndex++;

    return postDataStatic;
  }

  return {
    getPostBySlugId,
    composeDummyCommentItem,
    fetchCuratedPosts,
    updateCommentRanking,
    getCommunityImageFromId,
    submitNewPost,
    allocateAllCommentsForRanking,
    emptyPost,
    lastSavedHomeFeedPosition,
  };
});
