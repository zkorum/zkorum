// Part of these functions were extracted from ts-odd which is Apache licensed
// https://github.com/nicobao/ts-odd/blob/f90bde37416d9986d1c0afed406182a95ce7c1d7/src/common/root-key.ts#L29

import { encode, decode } from "../../shared/common/base64.js";
import { DEFAULT_AES_ALG } from "../basic.js";
import { cryptoStore } from "@/store/store.js";

export async function generateAndEncryptSymmKey(
    email: string
): Promise<string> {
    const didExchange = await cryptoStore.keystore.publicExchangeKey(email);
    return cryptoStore.aes
        .genKey(DEFAULT_AES_ALG)
        .then(cryptoStore.aes.exportKey)
        .then((symmKey: Uint8Array) =>
            cryptoStore.rsa.encrypt(symmKey, didExchange)
        )
        .then(encode);
}

/**
 * Decrypt the symm key then store it using the WebCrypto API
 */
export async function storeSymmKeyLocally(
    encryptedSymmKey: string,
    userId: string
) {
    const decodedEncryptedSymmKey = decode(encryptedSymmKey);
    const symmKey = await cryptoStore.keystore.decrypt(
        decodedEncryptedSymmKey,
        userId
    );
    await cryptoStore.keystore.importSymmKey(symmKey, userId);
}

export async function retrieveSymmKey(userId: string): Promise<Uint8Array> {
    return await cryptoStore.keystore.exportSymmKey(userId);
}

export async function symmKeyExists(userId: string): Promise<boolean> {
    return await cryptoStore.keystore.symmKeyExists(userId);
}

export async function copyKeypairsIfDestIsEmpty(
    fromEmail: string,
    toUserId: string
): Promise<void> {
    if (
        (await cryptoStore.keystore.writeKeyExists(toUserId)) &&
        (await cryptoStore.keystore.exchangeKeyExists(toUserId))
    ) {
        return;
    }
    await cryptoStore.keystore.copyKeypairs(fromEmail, toUserId);
}
