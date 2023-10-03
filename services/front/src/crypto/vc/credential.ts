import type { EmailCredentialsPerEmail } from "@/shared/types/zod";
import { decode, encode } from "../../shared/common/base64";
import { DEFAULT_AES_ALG } from "../basic";
import { cryptoStore } from "@/store/store";

/**
 *  May throw exceptions
 * */
export async function decryptEmailCredentials(
    userId: string,
    encryptedSymmKey: string,
    encryptedCredentials: string
): Promise<EmailCredentialsPerEmail> {
    const symmKey = await cryptoStore.keystore.decrypt(
        decode(encryptedSymmKey),
        userId
    );
    const decryptedCredential = await cryptoStore.aes.decrypt(
        decode(encryptedCredentials),
        symmKey,
        DEFAULT_AES_ALG
    );
    const emailCredentialsPerEmailStr = encode(decryptedCredential);
    const emailCredentialsPerEmail: EmailCredentialsPerEmail = {};
    return Object.assign(
        emailCredentialsPerEmail,
        JSON.parse(emailCredentialsPerEmailStr)
    );
}

/**
 *  May throw exceptions
 * */
export async function encryptEmailCredentials(
    userId: string,
    encryptedSymmKey: string,
    emailCredentials: EmailCredentialsPerEmail
): Promise<string> {
    const symmKey = await cryptoStore.keystore.decrypt(
        decode(encryptedSymmKey),
        userId
    );
    const encryptedEmailCredentials = await cryptoStore.aes.encrypt(
        decode(JSON.stringify(emailCredentials)),
        symmKey,
        DEFAULT_AES_ALG
    );
    return encode(encryptedEmailCredentials);
}
