import { store } from "../store.js";
import { verifying, authenticating } from "../reducers/session.js";
import * as DID from "../crypto/ucan/did/index.js";
import {
  DefaultApiFactory,
  type AuthAuthenticatePost200Response,
  type AuthVerifyOtpPost200Response,
} from "../api/api.js";
import { noAuthAxios, pendingSessionUcanAxios } from "../interceptors.js";
import { getOrGenerateCryptoKey } from "../crypto/ucan/ucan.js";

export async function authenticate(
  email: string,
  isRequestingNewCode: boolean
): Promise<AuthAuthenticatePost200Response> {
  const userId = await DefaultApiFactory(
    undefined,
    undefined,
    noAuthAxios // TODO: Check if email is already existing (is already in the store - if yes, then change it to active and use UCAN so we can rate-limit less those requests)
  ).authGetUserIdPost(email);
  // TODO: if userId.data does not match the potentially existing email/userId local association - move the old association data to the new one
  const newCryptoKey = await getOrGenerateCryptoKey(userId.data);

  // this is a necessary step for interceptor to inject UCAN
  store.dispatch(authenticating({ userId: userId.data, email: email }));

  const didExchange = await DID.exchange(newCryptoKey);

  // Send authenticate request - UCAN will be sent by interceptor
  const otpDetails = await DefaultApiFactory(
    undefined,
    undefined,
    pendingSessionUcanAxios
  ).authAuthenticatePost({
    userId: userId.data,
    email: email,
    didExchange: didExchange,
    isRequestingNewCode: isRequestingNewCode,
  });
  store.dispatch(
    verifying({
      userId: userId.data,
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
