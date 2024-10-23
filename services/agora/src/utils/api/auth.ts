import { ApiV1AuthAuthenticatePost200Response, ApiV1AuthAuthenticatePost409Response, ApiV1AuthAuthenticatePostRequest, ApiV1AuthVerifyOtpPostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useCommonApi } from "./common";

interface AuthenticateReturn {
  isSuccessful: boolean;
  data: ApiV1AuthAuthenticatePost200Response | null;
  error: "already_logged_in" | "throttled" | ""
}

export function useBackendAuthApi() {

  const { buildEncodedUcan } = useCommonApi();

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
          const auth409: ApiV1AuthAuthenticatePost409Response = e.response.data as ApiV1AuthAuthenticatePost409Response; // TODO: this is not future proof - openapi type generation isn't right
          return { isSuccessful: false, data: null, error: auth409.reason };
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

  async function emailCode(
    code: number
  ) {
    const params: ApiV1AuthVerifyOtpPostRequest = {
      code: code
    };

    const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthVerifyOtpPost(params);
    const encodedUcan = await buildEncodedUcan(url, options);
    const otpDetails = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1AuthVerifyOtpPost(params, {
      headers: {
        ...buildAuthorizationHeader(encodedUcan)
      }
    });
    return { data: otpDetails.data };

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

  return { sendEmailCode, emailCode, logout };
}


// export function handleOnAuthenticate(email: string, userId?: string) {
//   store.dispatch(openMainLoading());
//   // do register the user
//   authenticate(email, false, userId)
//     .then((response) => {
//       if (response === "logged-in") {
//         store.dispatch(showSuccess(authSuccess));
//       } else if (response === "awaiting-syncing") {
//         // TODO
//       } else if (response === "throttled") {
//         store.dispatch(showError(throttled));
//       }
//       // else go to next step => validate email address => automatic via redux store update
//     })
//     .catch((e) => {
//       console.error(e);
//       store.dispatch(showError(genericError));
//     })
//     .finally(() => {
//       store.dispatch(closeMainLoading());
//     });
// }
