import { store } from "../store.js";
import { verifying, authenticating } from "../reducers/session.js";
import * as DID from "../crypto/ucan/did/index.js";
import {
  DefaultApiFactory,
  type AuthAuthenticatePost200Response,
  type AuthVerifyOtpPost200Response,
} from "../api/api.js";
import { pendingSessionUcanAxios } from "../interceptors.js";
import { getOrGenerateCryptoKey } from "../crypto/ucan/ucan.js";

export async function authenticate(
  email: string,
  isRequestingNewCode: boolean
): Promise<AuthAuthenticatePost200Response> {
  // TODO: email may be changed in the future, so this will have to be dealt with
  const newCryptoKey = await getOrGenerateCryptoKey(email);

  // this is a necessary step for interceptor to inject UCAN
  store.dispatch(authenticating({ email: email }));

  const didExchange = await DID.exchange(newCryptoKey);

  // Send authenticate request - UCAN will be sent by interceptor
  const otpDetails = await DefaultApiFactory(
    undefined,
    undefined,
    pendingSessionUcanAxios
  ).authAuthenticatePost({
    email: email,
    didExchange: didExchange,
    isRequestingNewCode: isRequestingNewCode,
  });
  store.dispatch(
    verifying({
      email: email,
      codeExpiry: otpDetails.data.codeExpiry,
      nextCodeSoonestTime: otpDetails.data.nextCodeSoonestTime,
    })
  );
  return otpDetails.data;
}

export async function validateOtp(
  code: number
): Promise<AuthVerifyOtpPost200Response> {
  const validateOtpResult = await DefaultApiFactory(
    undefined,
    undefined,
    pendingSessionUcanAxios
  ).authVerifyOtpPost({
    code: code,
  });
  return validateOtpResult.data;
}
