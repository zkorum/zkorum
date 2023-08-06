import axios from "axios";
import * as Crypto from "./crypto/ucan/implementation.js";
import * as DID from "./crypto/ucan/did/index.js";
import * as ucan from "@ucans/ucans";

import {
  httpMethodToAbility,
  httpUrlToResourcePointer,
} from "./shared/ucan/ucan";
import { getOrGenerateCryptoKey } from "./crypto/ucan/ucan.js";
import { store } from "./store.js";

export const ucanAxios = axios.create({
  baseURL: import.meta.env.VITE_BACK_BASE_URL,
});

async function buildUcan(
  url: string,
  method: string,
  accountCrypto: Crypto.Implementation
): Promise<string> {
  const accountDid = await DID.ucan(accountCrypto);
  const u = await ucan.Builder.create()
    .issuedBy({
      did: () => accountDid,
      jwtAlg: await accountCrypto.keystore.getUcanAlgorithm(),
      sign: accountCrypto.keystore.sign,
    })
    .toAudience(import.meta.env.VITE_BACK_DID)
    .withLifetimeInSeconds(30)
    .claimCapability({
      // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
      // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
      with: httpUrlToResourcePointer(url),
      can: httpMethodToAbility(method),
    })
    .build();

  // const u = await ucan.build({
  //   audience: import.meta.env.VITE_BACK_DID,
  //   issuer: {
  //     did: () => accountDid,
  //     jwtAlg: await accountCrypto.keystore.getUcanAlgorithm(),
  //     sign: accountCrypto.keystore.sign,
  //   },
  //   lifetimeInSeconds: 60,
  //   capabilities: [
  //     {
  //       // this must match with backend expectation
  //       with: httpUrlToResourcePointer(import.meta.env.VITE_BACK_BASE_URL),
  //       can: { namespace: `http/${method}`, segments: [pathname] },
  //     },
  //   ],
  // });
  return ucan.encode(u);
  // const keyType = await accountCrypto.keystore.getUcanAlgorithm();
  // const u = await ucan.sign(payload, keyType, accountCrypto.keystore.sign);

  // return ucan.encode(u);
}

// Add UCAN to every request - if an active session exists
ucanAxios.interceptors.request.use(
  async function (config) {
    const username = store.getState().sessions.activeSessionEmail;
    if (username === "") {
      console.log("No active session: not adding UCAN");
      return config;
    }

    if (config.url === undefined || config.method === undefined) {
      // TODO: better error handling
      throw new Error(
        `Cannot add UCAN because url==${config.url} or method==${config.method} is undefined, should not happen!`
      );
    }

    const newCryptoKey = await getOrGenerateCryptoKey(username);
    const newUcan = await buildUcan(config.url, config.method, newCryptoKey);
    config.headers.Authorization = `Bearer ${newUcan}`;
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);
