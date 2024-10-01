import { ApiV1AuthAuthenticatePost200Response, ApiV1AuthAuthenticatePost409Response, ApiV1AuthAuthenticatePostRequest, ApiV1AuthVerifyOtpPostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { api } from "src/boot/axios";
import axios from "axios";
import { SupportedPlatform } from "src/utils/common";
import * as ucanOperation from "../crypto/ucan/operation";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";

interface AuthenticateReturn {
  isSuccessful: boolean;
  data: ApiV1AuthAuthenticatePost200Response | null;
  error: "already_logged_in" | "throttled" | ""
}

export function useBackendAuthApi() {

  async function emailLogin(
    email: string,
    isRequestingNewCode: boolean,
    platform: SupportedPlatform
  ): Promise<AuthenticateReturn> {
    const { did, prefixedKey } = await ucanOperation.createDidIfDoesNotExist(email, platform);
    // TODO: get DID if exist, else create it
    // then create UCAN, then inject it below
    // if we create it, create a unique cryptographic random ID that is linked to the email address
    // return this so we can go to /onboarding/verify/email/{id}
    // store in Pinia and in secure storage:
    // - email => prefixedKey
    // - flowId => email
    // later after verification, will store UUID => prefixedKey

    const params: ApiV1AuthAuthenticatePostRequest = {
      email: email,
      isRequestingNewCode: isRequestingNewCode
    };
    try {
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthAuthenticatePost(params);
      const encodedUcan = await ucanOperation.buildUcan({ did, prefixedKey, pathname: url, method: options.method, platform });
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
    email: string,
    code: number,
    platform: SupportedPlatform
  ) {
    const { did, prefixedKey } = await ucanOperation.createDidIfDoesNotExist(email, platform);
    const params: ApiV1AuthVerifyOtpPostRequest = {
      code: code
    };

    const { url, options } = await DefaultApiAxiosParamCreator().apiV1AuthVerifyOtpPost(params);
    const encodedUcan = await ucanOperation.buildUcan({ did, prefixedKey, pathname: url, method: options.method, platform });
    const otpDetails = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1AuthVerifyOtpPost({
      code: code,
    }, {
      headers: {
        ...buildAuthorizationHeader(encodedUcan)
      }
    });
    return { data: otpDetails.data };

  }

  return { emailLogin, emailCode };
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
