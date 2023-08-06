import { store } from "../store.js";
import { registering } from "../reducers/session.js";
import * as DID from "../crypto/ucan/did/index.js";
import { DefaultApiFactory } from "../api/api.js";
import { ucanAxios } from "../interceptors.js";
import { getOrGenerateCryptoKey } from "../crypto/ucan/ucan.js";

export async function register(email: string) {
  const newCryptoKey = await getOrGenerateCryptoKey(email);
  store.dispatch(registering({ email: email }));

  const didExchange = await DID.exchange(newCryptoKey);

  // Send register request - UCAN will be sent by interceptor
  await DefaultApiFactory(undefined, undefined, ucanAxios).authRegisterPut({
    email: email,
    didExchange: didExchange,
  });
}
