import { store } from "../store.js";
import { authenticating, validating } from "../reducers/session.js";
import * as DID from "../crypto/ucan/did/index.js";
import {
  DefaultApiFactory,
  type AuthAuthenticatePost200Response,
} from "../api/api.js";
import { noAuthAxios, ucanAxios } from "../interceptors.js";
import { getOrGenerateCryptoKey } from "../crypto/ucan/ucan.js";

export async function authenticate(
  email: string
): Promise<AuthAuthenticatePost200Response> {
  const userId = await DefaultApiFactory(
    undefined,
    undefined,
    noAuthAxios // TODO: Check if email is already existing (is already in the store - if yes, then change it to active and use UCAN so we can rate-limit less those requests)
  ).authGetUserIdPost(email);
  const newCryptoKey = await getOrGenerateCryptoKey(userId.data);
  store.dispatch(authenticating({ userId: userId.data, email: email }));

  const didExchange = await DID.exchange(newCryptoKey);

  // Send authenticate request - UCAN will be sent by interceptor
  const otpDetails = await DefaultApiFactory(
    undefined,
    undefined,
    ucanAxios
  ).authAuthenticatePost({
    userId: userId.data,
    email: email,
    didExchange: didExchange,
  });
  store.dispatch(
    validating({
      userId: userId.data,
      codeId: otpDetails.data.codeId,
      codeExpiry: otpDetails.data.codeExpiry,
    })
  );
  return otpDetails.data;
}
