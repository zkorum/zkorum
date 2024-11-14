import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import {
  ApiV1PollSubmitResponsePostRequest,
  ApiV1VotingFetchUserVotesForPostSlugIdPostRequest,
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
} from "src/api";
import { useCommonApi } from "./common";
import { useDialog } from "../ui/dialog";

export function useBackendPollApi() {
  const { buildEncodedUcan } = useCommonApi();

  const { showMessage } = useDialog();

  async function fetchUserPollResponse(postSlugId: string) {
    try {
      const params: ApiV1VotingFetchUserVotesForPostSlugIdPostRequest = {
        postSlugId: postSlugId
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1PollGetUserPollResponsePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PollGetUserPollResponsePost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });

      return response.data;
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to submit poll response.");
      return undefined;
    }
  }

  async function submitPollResponse(voteIndex: number, postSlugId: string) {
    try {
      const params: ApiV1PollSubmitResponsePostRequest = {
        postSlugId: postSlugId,
        voteOptionChoice: voteIndex + 1
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1PollSubmitResponsePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PollSubmitResponsePost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });

      return true;
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to submit poll response.");
      return false;
    }
  }

  return { submitPollResponse, fetchUserPollResponse };

}
