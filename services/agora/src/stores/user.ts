import { useStorage } from "@vueuse/core";
import { useBackendUserApi } from "src/utils/api/user";
import type { ExtendedPost } from "src/shared/types/zod";

export function useUserStore() {

  const { fetchUserProfile, fetchUserPosts } = useBackendUserApi();

  interface UserProfile {
    commentCount: number;
    postCount: number;
    createdAt: Date;
    userName: string;
    userPostList: ExtendedPost[];
  }

  const emptyProfile: UserProfile = {
    commentCount: 0,
    postCount: 0,
    createdAt: new Date(),
    userName: "",
    userPostList: []
  };

  const profileData = useStorage("user-profile-data", emptyProfile);

  async function loadUserProfile() {
    const userProfile = await fetchUserProfile();
    if (userProfile) {
      const userPosts = await fetchUserPosts(undefined);
      profileData.value = {
        commentCount: userProfile.commentCount,
        postCount: userProfile.postCount,
        createdAt: userProfile.createdAt,
        userName: userProfile.userName,
        userPostList: userPosts
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

