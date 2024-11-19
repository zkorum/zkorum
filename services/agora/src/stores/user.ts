import { useStorage } from "@vueuse/core";
import { useBackendUserApi } from "src/utils/api/user";

export function useUserStore() {

  const { fetchUserProfile } = useBackendUserApi();

  interface UserProfile {
    commentCount: number;
    postCount: number;
    createdAt: Date;
    userName: string;
  }

  const emptyProfile: UserProfile = {
    commentCount: 0,
    postCount: 0,
    createdAt: new Date(),
    userName: ""
  };

  const profileData = useStorage("user-profile-data", emptyProfile);

  async function loadUserProfile() {
    const response = await fetchUserProfile();
    if (response) {
      profileData.value = {
        commentCount: response.commentCount,
        postCount: response.postCount,
        createdAt: response.createdAt,
        userName: response.userName
      };
    }
  }

  return { loadUserProfile, profileData };

}

