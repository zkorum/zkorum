import { ApiV1AuthAuthenticatePost200Response, ApiV1AuthAuthenticatePost409Response, ApiV1AuthAuthenticatePost409ResponseAnyOf, DefaultApiFactory } from "@/api";
import { api } from "@/boot/axios";
import axios from "axios";

export async function authenticate(
  email: string,
  isRequestingNewCode: boolean,
  userId?: string
): Promise<
  | ApiV1AuthAuthenticatePost200Response
  | "already_logged_in"
  | "throttled"
> {
  // TODO: get DID if exist, else create it
  // then create UCAN, then inject it below

  try {
    const otpDetails = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1AuthAuthenticatePost({
      email: email,
      isRequestingNewCode: isRequestingNewCode,
    });
    return otpDetails.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 409) {
        const auth409:
          | ApiV1AuthAuthenticatePost409Response
          | ApiV1AuthAuthenticatePost409ResponseAnyOf = e.response
            .data as
          | ApiV1AuthAuthenticatePost409Response
          | ApiV1AuthAuthenticatePost409ResponseAnyOf; // TODO: this is not future proof - openapi type generation isn't right
        return auth409.reason;
      }
      else if (e.response?.status === 429) {
        return "throttled";
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }
}

export function handleOnAuthenticate(email: string, userId?: string) {
  store.dispatch(openMainLoading());
  // do register the user
  authenticate(email, false, userId)
    .then((response) => {
      if (response === "logged-in") {
        store.dispatch(showSuccess(authSuccess));
      } else if (response === "awaiting-syncing") {
        // TODO
      } else if (response === "throttled") {
        store.dispatch(showError(throttled));
      }
      // else go to next step => validate email address => automatic via redux store update
    })
    .catch((e) => {
      console.error(e);
      store.dispatch(showError(genericError));
    })
    .finally(() => {
      store.dispatch(closeMainLoading());
    });
}
