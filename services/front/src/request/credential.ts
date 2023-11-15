import {
    DefaultApiFactory,
    type CredentialRequestPostRequestFormCredentialRequest,
    type PollCreatePostRequestPoll,
} from "@/api";
import { unblindedSecretCredentialsPerTypeFrom } from "@/crypto/vc/credential";
import { activeSessionUcanAxios, noAuthAxios } from "@/interceptors";
import type { FormCredentialRequest } from "@/shared/types/zod";
import {
    updateCredentials,
    updateFormCredentials,
} from "@/store/reducers/session";
import { store } from "@/store/store";
import type { Presentation } from "@docknetwork/crypto-wasm-ts";

export async function requestAnonymousCredentials(
    email: string,
    formCredentialRequest: FormCredentialRequest
): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialRequestPost({
        email: email,
        formCredentialRequest:
            formCredentialRequest as CredentialRequestPostRequestFormCredentialRequest,
    });
    if (response.data !== undefined) {
        const credentials = response.data;
        store.dispatch(
            updateFormCredentials({
                formCredentialsPerEmail: credentials.formCredentialsPerEmail,
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
                formCredentialsPerEmail: credentials.formCredentialsPerEmail,
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
    await DefaultApiFactory(undefined, undefined, noAuthAxios).pollCreatePost({
        poll: pollContent,
        pres: presentation.toJSON(),
    });
}
