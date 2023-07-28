import localforage from "localforage";
import * as BrowserCrypto from "../shared/crypto/implementation/browser.js";
import * as Crypto from "../shared/crypto/implementation.js";
import { store } from "../store.js";
import { cryptoKeyAdded } from "../reducers/session.js";
import ucan, { Ucan } from "@ucans/ucans";
import * as DID from "../shared/did/index.js";
import { httpUrlToResourcePointer } from "../shared/ucan/ucan.js";

// generate keys using RSAKeyStore.init , see https://github.com/nicobao/ts-odd/blob/f90bde37416d9986d1c0afed406182a95ce7c1d7/src/components/crypto/implementation/browser.ts#L310
// we need a unique  exchangeKeyName and writeKeyName for each user.
// response = await RSAKeyStore.init({ exchangeKeyName: 'test-exchange', writeKeyName: 'test-write' })
// store the key associated with username, email, status and associated files in localforage. Get inspiration from SessionMod
// use DID.ucan(crypto) (bad name) or DID.write to get the DID associated with this storage: https://github.com/nicobao/ts-odd/blob/f90bde37416d9986d1c0afed406182a95ce7c1d7/src/did/local.ts#L23
// create the UCAN and send the request register to the backend
// upon backend verification, verify email - tell user to make sure the right DID is shown
// when backend validates, update local storage to show that credential is now a validated credential.
//

async function storeNewAccountIfNotExist(
  username: string,
  email: string
): Promise<boolean> {
  return localforage
    .getItem(username)
    .then(function (value) {
      if (value === null) {
        return storeNewAccount(username, email);
      } else {
        return false;
      }
    })
    .catch(function (err) {
      console.error("Cannot get account", err);
      return false;
    });
}

async function storeNewAccount(
  username: string,
  email: string
): Promise<boolean> {
  return localforage
    .setItem(username, { email: email, verified: false })
    .then(function () {
      return true;
    })
    .catch(function (err) {
      console.error("Cannot set new account", err);
      return false;
    });
}

async function getOrGenerateCryptoKey(
  username: string
): Promise<Crypto.Implementation> {
  const newCryptoKey = await BrowserCrypto.implementation({
    storeName: `${username}-zkorum`,
    exchangeKeyName: `${username}-exchange-key`,
    writeKeyName: `${username}-write-key`,
  });
  // store it in-memory in redux
  store.dispatch(cryptoKeyAdded({ username: username, crypto: newCryptoKey }));
  return newCryptoKey;
}

async function buildUcan(
  pathname: string,
  method: string,
  accountCrypto: Crypto.Implementation
): Promise<string> {
  const accountDid = await DID.ucan(accountCrypto);
  const payload = ucan.buildPayload({
    audience: import.meta.env.VITE_BACK_DID,
    issuer: accountDid,
    capabilities: [
      {
        // this must match with backend expectation
        with: httpUrlToResourcePointer(import.meta.env.VITE_BACK_BASE_URL),
        can: { namespace: `http/${method}`, segments: [pathname] },
      },
    ],
  });
  const keyType = await accountCrypto.keystore.getUcanAlgorithm();
  const u = await ucan.sign(payload, keyType, accountCrypto.keystore.sign);
  return ucan.encode(u);
}

async function customRegister(username: string, email: string) {
  // generate a new set of unextractable asymmetric key and store it in IndexedDB using localforage under the hood
  // this key pair will be the device DID for this username
  let newCryptoKey: Crypto.Implementation;
  newCryptoKey = await getOrGenerateCryptoKey(username);

  // Store account data in web secure offline storage (IndexedDB)
  // may fail in rare occasions - and it is ok. It will mean that the user will have to remember his username/email to login again
  try {
    await storeNewAccountIfNotExist(username, email);
  } catch (e) {
    console.error("Unable to store account using localforage", e);
  }

  // Generate UCAN for register request
  const ucan = await buildUcan(endpoint, method, newCryptoKey);

  // Send register request
}

async function register(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
  options: { username: string; email?: string }
): Promise<{ success: boolean }> {
  const { success } = await Fission.createAccount(
    endpoints,
    dependencies,
    options
  );
  if (success)
    return Base.register(dependencies, { ...options, type: Base.TYPE });
  return { success: false };
}

/**
 * Create a user account.
 */
export async function createAccount(
  endpoints: Endpoints,
  dependencies: Dependencies,
  userProps: {
    username: string;
    email?: string;
  }
): Promise<{ success: boolean }> {
  const jwt = Ucan.encode(
    await Ucan.build({
      audience: await Fission.did(endpoints),
      dependencies: dependencies,
      issuer: await DID.ucan(dependencies.crypto),
    })
  );

  const response = await fetch(Fission.apiUrl(endpoints, "/user"), {
    method: "PUT",
    headers: {
      authorization: `Bearer ${jwt}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(userProps),
  });

  return {
    success: response.status < 300,
  };
}

class Base {
  TYPE = "webCrypto";

  /**
   * Doesn't quite register an account yet,
   * needs to be implemented properly by other implementations.
   *
   * NOTE: This base function should be called by other implementations,
   *       because it's the foundation for sessions.
   */
  static async register(
    dependencies: Dependencies,
    options: { username: string; email?: string; type?: string }
  ): Promise<{ success: boolean }> {
    await SessionMod.provide(dependencies.storage, {
      type: options.type || Base.TYPE,
      username: options.username,
    });
    return { success: true };
  }
}
