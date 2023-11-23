// Part of these functions were extracted from ts-odd which is Apache licensed
// https://github.com/nicobao/ts-odd/blob/f90bde37416d9986d1c0afed406182a95ce7c1d7/src/common/root-key.ts#L29

import { base64 } from "../../shared/common/index.js";
import { DEFAULT_AES_ALG } from "../basic.js";
import { getCryptoStore } from "@/store/store.js";

interface PlainAndEncryptedSymmKey {
    exportedSymmKey: Uint8Array;
    encodedEncryptedSymmKey: string;
}

export async function generateAndEncryptSymmKey(
    email: string
): Promise<PlainAndEncryptedSymmKey> {
    const cryptoStore = await getCryptoStore();
    const didExchange = await cryptoStore.keystore.publicExchangeKey(email);
    const symmKey = await cryptoStore.aes.genKey(DEFAULT_AES_ALG).then();
    const exportedSymmKey = await cryptoStore.aes.exportKey(symmKey);
    const encryptedSymmKey = await cryptoStore.rsa.encrypt(
        exportedSymmKey,
        didExchange
    );
    const encodedEncryptedSymmKey = base64.encode(encryptedSymmKey);
    return { exportedSymmKey, encodedEncryptedSymmKey };
}

/**
 * Decrypt the symm key then store it using the WebCrypto API
 */
export async function storeSymmKeyLocally(
    encryptedSymmKey: string,
    userId: string
) {
    const cryptoStore = await getCryptoStore();
    const decodedEncryptedSymmKey = base64.decode(encryptedSymmKey);
    const symmKey = await cryptoStore.keystore.decrypt(
        decodedEncryptedSymmKey,
        userId
    );
    await cryptoStore.keystore.importSymmKey(symmKey, userId);
}

export async function retrieveSymmKey(userId: string): Promise<Uint8Array> {
    const cryptoStore = await getCryptoStore();
    return await cryptoStore.keystore.exportSymmKey(userId);
}

export async function symmKeyExists(userId: string): Promise<boolean> {
    const cryptoStore = await getCryptoStore();
    return await cryptoStore.keystore.symmKeyExists(userId);
}

export async function copyKeypairsIfDestIsEmpty(
    fromEmail: string,
    toUserId: string
): Promise<void> {
    const cryptoStore = await getCryptoStore();
    if (
        (await cryptoStore.keystore.writeKeyExists(toUserId)) &&
        (await cryptoStore.keystore.exchangeKeyExists(toUserId))
    ) {
        return;
    }
    await cryptoStore.keystore.copyKeypairs(fromEmail, toUserId);
}
