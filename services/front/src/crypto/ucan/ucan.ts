import * as Crypto from "./implementation.js";
import * as BrowserCrypto from "./implementation/browser.js";

export async function getOrGenerateCryptoKey(
  email: string
): Promise<Crypto.Implementation> {
  const newCryptoKey = await BrowserCrypto.implementation({
    storeName: `${email}-zkorum`,
    exchangeKeyName: `${email}-exchange-key`,
    writeKeyName: `${email}-write-key`,
  });
  return newCryptoKey;
}
