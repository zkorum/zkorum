import * as Crypto from "./implementation.js";
import * as BrowserCrypto from "./implementation/browser.js";

export async function getOrGenerateCryptoKey(
    userId: string
): Promise<Crypto.Implementation> {
    const newCryptoKey = await BrowserCrypto.implementation({
        storeName: `${userId}-zkorum`,
        exchangeKeyName: `${userId}-exchange-key`,
        writeKeyName: `${userId}-write-key`,
    });
    return newCryptoKey;
}
