import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { useCommonApi } from "./common";

export function useBackendPostApi() {

  const { buildEncodedUcan } = useCommonApi();

  async function createNewPost(
  ): Promise<void> {
    try {
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1PostCreatePost();
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostCreatePost({
      }, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan)
        }
      });
      return;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw e;
      } else {
        throw e;
      }
    }
  }

  return { createNewPost };
}
