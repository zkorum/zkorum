import {
    DefaultApiFactory,
    type CredentialRequestPostRequestEmailCredentialRequest,
    type PollCreatePostRequestPoll,
} from "@/api";
import {
    buildBlindedSecretCredential,
    encryptAndEncode,
    unblindedSecretCredentialsPerTypeFrom,
} from "@/crypto/vc/credential";
import { activeSessionUcanAxios, noAuthAxios } from "@/interceptors";
import { arrbufs } from "@/shared/common";
import type { EmailCredentialRequest } from "@/shared/types/zod";
import { updateCredentials } from "@/store/reducers/session";
import { store } from "@/store/store";
import type { Presentation } from "@docknetwork/crypto-wasm-ts";

export async function requestAnonymousCredentials(
    email: string,
    emailCredentialRequest: EmailCredentialRequest,
    userId: string
): Promise<void> {
    const { req, blindedSubject, blinding } =
        await buildBlindedSecretCredential();
    const blindedSubjectBinary = arrbufs.anyToUint8Array(blindedSubject);
    const encryptedBlindedSubject = await encryptAndEncode(
        blindedSubjectBinary,
        userId
    );
    const encryptedBlinding = await encryptAndEncode(blinding.bytes, userId);
    const secretCredentialRequest = {
        blindedRequest: req.toJSON(),
        encryptedEncodedBlindedSubject: encryptedBlindedSubject,
        encryptedEncodedBlinding: encryptedBlinding,
    };
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialRequestPost({
        email: email,
        emailCredentialRequest:
            emailCredentialRequest as CredentialRequestPostRequestEmailCredentialRequest,
        secretCredentialRequest: secretCredentialRequest,
    });
    if (response.data !== undefined) {
        const credentials = response.data;
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                unblindedSecretCredentialsPerType:
                    await unblindedSecretCredentialsPerTypeFrom(
                        credentials.secretCredentialsPerType,
                        userId
                    ),
            })
        );
    } else {
        console.warn("Unexpected empty data on credential request response");
    }
}

// TODO this function is subject to synchronization errors,
// because the activeSessionEmail email is continuously
// fetched in the cache, instead of being passed as param.
// This could lead to situation where someone else's credential
// is stored in the active session email
export async function fetchAndUpdateCredentials(userId: string): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialGetPost();
    const credentials = response?.data;
    if (credentials !== undefined) {
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                unblindedSecretCredentialsPerType:
                    await unblindedSecretCredentialsPerTypeFrom(
                        credentials.secretCredentialsPerType,
                        userId
                    ),
            })
        );
    }
}

export async function createPoll(
    presentation: Presentation,
    pollContent: PollCreatePostRequestPoll
): Promise<void> {
    // const bearerToken = encodeCbor(presentation.toJSON());
    // console.log(
    //     presentation.toJSON(),
    //     bearerToken,
    //     new Blob([bearerToken]).size
    // );
    const _response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).pollCreatePost({
        poll: pollContent,
        pres: presentation.toJSON(),
    });
}
