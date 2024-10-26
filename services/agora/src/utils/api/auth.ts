import { ApiV1AuthAuthenticatePost200Response, ApiV1AuthAuthenticatePostRequest, ApiV1AuthVerifyOtpPostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useCommonApi } from "./common";
import { useRouter } from "vue-router";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";

interface AuthenticateReturn {
  isSuccessful: boolean;
  data: ApiV1AuthAuthenticatePost200Response | null;
  error: "already_logged_in" | "throttled" | ""
}

export function useBackendAuthApi() {

  const { buildEncodedUcan } = useCommonApi();
  const { userLogout } = useAuthenticationStore();
  const { verificationEmailAddress, isAuthenticated  } = storeToRefs(useAuthenticationStore());

  const router = useRouter();

  async function sendEmailCode(
    email: string,
    isRequestingNewCode: boolean
  ): Promise<AuthenticateReturn> {

    if (process.env.USE_DUMMY_ACCESS == "true") {
      email = "test@gmail.com";
    }

    const params: ApiV1AuthAuthenticatePostRequest = {
      email: email,
      isRequestingNewCode: isRequestingNewCode
    };
    try {
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthAuthenticatePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const otpDetails = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AuthAuthenticatePost({
        email: email,
        isRequestingNewCode: isRequestingNewCode,
      }, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan)
        }
      });
      return { isSuccessful: true, data: otpDetails.data, error: "" };
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          return { isSuccessful: false, data: null, error: "already_logged_in" };
        }
        else if (e.response?.status === 429) {
          return { isSuccessful: false, data: null, error: "throttled" };
        } else {
          console.log("Unknown status code: " + e.response?.status);
          throw e;
        }
      } else {
        console.log("Unknown error");
        throw e;
      }
    }
  }

  async function emailCode(code: number) {
    try {
      const params: ApiV1AuthVerifyOtpPostRequest = {
        code: code
      };
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthVerifyOtpPost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AuthVerifyOtpPost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan)
        }
      });
      return { isSuccessful: true, data: response.data, error: "" };
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          return { isSuccessful: false, data: null, error: "already_logged_in" };
        }
        else if (e.response?.status === 429) {
          // return "throttled";
          return { isSuccessful: false, data: null, error: "throttled" };
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }


  }

  async function deviceIsLoggedOn() {
    try {
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthCheckLoginStatusPost();
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AuthCheckLoginStatusPost({
        headers: {
          ...buildAuthorizationHeader(encodedUcan)
        }
      });
      return { isSuccessful: true, error: "" };
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          return { isSuccessful: false, error: "already_logged_in" };
        }
        else if (e.response?.status === 429) {
          return { isSuccessful: false, error: "throttled" };
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  async function logout(
  ) {
    const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthLogoutPost();
    const encodedUcan = await buildEncodedUcan(url, options);
    const otpDetails = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1AuthLogoutPost({
      headers: {
        ...buildAuthorizationHeader(encodedUcan)
      }
    });
    return { data: otpDetails.data };

  }


  function initializeAuthState() {

    setTimeout(
      async () => {
        console.log(verificationEmailAddress.value);
        if (!verificationEmailAddress.value) {
          router.push({ name: "welcome" });
        } else if (isAuthenticated.value) {
          const status = await deviceIsLoggedOn();
          if (!status.isSuccessful) {
            if (status.error == "already_logged_in") {
              // ignore
              console.log("already logged in");
            } else if (status.error == "throttled") {
              // ignore
            } else {
              userLogout();
              router.push({ name: "welcome" });
            }
          }
        }
      }, 1000);
  }

  return { sendEmailCode, emailCode, logout, deviceIsLoggedOn, initializeAuthState };
}
