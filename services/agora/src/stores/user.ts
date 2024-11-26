import { useStorage } from "@vueuse/core";
import { useBackendUserApi } from "src/utils/api/user";
import type { ExtendedComment, ExtendedPost } from "src/shared/types/zod";

export function useUserStore() {

  const { fetchUserProfile, fetchUserPosts, fetchUserComments } = useBackendUserApi();

  interface UserProfile {
    commentCount: number;
    postCount: number;
    createdAt: Date;
    userName: string;
    userPostList: ExtendedPost[];
    userCommentList: ExtendedComment[];
  }

  const emptyProfile: UserProfile = {
    commentCount: 0,
    postCount: 0,
    createdAt: new Date(),
    userName: "",
    userPostList: [],
    userCommentList: []
  };

  const profileData = useStorage("user-profile-data", emptyProfile);


  async function loadUserProfile() {

    const [userProfile, userPosts, userComments] = await Promise.all([
      fetchUserProfile(),
      fetchUserPosts(undefined),
      fetchUserComments(undefined)]);

    if (userProfile && userPosts && userComments) {
      profileData.value = {
        commentCount: userProfile.commentCount,
        postCount: userProfile.postCount,
        createdAt: userProfile.createdAt,
        userName: userProfile.userName,
        userPostList: userPosts,
        userCommentList: userComments
      };
    }
  }

  async function loadMoreUserPosts() {
    let lastPostSlugId: undefined | string = undefined;
    if (profileData.value.userPostList.length > 0) {
      lastPostSlugId = profileData.value.userPostList.at(-1).metadata.postSlugId;
    }

    const userPosts = await fetchUserPosts(lastPostSlugId);
    profileData.value.userPostList.push(...userPosts);

    return { reachedEndOfFeed: userPosts.length == 0 };
  }

  return { loadUserProfile, loadMoreUserPosts, profileData };

}

